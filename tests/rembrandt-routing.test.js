import test from 'node:test';
import assert from 'node:assert/strict';
import rembrandtProjectGate from '../middleware.js';

test('hidden dossier routes fail closed while preview shells remain reachable', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ enabled: false }), { status: 200 }));
  const hidden = await rembrandtProjectGate(new Request('https://www.atelierrembrandt.com/fr/lost-rembrandt-project/project-02'));
  assert.equal(hidden.status, 404);
  assert.equal(hidden.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(fetchMock.mock.callCount(), 1);
  const preview = await rembrandtProjectGate(new Request('https://www.atelierrembrandt.com/fr/lost-rembrandt-project/preview/project-02'));
  assert.equal(preview.headers.get('x-middleware-next'), '1');
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('public dossier routes pass only an enabled access check', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ enabled: true }), { status: 200 }));
  const response = await rembrandtProjectGate(new Request('https://www.atelierrembrandt.com/lost-rembrandt-project/project-01'));
  assert.equal(response.headers.get('x-middleware-next'), '1');
});
