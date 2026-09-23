import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCatalogMutation, toStoredCatalogItem } from '../api/catalog-items.js';

test('catalog mutations accept only one bounded, well-formed save request', () => {
  const item = { id: 'rembrandt-001', title: 'Portrait', images: [] };
  assert.deepEqual(parseCatalogMutation({ action: 'save', item }), { action: 'save', item });
  assert.equal(parseCatalogMutation({ action: 'save', item: [] }), null);
  assert.equal(parseCatalogMutation({ action: 'save', item: { id: 'x', title: 'x'.repeat(600 * 1024) } }), null);
});

test('catalog batch mutations are bounded and preserve each item payload', () => {
  const items = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }];
  assert.deepEqual(parseCatalogMutation({ action: 'save-many', items }), { action: 'save-many', items });
  assert.equal(parseCatalogMutation({ action: 'save-many', items: [] }), null);
  assert.equal(parseCatalogMutation({ action: 'save-many', items: Array.from({ length: 101 }, () => ({ id: 'x', title: 'X' })) }), null);
});

test('catalog mutations reject unsafe delete identifiers', () => {
  assert.deepEqual(parseCatalogMutation({ action: 'delete', itemId: 'rembrandt-001' }), {
    action: 'delete', itemId: 'rembrandt-001',
  });
  assert.equal(parseCatalogMutation({ action: 'delete', itemId: '../all-items' }), null);
  assert.equal(parseCatalogMutation({ action: 'delete', itemId: '' }), null);
  assert.equal(parseCatalogMutation({ action: 'publish' }), null);
});

test('server catalog serialization preserves the established taxonomy mapping', () => {
  const stored = toStoredCatalogItem({
    id: 'painting-1',
    title: 'Still life',
    itemType: 'painting',
    category: 'Stillevens & Landschappen',
  });
  assert.equal(stored.category, 'still-lifes-landscapes');
  assert.equal(stored.collectionGroup, 'art');
});
