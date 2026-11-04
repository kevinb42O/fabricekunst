import React, { useMemo } from "react";
import Lightbox, { useController } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { localizedProjectValue } from "../utils/rembrandtProject";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

const translations = {
  nl: { Previous: "Vorige foto", Next: "Volgende foto", "Zoom in": "Inzoomen", "Zoom out": "Uitzoomen", "Loading...": "Foto laden…", "Error loading image": "Foto kon niet geladen worden" },
  en: { Previous: "Previous image", Next: "Next image" },
  fr: { Previous: "Photo précédente", Next: "Photo suivante", "Zoom in": "Agrandir", "Zoom out": "Réduire", "Loading...": "Chargement…", "Error loading image": "Impossible de charger la photo" },
};

function ViewerCloseButton({ label }) {
  const { close } = useController();
  return <button className="research-viewer__close" type="button" onClick={close} aria-label={label}><X aria-hidden="true" /><span>{label}</span></button>;
}

export default function ResearchViewer({ images, language, copy, index, onClose, onView }) {
  const reducedMotion = useReducedMotion();
  const slides = useMemo(() => images.map((image) => ({
    src: image.url,
    alt: localizedProjectValue(image.alt, language, ""),
    description: localizedProjectValue(image.caption, language, "") || localizedProjectValue(image.alt, language, ""),
  })), [images, language]);
  return <Lightbox open index={index} close={onClose} slides={slides} className="research-viewer" plugins={[Zoom, Captions, Counter]}
    labels={{ ...translations[language], Close: copy.close }}
    carousel={{ finite: true, preload: 1, padding: "6%", imageFit: "contain" }}
    controller={{ closeOnBackdropClick: true }}
    animation={{ fade: reducedMotion ? 0 : 220, swipe: reducedMotion ? 0 : 320, zoom: reducedMotion ? 0 : 250 }}
    captions={{ showToggle: false, descriptionTextAlign: "center", descriptionMaxLines: 3 }}
    on={{ view: ({ index: current }) => onView?.(current) }}
    render={{
      iconPrev: () => <ArrowLeft aria-hidden="true" />,
      iconNext: () => <ArrowRight aria-hidden="true" />,
      buttonPrev: images.length < 2 ? () => null : undefined,
      buttonNext: images.length < 2 ? () => null : undefined,
      buttonClose: () => <ViewerCloseButton label={copy.close} />,
    }} />;
}
