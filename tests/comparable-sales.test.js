import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { transform } from 'sucrase';
import { isCatalogItemPublished, needsCatalogPublication, hasCatalogPhoto } from '../src/utils/catalogPublication.js';

const source = readFileSync(new URL('../src/components/ComparableSalesSection.jsx', import.meta.url), 'utf8');
const code = transform(source.replace(/^import .*;$/gm, ''), { transforms: ['jsx'] }).code.replace('export default function', 'function');
const Section = new Function('React', 'useState', 'useLanguage', 'Building2', 'CalendarDays', 'ExternalLink', 'Gavel', 'ZoomIn', 'ImageZoomModal', `${code}; return ComparableSalesSection;`)(React, React.useState, () => ({ t: key => key, language: 'nl' }), 'svg', 'svg', 'svg', 'svg', 'svg', 'zoom-modal');

const image = 'https://example.com/reference.jpg';
const fields = { imageUrl: image, imageCaption: 'Bijschrift', description: 'Beschrijving', description_en: 'Description', description_fr: 'Description FR', seller: 'Verkoper', saleDate: '2026-01-01', lotNumber: '12', realizedPrice: 'EUR 120', priceType: 'hammer', saleUrl: 'https://example.com/sale' };

test('published related works render with any field missing, or all fields missing', () => {
  for (const field of [...Object.keys(fields), 'all']) {
    const sale = { id: field, published: true, ...fields };
    if (field === 'all') for (const key of Object.keys(fields)) delete sale[key];
    else delete sale[field];
    const renderer = create(React.createElement(Section, { sales: [sale] }));
    assert.equal(renderer.root.findAllByType('article').length, 1, field);
    assert.equal(renderer.root.findAllByType('img').length, field === 'imageUrl' || field === 'all' ? 0 : 1, field);
    renderer.unmount();
  }
});

test('a link alone is visible, drafts stay private, and zoom skips works without images', () => {
  const renderer = create(React.createElement(Section, { sales: [
    { published: true, saleUrl: 'https://example.com/sale' },
    { published: false, imageUrl: image },
    { published: true, seller: 'Met beeld', imageUrl: image },
    { published: true, imageUrl: 'javascript:alert(1)', saleUrl: 'javascript:alert(1)' },
  ] }));
  assert.equal(renderer.root.findAllByType('article').length, 3);
  assert.equal(renderer.root.findAllByType('a').length, 1);
  assert.equal(renderer.root.findAllByType('img').length, 1);
  act(() => renderer.root.findByType('button').props.onClick());
  const zoom = renderer.root.findByType('zoom-modal');
  assert.equal(zoom.props.initialIndex, 0);
  assert.deepEqual(zoom.props.images.map(entry => entry.url), [image]);
  assert.match(zoom.props.title, /Met beeld/);
  renderer.unmount();
});

test('admin save reaches persistence with every related-work field optional', async () => {
  const editor = readFileSync(new URL('../src/components/admin/ItemManager.jsx', import.meta.url), 'utf8');
  const handler = editor.slice(editor.indexOf('  const handleSaveForm ='), editor.indexOf('  handleSaveFormRef.current'));
  for (const field of [...Object.keys(fields), 'all']) {
    const sale = { id: field, published: true, ...fields };
    if (field === 'all') for (const key of Object.keys(fields)) delete sale[key];
    else delete sale[field];
    const item = { id: 'work', title: 'Werk', isPublished: true, images: [{ url: image }], comparableSales: [sale] };
    let saved;
    const save = new Function('editingItem', 'items', 'isUploading', 'imageUploadError', 'onShowToast', 'setEditorTab', 'syncUniversalMediaUrlsAsync', 'onSaveItem', 'setEditingItem', 'isCatalogItemPublished', 'needsCatalogPublication', 'hasCatalogPhoto', `${handler}; return handleSaveForm;`)(item, [item], false, false, () => {}, () => {}, async () => {}, async value => { saved = value; return { success: true }; }, () => {}, isCatalogItemPublished, needsCatalogPublication, hasCatalogPhoto);
    await save();
    assert.deepEqual(saved?.comparableSales, [sale], field);
  }
});
