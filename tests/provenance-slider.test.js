import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultProvenance } from '../src/data/defaultProvenance.js';
import { MEDIA_CATEGORIES, hydrateProvenanceMediaMetadata, migrateProvenance, normalizeProvenance, provenanceIssues, provenanceMediaUsages, publicProvenance } from '../src/utils/provenance.js';

test('default provenance has valid comparison for UV vs daylight', () => {
  const draft = defaultProvenance();
  assert.ok(Array.isArray(draft.comparisons), 'comparisons should be an array');
  assert.equal(draft.comparisons.length, 1, 'should have 1 default comparison');

  const comparison = draft.comparisons[0];
  assert.equal(comparison.id, 'portrait-daylight-uv');
  assert.equal(comparison.enabled, true);
  assert.equal(comparison.sameObjectConfirmed, true);
  assert.ok(comparison.leftId, 'leftId must be present');
  assert.ok(comparison.rightId, 'rightId must be present');
  assert.notEqual(comparison.leftId, comparison.rightId, 'left and right must be distinct assets');

  // Verify translations
  for (const lang of ['nl', 'en', 'fr']) {
    assert.ok(comparison.title[lang], `title in ${lang} must be present`);
    assert.ok(comparison.leftLabel[lang], `leftLabel in ${lang} must be present`);
    assert.ok(comparison.rightLabel[lang], `rightLabel in ${lang} must be present`);
  }

  // Verify publishing validation passes with 0 issues
  const issues = provenanceIssues(draft, { publishing: true });
  assert.deepEqual(issues, []);
});

test('provenance issues rejects invalid comparisons', () => {
  const draft = defaultProvenance();

  // 1. Same asset on left and right
  draft.comparisons[0].leftId = draft.comparisons[0].rightId;
  let issues = provenanceIssues(draft, { publishing: true });
  assert.ok(issues.some(issue => issue.includes('kies twee verschillende beelden')));

  // 2. Unconfirmed same object
  draft.comparisons[0].leftId = '00000000-0000-4000-8000-000000000020';
  draft.comparisons[0].rightId = '00000000-0000-4000-8000-000000000027';
  draft.comparisons[0].sameObjectConfirmed = false;
  issues = provenanceIssues(draft, { publishing: true });
  assert.ok(issues.some(issue => issue.includes('bevestig hetzelfde object')));

  // 3. Missing translation
  draft.comparisons[0].sameObjectConfirmed = true;
  draft.comparisons[0].rightLabel.fr = '';
  issues = provenanceIssues(draft, { publishing: true });
  assert.ok(issues.some(issue => issue.includes('Vergelijking / rightLabel: FR ontbreekt')));
});

test('publicProvenance projects comparison with ready assets', () => {
  const draft = defaultProvenance();
  const media = [
    { id: '00000000-0000-4000-8000-000000000020', status: 'ready', variants: [{ url: 'https://cdn.example.com/20.webp', width: 1200, height: 1600 }] },
    { id: '00000000-0000-4000-8000-000000000027', status: 'ready', variants: [{ url: 'https://cdn.example.com/27.webp', width: 1209, height: 1600 }] },
    { id: '00000000-0000-4000-8000-000000000037', status: 'ready', variants: [{ url: 'https://cdn.example.com/37.webp', width: 1200, height: 1600 }] },
  ];

  const pub = publicProvenance(draft, media);
  assert.equal(pub.comparisons.length, 1);
  assert.equal(pub.comparisons[0].leftId, '00000000-0000-4000-8000-000000000020');
  assert.equal(pub.comparisons[0].rightId, '00000000-0000-4000-8000-000000000027');

  // Verify left and right assets are in public assets
  const left = pub.assets.find(a => a.id === pub.comparisons[0].leftId);
  const right = pub.assets.find(a => a.id === pub.comparisons[0].rightId);
  assert.ok(left, 'left asset must be in public projection');
  assert.ok(right, 'right asset must be in public projection');
  assert.equal(left.url, 'https://cdn.example.com/20.webp');
  assert.equal(right.url, 'https://cdn.example.com/27.webp');
});

test('hydrated provenance media chooses the largest public variant regardless of order', () => {
  const draft = defaultProvenance();
  const assetId = draft.hero.assetId;
  const hydrated = hydrateProvenanceMediaMetadata(draft, [{
    id: assetId,
    status: 'ready',
    variants: [
      { url: 'https://cdn.example.com/hero-large.webp', width: 1600 },
      { url: 'https://cdn.example.com/hero-small.webp', width: 360 },
    ],
  }]);

  assert.equal(
    hydrated.assets.find((asset) => asset.id === assetId)?.url,
    'https://cdn.example.com/hero-large.webp',
  );
});

