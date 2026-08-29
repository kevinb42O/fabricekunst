export const REMBRANDT_PROJECT_ROUTE = "/rembrandt-project";

const emptyLocalizedText = () => ({ nl: "", en: "", fr: "" });

// This fallback is intentionally content-free. The carefully prepared project
// seed is server-only: putting it in a browser fallback would expose every
// private draft in the publicly downloadable JavaScript bundle.
export function createEmptyRembrandtProject() {
  return {
    schemaVersion: 1,
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
      closingTitle: emptyLocalizedText(),
      closingText: emptyLocalizedText(),
      heroImage: "",
      heroAlt: emptyLocalizedText(),
      socialImage: "",
      projectStatus: "discovery",
      currentPhaseId: "",
      seoTitle: emptyLocalizedText(),
      seoDescription: emptyLocalizedText(),
    },
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
  const updates = Array.isArray(input.updates)
    ? input.updates
        .filter((update) => update && typeof update === "object")
        .map((update, index) => ({
          ...update,
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
  return {
    ...fallback,
    ...input,
    settings: { ...fallback.settings, ...(input.settings || {}) },
    phases,
    updates,
  };
}

export function publishedRembrandtProject(input) {
  const project = normalizeRembrandtProject(input);
  const visiblePhaseIds = new Set(
    project.phases
      .filter((phase) => phase.visible !== false)
      .map((phase) => phase.id),
  );
  return {
    ...project,
    phases: project.phases
      .filter((phase) => phase.visible !== false)
      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
    updates: project.updates
      .filter((update) => {
        if (
          update.status !== "published" ||
          !visiblePhaseIds.has(update.phaseId)
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

export function createProjectUpdate(project) {
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
