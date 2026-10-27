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

test('each gallery position becomes a full portrait row with the price beside its description', async () => {
  let renderer;
  await act(async () => { renderer = create(React.createElement(Showcase, { items: works })); });
  for (let index = 1; index < 4; index++) {
    const image = renderer.root.findByProps({ src: `/image-${index}.jpg` });
    await act(async () => image.props.onLoad({ currentTarget: { currentSrc: `/image-${index}.jpg`, naturalWidth: 900, naturalHeight: 1200 } }));
    const card = renderer.root.findByProps({ role: 'link', 'aria-label': `Work ${index}` });
    assert.match(card.props.className, /featured-work--portrait md:col-span-12/);
    const content = card.findByProps({ className: 'featured-work__content min-w-0' });
    assert.equal(content.findByProps({ 'data-price-for': `work-${index}` }).children[0], works[index].price);
  }
  // Replacing the photo must recalculate its layout using the new source.
  const changed = works.map(item => item.id === 'work-3' ? { ...item, images: [{ url: '/replacement-landscape.jpg' }] } : item);
  await act(async () => renderer.update(React.createElement(Showcase, { items: changed })));
  assert.doesNotMatch(renderer.root.findByProps({ role: 'link', 'aria-label': 'Work 3' }).props.className, /featured-work--portrait/);
  await act(async () => renderer.unmount());
});
