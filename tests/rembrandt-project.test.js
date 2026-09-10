import test from "node:test";
import assert from "node:assert/strict";
import { cloneDefaultRembrandtProject } from "../src/data/defaultRembrandtProject.js";
import {
  createEmptyRembrandtProject,
  createProjectInvestigation,
  createProjectUpdate,
  getRembrandtProjectIntegrityIssues,
  latestProjectUpdate,
  localizedProjectValue,
  normalizeRembrandtProject,
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
import {
  isVersionMatch,
  resolveSavedProjectVisibility,
  validateProject,
} from "../api/_lib/rembrandtProjectEndpoint.js";

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

test("the Lost Rembrandt seed passes strict server validation with bundled images", async () => {
  const project = cloneDefaultRembrandtProject();
  const serialized = await validateProject(project);
  assert.equal(JSON.parse(serialized).schemaVersion, 2);
  assert.equal(project.investigations.length, 3);
  assert.equal(project.researchSteps.length, 13);
});

test("sitemap includes all localized Lost Rembrandt Project routes", () => {
  const project = cloneDefaultRembrandtProject();
  const sitemap = buildSitemapXml([], { rembrandtProject: project });
  assert.match(
    sitemap,
    /https:\/\/www\.atelierrembrandt\.com\/lost-rembrandt-project/,
  );
  assert.match(
    sitemap,
    /https:\/\/www\.atelierrembrandt\.com\/en\/lost-rembrandt-project/,
  );
  assert.match(
    sitemap,
    /https:\/\/www\.atelierrembrandt\.com\/fr\/lost-rembrandt-project/,
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

test("an explicit authenticated publication can make a hidden save live", () => {
  assert.equal(
    resolveSavedProjectVisibility({ publish: true, accessEnabled: false }),
    true,
  );
  assert.equal(
    resolveSavedProjectVisibility({ publish: false, accessEnabled: false }),
    false,
  );
  assert.equal(
    resolveSavedProjectVisibility({ publish: false, accessEnabled: true }),
    true,
  );
});

test("the public access gate also rejects legacy project snapshots", () => {
  const project = cloneDefaultRembrandtProject();
  project.schemaVersion = 1;
  const snapshot = { rembrandtProject: project };
  const redacted = redactHiddenRembrandtProject(snapshot, {
    schemaVersion: 1,
    enabled: true,
  });
  assert.deepEqual(redacted.rembrandtProject, { isEnabled: false });
});

test("the browser fallback contains no private project seed", () => {
  const fallback = createEmptyRembrandtProject();
  assert.equal(fallback.isEnabled, false);
  assert.deepEqual(fallback.phases, []);
  assert.deepEqual(fallback.updates, []);
  assert.deepEqual(fallback.investigations, []);
  assert.deepEqual(fallback.researchSteps, []);
  assert.doesNotMatch(JSON.stringify(fallback), /Rembrandt f\. 1637|Drouot|onbekend portret/i);
});

test("normalization repairs duplicate investigation IDs used by the admin editor", () => {
  const project = cloneDefaultRembrandtProject();
  project.investigations = project.investigations.map((investigation, index) => ({
    ...investigation,
    id: "duplicate-project",
    title: { ...investigation.title, nl: `Werk ${index + 1}` },
  }));
  project.updates[0].investigationId = "duplicate-project";

  const issues = getRembrandtProjectIntegrityIssues(project);
  const normalized = normalizeRembrandtProject(project);
  const ids = normalized.investigations.map((investigation) => investigation.id);

  assert.equal(issues.length, 2);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(normalized.investigations[1].title.nl, "Werk 2");
  assert.equal(
    normalized.investigations.find((investigation) => investigation.id === ids[1])?.title.nl,
    "Werk 2",
  );
  assert.equal(normalized.updates[0].investigationId, ids[0]);
});

test("legacy project snapshots fail closed after the schema upgrade", () => {
  const legacy = cloneDefaultRembrandtProject();
  legacy.schemaVersion = 1;
  const published = publishedRembrandtProject(legacy);
  assert.equal(published.isEnabled, false);
  assert.deepEqual(published.investigations, []);
  assert.deepEqual(published.updates, []);
});

test("new investigations use a server-valid initial status", async () => {
  const project = cloneDefaultRembrandtProject();
  const investigation = createProjectInvestigation(project);
  project.investigations.push(investigation);
  const serialized = await validateProject(project);
  assert.equal(investigation.status, "initial-assessment");
  assert.equal(JSON.parse(serialized).investigations.length, 4);
});

test("new updates can be scoped to the selected investigation", () => {
  const project = cloneDefaultRembrandtProject();
  const update = createProjectUpdate(project, "project-03");
  assert.equal(update.investigationId, "project-03");
});

test("public project projection excludes hidden investigations and research steps", () => {
  const project = cloneDefaultRembrandtProject();
  project.updates[0].investigationId = "project-02";
  project.investigations[1].visible = false;
  project.researchSteps[1].visible = false;
  const published = publishedRembrandtProject(project);
  assert.ok(published.investigations.every((entry) => entry.visible !== false));
  assert.ok(published.researchSteps.every((entry) => entry.visible !== false));
  assert.ok(published.updates.every((entry) => entry.investigationId !== "project-02"));
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

test("dossier routes distinguish localized, preview and unrelated paths", async () => {
  const { getRembrandtRoute } = await import("../src/utils/rembrandtProject.js");
  assert.deepEqual(getRembrandtRoute('/fr/lost-rembrandt-project/project-02/'), { privatePreview: false, investigationSlug: 'project-02' });
  assert.deepEqual(getRembrandtRoute('/en/lost-rembrandt-project/preview/project-03'), { privatePreview: true, investigationSlug: 'project-03' });
  assert.deepEqual(getRembrandtRoute('/rembrandt-project/preview'), { privatePreview: true, investigationSlug: '' });
  assert.equal(getRembrandtRoute('/lost-rembrandt-project-other/project-01'), null);
});

test("sitemap includes visible dossier pages and excludes hidden dossiers", () => {
  const project = cloneDefaultRembrandtProject();
  project.isEnabled = true;
  project.investigations[1].visible = false;
  const sitemap = buildSitemapXml([], { rembrandtProject: project });
  assert.match(sitemap, /<loc>https:\/\/www.atelierrembrandt.com\/fr\/lost-rembrandt-project\/project-01<\/loc>/);
  assert.doesNotMatch(sitemap, /lost-rembrandt-project\/project-02/);
});

test("a dossier cannot use the reserved preview route", async () => {
  const project = cloneDefaultRembrandtProject();
  project.investigations[0].slug = 'preview';
  await assert.rejects(() => validateProject(project), /URL-slug/);
});

test("isVersionMatch correctly matches timestamps regardless of timezone format (+00:00 vs Z)", () => {
  const isoUtc = "2026-09-10T21:32:39.409Z";
  const postgresUtc = "2026-09-10T21:32:39.409+00:00";
  assert.equal(isVersionMatch(isoUtc, postgresUtc), true);
  assert.equal(isVersionMatch(postgresUtc, isoUtc), true);
  assert.equal(isVersionMatch(isoUtc, isoUtc), true);

  // Minor millisecond drift (<= 2s)
  assert.equal(
    isVersionMatch("2026-09-10T21:32:39.000Z", "2026-09-10T21:32:40.500+00:00"),
    true,
  );

  // Real conflict (> 2s)
  assert.equal(
    isVersionMatch("2026-09-10T21:32:39.409Z", "2026-09-10T21:35:00.000Z"),
    false,
  );

  // Null or missing values
  assert.equal(isVersionMatch(null, postgresUtc), false);
  assert.equal(isVersionMatch(isoUtc, null), false);
  assert.equal(isVersionMatch(undefined, postgresUtc), false);
  assert.equal(isVersionMatch("", postgresUtc), false);
});

