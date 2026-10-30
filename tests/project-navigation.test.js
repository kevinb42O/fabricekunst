import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers';
import { followProjectAnchor } from '../src/utils/projectNavigation.js';

class Events {
  listeners = new Map();
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  fire(type) { for (const callback of [...(this.listeners.get(type) || [])]) callback({ type }); }
}

function page() {
  const browser = new Events();
  let fontsReady;
  const fonts = new Promise(resolve => { fontsReady = resolve; });
  const frames = new Map();
  const timers = new Map();
  let sequence = 0;
  let alignments = 0;
  const target = { isConnected: true, scrollIntoView() { alignments++; } };
  const before = Object.assign(new Events(), { complete: false, loading: 'lazy', compareDocumentPosition: () => 4 });
  const after = Object.assign(new Events(), { complete: false, loading: 'lazy', compareDocumentPosition: () => 2 });
  Object.assign(browser, {
    location: { hash: '#update-rx' },
    document: { getElementById: id => id === 'update-rx' ? target : null, images: [before, after], fonts: { ready: fonts } },
    requestAnimationFrame: callback => { const id = ++sequence; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: callback => { const id = ++sequence; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
  });
  return {
    browser, before, after, fontsReady, timers,
    get alignments() { return alignments; },
    frame() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
  };
}

test('a deep link aligns again after preceding photos and fonts load, without loading later photos', async () => {
  const p = page();
  followProjectAnchor(p.browser);
  p.frame();
  assert.equal(p.alignments, 1);
  assert.equal(p.before.loading, 'eager');
  assert.equal(p.after.loading, 'lazy');
  p.before.fire('load');
  await Promise.resolve();
  p.frame();
  assert.equal(p.alignments, 1);
  p.fontsReady();
  await new Promise(resolve => setImmediate(resolve));
  p.frame();
  assert.equal(p.alignments, 2);
  assert.equal(p.timers.size, 0);
});

test('user gestures, a different hash and unmount cancel delayed alignment', async () => {
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'hashchange', 'unmount']) {
    const p = page();
    const cleanup = followProjectAnchor(p.browser);
    p.frame();
    if (event === 'unmount') cleanup();
    else p.browser.fire(event);
    p.before.fire('load');
    p.fontsReady();
    await new Promise(resolve => setImmediate(resolve));
    p.frame();
    assert.equal(p.alignments, 1, event);
    assert.equal(p.timers.size, 0, event);
  }
});

test('a broken photo and a stalled photo cannot keep the initial jump pending indefinitely', async () => {
  const failed = page();
  followProjectAnchor(failed.browser);
  failed.frame();
  failed.before.fire('error');
  failed.fontsReady();
  await new Promise(resolve => setImmediate(resolve));
  failed.frame();
  assert.equal(failed.alignments, 2);
  const stalled = page();
  followProjectAnchor(stalled.browser);
  stalled.frame();
  [...stalled.timers.values()].forEach(callback => callback());
  stalled.frame();
  assert.equal(stalled.alignments, 2);
  assert.equal(stalled.timers.size, 0);
});
