import html2canvas from 'html2canvas';

const IMAGE_TIMEOUT = 30000;

const loadImage = (document, source, label) => new Promise((resolve, reject) => {
  const image = document.createElement('img');
  const timeout = setTimeout(() => fail(), IMAGE_TIMEOUT);
  const cleanup = () => {
    clearTimeout(timeout);
    image.onload = null;
    image.onerror = null;
  };
  const fail = () => {
    cleanup();
    reject(new Error(`De afbeelding “${label}” kon niet worden geladen voor de PDF. Probeer opnieuw of controleer de foto.`));
  };
  image.onload = () => {
    cleanup();
    if (!image.naturalWidth || !image.naturalHeight) {
      fail();
      return;
    }
    resolve(image);
  };
  image.onerror = fail;
  // Set CORS before src, so the browser requests an image that can be read
  // by canvas rather than reusing an ordinary, display-only image response.
  image.crossOrigin = 'anonymous';
  image.src = source;
});

export const captureCertificateCanvas = async (element, render = html2canvas) => {
  const document = element.ownerDocument;
  const sources = [...element.querySelectorAll('img')].map(image => ({
    source: image.currentSrc || image.src,
    label: image.alt || 'certificaatfoto',
  }));

  // Embed the actual pixels before html2canvas starts. Its normal image loader
  // silently skips CORS failures, resulting in a successful PDF with no photo.
  const embeddedImages = await Promise.all(sources.map(async ({ source, label }) => {
    const url = new URL(source, document.baseURI);
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(document.baseURI).origin) {
      // R2 images may already be cached without CORS headers from the catalog.
      // A fresh URL forces a new anonymous request with the correct Origin.
      url.searchParams.set('certificate-export', `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    }
    const image = await loadImage(document, url.href, label);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    try {
      canvas.getContext('2d').drawImage(image, 0, 0);
      return canvas.toDataURL('image/png');
    } catch {
      throw new Error(`De afbeelding “${label}” kon niet in de PDF worden opgenomen. Probeer opnieuw of controleer de foto.`);
    }
  }));

  await document.fonts?.ready;
  return render(element, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
    onclone: (_clonedDocument, clonedElement) => {
      [...clonedElement.querySelectorAll('img')].forEach((image, index) => {
        image.removeAttribute('srcset');
        image.removeAttribute('sizes');
        image.loading = 'eager';
        image.src = embeddedImages[index];
      });
    },
  });
};
