import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { transform } from 'sucrase';
import { localizedProjectValue } from '../src/utils/rembrandtProject.js';

// Exercise the gallery's state and wiring; the vendor viewer is tested in-browser.
const source = readFileSync(new URL('../src/components/ResearchGallery.jsx', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace('const loadViewer = () => import("./ResearchViewer");', 'const loadViewer = () => Promise.resolve();')
  .replace('const ResearchViewer = lazy(loadViewer);', 'const ResearchViewer = MockViewer;')
  .replace('export default function', 'function')
  .replace('export function', 'function');
const code = transform(source, { transforms: ['jsx'] }).code;
const Gallery = new Function('React', 'Suspense', 'useEffect', 'useMemo', 'useRef', 'useState', 'motion', 'useReducedMotion', 'localizedProjectValue', 'MockViewer', 'ArrowLeft', 'ArrowRight', 'ArrowUpRight', 'Expand', `${code}; return ResearchGallery;`)(
  React, React.Suspense, React.useEffect, React.useMemo, React.useRef, React.useState, { img: 'img' }, () => true, localizedProjectValue, props => React.createElement('viewer', props), 'svg', 'svg', 'svg', 'svg',
);
const images = [
  { id: 'missing', url: '' },
  { id: 'a', url: '/a.jpg', alt: { nl: 'Voorzijde', fr: 'Recto' }, caption: { nl: 'Eerste onderzoek', fr: 'Première étude' } },
  { id: 'b', url: '/b.jpg', alt: { nl: 'Achterzijde', fr: 'Verso' }, caption: { nl: 'Tweede onderzoek', fr: 'Deuxième étude' } },
];
const copy = { enlarge: 'Bekijk op groot formaat', close: 'Afbeelding sluiten', imageNote: 'Onderzoeksbeeld' };

test('research gallery keeps selection, caption and full-screen index together, skipping empty images', async () => {
  let renderer;
  await act(async () => { renderer = create(React.createElement(Gallery, { images, language: 'nl', copy })); });
  const root = renderer.root;
  const thumbs = () => root.findAllByProps({ className: 'research-gallery__thumbnail' });
  assert.equal(thumbs().length, 2);
  assert.equal(root.findByProps({ 'aria-label': 'Vorig beeld' }).props.disabled, true);
  await act(async () => thumbs()[1].props.onClick());
  assert.equal(root.findByProps({ className: 'research-gallery__caption' }).children.join(''), 'Tweede onderzoek');
  assert.equal(root.findByProps({ 'aria-label': 'Volgend beeld' }).props.disabled, true);
  await act(async () => root.findByProps({ className: 'research-gallery__image' }).props.onClick());
  const viewer = root.findByType('viewer');
  assert.equal(viewer.props.index, 1);
  assert.deepEqual(viewer.props.images.map(image => image.id), ['a', 'b']);
  await act(async () => viewer.props.onView(0));
  assert.equal(thumbs()[0].props['aria-pressed'], true);
  assert.equal(root.findByProps({ className: 'research-gallery__caption' }).children.join(''), 'Eerste onderzoek');
  await act(async () => renderer.unmount());
});

test('single-image and empty galleries remain usable, with localized labels and captions', async () => {
  let renderer;
  await act(async () => { renderer = create(React.createElement(Gallery, { images: [images[1]], language: 'fr', copy })); });
  assert.equal(renderer.root.findAllByProps({ className: 'research-gallery__thumbnail' }).length, 0);
  assert.equal(renderer.root.findAllByProps({ className: 'research-gallery__arrows' }).length, 0);
  assert.equal(renderer.root.findByProps({ className: 'research-gallery__caption' }).children.join(''), 'Première étude');
  assert.match(renderer.root.findByProps({ className: 'research-gallery__image' }).props['aria-label'], /Recto/);
  await act(async () => renderer.update(React.createElement(Gallery, { images: [images[0]], language: 'fr', copy })));
  assert.equal(renderer.toJSON(), null);
  await act(async () => renderer.unmount());
});
