/** Keep an initial deep link aligned while earlier lazy photos/fonts load.
 * A visitor's next gesture always wins over an automatic correction.
 */
export function followProjectAnchor(browserWindow = window) {
  const { document } = browserWindow;
  let id;
  try {
    id = decodeURIComponent(browserWindow.location.hash.slice(1));
  } catch {
    return () => {};
  }
  const target = id && document.getElementById(id);
  if (!target) return () => {};

  const hash = browserWindow.location.hash;
  let cancelled = false;
  let frame;
  let timeout;
  const cleanups = [];
  const cleanup = () => {
    cancelled = true;
    browserWindow.cancelAnimationFrame(frame);
    browserWindow.clearTimeout(timeout);
    cleanups.forEach((remove) => remove());
  };
  const align = () => {
    if (!cancelled && browserWindow.location.hash === hash && target.isConnected) {
      target.scrollIntoView({ behavior: "instant", block: "start" });
    }
  };
  const listen = (element, event, callback, options) => {
    element.addEventListener(event, callback, options);
    cleanups.push(() => element.removeEventListener(event, callback, options));
  };
  for (const event of ["wheel", "touchstart", "pointerdown", "keydown", "hashchange"]) {
    listen(browserWindow, event, cleanup, { passive: true });
  }

  const precedingImages = Array.from(document.images).filter((image) =>
    Boolean(image.compareDocumentPosition(target) & 4),
  );
  const imagesReady = precedingImages.map((image) => {
    // Only images before the destination are needed to establish its position.
    image.loading = "eager";
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      listen(image, "load", resolve, { once: true });
      listen(image, "error", resolve, { once: true });
    });
  });

  frame = browserWindow.requestAnimationFrame(align);
  const finish = () => {
    if (cancelled) return;
    browserWindow.cancelAnimationFrame(frame);
    frame = browserWindow.requestAnimationFrame(() => {
      align();
      cleanup();
    });
  };
  // A stalled photo must not keep the automatic scroll active indefinitely.
  timeout = browserWindow.setTimeout(finish, 10_000);
  Promise.allSettled([...imagesReady, document.fonts?.ready]).then(finish);
  return cleanup;
}
