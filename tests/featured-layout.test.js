import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { transform } from 'sucrase';
import { getFeaturedItems } from '../src/utils/featuredOrder.js';
import { getImagePresentation, rememberImagePresentation } from '../src/utils/imagePresentation.js';

const source = readFileSync(new URL('../src/components/TopstukkenShowcase.jsx', import.meta.url), 'utf8');
const code = transform(source.replace(/^import .*;$/gm, ''), { transforms: ['jsx'] }).code.replace('export default function', 'function');
const Showcase = new Function('React', 'useState', 'motion', 'ArtworkPriceStatus', 'ArrowRight', 'useLanguage', 'getFeaturedItems', 'getItemField', 'getLocalizedCategory', 'LUXURY_EASE', 'getArtworkImageTransitionName', 'getArtworkTitleTransitionName', 'getImagePresentation', 'rememberImagePresentation', 'getItemSlug', 'localizePath', `${code}; return TopstukkenShowcase;`)(
  React, React.useState, { div: 'div', button: 'button' },
  ({ item }) => React.createElement('span', { 'data-price-for': item.id }, item.price), 'svg',
  () => ({ language: 'nl', t: key => key }), getFeaturedItems, (item, field) => item[field], value => value,
  [0, 0, 1, 1], id => id, id => id, getImagePresentation, rememberImagePresentation,
  item => item.id, path => path,
);
const works = Array.from({ length: 4 }, (_, index) => ({
  id: `work-${index}`, title: `Work ${index}`, featured: true, featuredOrder: index,
  images: [{ url: `/image-${index}.jpg` }], price: index === 3 ? '€ 250.000' : 'Prijs op aanvraag',
}));

test('four full rows alternate text right, left, right, left before and after image loads', async () => {
  let renderer;
  const extra = { ...works[0], id: 'extra', title: 'Fifth work', featuredOrder: 4 };
  await act(async () => { renderer = create(React.createElement(Showcase, { items: [...works, extra] })); });
  assert.equal(renderer.root.findAllByProps({ className: 'featured-work__layout' }).length, 4);
  assert.equal(renderer.root.findAllByProps({ 'aria-label': 'Fifth work' }).length, 0);
  for (let index = 0; index < 4; index++) {
    const card = renderer.root.findByProps({ role: 'link', 'aria-label': `Work ${index}` });
    const expected = index % 2 === 0 ? 'featured-work--text-right' : 'featured-work--text-left';
    assert.ok(card.props.className.includes(expected));
    const image = card.findByType('img');
    await act(async () => image.props.onLoad({ currentTarget: { currentSrc: `/image-${index}.jpg`, naturalWidth: index % 2 ? 1600 : 900, naturalHeight: 1200 } }));
    assert.ok(card.props.className.includes(expected));
    const content = card.findByProps({ className: 'featured-work__content min-w-0 space-y-6' });
    assert.equal(content.findByProps({ 'data-price-for': `work-${index}` }).children[0], works[index].price);
  }
  // Alternation follows the chosen order, never a work's identity or image ratio.
  const reordered = [...works].reverse().map((item, index) => ({ ...item, featuredOrder: index }));
  await act(async () => renderer.update(React.createElement(Showcase, { items: reordered })));
  assert.match(renderer.root.findByProps({ role: 'link', 'aria-label': 'Work 3' }).props.className, /featured-work--text-right/);
  assert.match(renderer.root.findByProps({ role: 'link', 'aria-label': 'Work 0' }).props.className, /featured-work--text-left/);
  await act(async () => renderer.unmount());
});
