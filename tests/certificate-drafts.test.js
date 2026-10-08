import test from 'node:test';
import assert from 'node:assert/strict';
import { createCertificateDraft, certificateDraftKey } from '../src/utils/certificateDrafts.js';
import { createCertificateDraftsHandler, parseCertificateSave } from '../api/_lib/certificateDraftsEndpoint.js';
import { buildPublicContentSnapshot } from '../api/_lib/publicContent.js';

const item = { id: 'book-1', ref: 'FB-2026-123', title: 'Nederlandse titel', title_fr: 'Titre français', title_en: 'English title', binding: 'Band', binding_fr: 'Reliure', binding_en: 'Binding', provenance: 'Herkomst', provenance_fr: 'Provenance française', provenance_en: 'English provenance' };
const response = () => ({ code: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
function fixture() {
  const rows = new Map();
  let race = null;
  let failure = null;
  const db = { from(table) {
    let operation = 'read', record, filters = {};
    const query = {
      select() { return this; }, eq(key, value) { filters[key] = value; return this; },
      insert(value) { operation = 'insert'; record = value; return this; },
      update(value) { operation = 'update'; record = value; return this; },
      async single() { return this.maybeSingle(); },
      async maybeSingle() {
        if (failure) return { data: null, error: failure };
        if (table === 'items') return { data: filters.id === item.id ? { id: item.id } : null, error: null };
        if (operation === 'read') return { data: rows.get(filters.key) || null, error: null };
        if (race) { race(rows, record.key); race = null; }
        if (operation === 'insert' && rows.has(record.key)) return { data: null, error: { code: '23505' } };
        if (operation === 'update' && rows.get(record.key)?.value !== filters.value) return { data: null, error: null };
        rows.set(record.key, record);
        return { data: { key: record.key }, error: null };
      },
    };
    return query;
  } };
  const handler = createCertificateDraftsHandler({ getSupabase: () => db, authorize: async () => ({ ok: true }) });
  const request = async (method, language = 'fr', body = {}) => {
    const res = response();
    await handler({ method, headers: {}, query: { itemId: item.id, language }, body: { itemId: item.id, language, ...body } }, res);
    return res;
  };
  return { rows, request, race: fn => { race = fn; }, fail: value => { failure = value; } };
}

test('certificate defaults use saved French/English object text, localized dates and NVT', () => {
  const fr = createCertificateDraft(item, 'fr', new Date('2026-10-08T12:00:00Z'));
  assert.equal(fr.customTitle, 'Titre français');
  assert.equal(fr.customBinding, 'Reliure');
  assert.equal(fr.customProvenance, 'Provenance française');
  assert.match(fr.certDate, /octobre/);
  assert.equal(createCertificateDraft(item, 'en').customTitle, 'English title');
  assert.equal(createCertificateDraft({ ...item, emptyFields: { binding_fr: true } }, 'fr').customBinding, '');
  assert.equal(createCertificateDraft({ ...item, title_fr: '' }, 'fr').customTitle, item.title);
});

test('certificate texts, customer/date and options persist separately per language', async () => {
  const { request } = fixture();
  const fr = { ...createCertificateDraft(item, 'fr'), customTitle: 'Titre corrigé', customGuaranteeText: 'Garantie personnelle', issuedTo: 'Collection Test', certDate: '1 janvier 2027', showImage: false };
  const savedFr = await request('POST', 'fr', { draft: fr, expectedVersion: null });
  assert.equal(savedFr.code, 200);
  assert.match(savedFr.body.version, /^[a-f0-9-]{36}$/);
  const en = createCertificateDraft(item, 'en');
  assert.equal((await request('POST', 'en', { draft: en, expectedVersion: null })).code, 200);
  assert.deepEqual((await request('GET', 'fr')).body.draft, fr);
  assert.deepEqual((await request('GET', 'en')).body.draft, en);
  assert.equal((await request('GET', 'nl')).body.draft, null);
  assert.match((await request('GET')).headers['Cache-Control'], /no-store/);
});

test('a stale tab cannot overwrite a newer certificate, including races during UPDATE/INSERT', async () => {
  const f = fixture();
  const draft = createCertificateDraft(item, 'fr');
  const first = await f.request('POST', 'fr', { draft, expectedVersion: null });
  const second = await f.request('POST', 'fr', { draft: { ...draft, customTitle: 'Nieuw' }, expectedVersion: first.body.version });
  assert.equal(second.code, 200);
  assert.equal((await f.request('POST', 'fr', { draft, expectedVersion: first.body.version })).code, 409);
  const key = certificateDraftKey(item.id, 'fr');
  f.race(rows => rows.set(key, { value: JSON.stringify({ version: 'concurrent', draft: { ...draft, customTitle: 'Gelijktijdig' } }) }));
  assert.equal((await f.request('POST', 'fr', { draft, expectedVersion: second.body.version })).code, 409);
  assert.equal((await f.request('GET')).body.draft.customTitle, 'Gelijktijdig');
  f.race((rows, newKey) => rows.set(newKey, { value: JSON.stringify({ version: 'other', draft }) }));
  assert.equal((await f.request('POST', 'en', { draft, expectedVersion: null })).code, 409);
});

test('invalid fields, unsupported languages, missing objects and unauthorized access are rejected', async () => {
  const draft = createCertificateDraft(item, 'fr');
  assert.equal(parseCertificateSave({ itemId: item.id, language: 'de', draft, expectedVersion: null }), null);
  assert.equal(parseCertificateSave({ itemId: item.id, language: 'fr', draft: { ...draft, customTitle: [] }, expectedVersion: null }), null);
  assert.equal(parseCertificateSave({ itemId: '../secret', language: 'fr', draft, expectedVersion: null }), null);
  // Authorization must happen before any content query; supplying no client
  // is safe because the denied authorization never uses it.
  const handler = createCertificateDraftsHandler({ getSupabase: () => null, authorize: async () => ({ ok: false, status: 403, error: 'Denied' }) });
  const res = response();
  await handler({ method: 'GET', headers: {}, query: {} }, res);
  assert.equal(res.code, 403);
  assert.equal((await fixture().request('DELETE')).code, 405);
  assert.equal((await fixture().request('POST', 'fr', { itemId: 'missing', draft, expectedVersion: null })).code, 404);
});


test('private certificate customer names and declarations never enter public snapshots', async t => {
  t.mock.method(console, 'warn', () => {});
  const privateDraft = { issuedTo: 'PRIVATE-CERTIFICATE-CUSTOMER', customGuaranteeText: 'PRIVATE-CERTIFICATE-DECLARATION' };
  const db = { from(table) {
    const data = table === 'items' ? [item] : [
      { key: certificateDraftKey(item.id, 'fr'), value: JSON.stringify({ draft: privateDraft }) },
      { key: 'rembrandt_project_data', value: JSON.stringify({ isEnabled: false }) },
    ];
    return { select() { return this; }, order: async () => ({ data, error: null }), or: async () => ({ data, error: null }) };
  } };
  const snapshot = await buildPublicContentSnapshot(db);
  assert.equal(JSON.stringify(snapshot).includes('PRIVATE-CERTIFICATE'), false);
  assert.equal(snapshot.catalog[0].title_fr, item.title_fr);
});
