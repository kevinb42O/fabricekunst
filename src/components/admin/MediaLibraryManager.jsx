import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  archiveUniversalMediaAsync,
  deleteUniversalMediaAsync,
  fetchMediaLibraryAsync,
  restoreUniversalMediaAsync,
  updateUniversalMediaMetadataAsync,
  uploadUniversalMediaAsync,
} from "../../utils/storage";
import {
  catalogContextsFor,
  collectionGroupsFor,
  collectionWorksFor,
  findMediaAssets,
  groupMediaByCollection,
  mediaTitle,
  preferredMediaVariantUrl,
} from "../../utils/mediaSearch";
import "../../styles/media-library.css";

const languages = [
  ["nl", "Nederlands"],
  ["en", "English"],
  ["fr", "Français"],
];
const blankText = () => ({ nl: "", en: "", fr: "" });
const defaultMetadata = (filename) => ({
  title: { nl: filename, en: filename, fr: filename },
  caption: blankText(),
  alt: blankText(),
  credit: blankText(),
  objectLabel: blankText(),
  rights: "",
  source: "",
  category: "unconfirmed",
  approved: false,
  tags: [],
});
const largestUrl = preferredMediaVariantUrl;
const titleFor = (asset) => mediaTitle(asset);
const statusLabel = (status) => {
  if (status === "ready") return "Klaar voor gebruik";
  if (status === "archived") return "Gearchiveerd";
  return "Voorbereiding nodig";
};
const isHistoricalUsage = (usage) =>
  usage?.consumer_type === "provenance" &&
  usage?.consumer_id?.startsWith("revision:");
const usageLabel = (usage, asset) => {
  if (
    usage.consumer_type === "provenance" &&
    usage.consumer_id === "main:draft"
  )
    return "Herkomst · opgeslagen concept";
  if (usage.consumer_type === "provenance" && usage.consumer_id === "main:live")
    return "Herkomst · live pagina";
  if (
    usage.consumer_type === "provenance" &&
    usage.consumer_id?.startsWith("revision:")
  )
    return "Herkomst · bewaarde revisie";
  if (usage.consumer_type === "rembrandt-project")
    return "Lost Rembrandt Project";
  if (usage.consumer_type === "catalog") {
    const context = catalogContextsFor(asset).find(
      (entry) => entry.item_id === String(usage.consumer_id),
    );
    return context?.title ? `Collectie · ${context.title}` : "Collectie";
  }
  if (usage.consumer_type === "site") return "Website";
  return "Een redactionele pagina";
};
const placementLabel = (usage) => {
  const placement = usage.placement || "";
  if (placement === "hero") return "Hero-afbeelding";
  if (placement === "seo-share") return "SEO / deelafbeelding";
  if (placement === "homepage-teaser") return "Homepage-teaser";
  if (placement === "contact-cta") return "Contact & CTA";
  if (placement.startsWith("method:"))
    return `Onderzoeksmethode · beeld ${placement.split(":").at(-1)}`;
  if (placement.startsWith("example:"))
    return `Praktijkvoorbeeld · beeld ${placement.split(":").at(-1)}`;
  if (placement.startsWith("gallery:"))
    return `Galerij · positie ${placement.split(":").at(-1)}`;
  if (placement.startsWith("comparison:"))
    return `Voor/na-vergelijking · ${placement.endsWith(":left") ? "linkerbeeld" : "rechterbeeld"}`;
  if (placement === "project-reference") return "Projectplaatsing";
  if (placement === "url-reference") return "Gekoppelde afbeelding";
  return placement || "Gekoppelde plaatsing";
};
const collectionGroupLabel = (group) =>
  ({
    books: "Boeken",
    art: "Kunst",
    "historical-objects": "Historische objecten",
  })[group] || group;

function MediaListItem({ asset, active, onSelect, context: contextOverride }) {
  const context = contextOverride || catalogContextsFor(asset)[0];
  return (
    <button
      type="button"
      className={active ? "is-active" : ""}
      onClick={() => onSelect(asset.id)}
    >
      {largestUrl(asset) ? <img src={largestUrl(asset)} alt="" /> : <ImageIcon />}
      <span>
        <strong>{titleFor(asset)}</strong>
        <small>
          {context?.title
            ? `Collectie · ${context.title}`
            : `${statusLabel(asset.status)} · ${asset.media_asset_usages?.length || 0} toepassing${asset.media_asset_usages?.length === 1 ? "" : "en"}`}
        </small>
      </span>
    </button>
  );
}

