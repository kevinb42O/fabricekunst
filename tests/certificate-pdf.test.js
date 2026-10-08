import test from 'node:test';
import assert from 'node:assert/strict';
import { captureCertificateCanvas } from '../src/utils/certificatePdf.js';

const photo = 'https://media.atelierrembrandt.com/media/variants/book/front.webp';

function fixture(sources, { failPhoto = false, unreadablePhoto = false } = {}) {
  const requests = [];
  const originals = sources.map(source => ({ src: source, currentSrc: source, alt: 'Boekfoto' }));
  const document = {
    baseURI: 'https://www.atelierrembrandt.com/admin',
    fonts: { ready: Promise.resolve() },
    createElement(tag) {
      if (tag === 'img') {
        return {
          naturalWidth: 1600,
          naturalHeight: 1200,
          set src(value) {
            requests.push({ url: new URL(value), crossOrigin: this.crossOrigin });
            queueMicrotask(() => {
              if (failPhoto && value.startsWith('https://media.')) this.onerror();
              else this.onload();
            });
          },
        };
      }
      let pixels;
      return {
        getContext: () => ({ drawImage: () => { pixels = 'loaded'; } }),
        toDataURL: () => {
          if (unreadablePhoto) throw new Error('Tainted canvas');
          assert.equal(pixels, 'loaded');
          return 'data:image/png;base64,cGl4ZWxz';
        },
      };
    },
  };
  return { element: { ownerDocument: document, querySelectorAll: () => originals }, originals, requests };
}

test('certificate exports embed fresh anonymous R2 pixels without changing the preview', async () => {
  const { element, originals, requests } = fixture([photo, '/images/logo.png', 'data:image/png;base64,c2lnbmF0dXJl']);
  const result = await captureCertificateCanvas(element, async (_element, options) => {
    // Export must wait for every image before rendering starts.
    assert.equal(requests.length, 3);
    const clonedImages = originals.map(image => ({ ...image, srcset: photo, removeAttribute(name) { delete this[name]; } }));
    options.onclone({}, { querySelectorAll: () => clonedImages });
    for (const image of clonedImages) {
      assert.match(image.src, /^data:image\/png;base64,/);
      assert.equal(image.srcset, undefined);
      assert.equal(image.loading, 'eager');
    }
    return 'rendered certificate';
  });
  assert.equal(result, 'rendered certificate');
  assert.equal(requests[0].crossOrigin, 'anonymous');
  assert.ok(requests[0].url.searchParams.has('certificate-export'));
  assert.equal(requests[1].url.href, 'https://www.atelierrembrandt.com/images/logo.png');
  assert.equal(requests[2].url.href, 'data:image/png;base64,c2lnbmF0dXJl');
  assert.equal(originals[0].src, photo);
});

test('an unavailable R2 photo prevents saving a certificate with a blank frame', async () => {
  const { element } = fixture([photo], { failPhoto: true });
  let rendered = false;
  await assert.rejects(captureCertificateCanvas(element, () => { rendered = true; }), /Boekfoto.*niet worden geladen/);
  assert.equal(rendered, false);
});

test('an unreadable photo fails explicitly before rendering', async () => {
  const { element } = fixture([photo], { unreadablePhoto: true });
  await assert.rejects(captureCertificateCanvas(element, () => assert.fail('Must not render missing pixels')), /Boekfoto.*niet in de PDF/);
});

test('certificates with the photo disabled can still be exported', async () => {
  const { element, requests } = fixture([]);
  assert.equal(await captureCertificateCanvas(element, () => 'without photo'), 'without photo');
  assert.equal(requests.length, 0);
});
