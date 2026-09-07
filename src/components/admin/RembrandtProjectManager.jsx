import React, { useEffect, useMemo, useState, useId } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  BookOpen,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  Image as ImageIcon,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import {
  REMBRANDT_EVIDENCE_TYPES,
  REMBRANDT_PROJECT_STATUSES,
} from "../../data/rembrandtProjectOptions";
import {
  createEmptyRembrandtProject,
  createProjectInvestigation,
  createResearchStep,
  createProjectUpdate,
  getRembrandtProjectIntegrityIssues,
  normalizeRembrandtProject,
} from "../../utils/rembrandtProject";
import {
  fetchRembrandtProjectAdminAsync,
  fetchRembrandtProjectRevisionAsync,
  fetchRembrandtProjectTemplateAsync,
  fetchRembrandtPreviewLinkAsync,
  createRembrandtPreviewLinkAsync,
  revokeRembrandtPreviewLinkAsync,
  saveRembrandtProjectDataAsync,
  setRembrandtProjectAccessAsync,
  uploadCatalogImage,
} from "../../utils/storage";
import { localizePath } from "../../utils/locales";
import { REMBRANDT_PROJECT_ROUTE } from "../../utils/rembrandtProject";
import "../../styles/rembrandt-project-admin.css";

const LANGUAGES = [
  { id: "nl", label: "Nederlands" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
];
const PANELS = [
  { id: "investigations", label: "Projecten", description: "Dossiers, beelden & updates", icon: LayoutGrid },
  { id: "page", label: "Overzichtspagina", description: "Opening, status & afsluiting", icon: Globe2 },
  { id: "process", label: "Verhaal & werkwijze", description: "Achtergrond, proces & inzenden", icon: BookOpen },
  { id: "updates", label: "Alle updates", description: "Doorzoek alle onderzoeken", icon: FileText },
  { id: "publish", label: "Publicatie", description: "Toegang, controle & versies", icon: ShieldCheck },
];

function EditorNav({ items, value, onChange, label }) {
  return <nav className="rp-work-tabs" aria-label={label}>{items.map((item) => <button key={item.id} type="button" aria-current={value === item.id ? "page" : undefined} className={value === item.id ? "is-active" : ""} onClick={() => onChange(item.id)}>{item.label}</button>)}</nav>;
}


const slugify = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
const valueFor = (object, field, language) => object?.[field]?.[language] ?? "";
const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function Field({ label, hint, children }) {
  const id = useId();
  return (
    <label className="rp-admin-field">
      <span id={`${id}-label`}>{label}</span>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {React.isValidElement(children) ? React.cloneElement(children, {
        "aria-labelledby": `${id}-label`,
        "aria-describedby": hint ? `${id}-hint` : undefined,
      }) : children}
    </label>
  );
}

function LanguageTabs({ language, onChange }) {
  const handleKeys = (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = LANGUAGES.findIndex((entry) => entry.id === language);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? LANGUAGES.length - 1
          : (current +
              (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) +
              LANGUAGES.length) %
            LANGUAGES.length;
    onChange(LANGUAGES[next].id);
    event.currentTarget.querySelectorAll('[role="radio"]')[next]?.focus();
  };
  return (
    <div
      className="rp-admin-language"
      role="radiogroup"
      aria-label="Invoertaal"
      onKeyDown={handleKeys}
    >
      {LANGUAGES.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="radio"
          aria-checked={language === entry.id}
          tabIndex={language === entry.id ? 0 : -1}
          className={language === entry.id ? "is-active" : ""}
          onClick={() => onChange(entry.id)}
        >
          <strong>{entry.id.toUpperCase()}</strong>
          <span>{entry.label}</span>
        </button>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const label =
    status === "published"
      ? "Gepubliceerd"
      : status === "archived"
        ? "Gearchiveerd"
        : "Concept";
  return (
    <span className={`rp-admin-status rp-admin-status--${status}`}>
      {status === "published" ? (
        <Check aria-hidden="true" />
      ) : status === "archived" ? (
        <Archive aria-hidden="true" />
      ) : (
        <FileText aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

function SwitchControl({ checked, disabled = false, label, description, onChange }) {
  return (
    <label className={`rp-admin-toggle${checked ? " is-checked" : ""}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="rp-admin-toggle__track" aria-hidden="true">
        <span />
      </span>
      <span className="rp-admin-toggle__copy">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}

export default function RembrandtProjectManager({
  onPublished = () => {},
  onShowToast = () => {},
}) {
  const [project, setProject] = useState(() => createEmptyRembrandtProject());
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [panel, setPanel] = useState("investigations");
  const [workspaceMode, setWorkspaceMode] = useState("overview");
  const [dossierTab, setDossierTab] = useState("text");
  const [updateTab, setUpdateTab] = useState("text");
  const [pageTab, setPageTab] = useState("0");
  const [processTab, setProcessTab] = useState("0");
  const [publishTab, setPublishTab] = useState("1");
  const [contentSelection, setContentSelection] = useState({ about: 0, steps: 0 });
  const [language, setLanguage] = useState("nl");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savedVersion, setSavedVersion] = useState(null);
  const [integrityIssues, setIntegrityIssues] = useState([]);
  const [needsRepair, setNeedsRepair] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [uploading, setUploading] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [updateInvestigationFilter, setUpdateInvestigationFilter] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [previewLink, setPreviewLink] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewDays, setPreviewDays] = useState(30);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [confirmPublicDisable, setConfirmPublicDisable] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const loadProject = () => {
    let active = true;
    setLoading(true);
    setLoadError("");
    fetchRembrandtProjectAdminAsync()
      .then(({ project: loaded, version, revisions: loadedRevisions, integrityIssues: loadedIssues = [] }) => {
        if (!active) return;
        const normalized = normalizeRembrandtProject(loaded);
        const detectedIssues = loadedIssues.length
          ? loadedIssues
          : getRembrandtProjectIntegrityIssues(loaded);
        setProject(normalized);
        setSavedVersion(version ?? null);
        setSavedSnapshot(JSON.stringify(normalized));
        setIntegrityIssues(detectedIssues);
        setNeedsRepair(detectedIssues.length > 0);
        setSelectedId(normalized.updates?.[0]?.id || null);
        setSelectedInvestigationId(normalized.investigations?.[0]?.id || null);
        setRevisions(loadedRevisions || []);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    const cancel = loadProject();
    fetchRembrandtPreviewLinkAsync()
      .then(setPreviewLink)
      .catch(() => setPreviewLink(null));
    return cancel;
  }, []);

  const dirty = useMemo(
    () =>
      Boolean(
        needsRepair ||
          (savedSnapshot && JSON.stringify(project) !== savedSnapshot),
      ),
    [needsRepair, project, savedSnapshot],
  );
  const savedPublicEnabled = useMemo(() => {
    try {
      return JSON.parse(savedSnapshot || "{}").isEnabled === true;
    } catch {
      return false;
    }
  }, [savedSnapshot]);

  const createPreviewLink = async () => {
    setPreviewBusy(true);
    try {
      const result = await createRembrandtPreviewLinkAsync({ days: previewDays });
      setPreviewLink(result.link);
      setPreviewUrl(result.url);
      setConfirmRevoke(false);
      onShowToast("Nieuwe privélink aangemaakt.");
    } catch (error) {
      onShowToast(error.message, "error");
    } finally {
      setPreviewBusy(false);
    }
  };

  const copyPreviewLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      onShowToast("Privélink gekopieerd.", "info");
    } catch {
      onShowToast("Kopiëren is mislukt. Selecteer en kopieer de link handmatig.", "error");
    }
  };

  const revokePreviewLink = async () => {
    if (!previewLink?.id) return;
    setPreviewBusy(true);
    try {
      await revokeRembrandtPreviewLinkAsync(previewLink.id);
      setPreviewLink(null);
      setPreviewUrl("");
      setConfirmRevoke(false);
      onShowToast("De privélink is ingetrokken.");
    } catch (error) {
      onShowToast(error.message, "error");
    } finally {
      setPreviewBusy(false);
    }
  };
  const selectedUpdate =
    project.updates.find((update) => update.id === selectedId) || null;
  const selectedInvestigation =
    project.investigations.find((entry) => entry.id === selectedInvestigationId) || null;
  const filteredUpdates = project.updates
    .filter((update) => {
      const query = searchQuery.trim().toLowerCase();
      return (
        (updateInvestigationFilter === "all" ||
          update.investigationId === updateInvestigationFilter) &&
        (!query ||
          Object.values(update.title || {}).some((title) =>
            String(title).toLowerCase().includes(query),
          ))
      );
    })
    .sort((a, b) => Number(a.sequence) - Number(b.sequence));
  const publicationIssues = useMemo(() => {
    const issues = [];
    if (!project.settings.title?.nl?.trim())
      issues.push("De zichtbare pagina heeft een Nederlandse titel nodig.");
    if (!project.settings.disclaimer?.nl?.trim())
      issues.push("Het permanente voorbehoud mag niet leeg zijn.");
    if (
      !project.phases.some(
        (phase) =>
          phase.id === project.settings.currentPhaseId &&
          phase.visible !== false,
      )
    )
      issues.push("De huidige onderzoeksfase moet zichtbaar zijn.");
    const dossierSlugs = new Set();
    for (const investigation of project.investigations) {
      if (!investigation.slug || investigation.slug === "preview" || dossierSlugs.has(investigation.slug)) {
        issues.push(`${investigation.title?.nl || "Dit dossier"} heeft een unieke URL-slug nodig; ‘preview’ is gereserveerd.`);
      }
      dossierSlugs.add(investigation.slug);
    }
    const slugs = new Set();
    for (const update of project.updates) {
      if (update.status === "published" && !update.title?.nl?.trim())
        issues.push(`Update ${update.sequence} mist een Nederlandse titel.`);
      if (!update.slug || slugs.has(update.slug))
        issues.push(`Update ${update.sequence} heeft geen unieke URL-slug.`);
      slugs.add(update.slug);
      if (
        update.status === "published" &&
        (!update.publishedAt ||
          new Date(update.publishedAt).getTime() > Date.now() + 60000)
      )
        issues.push(
          `Update ${update.sequence} heeft een ongeldig of toekomstig publicatiemoment.`,
        );
      if (update.coverImage && !update.coverAlt?.nl?.trim())
        issues.push(
          `De hoofdafbeelding van update ${update.sequence} mist Nederlandse alternatieve tekst.`,
        );
      for (const [imageIndex, image] of (update.gallery || []).entries()) {
        if (image.url && !image.alt?.nl?.trim())
          issues.push(
            `Galerijafbeelding ${imageIndex + 1} van update ${update.sequence} mist Nederlandse alternatieve tekst.`,
          );
      }
    }
    for (const investigation of project.investigations) {
      if (investigation.visible !== false && !investigation.title?.nl?.trim())
        issues.push(`${investigation.reference || investigation.id} mist een Nederlandse titel.`);
      if (investigation.coverImage && !investigation.coverAlt?.nl?.trim())
        issues.push(`${investigation.reference || investigation.id} mist Nederlandse alternatieve tekst bij de hoofdafbeelding.`);
      for (const [imageIndex, image] of (investigation.gallery || []).entries()) {
        if (image.url && !image.alt?.nl?.trim())
          issues.push(`Dossierbeeld ${imageIndex + 1} van ${investigation.reference || investigation.id} mist Nederlandse alternatieve tekst.`);
      }
    }
    if (project.settings.heroImage && !project.settings.heroAlt?.nl?.trim())
      issues.push("De hero-afbeelding mist Nederlandse alternatieve tekst.");
    if (
      project.settings.researchImage &&
      !project.settings.researchImageAlt?.nl?.trim()
    )
      issues.push(
        "De onderzoeksafbeelding mist Nederlandse alternatieve tekst.",
      );
    return [...new Set(issues)];
  }, [project]);
  const uniqueR2ImageCount = useMemo(
    () =>
      new Set(
        [
          project.settings.heroImage,
          project.settings.researchImage,
          project.settings.socialImage,
          ...project.updates.flatMap((entry) => [
            entry.coverImage,
            ...(entry.gallery || []).map((image) => image.url),
          ]),
          ...project.investigations.flatMap((entry) => [
            entry.coverImage,
            ...(entry.gallery || []).map((image) => image.url),
          ]),
        ].filter(Boolean),
      ).size,
    [project],
  );
  const overviewStats = [
    {
      label: "Dossiers",
      value: project.investigations.length,
      detail: `${project.investigations.filter((entry) => entry.visible !== false).length} zichtbaar`,
    },
    {
      label: "Onderzoeksstappen",
      value: project.researchSteps.length,
      detail: `${project.researchSteps.filter((entry) => entry.visible !== false).length} zichtbaar`,
    },
    {
      label: "Updates",
      value: project.updates.length,
      detail: `${project.updates.filter((entry) => entry.status === "published").length} gepubliceerd`,
    },
    {
      label: "Publicatie",
      value: publicationIssues.length ? publicationIssues.length : "OK",
      detail: publicationIssues.length ? "aandachtspunten" : "klaar voor controle",
      tone: publicationIssues.length ? "warning" : "success",
    },
  ];
  const changePanelByKeyboard = (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = PANELS.findIndex((entry) => entry.id === panel);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? PANELS.length - 1
          : (current + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + PANELS.length) %
            PANELS.length;
    setPanel(PANELS[next].id);
    event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const updateSettings = (field, value, localized = true) =>
    setProject((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [field]: localized
          ? { ...(current.settings[field] || {}), [language]: value }
          : value,
      },
    }));
  const updateSelected = (field, value, localized = false) =>
    setProject((current) => ({
      ...current,
      updates: current.updates.map((entry) =>
        entry.id === selectedId
          ? {
              ...entry,
              [field]: localized
                ? { ...(entry[field] || {}), [language]: value }
                : value,
            }
          : entry,
      ),
    }));
  const updateInvestigation = (investigationId, field, value, localized = false) =>
    setProject((current) => ({
      ...current,
      investigations: current.investigations.map((entry) =>
        entry.id === investigationId
          ? {
              ...entry,
              [field]: localized
                ? { ...(entry[field] || {}), [language]: value }
                : value,
            }
          : entry,
      ),
    }));

  const updateAboutSection = (sectionId, field, value, localized = false) =>
    setProject((current) => ({
      ...current,
      aboutSections: current.aboutSections.map((entry) =>
        entry.id === sectionId
          ? {
              ...entry,
              [field]: localized
                ? { ...(entry[field] || {}), [language]: value }
                : value,
            }
          : entry,
      ),
    }));

  const updateResearchStep = (stepId, field, value, localized = false) =>
    setProject((current) => ({
      ...current,
      researchSteps: current.researchSteps.map((entry) =>
        entry.id === stepId
          ? {
              ...entry,
              [field]: localized
                ? { ...(entry[field] || {}), [language]: value }
                : value,
            }
          : entry,
      ),
    }));

  const save = async ({ publish = false } = {}) => {
    if (saving || uploading.size || loadError) return;
    if ((publish || savedPublicEnabled) && publicationIssues.length) {
      onShowToast(publicationIssues[0], "error");
      return;
    }
    setSaving(true);
    try {
      const result = await saveRembrandtProjectDataAsync(project, savedVersion, {
        publish,
      });
      setProject(result.project);
      setSavedVersion(result.version);
      setSavedSnapshot(JSON.stringify(result.project));
      setIntegrityIssues([]);
      setNeedsRepair(false);
      onPublished(result.project);
      onShowToast(
        result.project.isEnabled
          ? "The Lost Rembrandt Project is veilig opgeslagen en bijgewerkt op de website."
          : "The Lost Rembrandt Project is veilig opgeslagen en blijft verborgen voor bezoekers.",
      );
    } catch (error) {
      onShowToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const changePublicAccess = async (enabled) => {
    if (accessSaving || saving) return;
    if (enabled && dirty) {
      onShowToast("Sla uw inhoudswijzigingen eerst op voordat u de publieke toegang verandert.", "error");
      return;
    }
    if (enabled && publicationIssues.length) {
      onShowToast(publicationIssues[0], "error");
      return;
    }
    setAccessSaving(true);
    try {
      const result = await setRembrandtProjectAccessAsync(enabled, savedVersion);
      setProject((current) => !enabled && dirty
        ? { ...current, isEnabled: false }
        : result.project);
      setSavedVersion(result.version);
      setSavedSnapshot(JSON.stringify(result.project));
      onPublished(result.project);
      onShowToast(
        enabled
          ? "The Lost Rembrandt Project is nu openbaar."
          : "The Lost Rembrandt Project is niet meer openbaar.",
      );
    } catch (error) {
      onShowToast(error.message, "error");
    } finally {
      setAccessSaving(false);
    }
  };

  const addUpdate = () => {
    const selectedInvestigationForUpdate = project.investigations.some(
      (investigation) => investigation.id === updateInvestigationFilter,
    )
      ? updateInvestigationFilter
      : project.investigations[0]?.id;
    const update = createProjectUpdate(project, selectedInvestigationForUpdate);
    setProject((current) => ({
      ...current,
      updates: [...current.updates, update],
    }));
    setSelectedId(update.id);
    setUpdateTab("text");
    setDeleteConfirmId(null);
    setPanel("updates");
    setLanguage("nl");
  };

  const changeUpdateInvestigationFilter = (investigationId) => {
    setUpdateInvestigationFilter(investigationId);
    const nextUpdate = [...project.updates]
      .filter(
        (update) =>
          investigationId === "all" || update.investigationId === investigationId,
      )
      .sort((a, b) => Number(a.sequence) - Number(b.sequence))[0];
    setSelectedId(nextUpdate?.id || null);
    setDeleteConfirmId(null);
  };

  const addPhase = () => {
    const nextNumber = project.phases.length + 1;
    let id = `fase-${nextNumber}`;
    while (project.phases.some((phase) => phase.id === id))
      id = `fase-${nextNumber}-${crypto.randomUUID().slice(0, 4)}`;
    setProject((current) => ({
      ...current,
      phases: [
        ...current.phases,
        {
          id,
          sortOrder: nextNumber,
          visible: true,
          label: { nl: `Nieuwe fase ${nextNumber}`, en: "", fr: "" },
        },
      ],
    }));
  };

  const movePhase = (phaseId, direction) => {
    const ordered = [...project.phases].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const index = ordered.findIndex((phase) => phase.id === phaseId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const other = ordered[target];
    const contentKey = collection === "aboutSections" ? "about" : collection === "researchSteps" ? "steps" : null;
    if (contentKey) setContentSelection((current) => ({ ...current, [contentKey]: target }));
    setProject((current) => ({
      ...current,
      phases: current.phases.map((phase) =>
        phase.id === phaseId
          ? { ...phase, sortOrder: other.sortOrder }
          : phase.id === other.id
            ? { ...phase, sortOrder: ordered[index].sortOrder }
            : phase,
      ),
    }));
  };

  const removePhase = (phaseId) => {
    if (
      phaseId === project.settings.currentPhaseId ||
      project.updates.some((update) => update.phaseId === phaseId)
    ) {
      onShowToast(
        "Een huidige of gebruikte fase kan niet worden verwijderd.",
        "error",
      );
      return;
    }
    setProject((current) => ({
      ...current,
      phases: current.phases
        .filter((phase) => phase.id !== phaseId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((phase, index) => ({ ...phase, sortOrder: index + 1 })),
    }));
  };

  const restoreRevision = async (revisionId) => {
    if (deleteConfirmId !== `revision-${revisionId}`) {
      setDeleteConfirmId(`revision-${revisionId}`);
      return;
    }
    try {
      const revision = await fetchRembrandtProjectRevisionAsync(revisionId);
      const restored = normalizeRembrandtProject({ ...revision.content, isEnabled: savedPublicEnabled });
      setProject(restored);
      setSelectedId(restored.updates?.[0]?.id || null);
      setDeleteConfirmId(null);
      onShowToast(
        "De revisie staat klaar. Controleer ze en publiceer om definitief te herstellen.",
        "info",
      );
    } catch (error) {
      onShowToast(error.message, "error");
    }
  };

  const duplicateSelected = () => {
    if (!selectedUpdate) return;
    const usedSlugs = new Set(project.updates.map((entry) => entry.slug));
    const baseSlug = `${selectedUpdate.slug || "update"}-kopie`;
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    const copy = {
      ...JSON.parse(JSON.stringify(selectedUpdate)),
      id: crypto.randomUUID(),
      sequence:
        Math.max(
          ...project.updates.map((entry) => Number(entry.sequence) || 0),
        ) + 1,
      slug,
      status: "draft",
      publishedAt: "",
    };
    setProject((current) => ({
      ...current,
      updates: [...current.updates, copy],
    }));
    setSelectedId(copy.id);
  };

  const moveSelected = (direction) => {
    const ordered = [...project.updates].sort(
      (a, b) => Number(a.sequence) - Number(b.sequence),
    );
    const index = ordered.findIndex((entry) => entry.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const first = ordered[index];
    const second = ordered[target];
    setProject((current) => ({
      ...current,
      updates: current.updates.map((entry) => {
        if (entry.id === first.id)
          return { ...entry, sequence: second.sequence };
        if (entry.id === second.id)
          return { ...entry, sequence: first.sequence };
        return entry;
      }),
    }));
  };

  const deleteSelected = () => {
    if (!selectedUpdate) return;
    if (deleteConfirmId !== selectedUpdate.id) {
      setDeleteConfirmId(selectedUpdate.id);
      return;
    }
    const remaining = project.updates.filter(
      (entry) => entry.id !== selectedUpdate.id,
    );
    setProject((current) => ({ ...current, updates: remaining }));
    setSelectedId(remaining[0]?.id || null);
    setDeleteConfirmId(null);
  };

  const uploadImage = async (file, target, galleryId = null) => {
    if (!file) return;
    const uploadKey = galleryId ? `gallery-${galleryId}` : target;
    setUploading((current) => new Set(current).add(uploadKey));
    try {
      const url = await uploadCatalogImage(file, {
        purpose: ["heroImage", "researchImage", "socialImage"].includes(target)
          ? "rembrandt-project-hero"
          : "rembrandt-project-update",
      });
      if (target === "heroImage") updateSettings("heroImage", url, false);
      else if (target === "researchImage")
        updateSettings("researchImage", url, false);
      else if (target === "socialImage")
        updateSettings("socialImage", url, false);
      else if (target === "coverImage") updateSelected("coverImage", url);
      else
        setProject((current) => ({
          ...current,
          updates: current.updates.map((entry) =>
            entry.id !== selectedId
              ? entry
              : {
                  ...entry,
                  gallery: entry.gallery.map((image) =>
                    image.id === galleryId ? { ...image, url } : image,
                  ),
                },
          ),
        }));
      onShowToast("Afbeelding veilig geüpload.", "info");
    } catch (error) {
      onShowToast(error.message, "error");
    } finally {
      setUploading((current) => {
        const next = new Set(current);
        next.delete(uploadKey);
        return next;
      });
    }
  };

  const updateGallery = (imageId, field, value, localized = false) =>
    setProject((current) => ({
      ...current,
      updates: current.updates.map((entry) =>
        entry.id !== selectedId
          ? entry
          : {
              ...entry,
              gallery: entry.gallery.map((image) =>
                image.id === imageId
                  ? {
                      ...image,
                      [field]: localized
                        ? { ...(image[field] || {}), [language]: value }
                        : value,
                    }
                  : image,
              ),
            },
      ),
    }));
  const addGalleryImage = () =>
    updateSelected("gallery", [
      ...(selectedUpdate?.gallery || []),
      {
        id: crypto.randomUUID(),
        url: "",
        alt: { nl: "", en: "", fr: "" },
        caption: { nl: "", en: "", fr: "" },
      },
    ]);

  const addInvestigation = () => {
    const investigation = createProjectInvestigation(project);
    setProject((current) => ({
      ...current,
      investigations: [...current.investigations, investigation],
    }));
    setSelectedInvestigationId(investigation.id);
    setWorkspaceMode("edit");
    setDossierTab("text");
    setPanel("investigations");
    setLanguage("nl");
  };

  const moveOrderedEntry = (collection, id, direction) => {
    const ordered = [...project[collection]].sort(
      (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
    );
    const index = ordered.findIndex((entry) => entry.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const other = ordered[target];
    const contentKey = collection === "aboutSections" ? "about" : collection === "researchSteps" ? "steps" : null;
    if (contentKey) setContentSelection((current) => ({ ...current, [contentKey]: target }));
    setProject((current) => ({
      ...current,
      [collection]: current[collection].map((entry) =>
        entry.id === id
          ? { ...entry, sortOrder: other.sortOrder }
          : entry.id === other.id
            ? { ...entry, sortOrder: ordered[index].sortOrder }
            : entry,
      ),
    }));
  };

  const removeOrderedEntry = (collection, id) => {
    if (
      collection === "investigations" &&
      project.updates.some((update) => update.investigationId === id)
    ) {
      onShowToast("Verplaats of verwijder eerst de gekoppelde updates.", "error");
      return;
    }
    const nextSelection =
      collection === "investigations"
        ? project.investigations
            .filter((entry) => entry.id !== id)
            .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))[0]?.id || null
        : null;
    setProject((current) => ({
      ...current,
      [collection]: current[collection]
        .filter((entry) => entry.id !== id)
        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
        .map((entry, index) => ({ ...entry, sortOrder: index + 1 })),
    }));
    if (collection === "investigations") {
      setSelectedInvestigationId(nextSelection);
    }
  };

  const uploadInvestigationImage = async (file, investigationId, galleryId = null) => {
    if (!file) return;
    const uploadKey = galleryId ? `investigation-gallery-${galleryId}` : `investigation-cover-${investigationId}`;
    setUploading((current) => new Set(current).add(uploadKey));
    try {
      const url = await uploadCatalogImage(file, { purpose: "rembrandt-project-update" });
      setProject((current) => ({
        ...current,
        investigations: current.investigations.map((entry) =>
          entry.id !== investigationId
            ? entry
            : galleryId
              ? {
                  ...entry,
                  gallery: entry.gallery.map((image) =>
                    image.id === galleryId ? { ...image, url } : image,
                  ),
                }
              : { ...entry, coverImage: url },
        ),
      }));
      onShowToast("Dossierbeeld veilig geüpload.", "info");
    } catch (error) {
      onShowToast(error.message, "error");
    } finally {
      setUploading((current) => {
        const next = new Set(current);
        next.delete(uploadKey);
        return next;
      });
    }
  };

  if (loading)
    return (
      <div className="rp-admin-loading">
        <Loader2 aria-hidden="true" />
        <p>Projectbeheer laden…</p>
      </div>
    );
  if (loadError)
    return (
      <div className="rp-admin-loading rp-admin-loading--error">
        <FileText aria-hidden="true" />
        <h2>Projectbeheer kon niet worden geladen</h2>
        <p>{loadError}</p>
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={loadProject}
        >
          Opnieuw proberen
        </button>
      </div>
    );

  return (
    <div className="rp-admin rp-workspace">
      <header className="rp-admin-header">
        <div>
          <p>
            <Search aria-hidden="true" />
            Lost Rembrandt · beheer
          </p>
          <h1>Lost Rembrandt</h1>
          <span>
            De werkruimte voor uw onderzoeken.
          </span>
        </div>
        <div className="rp-admin-header__actions">
          <span className={dirty ? "is-dirty" : "is-saved"}>
            {dirty
              ? "Niet-opgeslagen wijzigingen"
              : savedVersion
                ? "Alles opgeslagen"
                : "Nog niet gepubliceerd"}
          </span>
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={save}
            disabled={saving || uploading.size > 0}
          >
            {saving ? (
              <Loader2 className="is-spinning" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {saving
              ? "Opslaan…"
              : savedPublicEnabled
                ? "Opslaan & publiceren"
                : "Wijzigingen opslaan"}
          </button>
        </div>
      </header>

      {needsRepair && (
        <aside className="rp-admin-data-alert" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Projectdata hersteld in deze editor</strong>
            <p>
              Er waren ongeldige of dubbele dossier-sleutels. De werken zijn tijdelijk
              opnieuw uniek gemaakt; sla de wijzigingen op om dit ook definitief te bewaren.
            </p>
            <ul>
              {integrityIssues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </div>
        </aside>
      )}

      <div
        className="rp-admin-tabs"
        role="tablist"
        aria-label="Projectonderdelen"
        aria-orientation="vertical"
        onKeyDown={changePanelByKeyboard}
      >
        {PANELS.map((entry) => (
          <button
            type="button"
            role="tab"
            aria-selected={panel === entry.id}
            aria-controls={`rp-panel-${entry.id}`}
            id={`rp-tab-${entry.id}`}
            tabIndex={panel === entry.id ? 0 : -1}
            className={panel === entry.id ? "is-active" : ""}
            key={entry.id}
            onClick={() => { setPanel(entry.id); if (entry.id === "investigations") setWorkspaceMode("overview"); if (entry.id === "updates") changeUpdateInvestigationFilter("all"); }}
          >
            <entry.icon aria-hidden="true" /><div><strong>{entry.label}</strong><small>{entry.description}</small></div>
            {entry.id === "updates" && <span>{project.updates.length}</span>}
            {entry.id === "investigations" && <span>{project.investigations.length}</span>}
            {entry.id === "process" && <span>{project.researchSteps.length}</span>}
          </button>
        ))}
      </div>
      <div className="rp-work-main">
      <div className="rp-work-context"><div><span>WERKRUIMTE / {PANELS.find((entry) => entry.id === panel)?.label.toUpperCase()}</span><h2>{panel === "investigations" && workspaceMode === "overview" ? "Uw onderzoeken" : PANELS.find((entry) => entry.id === panel)?.label}</h2></div><div><span className="rp-work-language-label">Inhoud bewerken in</span><LanguageTabs language={language} onChange={setLanguage} /></div></div>
      {panel === "investigations" && workspaceMode === "overview" && <div className="rp-admin-overview-strip" aria-label="Projectoverzicht">
        {overviewStats.map((stat) => (
          <div key={stat.label} className={stat.tone ? `is-${stat.tone}` : ""}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>}

      {panel === "investigations" && workspaceMode === "overview" && <section className="rp-project-overview" id="rp-panel-investigations" role="tabpanel" aria-labelledby="rp-tab-investigations">
        <div className="rp-work-intro"><p>Elk onderzoek heeft een eigen pagina. Kies een project om de inhoud, beelden en onderzoekstijdlijn te beheren.</p><button type="button" className="admin-button admin-button--primary" onClick={addInvestigation}><Plus />Nieuw project</button></div>
        <div className="rp-project-grid">{[...project.investigations].sort((a,b) => a.sortOrder - b.sortOrder).map((entry) => <button type="button" className="rp-project-card" key={entry.id} onClick={() => { setSelectedInvestigationId(entry.id); setWorkspaceMode("edit"); setDossierTab("text"); }}>
          <div className="rp-project-card__art">{entry.coverImage ? <img src={entry.coverImage} alt="" /> : <ImageIcon />}<span>{entry.reference}</span></div>
          <div className="rp-project-card__body"><span>{entry.title?.nl || "Nieuw project"}</span><h3>{entry.subtitle?.nl || "Naam van het werk toevoegen"}</h3><p>{entry.visible === false ? "Verborgen" : savedPublicEnabled ? "Publiek zichtbaar" : "Klaargezet · website verborgen"}</p><div><span>{project.updates.filter((update) => update.investigationId === entry.id).length} updates · {(entry.gallery || []).length} {(entry.gallery || []).length === 1 ? "beeld" : "beelden"}</span><ArrowRight /></div></div>
        </button>)}</div>
        <div className="rp-overview-caption"><Globe2 /><div><strong>De introductie boven de projectkaarten</strong><p>Deze tekst verschijnt op de overzichtspagina van Lost Rembrandt.</p></div></div>
        <div className="rp-admin-form-grid rp-admin-form-grid--two"><Field label="Sectietitel"><input value={valueFor(project.settings, "investigationsTitle", language)} onChange={(event) => updateSettings("investigationsTitle", event.target.value)} /></Field><Field label="Inleiding"><textarea rows="3" value={valueFor(project.settings, "investigationsIntro", language)} onChange={(event) => updateSettings("investigationsIntro", event.target.value)} /></Field></div>
      </section>}
      {panel === "page" && <EditorNav label="Onderdelen overzichtspagina" value={pageTab} onChange={setPageTab} items={[{id:"0",label:"Introductie"},{id:"1",label:"Status"},{id:"2",label:"Hoofdbeeld"},{id:"3",label:"Onderzoeksfases"},{id:"4",label:"Afsluiting"}]} />}
      {panel === "process" && <EditorNav label="Verhaal en werkwijze" value={processTab} onChange={setProcessTab} items={[{id:"0",label:"Over het initiatief"},{id:"1",label:"Onderzoeksproces"},{id:"2",label:"Een werk inzenden"}]} />}
      {panel === "publish" && <EditorNav label="Publicatieonderdelen" value={publishTab} onChange={setPublishTab} items={[{id:"1",label:"Toegang & controle"},{id:"0",label:"Zoekmachines & delen"},{id:"2",label:"Versiegeschiedenis"},{id:"3",label:"Herstellen"}]} />}
      {panel === "page" && (
        <div
          className="rp-admin-page-grid"
          id="rp-panel-page"
          role="tabpanel"
          aria-labelledby="rp-tab-page"
        >
          <section hidden={pageTab !== "0"} className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>01</p>
                <h2>Introductie & status</h2>
              </div>
            </div>
            <div className="rp-admin-form-grid">
              <Field label="Bovenregel">
                <input
                  value={valueFor(project.settings, "eyebrow", language)}
                  onChange={(event) =>
                    updateSettings("eyebrow", event.target.value)
                  }
                />
              </Field>
              <Field label="Paginatitel">
                <input
                  value={valueFor(project.settings, "title", language)}
                  onChange={(event) =>
                    updateSettings("title", event.target.value)
                  }
                />
              </Field>
              <Field label="Korte introductie">
                <textarea
                  rows="3"
                  value={valueFor(project.settings, "intro", language)}
                  onChange={(event) =>
                    updateSettings("intro", event.target.value)
                  }
                />
              </Field>
              <Field label="Projectsamenvatting">
                <textarea
                  rows="7"
                  value={valueFor(project.settings, "summary", language)}
                  onChange={(event) =>
                    updateSettings("summary", event.target.value)
                  }
                />
              </Field>
              <Field
                label="Permanent voorbehoud"
                hint="Deze tekst bewaakt de zorgvuldige formulering rond de toeschrijving."
              >
                <textarea
                  rows="4"
                  value={valueFor(project.settings, "disclaimer", language)}
                  onChange={(event) =>
                    updateSettings("disclaimer", event.target.value)
                  }
                />
              </Field>
            </div>
          </section>

          <section hidden={pageTab !== "1"} className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>02</p>
                <h2>Onderzoeksstatus</h2>
              </div>
            </div>
            <div className="rp-admin-form-grid rp-admin-form-grid--two">
              <Field label="Projectstatus">
                <select
                  value={project.settings.projectStatus}
                  onChange={(event) =>
                    updateSettings("projectStatus", event.target.value, false)
                  }
                >
                  {REMBRANDT_PROJECT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Huidige fase">
                <select
                  value={project.settings.currentPhaseId}
                  onChange={(event) =>
                    updateSettings("currentPhaseId", event.target.value, false)
                  }
                >
                  {project.phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.label.nl}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Actuele stand">
                <textarea
                  rows="5"
                  value={valueFor(project.settings, "currentStatus", language)}
                  onChange={(event) =>
                    updateSettings("currentStatus", event.target.value)
                  }
                />
              </Field>
              <Field label="Eerstvolgende stap">
                <textarea
                  rows="5"
                  value={valueFor(project.settings, "nextStep", language)}
                  onChange={(event) =>
                    updateSettings("nextStep", event.target.value)
                  }
                />
              </Field>
            </div>
          </section>

          <section hidden={pageTab !== "2"} className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>03</p>
                <h2>Hero-afbeelding</h2>
              </div>
            </div>
            <div className="rp-admin-media-row">
              <div className="rp-admin-media-preview">
                {project.settings.heroImage ? (
                  <img src={project.settings.heroImage} alt="Hero preview" />
                ) : (
                  <ImageIcon aria-hidden="true" />
                )}
              </div>
              <div>
                <p>
                  Afbeeldingen worden veilig opgeslagen en na een geslaagde upload
                  automatisch aan deze pagina gekoppeld.
                </p>
                <label className="admin-button admin-button--secondary">
                  <Upload aria-hidden="true" />
                  {uploading.has("heroImage")
                    ? "Uploaden…"
                    : "Afbeelding kiezen"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploading.has("heroImage")}
                    onChange={(event) => {
                      uploadImage(event.target.files?.[0], "heroImage");
                      event.target.value = "";
                    }}
                  />
                </label>
                {project.settings.heroImage && (
                  <button
                    type="button"
                    className="admin-text-button"
                    onClick={() => updateSettings("heroImage", "", false)}
                  >
                    Afbeelding verwijderen
                  </button>
                )}
              </div>
            </div>
            <Field label="Alternatieve tekst">
              <input
                value={valueFor(project.settings, "heroAlt", language)}
                onChange={(event) =>
                  updateSettings("heroAlt", event.target.value)
                }
              />
            </Field>
          </section>

          <section hidden={pageTab !== "3"} className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>04</p>
                <h2>Onderzoeksfases</h2>
              </div>
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={addPhase}
              >
                <Plus aria-hidden="true" />
                Fase toevoegen
              </button>
            </div>
            <div className="rp-admin-phases">
              {[...project.phases]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((phase, index) => (
                  <div key={phase.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <input
                      aria-label={`Naam fase ${index + 1}`}
                      value={phase.label?.[language] || ""}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          phases: current.phases.map((entry) =>
                            entry.id === phase.id
                              ? {
                                  ...entry,
                                  label: {
                                    ...entry.label,
                                    [language]: event.target.value,
                                  },
                                }
                              : entry,
                          ),
                        }))
                      }
                    />
                    <div className="rp-admin-phase-actions">
                      <button
                        type="button"
                        disabled={index === 0}
                        aria-label="Fase omhoog"
                        onClick={() => movePhase(phase.id, -1)}
                      >
                        <ArrowUp aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={index === project.phases.length - 1}
                        aria-label="Fase omlaag"
                        onClick={() => movePhase(phase.id, 1)}
                      >
                        <ArrowDown aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={phase.id === project.settings.currentPhaseId}
                        aria-label={
                          phase.id === project.settings.currentPhaseId
                            ? "De huidige fase kan niet verborgen worden"
                            : phase.visible === false
                              ? "Fase tonen"
                              : "Fase verbergen"
                        }
                        onClick={() =>
                          setProject((current) => ({
                            ...current,
                            phases: current.phases.map((entry) =>
                              entry.id === phase.id
                                ? { ...entry, visible: entry.visible === false }
                                : entry,
                            ),
                          }))
                        }
                      >
                        {phase.visible === false ? (
                          <EyeOff aria-hidden="true" />
                        ) : (
                          <Eye aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={
                          phase.id === project.settings.currentPhaseId ||
                          project.updates.some(
                            (update) => update.phaseId === phase.id,
                          )
                        }
                        aria-label="Fase verwijderen"
                        onClick={() => removePhase(phase.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section hidden={pageTab !== "4"} className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>05</p>
                <h2>Methodologie & afsluiting</h2>
              </div>
            </div>
            <div className="rp-admin-form-grid">
              <Field label="Methodologietitel">
                <input
                  value={valueFor(
                    project.settings,
                    "methodologyTitle",
                    language,
                  )}
                  onChange={(event) =>
                    updateSettings("methodologyTitle", event.target.value)
                  }
                />
              </Field>
              <Field label="Methodologietekst">
                <textarea
                  rows="5"
                  value={valueFor(
                    project.settings,
                    "methodologyText",
                    language,
                  )}
                  onChange={(event) =>
                    updateSettings("methodologyText", event.target.value)
                  }
                />
              </Field>
              <Field label="Afsluitende titel">
                <input
                  value={valueFor(project.settings, "closingTitle", language)}
                  onChange={(event) =>
                    updateSettings("closingTitle", event.target.value)
                  }
                />
              </Field>
              <Field label="Afsluitende tekst">
                <textarea
                  rows="4"
                  value={valueFor(project.settings, "closingText", language)}
                  onChange={(event) =>
                    updateSettings("closingText", event.target.value)
                  }
                />
              </Field>
            </div>
          </section>
        </div>
      )}

      {panel === "investigations" && workspaceMode === "edit" && (
        <div
          className="rp-admin-collection-layout"
          id="rp-panel-investigations"
          role="tabpanel"
          aria-labelledby="rp-tab-investigations"
        >
          <aside className="rp-admin-collection-list">
            <div className="rp-admin-card__heading">
              <div><button className="rp-back-link" type="button" onClick={() => setWorkspaceMode("overview")}><ArrowLeft />Alle projecten</button><h2>Kies een onderzoek</h2></div>
              <button type="button" className="admin-button admin-button--secondary" onClick={addInvestigation}>
                <Plus aria-hidden="true" />Nieuw dossier
              </button>
            </div>
            {[...project.investigations]
              .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
              .map((investigation) => (
                <button
                  type="button"
                  key={investigation.id}
                  className={investigation.id === selectedInvestigationId ? "is-active" : ""}
                  aria-current={investigation.id === selectedInvestigationId ? "true" : undefined}
                  aria-label={`${investigation.title?.nl || investigation.id} bewerken`}
                  onClick={() => setSelectedInvestigationId(investigation.id)}
                >
                  {investigation.coverImage ? <img className="rp-case-thumb" src={investigation.coverImage} alt="" /> : <span>{String(investigation.sortOrder).padStart(2, "0")}</span>}
                  <div>
                    <strong>{investigation.title?.nl || investigation.id}</strong>
                    <small>{investigation.subtitle?.nl || investigation.reference || "Zonder referentie"}</small>
                    <em>{investigation.visible === false ? "Verborgen" : savedPublicEnabled ? "Publiek zichtbaar" : "Klaargezet"}</em>
                  </div>
                  {investigation.visible === false ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              ))}
          </aside>

          {selectedInvestigation ? (
            <section className="rp-admin-editor">
              <header className="rp-admin-editor__header">
                <div>
                  <span className="rp-admin-status rp-admin-status--draft">
                    Werk {String(selectedInvestigation.sortOrder).padStart(2, "0")}
                  </span>
                  <h2>{selectedInvestigation.title?.nl || "Nieuw dossier"}</h2>
                  {savedPublicEnabled && selectedInvestigation.visible !== false && <a className="rp-live-link" href={localizePath(`${REMBRANDT_PROJECT_ROUTE}/${selectedInvestigation.slug}`, language)} target="_blank" rel="noopener noreferrer" title="Bekijk de laatst opgeslagen pagina"><Eye />Bekijk pagina</a>}
                  <p className="rp-admin-editor__context">
                    {selectedInvestigation.reference || "Zonder referentie"} · {selectedInvestigation.slug || "zonder URL-slug"}
                  </p>
                </div>
                <div>
                  <button type="button" aria-label="Dossier omhoog" onClick={() => moveOrderedEntry("investigations", selectedInvestigation.id, -1)}><ArrowUp aria-hidden="true" /></button>
                  <button type="button" aria-label="Dossier omlaag" onClick={() => moveOrderedEntry("investigations", selectedInvestigation.id, 1)}><ArrowDown aria-hidden="true" /></button>
                  <button type="button" aria-label="Dossier verwijderen" onClick={() => removeOrderedEntry("investigations", selectedInvestigation.id)}><Trash2 aria-hidden="true" /></button>
                </div>
              </header>
              <EditorNav label="Dossieronderdelen" value={dossierTab} onChange={(tab) => { if (tab === "updates") { changeUpdateInvestigationFilter(selectedInvestigation.id); setPanel("updates"); } else setDossierTab(tab); }} items={[{id:"text",label:"Tekst & verhaal"},{id:"media",label:"Beelden"},{id:"updates",label:`Updates (${project.updates.filter((entry) => entry.investigationId === selectedInvestigation.id).length})`},{id:"settings",label:"Instellingen"}]} />
              <div hidden={dossierTab !== "settings"} className="rp-admin-editor__publication">
                <div className="rp-admin-editor__publication-fields">
                  <Field label="Referentie"><input value={selectedInvestigation.reference || ""} onChange={(event) => updateInvestigation(selectedInvestigation.id, "reference", event.target.value)} /></Field>
                  <Field label="URL-slug"><input value={selectedInvestigation.slug || ""} onChange={(event) => updateInvestigation(selectedInvestigation.id, "slug", slugify(event.target.value))} /></Field>
                  <Field label="Onderzoeksstatus">
                    <select value={selectedInvestigation.status} onChange={(event) => updateInvestigation(selectedInvestigation.id, "status", event.target.value)}>
                      <option value="discovery">Ontdekking</option><option value="initial-assessment">Eerste beoordeling</option><option value="technical-research">Technisch onderzoek</option><option value="expert-review">Expertbeoordeling</option><option value="paused">Gepauzeerd</option><option value="completed">Afgerond</option>
                    </select>
                  </Field>
                </div>
                <div className="rp-admin-editor__publication-toggles" role="group" aria-label="Dossierweergave">
                  <SwitchControl
                    checked={selectedInvestigation.visible !== false}
                    label="Publiek zichtbaar"
                    description="Toon dit dossier op de publieke projectpagina."
                    onChange={(event) => updateInvestigation(selectedInvestigation.id, "visible", event.target.checked)}
                  />
                  <SwitchControl
                    checked={selectedInvestigation.featured === true}
                    label="Uitgelicht dossier"
                    description="Plaats dit dossier prominent in het overzicht."
                    onChange={(event) => updateInvestigation(selectedInvestigation.id, "featured", event.target.checked)}
                  />
                </div>
              </div>
              <div hidden={dossierTab === "settings"} className="rp-admin-editor__body">
                <div hidden={dossierTab !== "text"} className="rp-admin-form-grid rp-admin-form-grid--two">
                  <Field label="Projecttitel"><input value={valueFor(selectedInvestigation, "title", language)} onChange={(event) => updateInvestigation(selectedInvestigation.id, "title", event.target.value, true)} /></Field>
                  <Field label="Naam van het werk"><input value={valueFor(selectedInvestigation, "subtitle", language)} onChange={(event) => updateInvestigation(selectedInvestigation.id, "subtitle", event.target.value, true)} /></Field>
                  <Field label="Publieke statusregel"><input value={valueFor(selectedInvestigation, "statusLabel", language)} onChange={(event) => updateInvestigation(selectedInvestigation.id, "statusLabel", event.target.value, true)} /></Field>
                  <Field label="Korte samenvatting"><textarea rows="4" value={valueFor(selectedInvestigation, "summary", language)} onChange={(event) => updateInvestigation(selectedInvestigation.id, "summary", event.target.value, true)} /></Field>
                  <Field label="Dossierbeschrijving"><textarea rows="7" value={valueFor(selectedInvestigation, "description", language)} onChange={(event) => updateInvestigation(selectedInvestigation.id, "description", event.target.value, true)} /></Field>
                </div>
                <div hidden={dossierTab !== "media"}>
                <div className="rp-admin-card__heading"><div><p>Beelden van het onderzoek</p><h2>Hoofdbeeld</h2></div></div>
                <div className="rp-admin-media-row">
                  <div className="rp-admin-media-preview">{selectedInvestigation.coverImage ? <img src={selectedInvestigation.coverImage} alt="Dossier preview" /> : <ImageIcon aria-hidden="true" />}</div>
                  <div>
                    <label className="admin-button admin-button--secondary"><Upload aria-hidden="true" />Hoofdbeeld kiezen<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { uploadInvestigationImage(event.target.files?.[0], selectedInvestigation.id); event.target.value = ""; }} /></label>
                    {selectedInvestigation.coverImage && <button type="button" className="admin-text-button" onClick={() => updateInvestigation(selectedInvestigation.id, "coverImage", "")}>Hoofdbeeld verwijderen</button>}
                  </div>
                </div>
                <Field label="Alternatieve tekst hoofdbeeld"><input value={valueFor(selectedInvestigation, "coverAlt", language)} onChange={(event) => updateInvestigation(selectedInvestigation.id, "coverAlt", event.target.value, true)} /></Field>
                <div className="rp-admin-card__heading rp-admin-subheading">
                  <div><p>Media</p><h2>Dossiergalerij</h2></div>
                  <button type="button" className="admin-button admin-button--secondary" onClick={() => updateInvestigation(selectedInvestigation.id, "gallery", [...(selectedInvestigation.gallery || []), { id: crypto.randomUUID(), url: "", alt: { nl: "", en: "", fr: "" }, caption: { nl: "", en: "", fr: "" } }])}><Plus aria-hidden="true" />Beeld</button>
                </div>
                <div className="rp-admin-gallery">
                  {(selectedInvestigation.gallery || []).map((image, index) => (
                    <div key={image.id} className="rp-admin-gallery-item">
                      <div className="rp-admin-media-preview">{image.url ? <img src={image.url} alt="Galerij preview" /> : <ImageIcon aria-hidden="true" />}</div>
                      <div className="rp-admin-gallery-item__fields">
                        <strong>Beeld {index + 1}</strong>
                        <label className="admin-button admin-button--secondary"><Upload aria-hidden="true" />Uploaden<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { uploadInvestigationImage(event.target.files?.[0], selectedInvestigation.id, image.id); event.target.value = ""; }} /></label>
                        <Field label="Alternatieve tekst"><input value={image.alt?.[language] || ""} onChange={(event) => updateInvestigation(selectedInvestigation.id, "gallery", selectedInvestigation.gallery.map((entry) => entry.id === image.id ? { ...entry, alt: { ...entry.alt, [language]: event.target.value } } : entry))} /></Field>
                        <Field label="Bijschrift"><textarea rows="2" value={image.caption?.[language] || ""} onChange={(event) => updateInvestigation(selectedInvestigation.id, "gallery", selectedInvestigation.gallery.map((entry) => entry.id === image.id ? { ...entry, caption: { ...entry.caption, [language]: event.target.value } } : entry))} /></Field>
                        <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => updateInvestigation(selectedInvestigation.id, "gallery", selectedInvestigation.gallery.filter((entry) => entry.id !== image.id))}><Trash2 aria-hidden="true" />Beeld verwijderen</button>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </section>
          ) : <section className="rp-admin-empty"><Search aria-hidden="true" /><h2>Nog geen dossiers</h2><button type="button" className="admin-button admin-button--primary" onClick={addInvestigation}><Plus aria-hidden="true" />Eerste dossier</button></section>}
        </div>
      )}

      {panel === "process" && (
        <div className="rp-admin-page-grid" id="rp-panel-process" role="tabpanel" aria-labelledby="rp-tab-process">
          <section hidden={processTab !== "0"} className="rp-admin-card">
            <div className="rp-admin-card__heading"><div><p>Verhaal</p><h2>Over het project</h2></div><button type="button" className="admin-button admin-button--secondary" onClick={() => { setContentSelection((current) => ({...current, about: project.aboutSections.length})); const sortOrder = Math.max(0, ...project.aboutSections.map((entry) => Number(entry.sortOrder) || 0)) + 1; setProject((current) => ({ ...current, aboutSections: [...current.aboutSections, { id: `about-${sortOrder}`, sortOrder, visible: true, title: { nl: "Nieuwe sectie", en: "", fr: "" }, body: { nl: "", en: "", fr: "" } }] })); }}><Plus aria-hidden="true" />Sectie</button></div>
            <div className="rp-admin-form-grid"><Field label="Sectietitel"><input value={valueFor(project.settings, "aboutTitle", language)} onChange={(event) => updateSettings("aboutTitle", event.target.value)} /></Field><Field label="Inleiding"><textarea rows="4" value={valueFor(project.settings, "aboutIntro", language)} onChange={(event) => updateSettings("aboutIntro", event.target.value)} /></Field></div>
            <div className="rp-admin-content-list">
              <div className="rp-content-picker" aria-label="Kies een onderdeel">{[...project.aboutSections].sort((a,b) => a.sortOrder - b.sortOrder).map((entry, index) => <button type="button" key={entry.id} className={Math.min(contentSelection.about, project.aboutSections.length - 1) === index ? "is-active" : ""} onClick={() => setContentSelection((current) => ({...current, about: index}))}><span>{String(index + 1).padStart(2,"0")}</span>{entry.title?.[language] || entry.title?.nl || "Nieuw onderdeel"}</button>)}</div>
              {[...project.aboutSections].sort((a,b) => a.sortOrder - b.sortOrder).filter((_, index) => index === Math.min(contentSelection.about, project.aboutSections.length - 1)).map((section) => <article key={section.id}>
                <div className="rp-admin-content-list__actions"><button type="button" aria-label="Sectie omhoog" onClick={() => moveOrderedEntry("aboutSections", section.id, -1)}><ArrowUp aria-hidden="true" /></button><button type="button" aria-label="Sectie omlaag" onClick={() => moveOrderedEntry("aboutSections", section.id, 1)}><ArrowDown aria-hidden="true" /></button><button type="button" aria-label="Sectie tonen of verbergen" onClick={() => updateAboutSection(section.id, "visible", section.visible === false)}>{section.visible === false ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button><button type="button" aria-label="Sectie verwijderen" onClick={() => removeOrderedEntry("aboutSections", section.id)}><Trash2 aria-hidden="true" /></button></div>
                <Field label={`Titel ${section.sortOrder}`}><input value={valueFor(section, "title", language)} onChange={(event) => updateAboutSection(section.id, "title", event.target.value, true)} /></Field><Field label="Tekst"><textarea rows="6" value={valueFor(section, "body", language)} onChange={(event) => updateAboutSection(section.id, "body", event.target.value, true)} /></Field>
              </article>)}
            </div>
          </section>

          <section hidden={processTab !== "1"} className="rp-admin-card">
            <div className="rp-admin-card__heading"><div><p>Proces</p><h2>Onderzoeksstappen</h2></div><button type="button" className="admin-button admin-button--secondary" onClick={() => { setContentSelection((current) => ({...current, steps: project.researchSteps.length})); setProject((current) => ({ ...current, researchSteps: [...current.researchSteps, createResearchStep(current)] })); }}><Plus aria-hidden="true" />Stap</button></div>
            <div className="rp-admin-form-grid"><Field label="Sectietitel"><input value={valueFor(project.settings, "processTitle", language)} onChange={(event) => updateSettings("processTitle", event.target.value)} /></Field><Field label="Inleiding"><textarea rows="4" value={valueFor(project.settings, "processIntro", language)} onChange={(event) => updateSettings("processIntro", event.target.value)} /></Field></div>
            <div className="rp-admin-media-row">
              <div className="rp-admin-media-preview">
                {project.settings.researchImage ? (
                  <img src={project.settings.researchImage} alt="Preview onderzoeksproces" />
                ) : (
                  <ImageIcon aria-hidden="true" />
                )}
              </div>
              <div>
                <Field label="Alternatieve tekst">
                  <input
                    value={valueFor(project.settings, "researchImageAlt", language)}
                    onChange={(event) => updateSettings("researchImageAlt", event.target.value)}
                  />
                </Field>
                <label className="admin-button admin-button--secondary">
                  <Upload aria-hidden="true" />
                  {uploading.has("researchImage") ? "Uploaden…" : "Onderzoeksafbeelding kiezen"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploading.has("researchImage")}
                    onChange={(event) => {
                      uploadImage(event.target.files?.[0], "researchImage");
                      event.target.value = "";
                    }}
                  />
                </label>
                {project.settings.researchImage && (
                  <button
                    type="button"
                    className="admin-text-button"
                    onClick={() => updateSettings("researchImage", "", false)}
                  >
                    Afbeelding verwijderen
                  </button>
                )}
              </div>
            </div>
            <div className="rp-admin-content-list">
              <div className="rp-content-picker" aria-label="Kies een onderdeel">{[...project.researchSteps].sort((a,b) => a.sortOrder - b.sortOrder).map((entry, index) => <button type="button" key={entry.id} className={Math.min(contentSelection.steps, project.researchSteps.length - 1) === index ? "is-active" : ""} onClick={() => setContentSelection((current) => ({...current, steps: index}))}><span>{String(index + 1).padStart(2,"0")}</span>{entry.title?.[language] || entry.title?.nl || "Nieuw onderdeel"}</button>)}</div>
              {[...project.researchSteps].sort((a,b) => a.sortOrder - b.sortOrder).filter((_, index) => index === Math.min(contentSelection.steps, project.researchSteps.length - 1)).map((step) => <article key={step.id}>
                <div className="rp-admin-content-list__actions"><button type="button" aria-label="Stap omhoog" onClick={() => moveOrderedEntry("researchSteps", step.id, -1)}><ArrowUp aria-hidden="true" /></button><button type="button" aria-label="Stap omlaag" onClick={() => moveOrderedEntry("researchSteps", step.id, 1)}><ArrowDown aria-hidden="true" /></button><button type="button" aria-label="Stap tonen of verbergen" onClick={() => updateResearchStep(step.id, "visible", step.visible === false)}>{step.visible === false ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button><button type="button" aria-label="Stap verwijderen" onClick={() => removeOrderedEntry("researchSteps", step.id)}><Trash2 aria-hidden="true" /></button></div>
                <Field label={`Stap ${step.sortOrder}`}><input value={valueFor(step, "title", language)} onChange={(event) => updateResearchStep(step.id, "title", event.target.value, true)} /></Field><Field label="Beschrijving"><textarea rows="4" value={valueFor(step, "body", language)} onChange={(event) => updateResearchStep(step.id, "body", event.target.value, true)} /></Field>
              </article>)}
            </div>
          </section>

          <section hidden={processTab !== "2"} className="rp-admin-card">
            <div className="rp-admin-card__heading"><div><p>Oproep</p><h2>Submit a Painting</h2></div></div>
            <div className="rp-admin-form-grid rp-admin-form-grid--two">
              <Field label="Sectietitel"><input value={valueFor(project.settings, "submissionTitle", language)} onChange={(event) => updateSettings("submissionTitle", event.target.value)} /></Field>
              <Field label="Inleiding"><textarea rows="4" value={valueFor(project.settings, "submissionIntro", language)} onChange={(event) => updateSettings("submissionIntro", event.target.value)} /></Field>
              <Field label="Checklist (één punt per regel)"><textarea rows="7" value={(project.settings.submissionChecklist?.[language] || []).join("\n")} onChange={(event) => updateSettings("submissionChecklist", { ...(project.settings.submissionChecklist || {}), [language]: event.target.value.split("\n") }, false)} /></Field>
              <Field label="Melding bij upload"><textarea rows="4" value={valueFor(project.settings, "submissionNotice", language)} onChange={(event) => updateSettings("submissionNotice", event.target.value)} /></Field>
              <Field label="Titel vertrouwelijkheid"><input value={valueFor(project.settings, "confidentialityTitle", language)} onChange={(event) => updateSettings("confidentialityTitle", event.target.value)} /></Field>
              <Field label="Tekst vertrouwelijkheid"><textarea rows="4" value={valueFor(project.settings, "confidentialityText", language)} onChange={(event) => updateSettings("confidentialityText", event.target.value)} /></Field>
            </div>
          </section>
        </div>
      )}

      {panel === "updates" && updateInvestigationFilter !== "all" && <div className="rp-scoped-update-header"><button type="button" className="rp-back-link" onClick={() => { setSelectedInvestigationId(updateInvestigationFilter); setPanel("investigations"); setWorkspaceMode("edit"); }}><ArrowLeft />Terug naar het project</button><strong>{project.investigations.find((entry) => entry.id === updateInvestigationFilter)?.subtitle?.nl}</strong><span>Onderzoekstijdlijn</span></div>}
      {panel === "updates" && (
        <div
          className="rp-admin-updates-layout"
          id="rp-panel-updates"
          role="tabpanel"
          aria-labelledby="rp-tab-updates"
        >
          <aside className="rp-admin-update-list">
            <div className="rp-admin-list-tools">
              <div className="rp-admin-list-tools__top">
                <label>
                  <Search aria-hidden="true" />
                  <input
                    aria-label="Updates zoeken"
                    placeholder="Zoek update…"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={addUpdate}
                  aria-label="Nieuwe update voor het geselecteerde dossier"
                  title="Nieuwe update"
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
              <label className="rp-admin-list-tools__filter">
                <span>Updates van</span>
                <select
                  aria-label="Updates filteren per dossier"
                  value={updateInvestigationFilter}
                  onChange={(event) =>
                    changeUpdateInvestigationFilter(event.target.value)
                  }
                >
                  <option value="all">Alle dossiers ({project.updates.length})</option>
                  {[...project.investigations]
                    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                    .map((investigation) => (
                      <option key={investigation.id} value={investigation.id}>
                        {investigation.title?.nl || investigation.reference || investigation.id} ({project.updates.filter((update) => update.investigationId === investigation.id).length})
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div>
              {filteredUpdates.length > 0 ? (
                filteredUpdates.map((update) => (
                  <button
                    type="button"
                    key={update.id}
                    className={update.id === selectedId ? "is-active" : ""}
                    onClick={() => {
                      setSelectedId(update.id);
                      setDeleteConfirmId(null);
                    }}
                  >
                    <span>{String(update.sequence).padStart(2, "0")}</span>
                    <div>
                      <strong>{update.title?.nl || "Naamloze update"}</strong>
                      <small>
                        {project.investigations.find(
                          (investigation) => investigation.id === update.investigationId,
                        )?.reference || "Zonder dossier"}{" · "}
                        {project.phases.find(
                          (phase) => phase.id === update.phaseId,
                        )?.label?.nl || "Geen fase"}
                      </small>
                      <StatusPill status={update.status} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="rp-admin-update-list__empty">
                  <strong>Geen updates voor dit dossier</strong>
                  <span>Maak hier de eerste update aan.</span>
                  <button type="button" className="admin-button admin-button--secondary" onClick={addUpdate}>
                    <Plus aria-hidden="true" />Nieuwe update
                  </button>
                </div>
              )}
            </div>
          </aside>

          {selectedUpdate ? (
            <section className="rp-admin-editor">
              <header className="rp-admin-editor__header">
                <div>
                  <StatusPill status={selectedUpdate.status} />
                  <h2>{selectedUpdate.title?.nl || "Nieuwe update"}</h2>
                  <p className="rp-admin-editor__context">
                    {project.investigations.find(
                      (investigation) => investigation.id === selectedUpdate.investigationId,
                    )?.reference || "Zonder dossier"}
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    title="Omhoog"
                    aria-label="Update omhoog verplaatsen"
                    onClick={() => moveSelected(-1)}
                  >
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="Omlaag"
                    aria-label="Update omlaag verplaatsen"
                    onClick={() => moveSelected(1)}
                  >
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="Dupliceren"
                    aria-label="Update dupliceren"
                    onClick={duplicateSelected}
                  >
                    <Copy aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={
                      deleteConfirmId === selectedUpdate.id
                        ? "is-confirm-delete"
                        : ""
                    }
                    title="Verwijderen"
                    aria-label={
                      deleteConfirmId === selectedUpdate.id
                        ? "Verwijderen bevestigen"
                        : "Update verwijderen"
                    }
                    onClick={deleteSelected}
                  >
                    <Trash2 aria-hidden="true" />
                    <span>
                      {deleteConfirmId === selectedUpdate.id
                        ? "Nogmaals klikken"
                        : ""}
                    </span>
                  </button>
                </div>
              </header>


              <EditorNav label="Update bewerken" value={updateTab} onChange={setUpdateTab} items={[{id:"text",label:"Verhaal & bevindingen"},{id:"media",label:"Beelden"},{id:"settings",label:"Status & datum"}]} />
              <div hidden={updateTab !== "settings"} className="rp-admin-editor__publication">
                <div className="rp-admin-editor__publication-fields">
                  <Field label="Onderzoeksdossier">
                    <select value={selectedUpdate.investigationId || ""} onChange={(event) => updateSelected("investigationId", event.target.value)}>
                      {project.investigations.map((investigation) => <option key={investigation.id} value={investigation.id}>{investigation.reference} — {investigation.title?.nl}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      value={selectedUpdate.status}
                      onChange={(event) => {
                        const status = event.target.value;
                        updateSelected("status", status);
                        if (status === "published" && !selectedUpdate.publishedAt)
                          updateSelected("publishedAt", new Date().toISOString());
                      }}
                    >
                      <option value="draft">Concept</option>
                      <option value="published">Gepubliceerd</option>
                      <option value="archived">Gearchiveerd</option>
                    </select>
                  </Field>
                  <Field label="Onderzoeksfase">
                    <select
                      value={selectedUpdate.phaseId}
                      onChange={(event) =>
                        updateSelected("phaseId", event.target.value)
                      }
                    >
                      {project.phases.map((phase) => (
                        <option key={phase.id} value={phase.id}>
                          {phase.label.nl}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Bewijsstatus">
                    <select
                      value={selectedUpdate.evidenceType}
                      onChange={(event) =>
                        updateSelected("evidenceType", event.target.value)
                      }
                    >
                      {REMBRANDT_EVIDENCE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Datum van de stap">
                    <input
                      type="date"
                      value={selectedUpdate.eventDate || ""}
                      onChange={(event) =>
                        updateSelected("eventDate", event.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Publicatiemoment"
                    hint="Wordt automatisch ingevuld bij publiceren; toekomstige planning is bewust geblokkeerd."
                  >
                    <input
                      type="datetime-local"
                      max={toLocalDateTime(new Date())}
                      value={toLocalDateTime(selectedUpdate.publishedAt)}
                      onChange={(event) =>
                        updateSelected(
                          "publishedAt",
                          event.target.value
                            ? new Date(event.target.value).toISOString()
                            : "",
                        )
                      }
                    />
                  </Field>
                </div>
              </div>

              <div hidden={updateTab !== "text"} className="rp-admin-editor__content">
                <Field label="Titel">
                  <input
                    value={valueFor(selectedUpdate, "title", language)}
                    onChange={(event) => {
                      updateSelected("title", event.target.value, true);
                      if (
                        language === "nl" &&
                        (!selectedUpdate.slug ||
                          selectedUpdate.slug.startsWith("nieuwe-update-"))
                      )
                        updateSelected("slug", slugify(event.target.value));
                    }}
                  />
                </Field>
                <Field
                  label="URL-slug"
                  hint="Alleen kleine letters, cijfers en koppeltekens."
                >
                  <input
                    value={selectedUpdate.slug}
                    onChange={(event) =>
                      updateSelected("slug", slugify(event.target.value))
                    }
                  />
                </Field>
                <Field label="Korte samenvatting">
                  <textarea
                    rows="3"
                    value={valueFor(selectedUpdate, "summary", language)}
                    onChange={(event) =>
                      updateSelected("summary", event.target.value, true)
                    }
                  />
                </Field>
                <Field
                  label="Volledig verhaal"
                  hint="Gebruik een lege regel om alinea’s te scheiden. De website bewaakt automatisch de typografie."
                >
                  <textarea
                    rows="14"
                    value={valueFor(selectedUpdate, "body", language)}
                    onChange={(event) =>
                      updateSelected("body", event.target.value, true)
                    }
                  />
                </Field>
                <Field label="Kernbevindingen" hint="Eén bevinding per regel.">
                  <textarea
                    rows="6"
                    value={(selectedUpdate.keyFindings?.[language] || []).join(
                      "\n",
                    )}
                    onChange={(event) =>
                      updateSelected(
                        "keyFindings",
                        event.target.value.split("\n"),
                        true,
                      )
                    }
                  />
                </Field>
                <Field label="Volgende stap">
                  <textarea
                    rows="4"
                    value={valueFor(selectedUpdate, "nextStep", language)}
                    onChange={(event) =>
                      updateSelected("nextStep", event.target.value, true)
                    }
                  />
                </Field>
              </div>

              <div hidden={updateTab !== "media"} className="rp-admin-editor__media">
                <div className="rp-admin-card__heading">
                  <div>
                    <p>Beeld</p>
                    <h2>Hoofdafbeelding</h2>
                  </div>
                </div>
                <div className="rp-admin-media-row">
                  <div className="rp-admin-media-preview">
                    {selectedUpdate.coverImage ? (
                      <img
                        src={selectedUpdate.coverImage}
                        alt="Update preview"
                      />
                    ) : (
                      <ImageIcon aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <label className="admin-button admin-button--secondary">
                      <Upload aria-hidden="true" />
                      {uploading.has("coverImage")
                        ? "Uploaden…"
                        : "Afbeelding kiezen"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={uploading.has("coverImage")}
                        onChange={(event) => {
                          uploadImage(event.target.files?.[0], "coverImage");
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {selectedUpdate.coverImage && (
                      <button
                        type="button"
                        className="admin-text-button"
                        onClick={() => updateSelected("coverImage", "")}
                      >
                        Verwijderen
                      </button>
                    )}
                  </div>
                </div>
                <Field label="Alternatieve tekst">
                  <input
                    value={valueFor(selectedUpdate, "coverAlt", language)}
                    onChange={(event) =>
                      updateSelected("coverAlt", event.target.value, true)
                    }
                  />
                </Field>
                <Field label="Bijschrift">
                  <textarea
                    rows="2"
                    value={valueFor(selectedUpdate, "coverCaption", language)}
                    onChange={(event) =>
                      updateSelected("coverCaption", event.target.value, true)
                    }
                  />
                </Field>

                <div className="rp-admin-card__heading rp-admin-card__heading--gallery">
                  <div>
                    <p>Galerij</p>
                    <h2>Aanvullende beelden</h2>
                  </div>
                  <button
                    type="button"
                    className="admin-button admin-button--secondary"
                    onClick={addGalleryImage}
                  >
                    <Plus aria-hidden="true" />
                    Beeld toevoegen
                  </button>
                </div>
                <div className="rp-admin-gallery-editor">
                  {(selectedUpdate.gallery || []).map((image, index) => (
                    <div key={image.id} className="rp-admin-gallery-item">
                      <div className="rp-admin-media-preview">
                        {image.url ? (
                          <img src={image.url} alt="Galerij preview" />
                        ) : (
                          <ImageIcon aria-hidden="true" />
                        )}
                      </div>
                      <div className="rp-admin-gallery-item__fields">
                        <strong>Beeld {index + 1}</strong>
                        <label className="admin-button admin-button--secondary">
                          <Upload aria-hidden="true" />
                          {uploading.has(`gallery-${image.id}`)
                            ? "Uploaden…"
                            : "Afbeelding uploaden"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            disabled={uploading.has(`gallery-${image.id}`)}
                            onChange={(event) => {
                              uploadImage(
                                event.target.files?.[0],
                                "gallery",
                                image.id,
                              );
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <Field label="Alternatieve tekst">
                          <input
                            value={image.alt?.[language] || ""}
                            onChange={(event) =>
                              updateGallery(
                                image.id,
                                "alt",
                                event.target.value,
                                true,
                              )
                            }
                          />
                        </Field>
                        <Field label="Bijschrift">
                          <textarea
                            rows="2"
                            value={image.caption?.[language] || ""}
                            onChange={(event) =>
                              updateGallery(
                                image.id,
                                "caption",
                                event.target.value,
                                true,
                              )
                            }
                          />
                        </Field>
                        <button
                          type="button"
                          className="admin-text-button admin-text-button--danger"
                          onClick={() =>
                            updateSelected(
                              "gallery",
                              selectedUpdate.gallery.filter(
                                (entry) => entry.id !== image.id,
                              ),
                            )
                          }
                        >
                          <Trash2 aria-hidden="true" />
                          Beeld verwijderen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="rp-admin-empty">
              <FileText aria-hidden="true" />
              <h2>Nog geen updates</h2>
              <p>Maak de eerste onderzoeksupdate aan.</p>
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={addUpdate}
              >
                <Plus aria-hidden="true" />
                Nieuwe update
              </button>
            </section>
          )}
        </div>
      )}

      {panel === "publish" && (
        <div
          className="rp-admin-publish-grid"
          id="rp-panel-publish"
          role="tabpanel"
          aria-labelledby="rp-tab-publish"
        >
          <section hidden={publishTab !== "0"} className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>SEO</p>
                <h2>Zoekmachines & delen</h2>
              </div>
            </div>
            <div className="rp-admin-form-grid">
              <Field label="SEO-titel">
                <input
                  value={valueFor(project.settings, "seoTitle", language)}
                  onChange={(event) =>
                    updateSettings("seoTitle", event.target.value)
                  }
                />
              </Field>
              <Field label="Meta description">
                <textarea
                  rows="4"
                  value={valueFor(project.settings, "seoDescription", language)}
                  onChange={(event) =>
                    updateSettings("seoDescription", event.target.value)
                  }
                />
              </Field>
            </div>
            <div className="rp-admin-media-row">
              <div className="rp-admin-media-preview">
                {project.settings.socialImage ? (
                  <img
                    src={project.settings.socialImage}
                    alt="Social preview"
                  />
                ) : (
                  <ImageIcon aria-hidden="true" />
                )}
              </div>
              <div>
                <p>
                  Optionele deelafbeelding voor zoekmachines en sociale kanalen.
                  Zonder deze afbeelding wordt de hero gebruikt.
                </p>
                <label className="admin-button admin-button--secondary">
                  <Upload aria-hidden="true" />
                  {uploading.has("socialImage")
                    ? "Uploaden…"
                    : "Deelafbeelding kiezen"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploading.has("socialImage")}
                    onChange={(event) => {
                      uploadImage(event.target.files?.[0], "socialImage");
                      event.target.value = "";
                    }}
                  />
                </label>
                {project.settings.socialImage && (
                  <button
                    type="button"
                    className="admin-text-button"
                    onClick={() => updateSettings("socialImage", "", false)}
                  >
                    Afbeelding verwijderen
                  </button>
                )}
              </div>
            </div>
          </section>
          <section hidden={publishTab !== "1"} className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>Controle</p>
                <h2>Publicatiestatus</h2>
              </div>
            </div>
            <div className={`rp-admin-access ${project.isEnabled ? "is-public" : "is-private"}`}>
              <div className="rp-admin-access__main">
                <div className="rp-admin-access__icon">
                  {project.isEnabled ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                </div>
                <div>
                  <span className="rp-admin-access__eyebrow">Publieke toegang</span>
                  <strong>{project.isEnabled ? "Openbaar" : "Niet openbaar"}</strong>
                  <p>
                    {project.isEnabled
                      ? "Het project verschijnt in de navigatie en is toegankelijk voor alle bezoekers."
                      : "Het project blijft volledig beheerbaar, maar is niet toegankelijk voor gewone bezoekers."}
                  </p>
                </div>
                <div className="rp-admin-access__actions">
                  <span className={`rp-admin-live-state ${project.isEnabled ? "is-live" : "is-offline"}`}>
                    <span aria-hidden="true" />
                    {project.isEnabled ? "Live" : "Offline"}
                  </span>
                  {project.isEnabled ? (
                    <button
                      type="button"
                      className="admin-button admin-button--secondary"
                      disabled={accessSaving || saving}
                      onClick={() => setConfirmPublicDisable(true)}
                    >
                      <EyeOff aria-hidden="true" />
                      Offline halen
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-button admin-button--primary"
                      disabled={saving || accessSaving || uploading.size > 0 || publicationIssues.length > 0}
                      onClick={() => save({ publish: true })}
                    >
                      {saving ? <Loader2 className="is-spinning" aria-hidden="true" /> : <Globe2 aria-hidden="true" />}
                      {dirty ? "Opslaan & live zetten" : "Nu live zetten"}
                    </button>
                  )}
                </div>
              </div>
              {confirmPublicDisable && project.isEnabled && (
                <div className="rp-admin-inline-confirm" role="alert">
                  <p>De projectpagina en navigatielink verdwijnen meteen voor bezoekers. Uw inhoud blijft bewaard.</p>
                  <div>
                    <button type="button" className="admin-button admin-button--secondary" onClick={() => setConfirmPublicDisable(false)}>Annuleren</button>
                    <button type="button" className="admin-button admin-button--danger" onClick={() => { setConfirmPublicDisable(false); changePublicAccess(false); }}>Project offline halen</button>
                  </div>
                </div>
              )}
            </div>

            <div className="rp-admin-preview-link">
              <div className="rp-admin-preview-link__heading">
                <div className="rp-admin-access__icon"><ShieldCheck aria-hidden="true" /></div>
                <div>
                  <span className="rp-admin-access__eyebrow">Privévoorbeeld delen</span>
                  <strong>{previewLink ? "Privélink actief" : "Geen actieve privélink"}</strong>
                  <p>De link toont alleen opgeslagen, gepubliceerde updates en verschijnt nergens op de openbare website.</p>
                </div>
              </div>
              {previewLink ? (
                <div className="rp-admin-preview-link__active">
                  <dl>
                    <div><dt>Geldig tot</dt><dd>{new Intl.DateTimeFormat("nl-BE", { dateStyle: "long", timeStyle: "short" }).format(new Date(previewLink.expiresAt))}</dd></div>
                  </dl>
                  {previewUrl ? (
                    <div className="rp-admin-preview-link__copy">
                      <input readOnly aria-label="Privélink" value={previewUrl} onFocus={(event) => event.target.select()} />
                      <button type="button" className="admin-button admin-button--secondary" onClick={copyPreviewLink}><Copy aria-hidden="true" /> Link kopiëren</button>
                    </div>
                  ) : (
                    <p className="rp-admin-preview-link__notice">Om veiligheidsredenen wordt de bestaande link niet opnieuw getoond. Maak een nieuwe link als u hem opnieuw wilt delen.</p>
                  )}
                  {confirmRevoke ? (
                    <div className="rp-admin-inline-confirm" role="alert">
                      <p>Nieuwe bezoeken worden meteen geblokkeerd. Een reeds geopende preview sluit uiterlijk binnen 20 seconden.</p>
                      <div>
                        <button type="button" className="admin-button admin-button--secondary" onClick={() => setConfirmRevoke(false)}>Behouden</button>
                        <button type="button" className="admin-button admin-button--danger" disabled={previewBusy} onClick={revokePreviewLink}>Link intrekken</button>
                      </div>
                    </div>
                  ) : (
                    <div className="rp-admin-preview-link__actions">
                      <button type="button" className="admin-text-button" onClick={() => setConfirmRevoke(true)}>Actieve link intrekken</button>
                      {!savedPublicEnabled && <button type="button" className="admin-text-button" disabled={previewBusy} onClick={createPreviewLink}>Nieuwe link maken</button>}
                    </div>
                  )}
                </div>
              ) : savedPublicEnabled ? (
                <p className="rp-admin-preview-link__notice">Maak het project eerst niet openbaar voordat u een privélink aanmaakt.</p>
              ) : (
                <div className="rp-admin-preview-link__create">
                  <label>
                    <span>Geldigheid</span>
                    <select value={previewDays} onChange={(event) => setPreviewDays(Number(event.target.value))}>
                      <option value="7">7 dagen</option>
                      <option value="14">14 dagen</option>
                      <option value="30">30 dagen</option>
                      <option value="60">60 dagen</option>
                    </select>
                  </label>
                  <button type="button" className="admin-button admin-button--secondary" disabled={previewBusy} onClick={createPreviewLink}>
                    {previewBusy ? <Loader2 className="is-spinning" aria-hidden="true" /> : <Link2 aria-hidden="true" />}
                    Privélink aanmaken
                  </button>
                </div>
              )}
            </div>
            <dl className="rp-admin-summary">
              <div>
                <dt>Pagina</dt>
                <dd>
                  {savedVersion
                    ? savedPublicEnabled
                      ? "Zichtbaar"
                      : "Verborgen"
                    : project.isEnabled
                      ? "Zichtbaar na publicatie"
                      : "Blijft verborgen na publicatie"}
                </dd>
              </div>
              <div>
                <dt>{savedVersion ? "Gepubliceerd" : "Na publicatie"}</dt>
                <dd>
                  {
                    project.updates.filter(
                      (entry) => entry.status === "published",
                    ).length
                  }{" "}
                  {project.updates.filter((entry) => entry.status === "published").length === 1
                    ? "update"
                    : "updates"}
                </dd>
              </div>
              <div>
                <dt>Concepten</dt>
                <dd>
                  {
                    project.updates.filter((entry) => entry.status === "draft")
                      .length
                  }{" "}
                  updates
                </dd>
              </div>
              <div>
                <dt>Afbeeldingen</dt>
                <dd>{uniqueR2ImageCount} unieke afbeeldingen online</dd>
              </div>
            </dl>
            <div className="rp-admin-publish-note">
              <Eye aria-hidden="true" />
              <p>
                {savedPublicEnabled
                  ? "Bezoekers zien uitsluitend de laatst gepubliceerde websiteversie. Wijzigingen blijven een concept totdat u ze hier publiceert."
                  : "Het project staat offline. Met ‘Opslaan & live zetten’ bewaart u de wijzigingen en publiceert u de website in één gecontroleerde stap."}
              </p>
            </div>
            <div
              className={`rp-admin-readiness ${publicationIssues.length ? "has-issues" : "is-ready"}`}
            >
              <strong>
                {publicationIssues.length
                  ? `${publicationIssues.length} aandachtspunt${publicationIssues.length === 1 ? "" : "en"}`
                  : "Klaar voor publicatie"}
              </strong>
              {publicationIssues.length > 0 && (
                <ul>
                  {publicationIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="admin-button admin-button--primary rp-admin-publish-button"
              onClick={() => save({ publish: !savedPublicEnabled })}
              disabled={saving || accessSaving || uploading.size > 0 || publicationIssues.length > 0}
            >
              {saving ? (
                <Loader2 className="is-spinning" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              {saving
                ? "Veilig opslaan…"
                : savedPublicEnabled
                  ? "Wijzigingen publiceren"
                  : "Opslaan & live zetten"}
            </button>
          </section>
          {revisions.length === 0 && publishTab === "2" && <section className="rp-admin-card"><h2>Nog geen vorige versies</h2><p>Na het opslaan verschijnen eerdere versies van de inhoud hier.</p></section>}
          {revisions.length > 0 && (
            <section hidden={publishTab !== "2"} className="rp-admin-card">
              <div className="rp-admin-card__heading">
                <div>
                  <p>Historiek</p>
                  <h2>Vorige versies</h2>
                </div>
              </div>
              <div className="rp-admin-revisions">
                {revisions.map((revision) => (
                  <div key={revision.id}>
                    <div>
                      <strong>
                        {new Intl.DateTimeFormat("nl-BE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(revision.created_at))}
                      </strong>
                      <span>
                        Veilige inhoudsrevisie, zonder afbeeldingsbestanden
                      </span>
                    </div>
                    <button
                      type="button"
                      className="admin-button admin-button--secondary"
                      onClick={() => restoreRevision(revision.id)}
                    >
                      <span className="sr-only">
                        Versie van {new Intl.DateTimeFormat("nl-BE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(revision.created_at))}:{" "}
                      </span>
                      {deleteConfirmId === `revision-${revision.id}`
                        ? "Bevestig herstellen"
                        : "Klaarzetten"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section hidden={publishTab !== "3"} className="rp-admin-card rp-admin-card--reset">
            <div>
              <RotateCcw aria-hidden="true" />
              <h2>Startinhoud herstellen</h2>
              <p>
                Zet alle teksten en updates terug naar de zorgvuldig voorbereide
                basisversie. Geüploade afbeeldingen blijven veilig bewaard.
              </p>
            </div>
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={async () => {
                if (deleteConfirmId === "reset") {
                  try {
                    const template = await fetchRembrandtProjectTemplateAsync();
                    const reset = { ...template, isEnabled: savedPublicEnabled };
                    setProject(reset);
                    setSelectedId(reset.updates[0]?.id || null);
                    setSelectedInvestigationId(reset.investigations?.[0]?.id || null);
                    setDeleteConfirmId(null);
                  } catch (error) {
                    onShowToast(error.message, "error");
                  }
                } else setDeleteConfirmId("reset");
              }}
            >
              {deleteConfirmId === "reset"
                ? "Nogmaals klikken om te herstellen"
                : "Basisversie klaarzetten"}
            </button>
          </section>
        </div>
      )}
      </div>
    </div>
  );
}
