export const REMBRANDT_PROJECT_ROUTE = "/lost-rembrandt-project";
export const LEGACY_REMBRANDT_PROJECT_ROUTE = "/rembrandt-project";

const emptyLocalizedText = () => ({ nl: "", en: "", fr: "" });
const REMBRANDT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createUniqueInvestigationId = (usedIds, index) => {
  const base = `project-${String(index + 1).padStart(2, "0")}`;
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export function getRembrandtProjectIntegrityIssues(input) {
  if (!input || typeof input !== "object") return [];
  const issues = [];
  const seenInvestigationIds = new Set();
  const investigations = Array.isArray(input.investigations)
    ? input.investigations
    : [];
  for (const [index, investigation] of investigations.entries()) {
    const id = typeof investigation?.id === "string" ? investigation.id : "";
    if (!REMBRANDT_ID_PATTERN.test(id)) {
      issues.push(`Dossier ${index + 1} heeft geen geldige unieke sleutel.`);
    } else if (seenInvestigationIds.has(id)) {
      issues.push(`Dossier ${index + 1} gebruikt een dubbele sleutel (${id}).`);
    }
    seenInvestigationIds.add(id);
  }
  return issues;
}

// This fallback is intentionally content-free. The carefully prepared project
// seed is server-only: putting it in a browser fallback would expose every
// private draft in the publicly downloadable JavaScript bundle.
export function createEmptyRembrandtProject() {
  return {
    schemaVersion: 2,
    isEnabled: false,
    settings: {
      title: emptyLocalizedText(),
      eyebrow: emptyLocalizedText(),
      intro: emptyLocalizedText(),
      summary: emptyLocalizedText(),
      disclaimer: emptyLocalizedText(),
      currentStatus: emptyLocalizedText(),
      nextStep: emptyLocalizedText(),
      methodologyTitle: emptyLocalizedText(),
      methodologyText: emptyLocalizedText(),
      aboutTitle: emptyLocalizedText(),
      aboutIntro: emptyLocalizedText(),
      investigationsTitle: emptyLocalizedText(),
      investigationsIntro: emptyLocalizedText(),
      processTitle: emptyLocalizedText(),
      processIntro: emptyLocalizedText(),
      submissionTitle: emptyLocalizedText(),
      submissionIntro: emptyLocalizedText(),
      submissionChecklist: { nl: [], en: [], fr: [] },
      submissionNotice: emptyLocalizedText(),
      confidentialityTitle: emptyLocalizedText(),
      confidentialityText: emptyLocalizedText(),
      closingTitle: emptyLocalizedText(),
      closingText: emptyLocalizedText(),
      heroImage: "",
      heroAlt: emptyLocalizedText(),
      researchImage: "",
      researchImageAlt: emptyLocalizedText(),
      socialImage: "",
      projectStatus: "discovery",
      currentPhaseId: "",
      seoTitle: emptyLocalizedText(),
      seoDescription: emptyLocalizedText(),
    },
    aboutSections: [],
    investigations: [],
    researchSteps: [],
    phases: [],
    updates: [],
  };
}

export function localizedProjectValue(value, language = "nl", fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value;
  const candidates = [value[language], value.nl, value.en, value.fr];
  return (
    candidates.find(
      (candidate) =>
        typeof candidate !== "string" || candidate.trim().length > 0,
    ) ?? fallback
  );
}

export function normalizeRembrandtProject(input) {
  const fallback = createEmptyRembrandtProject();
  if (!input || typeof input !== "object") return fallback;
  const phases = Array.isArray(input.phases)
    ? input.phases
        .filter((phase) => phase && typeof phase === "object")
        .map((phase, index) => ({
          ...phase,
          id: typeof phase.id === "string" ? phase.id : `fase-${index + 1}`,
          sortOrder: Number.isFinite(Number(phase.sortOrder))
            ? Number(phase.sortOrder)
            : index + 1,
          visible: phase.visible !== false,
          label:
            phase.label && typeof phase.label === "object"
              ? phase.label
              : { nl: String(phase.label || ""), en: "", fr: "" },
        }))
    : fallback.phases;
  const investigationIdMap = new Map();
  const usedInvestigationIds = new Set();
  const aboutSections = Array.isArray(input.aboutSections)
    ? input.aboutSections
        .filter((section) => section && typeof section === "object")
        .map((section, index) => ({
          ...section,
          id: typeof section.id === "string" ? section.id : `about-${index + 1}`,
          sortOrder: Number.isFinite(Number(section.sortOrder))
            ? Number(section.sortOrder)
            : index + 1,
          visible: section.visible !== false,
        }))
    : fallback.aboutSections;
  const investigations = Array.isArray(input.investigations)
    ? input.investigations
        .filter((investigation) => investigation && typeof investigation === "object")
        .map((investigation, index) => {
          const originalId =
            typeof investigation.id === "string" ? investigation.id : "";
          const id =
            REMBRANDT_ID_PATTERN.test(originalId) &&
            !usedInvestigationIds.has(originalId)
              ? originalId
              : createUniqueInvestigationId(usedInvestigationIds, index);
          usedInvestigationIds.add(id);
          if (originalId && !investigationIdMap.has(originalId)) {
            investigationIdMap.set(originalId, id);
          }
          return {
            ...investigation,
            id,
            sortOrder: Number.isFinite(Number(investigation.sortOrder))
              ? Number(investigation.sortOrder)
              : index + 1,
            visible: investigation.visible !== false,
            featured: investigation.featured === true,
            gallery: Array.isArray(investigation.gallery)
              ? investigation.gallery.filter(
                  (image) => image && typeof image === "object",
                )
              : [],
          };
        })
    : fallback.investigations;
  const defaultInvestigationId = investigations[0]?.id || "project-01";
  const updates = Array.isArray(input.updates)
    ? input.updates
        .filter((update) => update && typeof update === "object")
        .map((update, index) => ({
          ...update,
          investigationId:
            typeof update.investigationId === "string"
              ? investigationIdMap.get(update.investigationId) ||
                update.investigationId
              : defaultInvestigationId,
          sequence: Number.isFinite(Number(update.sequence))
            ? Number(update.sequence)
            : index + 1,
          gallery: Array.isArray(update.gallery)
            ? update.gallery.filter(
                (image) => image && typeof image === "object",
              )
            : [],
        }))
    : fallback.updates;
  const researchSteps = Array.isArray(input.researchSteps)
    ? input.researchSteps
        .filter((step) => step && typeof step === "object")
        .map((step, index) => ({
          ...step,
          id: typeof step.id === "string" ? step.id : `step-${index + 1}`,
          sortOrder: Number.isFinite(Number(step.sortOrder))
            ? Number(step.sortOrder)
            : index + 1,
          visible: step.visible !== false,
        }))
    : fallback.researchSteps;
  return {
    ...fallback,
    ...input,
    schemaVersion: 2,
    settings: { ...fallback.settings, ...(input.settings || {}) },
    aboutSections,
    investigations,
    researchSteps,
    phases,
    updates,
  };
}

export function publishedRembrandtProject(input) {
  if (!input || Number(input.schemaVersion) !== 2) {
    return createEmptyRembrandtProject();
  }
  const project = normalizeRembrandtProject(input);
  const visiblePhaseIds = new Set(
    project.phases
      .filter((phase) => phase.visible !== false)
      .map((phase) => phase.id),
  );
  const visibleInvestigationIds = new Set(
    project.investigations
      .filter((investigation) => investigation.visible !== false)
      .map((investigation) => investigation.id),
  );
  return {
    ...project,
    aboutSections: project.aboutSections
      .filter((section) => section.visible !== false)
      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
    investigations: project.investigations
      .filter((investigation) => investigation.visible !== false)
      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
    researchSteps: project.researchSteps
      .filter((step) => step.visible !== false)
      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
    phases: project.phases
      .filter((phase) => phase.visible !== false)
      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
    updates: project.updates
      .filter((update) => {
        if (
          update.status !== "published" ||
          !visiblePhaseIds.has(update.phaseId) ||
          (project.investigations.length > 0 &&
            !visibleInvestigationIds.has(update.investigationId))
        )
          return false;
        if (!update.publishedAt) return true;
        const publicationTime = new Date(update.publishedAt).getTime();
        return (
          Number.isFinite(publicationTime) && publicationTime <= Date.now()
        );
      })
      .sort((a, b) => Number(a.sequence) - Number(b.sequence)),
  };
}

export function createProjectInvestigation(project) {
  const sortOrder =
    Math.max(
      0,
      ...(project?.investigations || []).map(
        (entry) => Number(entry.sortOrder) || 0,
      ),
    ) + 1;
  const id = `project-${String(sortOrder).padStart(2, "0")}`;
  return {
    id,
    slug: id,
    sortOrder,
    visible: false,
    featured: false,
    status: "initial-assessment",
    reference: `AR-${String(sortOrder).padStart(3, "0")}`,
    title: { nl: `Project ${String(sortOrder).padStart(2, "0")}`, en: "", fr: "" },
    subtitle: emptyLocalizedText(),
    summary: emptyLocalizedText(),
    description: emptyLocalizedText(),
    statusLabel: emptyLocalizedText(),
    coverImage: "",
    coverAlt: emptyLocalizedText(),
    gallery: [],
  };
}

export function createResearchStep(project) {
  const sortOrder =
    Math.max(
      0,
      ...(project?.researchSteps || []).map(
        (entry) => Number(entry.sortOrder) || 0,
      ),
    ) + 1;
  return {
    id: `step-${sortOrder}`,
    sortOrder,
    visible: true,
    title: { nl: `Onderzoeksstap ${sortOrder}`, en: "", fr: "" },
    body: emptyLocalizedText(),
  };
}

export function latestProjectUpdate(input) {
  const updates = publishedRembrandtProject(input).updates;
  return (
    [...updates].sort((a, b) => {
      const dateDifference =
        new Date(b.publishedAt || b.eventDate || 0) -
        new Date(a.publishedAt || a.eventDate || 0);
      return dateDifference || Number(b.sequence) - Number(a.sequence);
    })[0] || null
  );
}

export function projectProgress(input) {
  const project = publishedRembrandtProject(input);
  const currentIndex = project.phases.findIndex(
    (phase) => phase.id === project.settings.currentPhaseId,
  );
  if (!project.phases.length || currentIndex < 0) return 0;
  return Math.round(((currentIndex + 1) / project.phases.length) * 100);
}

export function createProjectUpdate(project, investigationId = "") {
  const sequence =
    Math.max(
      0,
      ...(project?.updates || []).map((entry) => Number(entry.sequence) || 0),
    ) + 1;
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `update-${Date.now()}`;
  return {
    id,
    slug: `nieuwe-update-${sequence}`,
    phaseId:
      project?.settings?.currentPhaseId ||
      project?.phases?.[0]?.id ||
      "discovery",
    investigationId:
      investigationId || project?.investigations?.[0]?.id || "project-01",
    sequence,
    status: "draft",
    evidenceType: "observation",
    eventDate: new Date().toISOString().slice(0, 10),
    publishedAt: "",
    featured: false,
    title: { nl: `Nieuwe update ${sequence}`, en: "", fr: "" },
    summary: { nl: "", en: "", fr: "" },
    body: { nl: "", en: "", fr: "" },
    keyFindings: { nl: [], en: [], fr: [] },
    nextStep: { nl: "", en: "", fr: "" },
    coverImage: "",
    coverAlt: { nl: "", en: "", fr: "" },
    coverCaption: { nl: "", en: "", fr: "" },
    gallery: [],
  };
}
