import test from "node:test";
import assert from "node:assert/strict";
import { cloneDefaultRembrandtProject } from "../src/data/defaultRembrandtProject.js";
import {
  createEmptyRembrandtProject,
  latestProjectUpdate,
  localizedProjectValue,
  projectProgress,
  publishedRembrandtProject,
} from "../src/utils/rembrandtProject.js";
import { buildSitemapXml } from "../src/utils/sitemap.js";
import { buildDesktopPrimaryNavigation } from "../src/utils/navigation.js";
import {
  hiddenProjectAccess,
  normalizeProjectAccess,
  redactHiddenRembrandtProject,
} from "../api/_lib/rembrandtProjectAccess.js";
import {
  createPreviewToken,
  hashPreviewToken,
  isValidPreviewToken,
} from "../api/_lib/rembrandtPreviewToken.js";
import { activePreviewLink } from "../api/_lib/rembrandtPreviewStore.js";

test("public project projection excludes drafts, archives and hidden phases", () => {
  const project = cloneDefaultRembrandtProject();
  project.updates[0].status = "draft";
  project.updates[1].status = "archived";
  project.phases.find((phase) => phase.id === "technical").visible = false;

  const published = publishedRembrandtProject(project);
  assert.ok(published.updates.every((update) => update.status === "published"));
  assert.ok(
    published.updates.every((update) => update.phaseId !== "technical"),
  );
  assert.ok(published.phases.every((phase) => phase.visible !== false));
});

test("latest update and progress follow publication time and visible phases", () => {
  const project = cloneDefaultRembrandtProject();
  const latest = latestProjectUpdate(project);
  assert.equal(latest.id, "planned-research");
  assert.equal(projectProgress(project), 60);
});

test("sitemap includes all localized Rembrandt Project routes", () => {
  const project = cloneDefaultRembrandtProject();
  const sitemap = buildSitemapXml([], { rembrandtProject: project });
  assert.match(
    sitemap,
    /https:\/\/www\.atelierrembrandt\.com\/rembrandt-project/,
  );
  assert.match(
    sitemap,
    /https:\/\/www\.atelierrembrandt\.com\/en\/rembrandt-project/,
  );
  assert.match(
    sitemap,
    /https:\/\/www\.atelierrembrandt\.com\/fr\/rembrandt-project/,
  );
});

test("sitemap omits a disabled Rembrandt Project", () => {
  const project = cloneDefaultRembrandtProject();
  project.isEnabled = false;
  assert.doesNotMatch(
    buildSitemapXml([], { rembrandtProject: project }),
    /rembrandt-project/,
  );
});

test("future publications stay private and empty translations fall back to Dutch", () => {
  const project = cloneDefaultRembrandtProject();
  project.updates[0].publishedAt = "2999-01-01T00:00:00.000Z";
  assert.ok(
    !publishedRembrandtProject(project).updates.some(
      (update) => update.id === project.updates[0].id,
    ),
  );
  assert.equal(
    localizedProjectValue({ nl: "Nederlands", en: "  ", fr: "" }, "en"),
    "Nederlands",
  );
});

test("project access is fail-closed and redacts hidden public content", () => {
  const project = cloneDefaultRembrandtProject();
  const snapshot = { schemaVersion: 2, catalog: [], rembrandtProject: project };
  assert.equal(hiddenProjectAccess().enabled, false);
  assert.equal(normalizeProjectAccess({ schemaVersion: 99, enabled: true }).enabled, false);
  assert.deepEqual(
    redactHiddenRembrandtProject(snapshot, hiddenProjectAccess()).rembrandtProject,
    { isEnabled: false },
  );
  assert.equal(
    redactHiddenRembrandtProject(snapshot, { schemaVersion: 1, enabled: true }).rembrandtProject.updates.length,
    project.updates.length,
  );
});

test("the browser fallback contains no private project seed", () => {
  const fallback = createEmptyRembrandtProject();
  assert.equal(fallback.isEnabled, false);
  assert.deepEqual(fallback.phases, []);
  assert.deepEqual(fallback.updates, []);
  assert.doesNotMatch(JSON.stringify(fallback), /Rembrandt f\. 1637|Drouot|onbekend portret/i);
});

test("hiding the project never inserts a duplicate contact navigation item", () => {
  const links = buildDesktopPrimaryNavigation({
    translate: (key) => key,
    language: "nl",
    showRembrandtProject: false,
  });
  assert.deepEqual(links.map(({ id }) => id), ["topstukken", "catalogus", "herkomst"]);
  assert.equal(links.some(({ id }) => id === "contact"), false);
});

test("private preview tokens are unguessable and stored as one-way hashes", () => {
  const first = createPreviewToken();
  const second = createPreviewToken();
  assert.equal(isValidPreviewToken(first.token), true);
  assert.equal(first.token.length, 43);
  assert.equal(first.tokenHash.length, 64);
  assert.equal(first.tokenHash, hashPreviewToken(first.token));
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.tokenHash, second.tokenHash);
  assert.equal(isValidPreviewToken('kort'), false);
});

test("only an unrevoked and unexpired private preview link is active", () => {
  const now = Date.now();
  const active = { id: 'active', expiresAt: new Date(now + 60_000).toISOString(), revokedAt: null };
  const expired = { id: 'expired', expiresAt: new Date(now - 1).toISOString(), revokedAt: null };
  const revoked = { id: 'revoked', expiresAt: new Date(now + 60_000).toISOString(), revokedAt: new Date(now).toISOString() };
  assert.equal(activePreviewLink([expired, revoked, active], now)?.id, 'active');
  assert.equal(activePreviewLink([expired, revoked], now), null);
});
