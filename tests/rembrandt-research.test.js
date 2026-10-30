import test from "node:test";
import assert from "node:assert/strict";
import { cloneDefaultRembrandtProject } from "../src/data/defaultRembrandtProject.js";
import { createResearchStep, localizedProjectValue, normalizeRembrandtProject, publishedRembrandtProject } from "../src/utils/rembrandtProject.js";
import { groupResearchSteps, researchAreaForStep } from "../src/utils/rembrandtResearch.js";
import { validateProject } from "../api/_lib/rembrandtProjectEndpoint.js";

test("every existing research item and translation remains intact, exactly once", () => {
  const project = cloneDefaultRembrandtProject();
  const snapshot = structuredClone(project);
  const groups = groupResearchSteps(publishedRembrandtProject(project).researchSteps);
  assert.deepEqual(groups.map((group) => group.id), ["assessment", "context", "technical", "interpretation"]);
  const items = groups.flatMap((group) => group.steps);
  assert.equal(items.length, 13);
  assert.equal(new Set(items.map((step) => step.id)).size, 13);
  for (const original of project.researchSteps) {
    assert.deepEqual(items.find((step) => step.id === original.id), original);
  }
  assert.deepEqual(project, snapshot);
});

test("dashboard additions survive server validation and appear under additional research", async () => {
  const project = cloneDefaultRembrandtProject();
  const extra = createResearchStep(project);
  extra.title = { nl: "Nieuw onderzoek", en: "New research", fr: "Nouvelle recherche" };
  extra.body = { nl: "Eerste alinea.\n\nTweede alinea.", en: "Full English content.", fr: "Texte français complet." };
  project.researchSteps.push(extra);
  const saved = normalizeRembrandtProject(JSON.parse(await validateProject(project)));
  const groups = groupResearchSteps(publishedRembrandtProject(saved).researchSteps);
  assert.deepEqual(groups.at(-1).steps, [extra]);
  assert.equal(researchAreaForStep(extra).id, "additional");
  assert.equal(saved.schemaVersion, project.schemaVersion);
  assert.deepEqual(saved.researchSteps, project.researchSteps);
});

test("dashboard visibility, deletion and reordering are respected without mutating data", () => {
  const project = cloneDefaultRembrandtProject();
  const uv = project.researchSteps.find((step) => step.id === "uv");
  const infrared = project.researchSteps.find((step) => step.id === "infrared");
  uv.visible = false;
  infrared.sortOrder = 100;
  project.researchSteps = project.researchSteps.filter((step) => step.id !== "signature");
  const before = structuredClone(project.researchSteps);
  const groups = groupResearchSteps(project.researchSteps);
  const technical = groups.find((group) => group.id === "technical");
  assert.equal(technical.steps.at(-1).id, "infrared");
  assert.ok(!groups.flatMap((group) => group.steps).some((step) => ["uv", "signature"].includes(step.id)));
  assert.deepEqual(project.researchSteps, before);
});

test("edited titles, full body text and translation fallback remain driven by dashboard content", async () => {
  const project = cloneDefaultRembrandtProject();
  const step = project.researchSteps.find((entry) => entry.id === "xray");
  step.title = { nl: "Aangepaste titel", en: "", fr: "Titre modifié" };
  step.body.nl = "Volledige inhoud met accenten: é, ë & < >.\n\nNog een alinea.";
  const saved = JSON.parse(await validateProject(project));
  const grouped = groupResearchSteps(publishedRembrandtProject(saved).researchSteps);
  const renderedItem = grouped.flatMap((area) => area.steps).find((entry) => entry.id === "xray");
  assert.deepEqual(renderedItem, step);
  assert.equal(localizedProjectValue(renderedItem.title, "en"), "Aangepaste titel");
  assert.equal(localizedProjectValue(renderedItem.title, "fr"), "Titre modifié");
  assert.equal(researchAreaForStep(renderedItem).id, "technical");
});

test("empty and hidden-only data produce no empty research areas", () => {
  assert.deepEqual(groupResearchSteps(), []);
  assert.deepEqual(groupResearchSteps(null), []);
  assert.deepEqual(groupResearchSteps([null, { id: "uv", visible: false }]), []);
  assert.deepEqual(groupResearchSteps([{ id: "custom-method", sortOrder: 1 }]).map((area) => area.id), ["additional"]);
});

test("each research area has complete Dutch, English and French guidance", () => {
  const project = cloneDefaultRembrandtProject();
  project.researchSteps.push(createResearchStep(project));
  for (const group of groupResearchSteps(project.researchSteps)) {
    for (const language of ["nl", "en", "fr"]) {
      assert.ok(group.title[language]?.trim());
      assert.ok(group.description[language]?.trim());
    }
  }
});
