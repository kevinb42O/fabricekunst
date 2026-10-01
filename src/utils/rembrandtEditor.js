export const imageDescriptionFieldId = (kind, ownerId = "", imageId = "") =>
  `rp-description-${kind}-${ownerId}-${imageId}`;

/** Use editorial descriptions only; a file name is not an image description. */
export function fillMediaText(current, metadataText) {
  const result = { ...(current || {}) };
  for (const language of ["nl", "en", "fr"]) {
    if (!result[language]?.trim() && metadataText?.[language]?.trim()) {
      result[language] = metadataText[language].trim();
    }
  }
  return result;
}

/** Drafts and hidden dossiers must not block edits to the published website. */
export function getProjectImageDescriptionIssues(project) {
  const issues = [];
  const add = (url, alt, message, target) => {
    if (url && !alt?.nl?.trim()) issues.push({ message, target });
  };
  for (const update of project.updates || []) {
    if (update.status !== "published") continue;
    const investigation = project.investigations?.find(
      (entry) => entry.id === update.investigationId,
    );
    const phase = project.phases?.find((entry) => entry.id === update.phaseId);
    if (investigation?.visible === false || phase?.visible === false) continue;
    const target = { panel: "updates", ownerId: update.id };
    add(
      update.coverImage,
      update.coverAlt,
      `Update ${update.sequence}: vul een Nederlandse beeldbeschrijving in bij de hoofdafbeelding.`,
      {
        ...target,
        fieldId: imageDescriptionFieldId("update-cover", update.id),
      },
    );
    for (const [index, image] of (update.gallery || []).entries()) {
      add(
        image.url,
        image.alt,
        `Update ${update.sequence}, beeld ${index + 1}: vul een Nederlandse beeldbeschrijving in.`,
        {
          ...target,
          fieldId: imageDescriptionFieldId(
            "update-gallery",
            update.id,
            image.id,
          ),
        },
      );
    }
  }
  for (const investigation of project.investigations || []) {
    if (investigation.visible === false) continue;
    const name =
      investigation.reference || investigation.title?.nl || investigation.id;
    const target = { panel: "investigations", ownerId: investigation.id };
    add(
      investigation.coverImage,
      investigation.coverAlt,
      `${name}: vul een Nederlandse beeldbeschrijving in bij het hoofdbeeld.`,
      {
        ...target,
        fieldId: imageDescriptionFieldId(
          "investigation-cover",
          investigation.id,
        ),
      },
    );
    for (const [index, image] of (investigation.gallery || []).entries()) {
      add(
        image.url,
        image.alt,
        `${name}, beeld ${index + 1}: vul een Nederlandse beeldbeschrijving in.`,
        {
          ...target,
          fieldId: imageDescriptionFieldId(
            "investigation-gallery",
            investigation.id,
            image.id,
          ),
        },
      );
    }
  }
  add(
    project.settings?.heroImage,
    project.settings?.heroAlt,
    "Vul een Nederlandse beeldbeschrijving in bij de hero-afbeelding.",
    { panel: "page", fieldId: imageDescriptionFieldId("hero") },
  );
  add(
    project.settings?.researchImage,
    project.settings?.researchImageAlt,
    "Vul een Nederlandse beeldbeschrijving in bij de onderzoeksafbeelding.",
    { panel: "process", fieldId: imageDescriptionFieldId("research") },
  );
  return issues;
}
