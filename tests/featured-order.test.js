import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { transform } from 'sucrase';
import { getFeaturedItems, withFeaturedOrder } from '../src/utils/featuredOrder.js';
import { isCatalogItemPublished, mergeCatalogItemExtension } from '../src/utils/catalogPublication.js';
import { parseCatalogMutation, toStoredCatalogItem } from '../api/_lib/catalogItemsEndpoint.js';

const works = [
  { id: 'a', title: 'Eerste werk', featured: true, created_at: '2026-01-01' },
  { id: 'b', title: 'Tweede werk', featured: true, created_at: '2026-02-01' },
  { id: 'draft', title: 'Concept', featured: true, isPublished: false },
  { id: 'other', title: 'Geen topstuk', featured: false },
];

test('manual order survives the batch payload, extension storage and public catalog reload', () => {
  const ordered = withFeaturedOrder([works[1], works[0], works[2]]);
  const mutation = parseCatalogMutation({ action: 'save-many', items: ordered });
  const extensions = new Map(mutation.items.map(item => [item.id, JSON.stringify(toStoredCatalogItem(item))]));
  // The database may return canonical rows in a different order each time.
  const reloaded = [...works].reverse().map(item => mergeCatalogItemExtension(item, JSON.parse(extensions.get(item.id) || 'null')));
  assert.deepEqual(getFeaturedItems(reloaded).map(item => item.id), ['b', 'a']);
  assert.deepEqual(getFeaturedItems(reloaded, { includeDrafts: true }).map(item => item.id), ['b', 'a', 'draft']);
  assert.equal(reloaded.find(item => item.id === 'other').featured, false);
  assert.equal(works[0].featuredOrder, undefined);
});

test('unranked and newly featured works follow saved works; invalid ranks are ignored', () => {
  const input = [works[1], { ...works[0], featuredOrder: 1 }, { id: 'new', featured: true, featuredOrder: -1 }];
  assert.deepEqual(getFeaturedItems(input).map(item => item.id), ['a', 'new', 'b']);
  assert.deepEqual(getFeaturedItems([works[1], works[0]]).map(item => item.id), ['a', 'b']);
});

const source = readFileSync(new URL('../src/components/admin/FeaturedOrderManager.jsx', import.meta.url), 'utf8');
const code = transform(source.replace(/^import .*;$/gm, ''), { transforms: ['jsx'] }).code.replace('export default function', 'function');
const Manager = new Function('React', 'useState', 'useEffect', 'ArrowDown', 'ArrowUp', 'Loader2', 'getFeaturedItems', 'withFeaturedOrder', 'isCatalogItemPublished', `${code}; return FeaturedOrderManager;`)(React, React.useState, React.useEffect, 'svg', 'svg', 'svg', getFeaturedItems, withFeaturedOrder, isCatalogItemPublished);

test('dashboard moves, saves and reopens the selected order; failures retain the selection for retry', async () => {
  let saved, fail = true, renderer;
  const onSave = async items => {
    if (fail) return { success: false, error: 'Publiceren mislukt. Probeer opnieuw.' };
    saved = items;
    return { success: true };
  };
  const visibleWorks = works.slice(0, 2);
  await act(async () => { renderer = create(React.createElement(Manager, { items: visibleWorks, onSave })); });
  const saveButton = () => renderer.root.findAllByType('button')[0];
  assert.equal(saveButton().props.disabled, true);
  await act(async () => renderer.root.findByProps({ 'aria-label': 'Tweede werk omhoog' }).props.onClick());
  assert.equal(saveButton().props.disabled, false);
  await act(async () => saveButton().props.onClick());
  assert.match(renderer.root.findByProps({ role: 'alert' }).children.join(''), /Publiceren mislukt/);
  assert.equal(saveButton().props.disabled, false);
  fail = false;
  await act(async () => saveButton().props.onClick());
  assert.deepEqual(saved.map(item => [item.id, item.featuredOrder]), [['b', 0], ['a', 1]]);
  await act(async () => renderer.update(React.createElement(Manager, { items: saved, onSave })));
  assert.equal(saveButton().props.disabled, true);
  assert.equal(renderer.root.findByProps({ 'aria-label': 'Tweede werk omhoog' }).props.disabled, true);
  await act(async () => renderer.unmount());
});

test('frontend reload keeps the saved rank, and a partial cloud save keeps the full local catalog', async () => {
  const storage = readFileSync(new URL('../src/utils/storage.js', import.meta.url), 'utf8');
  const mapperCode = storage.slice(storage.indexOf('const extractFieldValue ='), storage.indexOf('// Map database inquiry'));
  const mapper = new Function('normalizeCatalogItemTaxonomy', 'getCategorySlug', `${mapperCode}; return mapDbItemToFrontend;`)(item => item, value => value);
  assert.equal(mapper({ ...works[1], featuredOrder: 0 }).featuredOrder, 0);
  const saveCode = storage.slice(storage.indexOf('export const saveCatalogAsync ='), storage.indexOf('export const saveItemAsync =')).replace('export const ', 'const ');
  let cached, request;
  const save = new Function('isSupabaseConfigured', 'supabase', 'saveCatalog', 'validateCatalogImageReferences', 'authenticatedAdminFetch', 'formatSupabaseErrorMessage', `let publicContentPromise = {}; ${saveCode}; return saveCatalogAsync;`)(
    () => true, {}, items => { cached = items; }, () => {},
    async (_url, init) => { request = JSON.parse(init.body); return { ok: true, json: async () => ({ ok: true }) }; }, error => error.message,
  );
  const ordered = withFeaturedOrder([works[1], works[0]]);
  const result = await save([...ordered, works[3]], { changedItems: ordered });
  assert.equal(result.success, true);
  assert.deepEqual(request.items, ordered);
  assert.equal(cached.length, 3);
});
