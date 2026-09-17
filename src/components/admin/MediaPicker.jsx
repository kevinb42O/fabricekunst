import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, LibraryBig, Search, X } from "lucide-react";
import { fetchMediaLibraryAsync } from "../../utils/storage";
import {
  catalogContextsFor,
  collectionGroupsFor,
  collectionWorksFor,
  findMediaAssets,
  mediaTitle,
  preferredMediaVariantUrl,
} from "../../utils/mediaSearch";
import "../../styles/media-library.css";

const largestUrl = preferredMediaVariantUrl;
const titleFor = (asset) => mediaTitle(asset);
const collectionGroupLabel = (group) =>
  ({
    books: "Boeken",
    art: "Kunst",
    "historical-objects": "Historische objecten",
  })[group] || group;

/** Reusable, read-only picker. Uploading and editorial metadata deliberately
 * remain in the central library so every file starts with a clear owner. */
export default function MediaPicker({
  open,
  onClose,
  onSelect,
  onOpenMediaLibrary,
  title = "Kies een beeld uit de beeldbank",
}) {
  const [media, setMedia] = useState([]);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [collectionGroup, setCollectionGroup] = useState("");
  const [workId, setWorkId] = useState("");
  const [sort, setSort] = useState("relevance");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const searchInput = useRef(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setMedia(await fetchMediaLibraryAsync());
      setHasLoaded(true);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
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
    requestAnimationFrame(() => searchInput.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setScope("all");
    setCollectionGroup("");
    setWorkId("");
    setSort("relevance");
    load();
  }, [open]);

  const filtered = useMemo(
    () =>
      findMediaAssets(media, {
        query,
        scope,
        collectionGroup,
        workId,
        sort,
        readyOnly: true,
      }),
    [media, query, scope, collectionGroup, workId, sort],
  );
  const collectionGroups = useMemo(() => collectionGroupsFor(media), [media]);
  const collectionWorks = useMemo(
    () => collectionWorksFor(media, collectionGroup),
    [media, collectionGroup],
  );

  const selectAsset = async (asset) => {
    if (selectingId) return;
    setSelectingId(asset.id);
    setError("");
    try {
      // A picker can be kept open when its caller no longer has a valid
      // destination. That is much safer than silently throwing a selection
      // away, and makes the outcome of every click explicit to the editor.
      const selected = await onSelect(asset);
      if (selected === false) {
        setError(
          "Dit beeld kon niet aan het gekozen veld worden gekoppeld. Sluit de kiezer en probeer opnieuw.",
        );
        return;
      }
      onClose();
    } catch (selectionError) {
      setError(
        selectionError?.message ||
          "Dit beeld kon niet worden gekoppeld. Probeer het opnieuw.",
      );
    } finally {
      setSelectingId("");
    }
  };

  if (!open) return null;
  return createPortal(
    <div
      className="media-picker-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="media-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        aria-describedby="media-picker-description"
      >
        <header className="media-picker__header">
          <div>
            <p>UNIVERSELE BEELDBANK</p>
            <h2 id="media-picker-title">{title}</h2>
            <span id="media-picker-description">
              Elk beeld met een publieke variant is direct beschikbaar. Metadata
              is optioneel.
            </span>
          </div>
          <div className="media-picker__header-actions">
            {onOpenMediaLibrary && (
              <button
                type="button"
                className="media-picker__open-library"
                onClick={() => {
                  onClose();
                  onOpenMediaLibrary();
                }}
              >
                <LibraryBig aria-hidden="true" />
                Nieuw beeld toevoegen
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Beeldbank sluiten"
            >
              <X />
            </button>
          </div>
        </header>
        <div className="media-picker__toolbar">
          <label className="media-picker__search">
            <Search aria-hidden="true" />
            <input
              ref={searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek op naam, titel of trefwoord"
            />
          </label>
          <p>
            {loading
              ? "Laden…"
              : hasLoaded
                ? `${filtered.length} beschikbaar beeld${filtered.length === 1 ? "" : "en"}`
                : "Nog niet geladen"}
          </p>
        </div>
        <div className="media-picker__filter-row">
          <label>
            <span>Toepassing</span>
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="all">Alle beelden</option>
              <option value="collection">Alleen collectie</option>
              <option value="provenance">Herkomst</option>
              <option value="rembrandt-project">Lost Rembrandt</option>
              <option value="site">Website</option>
              <option value="unused">Nog nergens gebruikt</option>
            </select>
          </label>
          <label>
            <span>Collectie</span>
            <select
              value={collectionGroup}
              disabled={!collectionGroups.length}
              onChange={(event) => {
                setCollectionGroup(event.target.value);
                setWorkId("");
              }}
            >
              <option value="">Alle collecties</option>
              {collectionGroups.map((group) => (
                <option key={group} value={group}>{collectionGroupLabel(group)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Werk</span>
            <select value={workId} disabled={!collectionWorks.length} onChange={(event) => setWorkId(event.target.value)}>
              <option value="">Alle werken</option>
              {collectionWorks.map((work) => (
                <option key={work.item_id} value={work.item_id}>{work.title}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Sortering</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="relevance">{query ? "Beste overeenkomst" : "Recent bijgewerkt"}</option>
              <option value="recent">Recent bijgewerkt</option>
              <option value="title">Titel A–Z</option>
              <option value="collection">Collectie en werk</option>
            </select>
          </label>
        </div>
        <div className="media-picker__content">
          {loading && <p className="media-picker__message">Beeldbank laden…</p>}
          {error && (
            <p className="media-picker__message is-error" role="alert">
              {error}{" "}
              <button type="button" onClick={load} disabled={loading}>
                Opnieuw proberen
              </button>
            </p>
          )}
          {!loading && !error && Boolean(filtered.length) && (
            <div className="media-picker__grid">
              {filtered.map(({ asset }) => (
                <button
                  type="button"
                  key={asset.id}
                  onClick={() => selectAsset(asset)}
                  disabled={Boolean(selectingId)}
                  aria-label={`${titleFor(asset)} selecteren`}
                >
                  <div className="media-picker__image">
                    {largestUrl(asset) ? (
                      <img src={largestUrl(asset)} alt="" />
                    ) : (
                      <ImageIcon />
                    )}
                  </div>
                  <span>
                    <strong>
                      {selectingId === asset.id
                        ? "Beeld koppelen…"
                        : titleFor(asset)}
                    </strong>
                    <small>
                      {asset.width || "?"} × {asset.height || "?"} px
                    </small>
                    {catalogContextsFor(asset)[0]?.title && (
                      <small className="media-picker__context">
                        Collectie · {catalogContextsFor(asset)[0].title}
                      </small>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!loading && !error && !filtered.length && (
            <div className="media-picker__empty">
              <ImageIcon />
              <strong>Geen beelden gevonden</strong>
              <p>
                Probeer een andere zoekterm, of bereid een beeld eerst voor in
                Beeldbank.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
