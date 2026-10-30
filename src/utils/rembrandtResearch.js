// Presentation only: research items keep their existing dashboard IDs and data.
export const RESEARCH_AREAS = [
  {
    id: "assessment",
    title: { nl: "Eerste beoordeling", en: "Initial assessment", fr: "Première évaluation" },
    description: {
      nl: "Het schilderij leren kennen en de onderzoeksvragen formuleren.",
      en: "Getting to know the painting and defining the research questions.",
      fr: "Découvrir le tableau et définir les questions de recherche.",
    },
    stepIds: ["initial-assessment", "physical-examination"],
  },
  {
    id: "context",
    title: { nl: "Herkomst en kunsthistorische context", en: "Provenance and art-historical context", fr: "Provenance et contexte historique" },
    description: {
      nl: "De geschiedenis van het werk reconstrueren en het met andere schilderijen vergelijken.",
      en: "Reconstructing the work’s history and comparing it with other paintings.",
      fr: "Reconstituer l’histoire de l’œuvre et la comparer à d’autres tableaux.",
    },
    stepIds: ["provenance", "comparison"],
  },
  {
    id: "technical",
    title: { nl: "Technisch onderzoek", en: "Technical examination", fr: "Examens techniques" },
    description: {
      nl: "Onderzoeken wat de drager, verflagen en signatuur over het schilderij kunnen vertellen.",
      en: "Examining what the support, paint layers and signature can reveal about the painting.",
      fr: "Examiner ce que le support, les couches picturales et la signature peuvent révéler du tableau.",
    },
    stepIds: ["uv", "infrared", "xray", "xrf", "cross-sections", "dendrochronology", "support", "signature"],
  },
  {
    id: "interpretation",
    title: { nl: "Interpretatie en toeschrijving", en: "Interpretation and attribution", fr: "Interprétation et attribution" },
    description: {
      nl: "De bevindingen samenbrengen en de mogelijke betrokkenheid van Rembrandt of zijn atelier beoordelen.",
      en: "Bringing the findings together and assessing the possible involvement of Rembrandt or his workshop.",
      fr: "Confronter les résultats et évaluer l’intervention possible de Rembrandt ou de son atelier.",
    },
    stepIds: ["workshop-attribution"],
  },
  {
    id: "additional",
    title: { nl: "Aanvullend onderzoek", en: "Additional research", fr: "Recherches complémentaires" },
    description: {
      nl: "Aanvullende onderwerpen die bij het onderzoek van een schilderij aan bod kunnen komen.",
      en: "Further topics that may be relevant to the investigation of a painting.",
      fr: "D’autres sujets pouvant intervenir dans l’étude d’un tableau.",
    },
    stepIds: [],
  },
];

export function groupResearchSteps(steps = []) {
  const visibleSteps = (Array.isArray(steps) ? steps : [])
    .filter((step) => step && typeof step === "object" && step.visible !== false)
    .slice()
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const areas = RESEARCH_AREAS.map((area) => ({ ...area, steps: [] }));
  for (const step of visibleSteps) {
    const area = areas.find((entry) => entry.stepIds.includes(step.id)) || areas[areas.length - 1];
    area.steps.push(step);
  }
  return areas.filter((area) => area.steps.length > 0);
}

export function researchAreaForStep(step) {
  return RESEARCH_AREAS.find((area) => area.stepIds.includes(step.id)) || RESEARCH_AREAS[RESEARCH_AREAS.length - 1];
}
