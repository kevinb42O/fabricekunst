import test from "node:test";
import assert from "node:assert/strict";
import { cloneDefaultRembrandtProject } from "../src/data/defaultRembrandtProject.js";
import {
  latestProjectUpdate,
  localizedProjectValue,
  projectProgress,
  publishedRembrandtProject,
} from "../src/utils/rembrandtProject.js";
import { buildSitemapXml } from "../src/utils/sitemap.js";

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
