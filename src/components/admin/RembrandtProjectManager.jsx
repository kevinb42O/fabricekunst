import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  cloneDefaultRembrandtProject,
  REMBRANDT_EVIDENCE_TYPES,
  REMBRANDT_PROJECT_STATUSES,
} from "../../data/defaultRembrandtProject";
import {
  createProjectUpdate,
  normalizeRembrandtProject,
} from "../../utils/rembrandtProject";
import {
  fetchRembrandtProjectAdminAsync,
  fetchRembrandtProjectRevisionAsync,
  saveRembrandtProjectDataAsync,
  uploadCatalogImage,
} from "../../utils/storage";
import "../../styles/rembrandt-project-admin.css";

const LANGUAGES = [
  { id: "nl", label: "Nederlands" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
];
const PANELS = [
  { id: "page", label: "Pagina" },
  { id: "updates", label: "Updates" },
  { id: "publish", label: "Publicatie" },
];

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
  return (
    <label className="rp-admin-field">
      <span>{label}</span>
      {hint && <small>{hint}</small>}
      {children}
    </label>
  );
}

function LanguageTabs({ language, onChange }) {
  const handleKeys = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = LANGUAGES.findIndex((entry) => entry.id === language);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? LANGUAGES.length - 1
          : (current +
              (event.key === "ArrowRight" ? 1 : -1) +
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

export default function RembrandtProjectManager({
  onPublished = () => {},
  onShowToast = () => {},
}) {
  const [project, setProject] = useState(() => cloneDefaultRembrandtProject());
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [panel, setPanel] = useState("updates");
  const [language, setLanguage] = useState("nl");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savedVersion, setSavedVersion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [revisions, setRevisions] = useState([]);

  const loadProject = () => {
    let active = true;
    setLoading(true);
    setLoadError("");
    fetchRembrandtProjectAdminAsync()
      .then(({ project: loaded, version, revisions: loadedRevisions }) => {
        if (!active) return;
        const normalized = normalizeRembrandtProject(loaded);
        setProject(normalized);
        setSavedVersion(version ?? null);
        setSavedSnapshot(JSON.stringify(normalized));
        setSelectedId(normalized.updates?.[0]?.id || null);
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
    return cancel;
  }, []);

  const dirty = useMemo(
    () => savedSnapshot && JSON.stringify(project) !== savedSnapshot,
    [project, savedSnapshot],
  );
  const selectedUpdate =
    project.updates.find((update) => update.id === selectedId) || null;
  const filteredUpdates = project.updates
    .filter((update) => {
      const query = searchQuery.trim().toLowerCase();
      return (
        !query ||
        Object.values(update.title || {}).some((title) =>
          String(title).toLowerCase().includes(query),
        )
      );
    })
    .sort((a, b) => Number(a.sequence) - Number(b.sequence));
  const publicationIssues = useMemo(() => {
    const issues = [];
    if (project.isEnabled && !project.settings.title?.nl?.trim())
      issues.push("De zichtbare pagina heeft een Nederlandse titel nodig.");
    if (project.isEnabled && !project.settings.disclaimer?.nl?.trim())
      issues.push("Het permanente voorbehoud mag niet leeg zijn.");
    if (
      !project.phases.some(
        (phase) =>
          phase.id === project.settings.currentPhaseId &&
          phase.visible !== false,
      )
    )
      issues.push("De huidige onderzoeksfase moet zichtbaar zijn.");
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
    if (project.settings.heroImage && !project.settings.heroAlt?.nl?.trim())
      issues.push("De hero-afbeelding mist Nederlandse alternatieve tekst.");
    return [...new Set(issues)];
  }, [project]);
  const uniqueR2ImageCount = useMemo(
    () =>
      new Set(
        [
          project.settings.heroImage,
          project.settings.socialImage,
          ...project.updates.flatMap((entry) => [
            entry.coverImage,
            ...(entry.gallery || []).map((image) => image.url),
          ]),
        ].filter(Boolean),
      ).size,
    [project],
  );
  const changePanelByKeyboard = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = PANELS.findIndex((entry) => entry.id === panel);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? PANELS.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + PANELS.length) %
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

  const save = async () => {
    if (saving || uploading.size || loadError) return;
    if (publicationIssues.length) {
      onShowToast(publicationIssues[0], "error");
      return;
    }
    setSaving(true);
    try {
      const result = await saveRembrandtProjectDataAsync(project, savedVersion);
      setProject(result.project);
      setSavedVersion(result.version);
      setSavedSnapshot(JSON.stringify(result.project));
      onPublished(result.project);
      onShowToast(
        "The Rembrandt Project is veilig opgeslagen en op de website gepubliceerd.",
      );
    } catch (error) {
      onShowToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const addUpdate = () => {
    const update = createProjectUpdate(project);
    setProject((current) => ({
      ...current,
      updates: [...current.updates, update],
    }));
    setSelectedId(update.id);
    setPanel("updates");
    setLanguage("nl");
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
      setProject(revision.content);
      setSelectedId(revision.content.updates?.[0]?.id || null);
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
        purpose: ["heroImage", "socialImage"].includes(target)
          ? "rembrandt-project-hero"
          : "rembrandt-project-update",
      });
      if (target === "heroImage") updateSettings("heroImage", url, false);
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
    <div className="rp-admin">
      <header className="rp-admin-header">
        <div>
          <p>
            <Search aria-hidden="true" />
            Onderzoeksjournaal
          </p>
          <h1>The Rembrandt Project</h1>
          <span>
            Beheer de pagina, onderzoeksfases en wekelijkse updates vanuit één
            werkruimte.
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
            {saving ? "Publiceren…" : "Opslaan & publiceren"}
          </button>
        </div>
      </header>

      <div
        className="rp-admin-tabs"
        role="tablist"
        aria-label="Projectonderdelen"
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
            onClick={() => setPanel(entry.id)}
          >
            {entry.label}
            {entry.id === "updates" && <span>{project.updates.length}</span>}
          </button>
        ))}
      </div>
      <LanguageTabs language={language} onChange={setLanguage} />

      {panel === "page" && (
        <div
          className="rp-admin-page-grid"
          id="rp-panel-page"
          role="tabpanel"
          aria-labelledby="rp-tab-page"
        >
          <section className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>01</p>
                <h2>Introductie & status</h2>
              </div>
              <label className="rp-admin-switch">
                <input
                  type="checkbox"
                  checked={project.isEnabled !== false}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      isEnabled: event.target.checked,
                    }))
                  }
                />
                <span>
                  {project.isEnabled !== false
                    ? "Pagina zichtbaar"
                    : "Pagina verborgen"}
                </span>
              </label>
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

          <section className="rp-admin-card">
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

          <section className="rp-admin-card">
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

          <section className="rp-admin-card">
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

          <section className="rp-admin-card">
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

      {panel === "updates" && (
        <div
          className="rp-admin-updates-layout"
          id="rp-panel-updates"
          role="tabpanel"
          aria-labelledby="rp-tab-updates"
        >
          <aside className="rp-admin-update-list">
            <div className="rp-admin-list-tools">
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
                aria-label="Nieuwe update"
              >
                <Plus aria-hidden="true" />
              </button>
            </div>
            <div>
              {filteredUpdates.map((update) => (
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
                      {project.phases.find(
                        (phase) => phase.id === update.phaseId,
                      )?.label?.nl || "Geen fase"}
                    </small>
                    <StatusPill status={update.status} />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {selectedUpdate ? (
            <section className="rp-admin-editor">
              <header className="rp-admin-editor__header">
                <div>
                  <StatusPill status={selectedUpdate.status} />
                  <h2>{selectedUpdate.title?.nl || "Nieuwe update"}</h2>
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

              <div className="rp-admin-editor__publication">
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

              <div className="rp-admin-editor__content">
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

              <div className="rp-admin-editor__media">
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
          <section className="rp-admin-card">
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
          <section className="rp-admin-card">
            <div className="rp-admin-card__heading">
              <div>
                <p>Controle</p>
                <h2>Publicatiestatus</h2>
              </div>
            </div>
            <dl className="rp-admin-summary">
              <div>
                <dt>Pagina</dt>
                <dd>
                  {savedVersion
                    ? project.isEnabled
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
                  updates
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
                Bezoekers zien uitsluitend de laatst gepubliceerde websiteversie.
                Wijzigingen blijven een concept totdat u ze hier publiceert.
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
              onClick={save}
              disabled={saving || uploading.size > 0}
            >
              {saving ? (
                <Loader2 className="is-spinning" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              {saving ? "Veilig publiceren…" : "Opslaan & websiteversie publiceren"}
            </button>
          </section>
          {revisions.length > 0 && (
            <section className="rp-admin-card">
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
                      {deleteConfirmId === `revision-${revision.id}`
                        ? "Bevestig herstellen"
                        : "Klaarzetten"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="rp-admin-card rp-admin-card--reset">
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
              onClick={() => {
                if (deleteConfirmId === "reset") {
                  const reset = cloneDefaultRembrandtProject();
                  setProject(reset);
                  setSelectedId(reset.updates[0]?.id || null);
                  setDeleteConfirmId(null);
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
  );
}
