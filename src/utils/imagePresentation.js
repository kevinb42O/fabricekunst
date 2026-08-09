const imagePresentationCache = new Map();
const DEFAULT_PRESENTATION = Object.freeze({ ratio: 1.5, orientation: 'landscape' });

const classifyOrientation = (ratio) => {
  if (ratio >= 1.2) return 'landscape';
  if (ratio <= 0.82) return 'portrait';
  return 'square';
};

export const getImagePresentation = (url) => imagePresentationCache.get(url) || DEFAULT_PRESENTATION;

export const rememberImagePresentation = (url, imageElement) => {
  if (!url || !imageElement?.naturalWidth || !imageElement?.naturalHeight) return DEFAULT_PRESENTATION;
  const ratio = imageElement.naturalWidth / imageElement.naturalHeight;
  const presentation = { ratio, orientation: classifyOrientation(ratio) };
  imagePresentationCache.set(url, presentation);
  return presentation;
};
