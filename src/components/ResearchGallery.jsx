import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { localizedProjectValue } from "../utils/rembrandtProject";

const loadViewer = () => import("./ResearchViewer");
const ResearchViewer = lazy(loadViewer);

function ViewerLoading({ copy, onClose }) {
  return <div className="research-viewer-loading-surface" role="dialog" aria-modal="true" aria-label={copy.enlarge} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}><button className="research-viewer-loading" autoFocus onClick={onClose}>{copy.close}</button></div>;
}

export function DetailImage({ image, language, copy, showCaption = true }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const alt = localizedProjectValue(image.alt, language, "");
  const caption = localizedProjectValue(image.caption, language, "");
  return <figure className="dossier-image">
    <button ref={trigger} type="button" className="dossier-image__open" onPointerEnter={loadViewer} onFocus={loadViewer} onClick={() => setOpen(true)} aria-label={`${copy.enlarge}: ${alt || caption}`}>
      <span className="dossier-image__surface"><img src={image.url} alt={alt} loading="lazy" decoding="async" /></span>
      <span className="dossier-image__action"><span>{copy.enlarge}</span><ArrowUpRight aria-hidden="true" /></span>
    </button>
    {showCaption && (caption || alt) && <figcaption>{caption || alt}</figcaption>}
    {open && <Suspense fallback={<ViewerLoading copy={copy} onClose={() => setOpen(false)} />}><ResearchViewer images={[image]} language={language} copy={copy} index={0} onClose={() => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); }} /></Suspense>}
  </figure>;
}

const galleryLabels = {
  nl: { image: "Beeld", previous: "Vorig beeld", next: "Volgend beeld", select: "Kies een onderzoeksbeeld" },
  en: { image: "Image", previous: "Previous image", next: "Next image", select: "Choose a research image" },
  fr: { image: "Image", previous: "Image précédente", next: "Image suivante", select: "Choisir une image de recherche" },
};

export default function ResearchGallery({ images, language, copy, className = "" }) {
  const [index, setIndex] = useState(-1);
  const [selected, setSelected] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const returnTo = useRef(null);
  const reduceMotion = useReducedMotion();
  const visible = useMemo(() => images.filter((image) => image.url), [images]);
  const active = Math.min(selected, Math.max(0, visible.length - 1));
  const image = visible[active];
  const labels = galleryLabels[language] || galleryLabels.nl;
  useEffect(() => {
    const strip = root.current?.querySelector(".research-gallery__sequence");
    const thumbnail = strip?.querySelector('[aria-pressed="true"]');
    if (strip && thumbnail && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: thumbnail.offsetLeft - (strip.clientWidth - thumbnail.clientWidth) / 2, behavior: reduceMotion ? "instant" : "smooth" });
    }
  }, [active, reduceMotion]);
  if (!image) return null;
  const caption = localizedProjectValue(image.caption, language, "") || localizedProjectValue(image.alt, language, copy.imageNote);
  const close = () => { setIndex(-1); requestAnimationFrame(() => (returnTo.current || trigger.current)?.focus()); };
  const open = (event) => { returnTo.current = event?.currentTarget || trigger.current; setIndex(active); };
  return <div ref={root} className={`research-gallery ${visible.length === 1 ? "is-single" : ""} ${className}`}>
    <figure className="research-gallery__plate">
      <button ref={trigger} className="research-gallery__image" type="button" onPointerEnter={loadViewer} onFocus={loadViewer} onClick={open} aria-label={`${copy.enlarge}: ${localizedProjectValue(image.alt, language, caption)}`}>
        <motion.img key={image.url} src={image.url} alt={localizedProjectValue(image.alt, language, "")} decoding="async" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .3 }} />
      </button>
      <figcaption className="research-gallery__details">
        <div className="research-gallery__navigation">
          <span className="research-gallery__counter" aria-live="polite" aria-atomic="true"><span className="research-gallery__sr">{labels.image} </span>{String(active + 1).padStart(2, "0")}<span> / {String(visible.length).padStart(2, "0")}</span></span>
          {visible.length > 1 && <div className="research-gallery__arrows">
            <button type="button" aria-label={labels.previous} disabled={active === 0} onClick={() => setSelected(active - 1)}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" aria-label={labels.next} disabled={active === visible.length - 1} onClick={() => setSelected(active + 1)}><ArrowRight aria-hidden="true" /></button>
          </div>}
        </div>
        <p key={image.url} className="research-gallery__caption">{caption}</p>
        <button className="research-gallery__view" type="button" onPointerEnter={loadViewer} onFocus={loadViewer} onClick={open}><span>{copy.enlarge}</span><ArrowUpRight aria-hidden="true" /></button>
      </figcaption>
    </figure>
    {visible.length > 1 && <div className="research-gallery__sequence" role="group" aria-label={labels.select} onKeyDown={(event) => {
      const directions = { ArrowRight: Math.min(active + 1, visible.length - 1), ArrowLeft: Math.max(active - 1, 0), Home: 0, End: visible.length - 1 };
      if (Object.hasOwn(directions, event.key)) {
        event.preventDefault();
        const next = directions[event.key];
        setSelected(next);
        event.currentTarget.querySelectorAll("button")[next]?.focus();
      }
    }}>
      {visible.map((item, i) => <button key={item.id || item.url} type="button" className="research-gallery__thumbnail" aria-pressed={i === active} aria-label={`${labels.image} ${i + 1}: ${localizedProjectValue(item.alt, language, "")}`} onClick={() => setSelected(i)}>
        <span className="research-gallery__thumbnail-image"><img src={item.url} alt="" loading="lazy" decoding="async" /></span><span>{String(i + 1).padStart(2, "0")}</span>
      </button>)}
    </div>}
    {index >= 0 && <Suspense fallback={<ViewerLoading copy={copy} onClose={close} />}><ResearchViewer images={visible} language={language} copy={copy} index={index} onClose={close} onView={setSelected} /></Suspense>}
  </div>;
}
