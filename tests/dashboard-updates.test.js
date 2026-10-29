import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { readFileSync } from 'node:fs';
import handler from '../api/publish-public-content.js';
import { createDashboardUpdatesHandler } from '../api/_lib/dashboardUpdatesEndpoint.js';
import { dashboardUpdates } from '../api/_lib/dashboardUpdates.js';
import useDashboardUpdates from '../src/hooks/useDashboardUpdates.js';
import { UPDATE_CATEGORIES, readViewedUpdates, saveViewedUpdates } from '../src/utils/dashboardUpdates.js';

const response = () => ({
  headers: {}, statusCode: 200, body: null,
  setHeader(key, value) { this.headers[key] = value; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.body = value; return this; },
});

test('the deployed updates resource requires admin auth and never caches its content', async () => {
  const res = response();
  await handler({ method: 'GET', headers: {}, query: { resource: 'dashboard-updates' } }, res);
  assert.ok([401, 503].includes(res.statusCode));
  assert.equal(res.body.updates, undefined);
  assert.match(res.headers['Cache-Control'], /private, no-store/);
});

test('only an authorized GET receives updates; failures and other methods never disclose content', async () => {
  for (const status of [401, 403, 503]) {
    const res = response();
    await createDashboardUpdatesHandler(async () => ({ ok: false, status, error: 'Denied' }))({ method: 'GET' }, res);
    assert.equal(res.statusCode, status);
    assert.equal(res.body.updates, undefined);
  }
  const res = response();
  await createDashboardUpdatesHandler(async () => ({ ok: true }))({ method: 'GET' }, res);
  assert.deepEqual(res.body.updates, dashboardUpdates);
  const rejected = response();
  await createDashboardUpdatesHandler(() => { throw new Error('Must not authorize POST'); })({ method: 'POST' }, rejected);
  assert.equal(rejected.statusCode, 405);
  assert.equal(rejected.headers.Allow, 'GET');
});

test('updates are categorized, newest first, and link only to existing dashboard sections', () => {
  assert.ok(dashboardUpdates.length >= 51);
  assert.equal(dashboardUpdates.at(-1).date, '2026-07-25');
  for (const id of ['2026-07-25-projectstart', '2026-07-25-collectiepagina', '2026-07-25-herkomstpagina', '2026-07-25-dashboard', '2026-07-27-drie-talen', '2026-07-28-certificatenstudio', '2026-08-28-rembrandt-project']) {
    assert.ok(dashboardUpdates.some(update => update.id === id), `Missing project milestone: ${id}`);
  }
  assert.equal(new Set(dashboardUpdates.map(update => update.id)).size, dashboardUpdates.length);
  assert.deepEqual(dashboardUpdates.map(update => update.date), dashboardUpdates.map(update => update.date).sort().reverse());
  const dashboard = readFileSync(new URL('../src/components/admin/AdminDashboard.jsx', import.meta.url), 'utf8');
  for (const update of dashboardUpdates) {
    assert.ok(UPDATE_CATEGORIES[update.category]);
    assert.match(update.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(update.title && update.body.length);
    if (update.action) assert.ok(dashboard.includes(`'${update.action.target}'`));
    assert.deepEqual(Object.keys(update).sort(), ['id', 'date', 'category', 'title', 'body', ...(update.action ? ['action'] : [])].sort());
  }
  assert.doesNotMatch(JSON.stringify(dashboardUpdates), /github|commit|supabase|vercel|\bR2\b/i);
});

const browserStorage = () => {
  const stored = new Map();
  globalThis.window = { localStorage: {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  } };
  return stored;
};

test('viewed storage recovers from corrupt or blocked data and stays bounded', () => {
  const storage = browserStorage();
  assert.deepEqual(readViewedUpdates(), []);
  saveViewedUpdates(['one', 'one']);
  assert.deepEqual(readViewedUpdates(), ['one']);
  const key = [...storage.keys()][0];
  storage.set(key, '{bad');
  assert.deepEqual(readViewedUpdates(), []);
  saveViewedUpdates(Array.from({ length: 250 }, (_, index) => `id-${index}`));
  assert.equal(readViewedUpdates().length, 200);
  globalThis.window.localStorage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  assert.deepEqual(saveViewedUpdates(['still-readable']), ['still-readable']);
});

test('overview does not mark updates viewed; recording displayed IDs preserves unread entries and does not loop', async () => {
  browserStorage();
  let state, renderer;
  const load = async () => dashboardUpdates;
  function Harness() { state = useDashboardUpdates(load); return null; }
  await act(async () => { renderer = create(React.createElement(Harness)); });
  assert.equal(state.updates.length, dashboardUpdates.length);
  assert.deepEqual(state.viewed, []);
  await act(async () => state.markViewed([dashboardUpdates[0].id]));
  assert.deepEqual(readViewedUpdates(), [dashboardUpdates[0].id]);
  assert.equal(state.updates.filter(update => !state.viewed.includes(update.id)).length, dashboardUpdates.length - 1);
  await act(async () => renderer.unmount());
  await act(async () => { renderer = create(React.createElement(Harness)); });
  assert.deepEqual(state.viewed, [dashboardUpdates[0].id]);
  await act(async () => renderer.unmount());
});

test('loading failures can be retried and late responses from a closed dashboard are ignored', async () => {
  browserStorage();
  let state, renderer, attempt = 0;
  const load = async () => { if (++attempt === 1) throw new Error('Offline'); return dashboardUpdates; };
  function Harness({ loader = load }) { state = useDashboardUpdates(loader); return null; }
  await act(async () => { renderer = create(React.createElement(Harness)); });
  assert.equal(state.error, true);
  assert.deepEqual(readViewedUpdates(), []);
  await act(async () => state.reload());
  assert.equal(state.error, false);
  assert.equal(state.updates.length, dashboardUpdates.length);
  let finish;
  const pending = () => new Promise(resolve => { finish = resolve; });
  await act(async () => renderer.update(React.createElement(Harness, { loader: pending })));
  await act(async () => renderer.unmount());
  await act(async () => finish([]));
  assert.equal(state.updates.length, dashboardUpdates.length);
});