test('a ready central image is publishable without editorial metadata', () => {
  const draft = defaultProvenance();
  const assetId = draft.hero.assetId;
  draft.assets = draft.assets.map((asset) =>
    asset.id === assetId
      ? {
          ...asset,
          title: { nl: '', en: '', fr: '' },
          caption: { nl: '', en: '', fr: '' },
          alt: { nl: '', en: '', fr: '' },
          credit: { nl: '', en: '', fr: '' },
          approved: false,
        }
      : asset,
  );
  const media = [{
    id: assetId,
    status: 'ready',
    metadata: {},
    variants: [{ url: 'https://cdn.example.com/optional-metadata.webp', width: 1200, height: 800 }],
  }];

  assert.deepEqual(provenanceIssues(draft, { publishing: true }), []);
  const publicAsset = publicProvenance(draft, media).assets.find((asset) => asset.id === assetId);
  assert.equal(publicAsset.url, 'https://cdn.example.com/optional-metadata.webp');
});

test('contact CTA image is explicit, public, and compatible with saved v3 content', () => {
  const draft = defaultProvenance();
  const contactId = draft.cta.assetId;
  assert.ok(contactId, 'the contact CTA should have an explicit image');
  assert.ok(draft.assets.some(asset => asset.id === contactId), 'the contact image should be in the image bank');

  const publicPage = publicProvenance(draft, [{
    id: contactId,
    status: 'ready',
    variants: [{ url: 'https://cdn.example.com/contact.webp', width: 1200, height: 800 }],
  }]);
  assert.equal(publicPage.cta.assetId, contactId);
  assert.equal(publicPage.assets.find(asset => asset.id === contactId)?.url, 'https://cdn.example.com/contact.webp');

  const legacyV3 = defaultProvenance();
  delete legacyV3.cta.assetId;
  assert.equal(migrateProvenance(legacyV3, defaultProvenance()).cta.assetId, contactId, 'legacy v3 data gets a safe default');

  const intentionallyEmpty = defaultProvenance();
  intentionallyEmpty.cta.assetId = '';
  assert.equal(migrateProvenance(intentionallyEmpty, defaultProvenance()).cta.assetId, '', 'an editor can intentionally clear the selection');
});

test('schema preserves material-analysis media categories', () => {
  assert.ok(MEDIA_CATEGORIES.includes('methods'));
  const draft = defaultProvenance();
  const materialAsset = draft.assets.find(asset => asset.id === '00000000-0000-4000-8000-000000000014');
  assert.equal(materialAsset.category, 'methods');
  assert.equal(normalizeProvenance(draft).assets.find(asset => asset.id === materialAsset.id).category, 'methods');
});

test('only concrete Provenance placements create media usages', () => {
  const draft = defaultProvenance();
  const unusedAsset = draft.assets.find(asset => asset.id !== draft.hero.assetId && !draft.gallery.assetIds.includes(asset.id));
  const usages = provenanceMediaUsages(draft);
  assert.ok(usages.some(usage => usage.assetId === draft.hero.assetId && usage.placement === 'hero'));
  assert.ok(usages.some(usage => usage.placement.startsWith('gallery:')));
  assert.ok(!usages.some(usage => usage.assetId === unusedAsset.id), 'an asset merely listed in the old editorial catalogue is not in use');
});

test('central media metadata overrides the historical page copy at publication', () => {
  const draft = defaultProvenance();
  const assetId = draft.hero.assetId;
  const hydrated = hydrateProvenanceMediaMetadata(draft, [{
    id: assetId,
    status: 'ready',
    metadata: {
      title: { nl: 'Centrale titel', en: 'Central title', fr: 'Titre central' },
      caption: { nl: 'Centraal bijschrift', en: 'Central caption', fr: 'Légende centrale' },
      alt: { nl: 'Centrale alt', en: 'Central alt', fr: 'Texte alternatif central' },
      credit: { nl: 'Atelier Rembrandt', en: 'Atelier Rembrandt', fr: 'Atelier Rembrandt' },
      objectLabel: { nl: '', en: '', fr: '' },
      category: 'research',
      approved: true,
    },
    variants: [{ url: 'https://cdn.example.com/central.webp', width: 1200, height: 800 }],
    width: 1200,
    height: 800,
  }]);
  const asset = hydrated.assets.find(item => item.id === assetId);
  assert.equal(asset.title.nl, 'Centrale titel');
  assert.equal(asset.caption.nl, 'Centraal bijschrift');
  assert.equal(asset.category, 'research');
});

test('sources and timelines survive the public projection while disabled dossier items do not', () => {
  const draft = defaultProvenance();
  draft.sources = [{ id: 'archive', enabled: true, title: { nl: 'Archief', en: 'Archive', fr: 'Archives' }, url: 'https://example.com/archive' }];
  draft.examples[0].sourceIds = ['archive'];
  draft.examples[0].timeline = [{ id: 'event-1', date: { nl: '1650', en: '1650', fr: '1650' }, description: { nl: 'Vermelding', en: 'Recorded', fr: 'Mention' }, sourceId: 'archive' }];
  draft.dossier.items[0].enabled = false;
  const pub = publicProvenance(draft, []);
  assert.deepEqual(pub.sources.map(source => source.id), ['archive']);
  assert.equal(pub.examples[0].timeline[0].sourceId, 'archive');
  assert.ok(!pub.dossier.items.some(item => item.id === draft.dossier.items[0].id));
});