export default function MediaLibraryManager({ onShowToast }) {
  const [media, setMedia] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [scope, setScope] = useState("all");
  const [collectionGroup, setCollectionGroup] = useState("");
  const [workId, setWorkId] = useState("");
  const [sort, setSort] = useState("relevance");
  const [view, setView] = useState("flat");
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const applyMedia = (next) => {
    setMedia(next);
    setSelectedId((id) =>
      id && next.some((asset) => asset.id === id) ? id : next[0]?.id || null,
    );
    return next;
  };
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const next = applyMedia(
        await fetchMediaLibraryAsync({ includeArchived: true }),
      );
      setHasLoaded(true);
      return next;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const results = useMemo(
    () =>
      findMediaAssets(media, {
        query,
        status: filter,
        scope,
        collectionGroup,
        workId,
        sort,
      }),
    [media, query, filter, scope, collectionGroup, workId, sort],
  );
  const collectionGroups = useMemo(() => collectionGroupsFor(media), [media]);
  const collectionWorks = useMemo(
    () => collectionWorksFor(media, collectionGroup),
    [media, collectionGroup],
  );
  const groupedResults = useMemo(
    () => groupMediaByCollection(results),
    [results],
  );
  const selected = media.find((asset) => asset.id === selectedId) || null;
  const readyCount = media.filter((asset) => asset.status === "ready").length;
  const archivedCount = media.filter(
    (asset) => asset.status === "archived",
  ).length;
  const draftCount = media.length - readyCount - archivedCount;
  const hasActiveFilters = Boolean(
    query ||
      filter !== "all" ||
      scope !== "all" ||
      collectionGroup ||
      workId ||
      sort !== "relevance" ||
      view !== "flat",
  );
  const clearFilters = () => {
    setQuery("");
    setFilter("all");
    setScope("all");
    setCollectionGroup("");
    setWorkId("");
    setSort("relevance");
    setView("flat");
  };
  const saveMetadata = async (next) => {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await updateUniversalMediaMetadataAsync(
        selected.id,
        next,
      );
      setMedia((current) =>
        current.map((asset) => (asset.id === updated.id ? updated : asset)),
      );
      onShowToast?.("Beeldgegevens opgeslagen.", "info");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const name = file.name.replace(/\.[^/.]+$/, "");
      const uploaded = await uploadUniversalMediaAsync(file, {
        metadata: defaultMetadata(name),
      });
      setMedia((current) => [
        uploaded,
        ...current.filter((asset) => asset.id !== uploaded.id),
      ]);
      setSelectedId(uploaded.id);
      onShowToast?.(
        "Beeld veilig geüpload naar de centrale beeldbank.",
        "info",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const archive = async () => {
    if (
      !selected ||
      !window.confirm(
        `“${selected.filename}” archiveren? Dit kan alleen als het beeld nergens meer wordt gebruikt.`,
      )
    )
      return;
    setBusy(true);
    try {
      const archived = await archiveUniversalMediaAsync(selected.id);
      setMedia((current) =>
        current.map((asset) =>
          asset.id === archived.id ? { ...asset, ...archived } : asset,
        ),
      );
      onShowToast?.("Beeld gearchiveerd.", "info");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const requestPermanentDelete = () => {
    setDeleteError("");
    setError("");
    setDeleteTarget(selected);
  };
  const restore = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const restored = await restoreUniversalMediaAsync(selected.id);
      setMedia((current) =>
        current.map((asset) =>
          asset.id === restored.id ? { ...asset, ...restored } : asset,
        ),
      );
      onShowToast?.(
        "Gearchiveerd beeld is opnieuw zichtbaar in de beeldbank.",
        "info",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const deletePermanently = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setDeleteError("");
    try {
      await deleteUniversalMediaAsync(deleteTarget.id);
      setMedia((current) =>
        current.filter((asset) => asset.id !== deleteTarget.id),
      );
      setSelectedId(null);
      setDeleteTarget(null);
      onShowToast?.(
        "Beeld, publieke varianten en privé-origineel zijn definitief verwijderd.",
        "info",
      );
    } catch (err) {
      setDeleteError(err.message);
      try {
        const next = await fetchMediaLibraryAsync({ includeArchived: true });
        const refreshed = applyMedia(next);
        setDeleteTarget(
          refreshed.find((asset) => asset.id === deleteTarget.id) ||
            deleteTarget,
        );
      } catch (refreshError) {
        setError(refreshError.message);
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="media-library">
      <header className="media-library__header">
        <div>
          <p>MEDIA / CENTRAAL BEHEER</p>
          <h1>Beeldbank</h1>
          <span>
            Bereid beelden één keer voor en gebruik ze veilig op elke
            redactionele pagina.
          </span>
        </div>
        <div>
          <button
            type="button"
            className="admin-button admin-button--secondary"
            disabled={loading || busy}
            onClick={load}
          >
            <RefreshCw />
            Vernieuwen
          </button>
          <label className="admin-button admin-button--primary">
            <Upload />
            {busy ? "Bezig…" : "Nieuw beeld"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={busy}
              onChange={upload}
            />
          </label>
        </div>
      </header>
      <div className="media-library__summary">
        <span>
          <ImageIcon />
          {hasLoaded ? `${media.length} beelden` : "Beelden laden…"}
        </span>
        <span>
          <ShieldCheck />
          {hasLoaded
            ? `${readyCount} direct inzetbaar`
            : "Beschikbaarheid controleren…"}
        </span>
        <span>
          <CheckCircle2 />
          Alle originelen blijven privé
        </span>
      </div>
      {error && (
        <p className="media-library__error" role="alert">
          {error}{" "}
          <button type="button" onClick={load} disabled={loading}>
            Opnieuw proberen
          </button>
        </p>
      )}
      <div className="media-library__layout">
        <aside>
          <label className="media-library__search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek in beeldbank"
              disabled={!hasLoaded}
            />
          </label>
          <div className="media-library__filter-stack">
            <label className="media-library__field">
              <span>Toepassing</span>
              <select
                value={scope}
                disabled={!hasLoaded}
                onChange={(event) => setScope(event.target.value)}
              >
                <option value="all">Alle beelden</option>
                <option value="collection">Alleen collectie</option>
                <option value="provenance">Herkomst</option>
                <option value="rembrandt-project">Lost Rembrandt</option>
                <option value="site">Website</option>
                <option value="unused">Nog nergens gebruikt</option>
              </select>
            </label>
            <label className="media-library__field">
              <span>Collectie</span>
              <select
                value={collectionGroup}
                disabled={!hasLoaded || !collectionGroups.length}
                onChange={(event) => {
                  setCollectionGroup(event.target.value);
                  setWorkId("");
                }}
              >
                <option value="">Alle collecties</option>
                {collectionGroups.map((group) => (
                  <option key={group} value={group}>
                    {collectionGroupLabel(group)}
                  </option>
                ))}
              </select>
            </label>
            <label className="media-library__field">
              <span>Werk</span>
              <select
                value={workId}
                disabled={!hasLoaded || !collectionWorks.length}
                onChange={(event) => setWorkId(event.target.value)}
              >
                <option value="">Alle werken</option>
                {collectionWorks.map((work) => (
                  <option key={work.item_id} value={work.item_id}>
                    {work.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="media-library__field">
              <span>Sortering</span>
              <select
                value={sort}
                disabled={!hasLoaded}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="relevance">{query ? "Beste overeenkomst" : "Recent bijgewerkt"}</option>
                <option value="recent">Recent bijgewerkt</option>
                <option value="oldest">Oudst toegevoegd</option>
                <option value="title">Titel A–Z</option>
                <option value="collection">Collectie en werk</option>
                <option value="usage">Meest gebruikt</option>
              </select>
            </label>
          </div>
          <div
            className="media-library__filters"
            role="group"
            aria-label="Beelden filteren"
          >
            <button
              type="button"
              className={filter === "all" ? "is-active" : ""}
              onClick={() => setFilter("all")}
              disabled={!hasLoaded}
            >
              Alle <b>{hasLoaded ? media.length : "—"}</b>
            </button>
            <button
              type="button"
              className={filter === "ready" ? "is-active" : ""}
              onClick={() => setFilter("ready")}
              disabled={!hasLoaded}
            >
              Klaar <b>{hasLoaded ? readyCount : "—"}</b>
            </button>
            <button
              type="button"
              className={filter === "draft" ? "is-active" : ""}
              onClick={() => setFilter("draft")}
              disabled={!hasLoaded}
            >
              Te voltooien <b>{hasLoaded ? draftCount : "—"}</b>
            </button>
            <button
              type="button"
              className={filter === "archived" ? "is-active" : ""}
              onClick={() => setFilter("archived")}
              disabled={!hasLoaded}
            >
              Archief <b>{hasLoaded ? archivedCount : "—"}</b>
            </button>
          </div>
          <div className="media-library__view-controls">
            <span>Weergave</span>
            <div role="group" aria-label="Resultaten groeperen">
              <button
                type="button"
                className={view === "flat" ? "is-active" : ""}
                onClick={() => setView("flat")}
                disabled={!hasLoaded}
              >
                Lijst
              </button>
              <button
                type="button"
                className={view === "collection" ? "is-active" : ""}
                onClick={() => setView("collection")}
                disabled={!hasLoaded}
              >
                Per werk
              </button>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="media-library__clear-filters"
              onClick={clearFilters}
            >
              Wis zoekopdracht en filters
            </button>
          )}
          <p>
            {loading
              ? "Beeldbank laden…"
              : hasLoaded
                ? `${results.length} resultaat${results.length === 1 ? "" : "en"}`
                : "Er zijn nog geen resultaten geladen."}
          </p>
          <div className="media-library__items">
            {view === "flat"
              ? results.map(({ asset }) => (
                  <MediaListItem
                    key={asset.id}
                    asset={asset}
                    active={asset.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))
              : groupedResults.map((group) => (
                  <section className="media-library__group" key={group.key}>
                    <h2>
                      {group.label}
                      <small>
                        {group.context?.collection_group
                          ? `${collectionGroupLabel(group.context.collection_group)} · `
                          : ""}
                        {group.results.length} beeld{group.results.length === 1 ? "" : "en"}
                      </small>
                    </h2>
                    {group.results.map(({ asset, context }) => (
                      <MediaListItem
                        key={asset.id}
                        asset={asset}
                        active={asset.id === selectedId}
                        onSelect={setSelectedId}
                        context={context}
                      />
                    ))}
                  </section>
                ))}
          </div>
        </aside>
        <main>
          {selected ? (
            <MediaDetails
              asset={selected}
              metadata={selected.metadata || defaultMetadata(selected.filename)}
              busy={busy}
              onSave={saveMetadata}
              onArchive={archive}
              onRestore={restore}
              onRequestDelete={requestPermanentDelete}
            />
          ) : (
            <div className="media-library__empty">
              <ImageIcon />
              <p>
                {hasLoaded
                  ? "Selecteer een beeld of upload een nieuw bestand."
                  : "De beeldbankgegevens worden geladen. Bij een tijdelijke fout kun je hierboven opnieuw proberen."}
              </p>
            </div>
          )}
        </main>
      </div>
      {deleteTarget && (
        <DeleteMediaDialog
          asset={deleteTarget}
          busy={busy}
          error={deleteError}
          onCancel={() => {
            setDeleteError("");
            setDeleteTarget(null);
          }}
          onConfirm={deletePermanently}
        />
      )}
    </div>
  );
}

function MediaDetails({
  asset,
  metadata,
  busy,
  onSave,
  onArchive,
  onRestore,
  onRequestDelete,
}) {
  const [draft, setDraft] = useState(metadata);
  const [language, setLanguage] = useState("nl");
  useEffect(() => {
    setDraft(metadata);
    setLanguage("nl");
  }, [asset.id, metadata]);
  const updateText = (field, value) =>
    setDraft((current) => ({
      ...current,
      [field]: { ...(current[field] || blankText()), [language]: value },
    }));
  const text = (field) => draft?.[field]?.[language] || "";
  const update = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const usageCount = asset.media_asset_usages?.length || 0;
  const historicalUsages = (asset.media_asset_usages || []).filter(
    isHistoricalUsage,
  );
  const blockingUsages = (asset.media_asset_usages || []).filter(
    (usage) => !isHistoricalUsage(usage),
  );
  return (
    <div className="media-library__detail">
      <div className="media-library__detail-top">
        <div className="media-library__preview">
          {largestUrl(asset) ? (
            <img src={largestUrl(asset)} alt="" />
          ) : (
            <ImageIcon />
          )}
        </div>
        <div className="media-library__identity">
          <span
            className={
              asset.status === "ready"
                ? "media-library__status is-ready"
                : "media-library__status"
            }
          >
            {statusLabel(asset.status)}
          </span>
          <h2>{asset.filename}</h2>
          <p>
            {asset.width || "?"} × {asset.height || "?"} px
          </p>
          <div className="media-library__usage">
            <strong>{usageCount}</strong>
            <span>
              {usageCount === 1
                ? "geregistreerde toepassing"
                : "geregistreerde toepassingen"}
            </span>
          </div>
          {usageCount > 0 ? (
            <ul
              className="media-library__usage-list"
              aria-label="Waar dit beeld wordt gebruikt"
            >
              {asset.media_asset_usages.map((usage) => (
                <li
                  key={`${usage.consumer_type}-${usage.consumer_id}-${usage.placement}`}
                >
                  <strong>{usageLabel(usage, asset)}</strong>
                  <span>{placementLabel(usage)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="media-library__no-usage">
              Dit beeld is niet gekoppeld aan live inhoud, een concept of een
              bewaarde revisie.
            </p>
          )}
          <div className="media-library__destructive-actions">
            {asset.status === "archived" ? (
              <button
                type="button"
                className="admin-text-button"
                disabled={busy}
                onClick={onRestore}
              >
                <RotateCcw />
                Herstellen in beeldbank
              </button>
            ) : (
              <button
                type="button"
                className="admin-text-button admin-text-button--danger"
                disabled={busy}
                onClick={onArchive}
              >
                <Archive />
                Archiveren
              </button>
            )}
            <button
              type="button"
              className="admin-text-button admin-text-button--danger"
              disabled={busy || blockingUsages.length > 0}
              title={
                blockingUsages.length
                  ? "Ontkoppel dit beeld eerst op de vermelde plaats."
                  : historicalUsages.length
                    ? "Dit beeld zit alleen in bewaarde revisies en kan na bevestiging definitief worden verwijderd."
                    : "Verwijder het bestand definitief uit R2 en de beeldbank."
              }
              onClick={onRequestDelete}
            >
              <Trash2 />
              Definitief verwijderen
            </button>
            {blockingUsages.length > 0 && (
              <small>
                Verwijdering is geblokkeerd zolang dit beeld in live inhoud of
                een concept voorkomt.
              </small>
            )}
            {!blockingUsages.length && historicalUsages.length > 0 && (
              <small className="media-library__history-note">
                {historicalUsages.length} bewaarde revisie
                {historicalUsages.length === 1 ? "" : "s"} blokkeren
                verwijdering niet. Na bevestiging kan dit beeld daarin niet meer
                worden geladen.
              </small>
            )}
          </div>
        </div>
      </div>
      <div className="media-library__editor">
        <div className="media-library__editor-heading">
          <div>
            <p>REDACTIONELE GEGEVENS</p>
            <h3>Maak het beeld begrijpelijk en inzetbaar</h3>
          </div>
          <div
            className="media-library__languages"
            role="tablist"
            aria-label="Taal voor beeldgegevens"
          >
            {languages.map(([code, label]) => (
              <button
                key={code}
                type="button"
                role="tab"
                aria-selected={language === code}
                className={language === code ? "is-active" : ""}
                onClick={() => setLanguage(code)}
              >
                {code.toUpperCase()}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="media-library__copy-fields">
          <label>
            Titel
            <input
              value={text("title")}
              onChange={(event) => updateText("title", event.target.value)}
              placeholder="Korte, herkenbare titel"
            />
          </label>
          <label>
            Alt-tekst
            <textarea
              rows="3"
              value={text("alt")}
              onChange={(event) => updateText("alt", event.target.value)}
              placeholder="Beschrijf wat er zichtbaar is"
            />
          </label>
          <label>
            Bijschrift
            <textarea
              rows="3"
              value={text("caption")}
              onChange={(event) => updateText("caption", event.target.value)}
              placeholder="Context die bij het beeld mag verschijnen"
            />
          </label>
          <label>
            Credit
            <input
              value={text("credit")}
              onChange={(event) => updateText("credit", event.target.value)}
              placeholder="Fotograaf, collectie of rechthebbende"
            />
          </label>
          <label>
            Objectreferentie
            <input
              value={text("objectLabel")}
              onChange={(event) =>
                updateText("objectLabel", event.target.value)
              }
              placeholder="Inventarisnummer of objectnaam"
            />
          </label>
        </div>
        <div className="media-library__publication-fields">
          <label>
            Rechten / licentie
            <input
              value={draft.rights || ""}
              onChange={(event) => update("rights", event.target.value)}
            />
          </label>
          <label>
            Bron
            <input
              value={draft.source || ""}
              onChange={(event) => update("source", event.target.value)}
            />
          </label>
          <label>
            Categorie
            <select
              value={draft.category || "unconfirmed"}
              onChange={(event) => update("category", event.target.value)}
            >
              {[
                "unconfirmed",
                "artwork",
                "research",
                "document",
                "portrait",
                "interior",
                "context",
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="media-library__approved">
            <input
              type="checkbox"
              checked={draft.approved === true}
              onChange={(event) => update("approved", event.target.checked)}
            />
            <span>
              <strong>Goedgekeurd voor publiek gebruik</strong>
              <small>
                Optioneel kwaliteitslabel; het blokkeert gebruik niet.
              </small>
            </span>
          </label>
        </div>
      </div>
      <div className="media-library__savebar">
        <p>
          Metadata is volledig optioneel. Een pagina kan desgewenst eigen tekst
          tonen naast hetzelfde centrale beeld.
        </p>
        <button
          type="button"
          className="admin-button admin-button--primary"
          disabled={busy}
          onClick={() => onSave(draft)}
        >
          <Check />
          {busy ? "Opslaan…" : "Gegevens opslaan"}
        </button>
      </div>
    </div>
  );
}

function DeleteMediaDialog({ asset, busy, error, onCancel, onConfirm }) {
  const [confirmation, setConfirmation] = useState("");
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const latest = useRef({ busy, onCancel });
  latest.current = { busy, onCancel };
  const variantCount = Array.isArray(asset.variants)
    ? asset.variants.length
    : 0;
  const usages = asset.media_asset_usages || [];
  const historicalUsages = usages.filter(isHistoricalUsage);
  const blockingUsages = usages.filter((usage) => !isHistoricalUsage(usage));
  const blocked = blockingUsages.length > 0;
  useEffect(() => {
    openerRef.current = document.activeElement;
    const initialFocus = dialogRef.current?.querySelector(
      "input:not([disabled]), button:not([disabled])",
    );
    requestAnimationFrame(() => initialFocus?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !latest.current.busy) {
        event.preventDefault();
        event.stopPropagation();
        latest.current.onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        event.stopPropagation();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        event.stopPropagation();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus?.();
    };
  }, []);
  return (
    <div
      className="media-library__delete-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="media-library__delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-delete-title"
      >
        <header>
          <div>
            <p>{blocked ? "VERWIJDERING GEBLOKKEERD" : "ONOMKEERBARE ACTIE"}</p>
            <h2 id="media-delete-title">
              {blocked
                ? "Beeld is nog in gebruik"
                : "Beeld definitief verwijderen?"}
            </h2>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            aria-label="Verwijderen annuleren"
          >
            <X />
          </button>
        </header>
        <div className="media-library__delete-copy">
          {blocked ? (
            <>
              <p className="media-library__delete-warning">
                <strong>{asset.filename}</strong> kan nog niet uit R2 worden
                verwijderd: het is gekoppeld aan {blockingUsages.length} actieve
                plaats{blockingUsages.length === 1 ? "" : "en"}.
              </p>
              <ul className="media-library__usage-list">
                {blockingUsages.map((usage) => (
                  <li
                    key={`${usage.consumer_type}-${usage.consumer_id}-${usage.placement}`}
                  >
                    <strong>{usageLabel(usage)}</strong>
                    <span>{placementLabel(usage)}</span>
                  </li>
                ))}
              </ul>
              <p>
                Verwijder of vervang het beeld eerst op de vermelde plaats.
                Daarna wordt de R2-verwijdering automatisch veilig beschikbaar.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>{asset.filename}</strong> verdwijnt uit de beeldbank en
                uit R2.
              </p>
              <ul>
                <li>privé-origineel</li>
                <li>
                  {variantCount} publieke variant
                  {variantCount === 1 ? "" : "en"}
                </li>
                <li>alle metadata van dit beeld</li>
              </ul>
              {historicalUsages.length > 0 && (
                <p className="media-library__delete-history-warning">
                  Dit beeld komt alleen nog voor in {historicalUsages.length}{" "}
                  bewaarde revisie{historicalUsages.length === 1 ? "" : "s"}. De
                  revisietekst blijft bewaard, maar dit beeld kan daarin na
                  verwijdering niet meer worden geladen.
                </p>
              )}
              <label>
                Typ <b>VERWIJDER</b> om te bevestigen
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  disabled={busy}
                />
              </label>
            </>
          )}
          {error && (
            <p className="media-library__delete-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer>
          <button
            type="button"
            className="admin-button admin-button--secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {blocked ? "Sluiten" : "Annuleren"}
          </button>
          {!blocked && (
            <button
              type="button"
              className="admin-button admin-button--danger"
              disabled={busy || confirmation !== "VERWIJDER"}
              onClick={onConfirm}
            >
              <Trash2 />
              {busy
                ? "Definitief verwijderen…"
                : "Verwijder uit R2 en beeldbank"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
