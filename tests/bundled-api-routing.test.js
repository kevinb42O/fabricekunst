import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import publishHandler from '../api/publish-public-content.js';
import publicHandler from '../api/public-content.js';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const rewriteRequest = (path, method, extra = {}) => {
  const route = config.rewrites.find((entry) => entry.source === path);
  assert.ok(route, `Missing compatibility route for ${path}`);
  const destination = new URL(route.destination, 'https://www.atelierrembrandt.com');
  return { method, headers: {}, query: Object.fromEntries(destination.searchParams), ...extra };
};
const response = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  send(body) { this.body = body; return this; },
});

test('the legacy catalog URL reaches the original bounded mutation handler', async () => {
  const res = response();
  await publishHandler(rewriteRequest('/api/catalog-items', 'POST', {
    headers: { 'content-length': String(3 * 1024 * 1024) },
  }), res);
  assert.equal(res.statusCode, 413);
  assert.match(res.body.error, /cataloguswijziging/);
  assert.match(res.headers['Cache-Control'], /no-store/);
});

test('catalog mutations still require administrator authorization after bundling', async () => {
  const res = response();
  await publishHandler(rewriteRequest('/api/catalog-items', 'POST', {
    body: { action: 'delete', itemId: 'painting-1' },
  }), res);
  assert.ok([401, 503].includes(res.statusCode));
  assert.match(res.body.error, /bearer token|configuration is incomplete/);
  assert.match(res.headers['Cache-Control'], /no-store/);
});

test('catalog reads cannot trigger a mutation through the compatibility URL', async () => {
  const res = response();
  await publishHandler(rewriteRequest('/api/catalog-items', 'GET'), res);
  assert.equal(res.statusCode, 405);
});

test('LLMs aliases retain their GET/HEAD method policy inside the public function', async () => {
  for (const path of ['/api/llms', '/llms.txt']) {
    const req = rewriteRequest(path, 'POST');
    assert.equal(req.query.resource, 'llms');
    const res = response();
    await publicHandler(req, res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.Allow, 'GET, HEAD');
  }
});
