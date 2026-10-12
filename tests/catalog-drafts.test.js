import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getCatalogItemStatus, withCatalogItemStatus, isCatalogItemPublished,
  needsCatalogPublication, hasCatalogPhoto, mergeCatalogItemExtension,
} from '../src/utils/catalogPublication.js';
import { buildPublicContentSnapshot } from '../api/_lib/publicContent.js';
import { buildSitemapXml } from '../src/utils/sitemap.js';
import { createCatalogItemsHandler, toStoredCatalogItem } from '../api/_lib/catalogItemsEndpoint.js';

test('a draft preserves its sale status and requires an explicit publication transition', () => {
  const sold = { id: 'sold', title: 'Sold work', status: 'Verkocht' };
  assert.equal(isCatalogItemPublished(sold), true);
  const draft = withCatalogItemStatus(sold, 'Concept');
  assert.equal(draft.status, 'Verkocht');
  assert.equal(getCatalogItemStatus(draft), 'Concept');
  assert.equal(isCatalogItemPublished(draft), false);
  const published = withCatalogItemStatus(draft, 'Beschikbaar');
  assert.equal(needsCatalogPublication(published, draft), true);
  assert.equal(needsCatalogPublication(published, published), false);
  assert.equal(hasCatalogPhoto(draft), false);
  assert.equal(hasCatalogPhoto({ images: [{ __ext__: true, url: 'extension' }] }), false);
  assert.equal(hasCatalogPhoto({ images: [{ url: 'https://media.atelierrembrandt.com/photo.jpg' }] }), true);
  assert.equal(toStoredCatalogItem(draft).is_published, false);
});

test('canonical publication cannot be overridden by stale extension data', () => {
  const merged = mergeCatalogItemExtension({ id: 'draft', is_published: false }, { isPublished: true, is_published: true, title_fr: 'Brouillon' });
  assert.equal(isCatalogItemPublished(merged), false);
  assert.equal(merged.title_fr, 'Brouillon');
});

test('public snapshots exclude drafts and their translations even when featured or sold', async () => {
  const items = [
    { id: 'visible', title: 'Visible', is_published: true },
    { id: 'legacy', title: 'Legacy', status: 'Gereserveerd' },
    { id: 'secret', title: 'Private draft', is_published: false, featured: true, status: 'Verkocht' },
  ];
  const settings = [
    { key: 'item_ext_secret', value: JSON.stringify({ title_fr: 'PRIVATE_DRAFT_TRANSLATION', isPublished: true }) },
    { key: 'item_ext_visible', value: JSON.stringify({ title_fr: 'Visible French' }) },
  ];
  const supabase = { from(table) {
    const rows = table === 'items' ? items : settings;
    return { select() { return this; }, order: async () => ({ data: rows }), or: async () => ({ data: rows }) };
  } };
  const snapshot = await buildPublicContentSnapshot(supabase);
  assert.deepEqual(snapshot.catalog.map((item) => item.id), ['visible', 'legacy']);
  assert.equal(snapshot.catalog[0].title_fr, 'Visible French');
  assert.equal(JSON.stringify(snapshot).includes('PRIVATE_DRAFT'), false);
  assert.equal(JSON.stringify(snapshot).includes('Private draft'), false);
});

test('draft detail URLs never enter the sitemap, including an entirely draft catalog', () => {
  const draft = { id: 'secret-draft', title: 'Secret draft', isPublished: false };
  const live = { id: 'live-work', title: 'Live work' };
  const sitemap = buildSitemapXml([draft, live]);
  assert.equal(sitemap.includes('secret-draft'), false);
  assert.equal(sitemap.includes('live-work'), true);
  assert.equal(buildSitemapXml([draft]).includes('/collectie/secret'), false);
});

const response = () => ({
  statusCode: 200, headers: {}, body: null,
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('private admin reads include drafts and translations without publishing or mutating', async () => {
  const db = { from(table) {
    return { select() { return this; },
      order: async () => ({ data: [{ id: 'draft', title: 'Draft', is_published: false }] }),
      like: async () => ({ data: [{ key: 'item_ext_draft', value: JSON.stringify({ title_fr: 'Brouillon', isPublished: true }) }] }),
    };
  }, rpc() { throw new Error('A read attempted a mutation'); } };
  const handler = createCatalogItemsHandler({ getSupabase: () => db, authorize: async () => ({ ok: true }), publish() { throw new Error('A read attempted publication'); } });
  const res = response();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.catalog[0].title_fr, 'Brouillon');
  assert.equal(isCatalogItemPublished(res.body.catalog[0]), false);
  assert.match(res.headers['Cache-Control'], /no-store/);
  assert.equal(res.headers['CDN-Cache-Control'], 'no-store');
});

test('unauthorized catalog reads cannot touch the private tables', async () => {
  const handler = createCatalogItemsHandler({ getSupabase: () => ({ from() { throw new Error('Unauthorized read'); } }), authorize: async () => ({ ok: false, status: 403, error: 'Forbidden' }) });
  const res = response();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.catalog, undefined);
});

const storageSource = readFileSync(new URL('../src/utils/storage.js', import.meta.url), 'utf8');
const adminReadSource = storageSource.slice(storageSource.indexOf('export const fetchAdminCatalogAsync ='), storageSource.indexOf('export const saveCatalog =')).replace('export const ', 'const ');

test('reopening the editor reads the private catalog including a title-only draft', async () => {
  const draft = { id: 'work-in-progress', title: 'Work in progress', is_published: false, images: [] };
  let request;
  const read = new Function('isSupabaseConfigured', 'supabase', 'getCatalog', 'authenticatedAdminFetch', 'mapDbItemToFrontend', `${adminReadSource}; return fetchAdminCatalogAsync;`)(
    () => true, {}, () => { throw new Error('Private read used a public fallback'); },
    async (url, options) => { request = { url, options }; return { ok: true, json: async () => ({ ok: true, catalog: [draft] }) }; },
    item => item,
  );
  assert.deepEqual(await read(), [draft]);
  assert.equal(request.url, '/api/catalog-items');
  assert.equal(request.options.cache, 'no-store');
});

test('a failed private catalog read reports an error instead of showing an incomplete public catalog', async () => {
  const read = new Function('isSupabaseConfigured', 'supabase', 'getCatalog', 'authenticatedAdminFetch', 'mapDbItemToFrontend', `${adminReadSource}; return fetchAdminCatalogAsync;`)(
    () => true, {}, () => { throw new Error('Unexpected fallback'); },
    async () => ({ ok: false, json: async () => ({ error: 'Session expired' }) }), item => item,
  );
  await assert.rejects(read(), /Session expired/);
});

test('an empty published catalog remains empty rather than resurrecting bundled items', async () => {
  const code = storageSource.slice(storageSource.indexOf('export const fetchCatalogAsync ='), storageSource.indexOf('export const fetchAdminCatalogAsync =')).replace('export const ', 'const ');
  const read = new Function('isSupabaseConfigured', 'fetchPublicContentSnapshot', 'mapDbItemToFrontend', 'clearCatalogBrowserCache', 'getCatalog', 'isCatalogItemPublished', `${code}; return fetchCatalogAsync;`)(
    () => true, async () => ({ catalog: [] }), item => item, () => {}, () => [{ id: 'fallback' }], isCatalogItemPublished,
  );
  assert.deepEqual(await read(), []);
});
