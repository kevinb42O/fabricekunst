import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Execute the existing storage functions with an isolated network/browser,
// so regressions cover the real cached read + mutation path without cloud writes.
const source = readFileSync(new URL('../src/utils/storage.js', import.meta.url), 'utf8');
function storageFixture() {
  let server = { catalog: [{ id: 'demo', title: 'NL', title_fr: 'Ancien texte' }] };
  let reads = 0;
  const readCode = source.slice(source.indexOf('const fetchPublicContentSnapshot ='), source.indexOf('const publishPublicContentSnapshot ='));
  const saveCode = source.slice(source.indexOf('export const saveCatalogAsync ='), source.indexOf('// --- IMAGE UPLOAD HELPER ---')).replaceAll('export const ', 'const ');
  const api = new Function('fetch', 'authenticatedAdminFetch', 'isSupabaseConfigured', 'supabase', 'getCatalog', 'saveCatalog', 'validateCatalogImageReferences', 'formatSupabaseErrorMessage', `let publicContentPromise=null; ${readCode} ${saveCode} return { read:fetchPublicContentSnapshot, save:saveItemAsync, saveMany:saveCatalogAsync, remove:deleteItemAsync };`)(
    async () => { reads++; return { ok: true, json: async () => structuredClone(server) }; },
    async (_url, init) => {
      const body = JSON.parse(init.body);
      server = { catalog: body.action === 'delete' ? server.catalog.filter(i => i.id !== body.itemId) : body.items || [body.item] };
      return { ok: true, json: async () => ({ ok: true }) };
    }, () => true, {}, () => server.catalog, () => {}, () => {}, e => e.message,
  );
  return { ...api, get reads() { return reads; } };
}

test('single, batch and delete mutations invalidate previously fetched catalog translations', async () => {
  for (const action of ['save', 'saveMany', 'remove']) {
    const s = storageFixture();
    assert.equal((await s.read()).catalog[0].title_fr, 'Ancien texte');
    const item = { id: 'demo', title: 'NL', title_fr: 'Nouveau texte' };
    const result = await s[action](action === 'saveMany' ? [item] : action === 'remove' ? item.id : item);
    assert.equal(result.success, true);
    const catalog = (await s.read()).catalog;
    assert.equal(s.reads, 2);
    if (action === 'remove') assert.deepEqual(catalog, []);
    else assert.equal(catalog[0].title_fr, 'Nouveau texte');
  }
});

test('legacy embedded snake-case French/English dossier texts survive reloading', () => {
  const mapperCode = source.slice(source.indexOf('const extractFieldValue ='), source.indexOf('// Map database inquiry'));
  const mapItem = new Function('normalizeCatalogItemTaxonomy', 'getCategorySlug', `${mapperCode}; return mapDbItemToFrontend;`)(x => x, x => x);
  const mapped = mapItem({ id: 'book', title: 'NL', images: [{ __ext__: true, payload: { condition_report_fr: 'Rapport français', historical_context_en: 'English history' } }] });
  assert.equal(mapped.conditionReport_fr, 'Rapport français');
  assert.equal(mapped.historicalContext_en, 'English history');
  assert.deepEqual(mapped.images, []);
});
