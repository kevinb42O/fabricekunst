import test from "node:test";
import assert from "node:assert/strict";
import { cloneDefaultRembrandtProject } from "../src/data/defaultRembrandtProject.js";
import {
  fillMediaText,
  getProjectImageDescriptionIssues,
  imageDescriptionFieldId,
} from "../src/utils/rembrandtEditor.js";

test("missing Dutch gallery descriptions identify the exact update and input", () => {
  const project = cloneDefaultRembrandtProject();
  const update = project.updates[3];
  update.status = "published";
  update.gallery = [
    {
      id: "xray-1",
      url: "/images/lost-rembrandt/test.jpg",
      alt: { nl: "  ", en: "X-ray" },
    },
  ];
  const issue = getProjectImageDescriptionIssues(project).find((entry) =>
    entry.target.fieldId.endsWith("xray-1"),
  );
  assert.match(issue.message, new RegExp(`Update ${update.sequence}, beeld 1`));
  assert.deepEqual(issue.target, {
    panel: "updates",
    ownerId: update.id,
    fieldId: imageDescriptionFieldId("update-gallery", update.id, "xray-1"),
  });
  update.gallery[0].alt.nl = "Röntgenopname van het doek";
  assert.equal(getProjectImageDescriptionIssues(project).length, 0);
});

test("drafts, archived updates and hidden research do not block public edits", () => {
  for (const hiddenBy of ["draft", "archived", "investigation", "phase"]) {
    const project = cloneDefaultRembrandtProject();
    const update = project.updates[0];
    update.coverAlt = { nl: "" };
    update.gallery = [
      { id: "xray-1", url: "/images/lost-rembrandt/test.jpg", alt: {} },
    ];
    if (hiddenBy === "draft" || hiddenBy === "archived")
      update.status = hiddenBy;
    if (hiddenBy === "investigation") {
      const investigation = project.investigations.find(
        (entry) => entry.id === update.investigationId,
      );
      investigation.visible = false;
      investigation.coverAlt = {};
      investigation.gallery = [
        { id: "hidden-image", url: "/images/lost-rembrandt/test.jpg", alt: {} },
      ];
    }
    if (hiddenBy === "phase")
      project.phases.find((entry) => entry.id === update.phaseId).visible =
        false;
    assert.equal(getProjectImageDescriptionIssues(project).length, 0, hiddenBy);
  }
});

test("all visible image placements have an actionable description destination", () => {
  const project = cloneDefaultRembrandtProject();
  project.settings.heroAlt = {};
  project.settings.researchImage = "/images/lost-rembrandt/test.jpg";
  project.settings.researchImageAlt = {};
  const investigation = project.investigations[0];
  investigation.coverAlt = {};
  investigation.gallery = [
    { id: "dossier-image", url: "/images/lost-rembrandt/test.jpg", alt: {} },
  ];
  const update = project.updates[0];
  update.coverImage = "/images/lost-rembrandt/test.jpg";
  update.coverAlt = {};
  update.gallery = [
    { id: "update-image", url: "/images/lost-rembrandt/test.jpg", alt: {} },
  ];
  assert.deepEqual(
    getProjectImageDescriptionIssues(project).map(
      (issue) => issue.target.fieldId,
    ),
    [
      imageDescriptionFieldId("update-cover", update.id),
      imageDescriptionFieldId("update-gallery", update.id, "update-image"),
      imageDescriptionFieldId("investigation-cover", investigation.id),
      imageDescriptionFieldId(
        "investigation-gallery",
        investigation.id,
        "dossier-image",
      ),
      imageDescriptionFieldId("hero"),
      imageDescriptionFieldId("research"),
    ],
  );
});

test("library descriptions fill empty translations without overwriting editorial copy", () => {
  const original = { nl: "Eigen beschrijving", en: " ", fr: "" };
  const metadata = {
    nl: "Beeldbankbeschrijving",
    en: " X-ray of the painting ",
    fr: "Radiographie du tableau",
  };
  assert.deepEqual(fillMediaText(original, metadata), {
    nl: "Eigen beschrijving",
    en: "X-ray of the painting",
    fr: "Radiographie du tableau",
  });
  assert.equal(original.en, " ");
  assert.equal(metadata.en, " X-ray of the painting ");
  assert.deepEqual(fillMediaText(undefined, undefined), {});
  assert.deepEqual(fillMediaText({ nl: "" }, { nl: "  " }), { nl: "" });
});

test("empty image slots and optional captions do not require descriptions", () => {
  const project = cloneDefaultRembrandtProject();
  project.updates[0].gallery.push({
    id: "empty-slot",
    url: "",
    alt: {},
    caption: {},
  });
  assert.equal(getProjectImageDescriptionIssues(project).length, 0);
});
