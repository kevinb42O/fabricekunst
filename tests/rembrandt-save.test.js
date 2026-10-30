import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { transform } from 'sucrase';
import * as icons from 'lucide-react';
import * as projectUtils from '../src/utils/rembrandtProject.js';
import * as editorUtils from '../src/utils/rembrandtEditor.js';
import * as researchUtils from '../src/utils/rembrandtResearch.js';
import * as mediaUtils from '../src/utils/mediaSearch.js';
import * as locales from '../src/utils/locales.js';
import * as options from '../src/data/rembrandtProjectOptions.js';
import { cloneDefaultRembrandtProject } from '../src/data/defaultRembrandtProject.js';

globalThis.window = { addEventListener() {}, removeEventListener() {}, confirm: () => true };
const source = readFileSync(new URL('../src/components/admin/RembrandtProjectManager.jsx', import.meta.url), 'utf8');
const usedIcons = Object.fromEntries(source.match(/import \{([\s\S]*?)\} from "lucide-react"/)[1].split(',').map(name => name.trim()).filter(Boolean).map(name => { const [original, alias = original] = name.split(' as '); return [alias, icons[original]]; }));
const code = transform(source.replace(/^import[\s\S]*?;\n/gm, '').replace('export default function', 'function'), { transforms: ['jsx'] }).code;
const text = (node) => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');

async function editor(custom = {}) {
  let stored = { ...cloneDefaultRembrandtProject(), updatedAt: '2026-10-30T10:00:00.000Z' };
  let version = stored.updatedAt;
  let renderer;
  const writes = [];
  const notifications = [];
  const published = [];
  const io = {
    fetchRembrandtProjectAdminAsync: async () => {
      if (custom.failReads) throw new Error('Offline');
      return { project: structuredClone(stored), version, revisions: [] };
    },
    fetchRembrandtPreviewLinkAsync: async () => null,
    saveRembrandtProjectDataAsync: async (project, expectedVersion) => {
      writes.push({ project: structuredClone(project), expectedVersion });
      if (custom.save) return custom.save(project, expectedVersion);
      version = '2026-10-30T10:01:00.000Z';
      stored = { ...structuredClone(project), updatedAt: version };
      return { project: structuredClone(stored), version };
    },
    setRembrandtProjectAccessAsync: async (...args) => {
      if (custom.access) return custom.access(...args);
      throw Object.assign(new Error('Conflict'), { status: 409 });
    },
  };
  const bindings = { React, useState: React.useState, useEffect: React.useEffect, useMemo: React.useMemo, useId: React.useId, useRef: React.useRef, ...usedIcons, ...projectUtils, ...editorUtils, ...researchUtils, ...mediaUtils, ...locales, ...options, ...io, MediaPicker: () => null };
  const Component = new Function(...Object.keys(bindings), `${code};return RembrandtProjectManager;`)(...Object.values(bindings));
  await act(async () => {
    renderer = create(React.createElement(Component, { onShowToast: (...args) => notifications.push(args), onPublished: project => published.push(project) }));
  });
  const button = (label) => renderer.root.findAllByType('button').find(node => text(node) === label);
  const saveButton = () => renderer.root.findByProps({ className: 'rp-admin-header__actions' }).findByType('button');
  await act(async () => renderer.root.findByProps({ id: 'rp-tab-page' }).props.onClick());
  const titleInput = () => renderer.root.findAllByType('label').find(node => node.findAllByType('span').some(span => text(span) === 'Paginatitel')).findByType('input');
  return {
    get root() { return renderer.root; }, writes, published, notifications,
    button, saveButton, titleInput,
    async editTitle(value) { await act(async () => titleInput().props.onChange({ target: { value } })); },
    setRemote(project) { stored = structuredClone(project); version = project.updatedAt; },
    async save() { await act(async () => saveButton().props.onClick()); },
    async close() { await act(async () => renderer.unmount()); },
  };
}

