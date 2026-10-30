import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { transform } from 'sucrase';
import { buildDesktopPrimaryNavigation } from '../src/utils/navigation.js';
import { localizePath } from '../src/utils/locales.js';

const source = readFileSync(new URL('../src/components/Navbar.jsx', import.meta.url), 'utf8');
const code = transform(source.replace(/^import .*;$/gm, '').replace('export default function', 'function'), { transforms: ['jsx'] }).code;
const Navbar = new Function('React', 'useState', 'useEffect', 'motion', 'AnimatePresence', 'Menu', 'X', 'useLanguage', 'LUXURY_EASE', 'localizePath', 'buildDesktopPrimaryNavigation', `${code};return Navbar;`)(React, React.useState, React.useEffect, { nav: 'nav', a: 'a', div: 'div' }, React.Fragment, 'svg', 'svg', () => ({ language: 'nl', setLanguage() {}, t: key => key }), [], localizePath, buildDesktopPrimaryNavigation);

test('crossing the desktop breakpoint closes the menu and restores the previous scroll setting', () => {
  let mediaChange;
  const media = { matches: false, addEventListener(_event, callback) { mediaChange = callback; }, removeEventListener() {} };
  globalThis.window = { matchMedia: query => { assert.equal(query, '(min-width: 1280px)'); return media; }, addEventListener() {}, removeEventListener() {}, scrollY: 0 };
  globalThis.document = { body: { style: { overflow: 'scroll' } } };
  let renderer;
  act(() => { renderer = create(React.createElement(Navbar, { onNavigate() {} })); });
  const toggle = () => renderer.root.findAllByType('button').find(node => node.props['aria-controls'] === 'desktop-responsive-menu');
  act(() => toggle().props.onClick());
  assert.equal(globalThis.document.body.style.overflow, 'hidden');
  act(() => { media.matches = true; mediaChange(); });
  assert.equal(toggle().props['aria-expanded'], false);
  assert.equal(globalThis.document.body.style.overflow, 'scroll');
  act(() => renderer.unmount());
  assert.equal(globalThis.document.body.style.overflow, 'scroll');
});
