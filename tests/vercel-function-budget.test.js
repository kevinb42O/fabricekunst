import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  listVercelFunctionEntrypoints,
  verifyVercelFunctionBudget,
} from '../scripts/verify-vercel-functions.js';

const fixture = (t, count) => {
  const root = mkdtempSync(join(tmpdir(), 'atelier-vercel-budget-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'api', '_lib'), { recursive: true });
  for (let index = 0; index < count; index += 1) {
    writeFileSync(join(root, 'api', `endpoint-${index}.js`), 'export default () => {};');
  }
  writeFileSync(join(root, 'middleware.js'), 'export const config = { runtime: "nodejs" };');
  writeFileSync(join(root, 'api', '_lib', 'privateHandler.js'), 'export default () => {};');
  return root;
};

test('the build budget includes Node.js middleware and excludes bundled helpers', (t) => {
  const root = fixture(t, 11);
  const entries = verifyVercelFunctionBudget(root);
  assert.equal(entries.length, 12);
  assert.ok(entries.includes('middleware.js'));
  assert.ok(entries.every((entry) => !entry.includes('_lib')));
});

test('adding a twelfth API alongside middleware blocks the build before deployment', (t) => {
  const root = fixture(t, 12);
  assert.throws(() => verifyVercelFunctionBudget(root), /13 functions exceed the limit of 12/);
});

test('nested API endpoints count towards the same deployment limit', (t) => {
  const root = fixture(t, 10);
  mkdirSync(join(root, 'api', 'reports'));
  writeFileSync(join(root, 'api', 'reports', 'monthly.ts'), 'export default () => {};');
  writeFileSync(join(root, 'api', 'reports', 'daily.js'), 'export default () => {};');
  assert.equal(listVercelFunctionEntrypoints(root).length, 13);
  assert.throws(() => verifyVercelFunctionBudget(root), /deployment blocked/);
});
