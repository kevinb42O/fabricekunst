import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = JSON.parse(
  await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
);

test('dynamic catalogue item routes fall back to the localized application shell', () => {
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites.get('/collectie/:slug'), '/');
  assert.equal(rewrites.get('/en/collectie/:slug'), '/en');
  assert.equal(rewrites.get('/fr/collectie/:slug'), '/fr');
});
