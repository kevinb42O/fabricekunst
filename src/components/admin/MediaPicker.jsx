import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, Search, X } from "lucide-react";
import { fetchMediaLibraryAsync } from "../../utils/storage";
import "../../styles/media-library.css";

const largestUrl = (asset) =>
  asset?.variants?.at(-1)?.url || asset?.variants?.[0]?.url || "";
const titleFor = (asset) =>
  asset?.metadata?.title?.nl || asset?.filename || "Naamloos beeld";

/** Reusable, read-only picker. Uploading and editorial metadata deliberately
 * remain in the central library so every file starts with a clear owner. */
export default function MediaPicker({
  open,
  onClose,
  onSelect,
  title = "Kies een beeld uit de beeldbank",
}) {
  const [media, setMedia] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    load();
  }, [open]);

  const filtered = useMemo(
    () =>
      media.filter((asset) => {
        if (asset.status !== "ready") return false;
        const haystack = [
          asset.filename,
          asset.id,
          asset.metadata?.title?.nl,
          asset.metadata?.caption?.nl,
          ...(asset.metadata?.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      }),
    [media, query],
  );

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
          <button
            type="button"
            onClick={onClose}
            aria-label="Beeldbank sluiten"
          >
            <X />
          </button>
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
              {filtered.map((asset) => (
                <button
                  type="button"
                  key={asset.id}
                  onClick={() => {
                    onSelect(asset);
                    onClose();
                  }}
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
                    <strong>{titleFor(asset)}</strong>
                    <small>
                      {asset.width || "?"} × {asset.height || "?"} px
                    </small>
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