test('a conflict stops after one request and keeps local input until an explicit server reload', async () => {
  const e = await editor({ save: async () => { throw Object.assign(new Error('Conflict'), { status: 409 }); } });
  await e.editTitle('Mijn lokale titel');
  const remote = cloneDefaultRembrandtProject();
  remote.settings.summary.nl = 'Gewijzigd door sessie B';
  remote.updatedAt = '2026-10-30T10:00:00.001Z';
  e.setRemote(remote);
  await e.save();
  assert.equal(e.writes.length, 1);
  assert.equal(e.titleInput().props.value, 'Mijn lokale titel');
  assert.equal(e.published.length, 0);
  assert.equal(e.saveButton().props.disabled, true);
  assert.ok(e.button('Eigen wijzigingen downloaden'));
  await act(async () => e.button('Nieuwste versie laden').props.onClick());
  assert.equal(e.titleInput().props.value, remote.settings.title.nl);
  assert.equal(e.saveButton().props.disabled, false);
  assert.equal(e.button('Eigen wijzigingen downloaden'), undefined);
  assert.equal(e.root.findAllByType('textarea').find(node => node.props.value === remote.settings.summary.nl)?.props.value, remote.settings.summary.nl);
  await e.close();
});

test('editing during a slow save preserves the newer title, remains dirty and uses the returned version on the next save', async () => {
  let finish;
  let first = true;
  const e = await editor({ save: async (project) => {
    const saved = structuredClone(project);
    if (first) {
      first = false;
      await new Promise(resolve => { finish = resolve; });
    }
    return { project: { ...saved, updatedAt: '2026-10-30T10:01:00.000Z' }, version: '2026-10-30T10:01:00.000Z' };
  } });
  await e.editTitle('Eerste wijziging');
  let pending;
  act(() => { const click = e.saveButton().props.onClick; pending = click(); click(); });
  assert.equal(e.writes.length, 1);
  await e.editTitle('Nieuwere wijziging tijdens opslaan');
  await act(async () => { finish(); await pending; });
  assert.equal(e.titleInput().props.value, 'Nieuwere wijziging tijdens opslaan');
  assert.equal(e.root.findAllByProps({ className: 'is-dirty' }).length, 1);
  assert.equal(e.published[0].settings.title.nl, 'Eerste wijziging');
  await e.save();
  assert.equal(e.writes[1].project.settings.title.nl, 'Nieuwere wijziging tijdens opslaan');
  assert.equal(e.writes[1].expectedVersion, '2026-10-30T10:01:00.000Z');
  await e.close();
});

test('a failed conflict reload keeps the local draft and recovery controls available', async () => {
  const behavior = { save: async () => { throw Object.assign(new Error('Conflict'), { status: 409 }); } };
  const e = await editor(behavior);
  await e.editTitle('Behoud deze tekst');
  await e.save();
  const previousConfirm = globalThis.window.confirm;
  globalThis.window.confirm = () => false;
  await act(async () => e.button('Nieuwste versie laden').props.onClick());
  globalThis.window.confirm = previousConfirm;
  behavior.failReads = true;
  await act(async () => e.button('Nieuwste versie laden').props.onClick());
  assert.equal(e.titleInput().props.value, 'Behoud deze tekst');
  assert.equal(e.saveButton().props.disabled, true);
  assert.ok(e.button('Eigen wijzigingen downloaden'));
  assert.equal(e.notifications.at(-1)[0], 'Offline');
  await e.close();
});

test('taking a project offline preserves an existing draft and edits made during the access request', async () => {
  let finish;
  const stored = cloneDefaultRembrandtProject();
  const e = await editor({ access: async (enabled) => {
    assert.equal(enabled, false);
    await new Promise(resolve => { finish = resolve; });
    return { project: { ...stored, isEnabled: false, updatedAt: '2026-10-30T10:02:00.000Z' }, version: '2026-10-30T10:02:00.000Z' };
  } });
  await e.editTitle('Niet-gepubliceerde wijziging');
  await act(async () => e.root.findByProps({ id: 'rp-tab-publish' }).props.onClick());
  await act(async () => e.button('Offline halen').props.onClick());
  act(() => e.button('Project offline halen').props.onClick());
  await act(async () => e.root.findByProps({ id: 'rp-tab-page' }).props.onClick());
  await e.editTitle('Nog een wijziging tijdens offline halen');
  await act(async () => { finish(); });
  assert.equal(e.titleInput().props.value, 'Nog een wijziging tijdens offline halen');
  assert.equal(e.root.findAllByProps({ className: 'is-dirty' }).length, 1);
  assert.equal(e.published[0].isEnabled, false);
  await e.close();
});
