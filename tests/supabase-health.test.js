import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSupabaseHealthHandler } from '../api/_lib/supabaseHealth.js';
import { verifyVercelFunctionBudget } from '../scripts/verify-vercel-functions.js';

const env = {
  CRON_SECRET: 'test-cron-secret-that-is-at-least-32-characters',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SECRET_KEY: 'test-server-secret-never-returned',
};
const response = () => ({
  statusCode: 200, headers: {}, body: null,
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const request = (authorization = `Bearer ${env.CRON_SECRET}`) => ({
  method: 'GET', headers: { authorization },
});
const fixture = (options = {}) => {
  const calls = [];
  const logs = [];
  const waits = [];
  const handler = createSupabaseHealthHandler({
    env,
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json([{ id: 'private-database-value' }]);
    },
    wait: async ms => waits.push(ms),
    logger: {
      info: (...args) => logs.push(args),
      error: (...args) => logs.push(args),
    },
    ...options,
  });
  return { handler, calls, logs, waits };
};

test('missing, incorrect and malformed bearer tokens never reach the database', async () => {
  const f = fixture();
  for (const token of [undefined, '', 'Bearer wrong', env.CRON_SECRET, [`Bearer ${env.CRON_SECRET}`]]) {
    const res = response();
    await f.handler({ method: 'GET', headers: { authorization: token } }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.headers['CDN-Cache-Control'], 'no-store');
    assert.equal(res.headers['X-Robots-Tag'], 'noindex, nofollow');
  }
  assert.equal(f.calls.length, 0);
  assert.equal(f.logs.length, 0);
});

test('missing/short cron secrets fail closed; non-GET requests never query', async () => {
  for (const secret of [undefined, '', 'short']) {
    const f = fixture({ env: { ...env, CRON_SECRET: secret } });
    const res = response();
    await f.handler(request(), res);
    assert.equal(res.statusCode, 503);
    assert.equal(f.calls.length, 0);
  }
  const f = fixture();
  for (const method of ['POST', 'HEAD', 'OPTIONS', 'DELETE']) {
    const res = response();
    await f.handler({ ...request(), method }, res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.Allow, 'GET');
  }
  assert.equal(f.calls.length, 0);
});

test('configuration errors never leak keys or reach the database', async () => {
  for (const override of [
    { SUPABASE_URL: undefined },
    { SUPABASE_URL: 'http://example.supabase.co' },
    { SUPABASE_URL: 'https://username:password@example.supabase.co' },
    { SUPABASE_SECRET_KEY: undefined },
  ]) {
    const f = fixture({ env: { ...env, ...override } });
    const res = response();
    await f.handler(request(), res);
    assert.equal(res.statusCode, 503);
    assert.equal(f.calls.length, 0);
    assert.doesNotMatch(JSON.stringify(res.body), /password|test-server-secret/);
  }
});

test('three real bounded reads succeed without exposing database values or secrets', async () => {
  const f = fixture();
  const res = response();
  await f.handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.attempts, 1);
  assert.deepEqual(res.body.checks.map(check => check.name), ['catalog', 'settings', 'analytics']);
  assert.equal(f.calls.length, 3);
  for (const call of f.calls) {
    const url = new URL(call.url);
    assert.equal(url.searchParams.get('limit'), '1');
    assert.match(url.searchParams.get('select'), /^(id|key)$/);
    assert.equal(call.init.method, 'GET');
    assert.equal(call.init.headers.apikey, env.SUPABASE_SECRET_KEY);
    assert.equal(call.init.cache, 'no-store');
    assert.equal(call.init.redirect, 'error');
    assert.ok(call.init.signal instanceof AbortSignal);
  }
  assert.equal(f.waits.length, 0);
  assert.match(res.headers['Cache-Control'], /no-store/);
  assert.doesNotMatch(JSON.stringify([res.body, f.logs]), /private-database-value|test-server-secret|test-cron-secret/);
});

test('legacy server key and URL fallback work, including empty tables', async () => {
  const f = fixture({
    env: {
      CRON_SECRET: env.CRON_SECRET,
      VITE_SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-key',
    },
    fetchImpl: async (_url, init) => {
      assert.equal(init.headers.apikey, 'legacy-service-key');
      return Response.json([]);
    },
  });
  const res = response();
  await f.handler(request(), res);
  assert.equal(res.statusCode, 200);
});

test('only transient failures retry, preserving successes and discarding error bodies', async () => {
  const counts = new Map();
  const f = fixture({ fetchImpl: async url => {
    const table = new URL(url).pathname;
    counts.set(table, (counts.get(table) || 0) + 1);
    if (table.endsWith('/items') && counts.get(table) === 1) {
      return new Response('private error details', { status: 503 });
    }
    return Response.json([]);
  } });
  const res = response();
  await f.handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.attempts, 2);
  assert.equal(counts.get('/rest/v1/items'), 2);
  assert.equal(counts.get('/rest/v1/admin_settings'), 1);
  assert.equal(counts.get('/rest/v1/analytics_events_v2'), 1);
  assert.deepEqual(f.waits, [500]);
  assert.doesNotMatch(JSON.stringify([res.body, f.logs]), /private error details/);
});

test('permanent HTTP failures and invalid successful responses report 503 without retry', async () => {
  for (const fetchImpl of [
    async () => new Response('provider secret', { status: 401 }),
    async () => new Response('schema details', { status: 404 }),
    async () => Response.json({ error: 'unexpected response' }),
    async () => Response.json([{}, {}]),
  ]) {
    const f = fixture({ fetchImpl });
    const res = response();
    await f.handler(request(), res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.attempts, 1);
    assert.equal(f.waits.length, 0);
    assert.doesNotMatch(JSON.stringify([res.body, f.logs]), /provider secret|schema details|unexpected response/);
  }
});

test('network failures and rate limits retry once and remain visible if unresolved', async () => {
  for (const fetchImpl of [
    async () => { throw new Error('sensitive connection details'); },
    async () => new Response('rate limit', { status: 429 }),
  ]) {
    let count = 0;
    const f = fixture({ fetchImpl: (...args) => { count++; return fetchImpl(...args); } });
    const res = response();
    await f.handler(request(), res);
    assert.equal(count, 6);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.attempts, 2);
    assert.equal(f.logs.length, 1);
    assert.doesNotMatch(JSON.stringify([res.body, f.logs]), /sensitive connection details/);
  }
});

test('hung requests abort and report timeouts after exactly one retry', async () => {
  // Keep the test event loop alive; AbortSignal.timeout itself is unref'ed.
  const keepAlive = setInterval(() => {}, 1000);
  try {
    let count = 0;
    const f = fixture({ timeoutMs: 15, fetchImpl: (_url, { signal }) => {
      count++;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    } });
    const res = response();
    await f.handler(request(), res);
    assert.equal(count, 6);
    assert.equal(res.statusCode, 503);
    assert.ok(res.body.checks.every(check => check.error === 'timeout'));
    assert.equal(res.body.attempts, 2);
  } finally {
    clearInterval(keepAlive);
  }
});

test('the daily Vercel schedule targets the dedicated handler within the function budget', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.crons, [{ path: '/api/supabase-health', schedule: '0 6 * * *' }]);
  assert.equal(config.functions['api/supabase-health.js'].maxDuration, 30);
  const functions = verifyVercelFunctionBudget();
  assert.ok(functions.includes('api/supabase-health.js'));
  assert.ok(functions.length <= 12);
});
