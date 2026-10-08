import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import useCertificateDrafts from '../src/hooks/useCertificateDrafts.js';
import { certificateDraftKey } from '../src/utils/certificateDrafts.js';

globalThis.window = { addEventListener() {}, removeEventListener() {}, confirm: () => true };
const item = { id: 'book-1', title: 'NL', title_fr: 'FR', title_en: 'EN' };
const other = { id: 'book-2', title: 'Ander', title_fr: 'Autre' };
const session = (storage = new Map(), custom = {}) => {
  let current, renderer;
  let sequence = 0;
  const io = {
    load: async (id, lang) => structuredClone(storage.get(certificateDraftKey(id, lang)) || { draft: null, version: null }),
    save: async (id, lang, draft, expectedVersion) => {
      const key = certificateDraftKey(id, lang);
      if ((storage.get(key)?.version ?? null) !== expectedVersion) throw new Error('Andere sessie');
      const result = { draft: structuredClone(draft), version: `version-${++sequence}` };
      storage.set(key, result);
      return result;
    }, ...custom,
  };
  function Editor(props) { current = useCertificateDrafts(props.item, props.language, io); return null; }
  return {
    get state() { return current; },
    async open(selected = item, language = 'fr') { await act(async () => { renderer = create(React.createElement(Editor, { item: selected, language })); }); },
    async switch(selected, language) { await act(async () => { renderer.update(React.createElement(Editor, { item: selected, language })); }); },
    async edit(field, value) { await act(async () => current.updateField(field, value)); },
    async save() { await act(async () => { await current.saveAll(); }); },
    async close() { await act(async () => renderer.unmount()); },
  };
};

test('FR → EN → FR and object switches retain edits; saving persists all edited drafts after reopening', async () => {
  const storage = new Map();
  const s = session(storage);
  await s.open();
  assert.equal(s.state.draft.customTitle, 'FR');
  await s.edit('customTitle', 'Français modifié');
  await s.edit('customGuaranteeText', 'Déclaration personnalisée');
  await s.switch(item, 'en');
  assert.equal(s.state.draft.customTitle, 'EN');
  await s.edit('customNotes', 'English notes');
  await s.switch(other, 'fr');
  await s.edit('customTitle', 'Autre œuvre');
  await s.switch(item, 'fr');
  assert.equal(s.state.draft.customTitle, 'Français modifié');
  assert.equal(s.state.draft.customGuaranteeText, 'Déclaration personnalisée');
  await s.save();
  assert.equal(s.state.dirty, false);
  await s.close();
  const reopened = session(storage);
  await reopened.open();
  assert.equal(reopened.state.draft.customTitle, 'Français modifié');
  await reopened.switch(item, 'en');
  assert.equal(reopened.state.draft.customNotes, 'English notes');
  await reopened.switch(other, 'fr');
  assert.equal(reopened.state.draft.customTitle, 'Autre œuvre');
  await reopened.close();
});

test('save failures and conflicts retain input; loading failures block accidental overwrites', async () => {
  const s = session(new Map(), { save: async () => { throw new Error('Andere sessie'); } });
  await s.open();
  await s.edit('customTitle', 'Mijn invoer');
  await assert.rejects(s.save(), /Andere sessie/);
  assert.equal(s.state.draft.customTitle, 'Mijn invoer');
  assert.equal(s.state.dirty, true);
  assert.equal(s.state.saving, false);
  assert.match(s.state.error, /Andere sessie/);
  await s.close();
  const failed = session(new Map(), { load: async () => { throw new Error('Offline'); } });
  await failed.open();
  assert.equal(failed.state.ready, false);
  assert.match(failed.state.error, /Offline/);
  await failed.edit('customTitle', 'Mag niet overschrijven');
  assert.equal(failed.state.draft.customTitle, 'FR');
  await failed.close();
});

test('a slow load for a previous language never replaces the current language', async () => {
  let resolveFrench;
  const s = session(new Map(), { load: async (_id, lang) => lang === 'fr' ? new Promise(resolve => { resolveFrench = resolve; }) : { draft: null, version: null } });
  await s.open();
  assert.equal(s.state.loading, true);
  await s.switch(item, 'en');
  await s.edit('customTitle', 'Edited English');
  await act(async () => resolveFrench({ draft: { customTitle: 'Late French' }, version: 'old' }));
  assert.equal(s.state.draft.customTitle, 'Edited English');
  await s.close();
});
