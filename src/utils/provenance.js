export const PROVENANCE_LANGUAGES = ['nl', 'en', 'fr'];
export const PROVENANCE_SECTIONS = ['workflow', 'methods', 'examples', 'gallery', 'dossier', 'faq', 'contact'];
export const MEDIA_CATEGORIES = ['rx', 'microscopy', 'surface', 'support', 'documents', 'context', 'unconfirmed'];
export const localized = (value, language = 'nl') => typeof value === 'string' ? value : value?.[language] || '';
export const languages = (nl = '', en = '', fr = '') => ({ nl, en, fr });
const text = value => languages(...PROVENANCE_LANGUAGES.map(lang => typeof value === 'string' ? (lang === 'nl' ? value : '') : String(value?.[lang] || '')));
const string = value => typeof value === 'string' ? value : '';
const list = value => Array.isArray(value) ? value : [];
const base = value => ({ id: string(value.id), enabled: value.enabled !== false });
const strings = value => list(value).filter(v => typeof v === 'string');
const texts = (value, fields) => Object.fromEntries(fields.map(field => [field, text(value?.[field])]));
export const emptyEntity = (type, id) => ({
  ...({ steps: { title: languages(), description: languages() }, methods: { title: languages(), question: languages(), description: languages(), findings: languages(), limitations: languages(), assetIds: [], sourceIds: [] }, examples: { title: languages(), question: languages(), description: languages(), findings: languages(), uncertainties: languages(), assetIds: [], sourceIds: [], timeline: [] }, sources: { title: languages(), url: '' }, faq: { question: languages(), answer: languages() }, comparisons: { title: languages(), leftLabel: languages(), rightLabel: languages(), leftId: '', rightId: '', sameObjectConfirmed: false }, assets: { title: languages(), caption: languages(), alt: languages(), credit: languages(), objectLabel: languages(), category: 'context', approved: false } }[type] || {}), id, enabled: true,
});

/** Explicit allowlist; no private fields or injected URLs survive normalization. */
export function normalizeProvenance(input = {}) {
  const value = input && typeof input === 'object' ? input : {};
  return {
    schemaVersion: 3,
    hero: { ...texts(value.hero, ['eyebrow', 'title', 'description', 'primaryLabel', 'secondaryLabel']), assetId: string(value.hero?.assetId) },
    seo: { ...texts(value.seo, ['title', 'description', 'imageAlt']), assetId: string(value.seo?.assetId) },
    homepageTeaser: { ...texts(value.homepageTeaser, ['title', 'description', 'buttonLabel']), assetId: string(value.homepageTeaser?.assetId), enabled: value.homepageTeaser?.enabled !== false },
    sections: list(value.sections).map(section => ({ ...base(section), ...texts(section, ['title', 'intro', 'eyebrow']) })),
    steps: list(value.steps).map(step => ({ ...base(step), ...texts(step, ['title', 'description']) })),
    methods: list(value.methods).map(method => ({ ...base(method), ...texts(method, ['title', 'question', 'description', 'findings', 'limitations']), assetIds: strings(method.assetIds), sourceIds: strings(method.sourceIds) })),
    examples: list(value.examples).map(example => ({ ...base(example), ...texts(example, ['title', 'question', 'description', 'findings', 'uncertainties']), assetIds: strings(example.assetIds), sourceIds: strings(example.sourceIds), timeline: list(example.timeline).map(event => ({ id: string(event.id), ...texts(event, ['date', 'description']), sourceId: string(event.sourceId) })) })),
    sources: list(value.sources).map(source => ({ ...base(source), ...texts(source, ['title']), url: string(source.url) })),
    assets: list(value.assets).map(asset => ({ id: string(asset.id), ...texts(asset, ['title', 'caption', 'alt', 'credit', 'objectLabel']), category: MEDIA_CATEGORIES.includes(asset.category) ? asset.category : 'context', approved: asset.approved === true, url: string(asset.url), width: Number.isSafeInteger(asset.width) ? asset.width : 0, height: Number.isSafeInteger(asset.height) ? asset.height : 0, srcSet: string(asset.srcSet), variants: list(asset.variants).map(variant => ({ url: string(variant?.url), width: Number.isSafeInteger(variant?.width) ? variant.width : 0, height: Number.isSafeInteger(variant?.height) ? variant.height : 0 })) })),
    comparisons: list(value.comparisons).map(pair => ({ ...base(pair), ...texts(pair, ['title', 'leftLabel', 'rightLabel']), leftId: string(pair.leftId), rightId: string(pair.rightId), sameObjectConfirmed: pair.sameObjectConfirmed === true })),
    gallery: { assetIds: strings(value.gallery?.assetIds) },
    dossier: { ...texts(value.dossier, ['description']), items: list(value.dossier?.items).map(item => ({ id: string(item.id), enabled: item.enabled !== false, ...texts(item, ['title', 'description']) })) },
    cta: { ...texts(value.cta, ['title', 'description', 'buttonLabel']), action: 'consultation' },
    faq: list(value.faq).map(item => ({ ...base(item), ...texts(item, ['question', 'answer']) })),
  };
}

export function migrateProvenance(input, defaults) {
  if (input?.schemaVersion === 3) return normalizeProvenance(input);
  const data = structuredClone(defaults);
  if (!input || !Object.keys(input).length) return data;
  const legacy = (section, field) => languages(section?.[field] || '', section?.[`${field}_en`] || '', section?.[`${field}_fr`] || '');
  if (input.hero) {
    data.hero.title = legacy(input.hero, 'title');
    data.hero.description = legacy(input.hero, 'subtitle');
    data.hero.eyebrow = legacy(input.hero, 'badge');
  }
  if (Array.isArray(input.protocol?.steps)) data.steps = input.protocol.steps.map((step, i) => ({ id: `legacy-step-${i + 1}`, enabled: true, title: legacy(step, 'title'), description: legacy(step, 'description') }));
  if (input.story) data.examples.unshift({ ...emptyEntity('examples', 'legacy-story'), enabled: false, title: legacy(input.story, 'title'), description: legacy(input.story, 'narrative'), uncertainties: languages('Overgenomen uit de vorige pagina; controleer inhoud en bronnen voor publicatie.', 'Imported from the previous page; check content and sources before publication.', 'Importé de la page précédente ; vérifier le contenu et les sources avant publication.') });
  return normalizeProvenance(data);
}

export function referencedAssetIds(data) {
  const visible = id => data.sections.some(section => section.id === id && section.enabled);
  return [...new Set([
    data.hero.assetId, data.seo.assetId,
    ...(data.homepageTeaser.enabled ? [data.homepageTeaser.assetId] : []),
    ...(visible('methods') ? data.methods.filter(x => x.enabled).flatMap(x => x.assetIds) : []),
    ...(visible('examples') ? data.examples.filter(x => x.enabled).flatMap(x => x.assetIds) : []),
    ...(visible('gallery') ? [...data.gallery.assetIds, ...data.comparisons.filter(x => x.enabled).flatMap(x => [x.leftId, x.rightId])] : []),
  ].filter(Boolean))];
}

export function provenanceIssues(input, { publishing = false } = {}) {
  const issues = [];
  if (new TextEncoder().encode(JSON.stringify(input)).length > 512 * 1024) return ['De pagina is groter dan 512 KiB.'];
  const data = normalizeProvenance(input);
  const limits = { sections: 7, steps: 20, methods: 12, examples: 12, sources: 80, assets: 120, faq: 20, comparisons: 12 };
  for (const [key, max] of Object.entries(limits)) {
    if (data[key].length > max) issues.push(`${key}: maximaal ${max} onderdelen.`);
    const ids = new Set();
    for (const entity of data[key]) {
      if (!/^[a-zA-Z0-9_-]{1,80}$/.test(entity.id) || ids.has(entity.id)) issues.push(`${key}: ontbrekende of dubbele identifier.`);
      ids.add(entity.id);
    }
  }
  if (data.sections.length !== 7 || data.sections.some(s => !PROVENANCE_SECTIONS.includes(s.id))) issues.push('Elke paginasectie moet precies eenmaal voorkomen.');
  if (data.dossier.items.length > 20) issues.push('Maximaal 20 dossieronderdelen.');
  const assets = new Set(data.assets.map(a => a.id));
  for (const id of referencedAssetIds(data)) if (!assets.has(id)) issues.push(`Afbeelding ${id} ontbreekt in de beeldbank.`);
  const sourceIds = new Set(data.sources.filter(s => s.enabled).map(s => s.id));
  for (const source of data.sources) if (source.url && !/^https:\/\/[^\s]+$/.test(source.url)) issues.push('Bronlinks moeten met https:// beginnen.');
  const walk = value => {
    if (typeof value === 'string' && value.length > 10000) issues.push('Een tekstveld is langer dan 10.000 tekens.');
    if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(data);
  if (!publishing) return [...new Set(issues)];
  const required = (value, label) => PROVENANCE_LANGUAGES.forEach(lang => { if (!localized(value, lang).trim()) issues.push(`${label}: ${lang.toUpperCase()} ontbreekt.`); });
  const consistent = (value, label) => { if (PROVENANCE_LANGUAGES.some(l => localized(value, l).trim())) required(value, label); };
  const visible = id => data.sections.some(s => s.id === id && s.enabled);
  const requiredAsset = (id, label) => { if (!id || !assets.has(id)) issues.push(`${label}: kies een beeld uit de beeldbank.`); };
  for (const field of ['title', 'description', 'primaryLabel', 'secondaryLabel']) required(data.hero[field], `Introductie / ${field}`);
  for (const field of ['title', 'description']) required(data.seo[field], `SEO / ${field}`);
  requiredAsset(data.hero.assetId, 'Introductie / hero-afbeelding');
  requiredAsset(data.seo.assetId, 'SEO / afbeelding');
  for (const section of data.sections.filter(x => x.enabled)) { required(section.title, `Sectie ${section.id}`); consistent(section.intro, `Intro ${section.id}`); consistent(section.eyebrow, `Label ${section.id}`); }
  const fields = { steps: ['title','description'], methods: ['title','question','description','findings','limitations'], examples: ['title','question','description','findings','uncertainties'], faq: ['question','answer'] };
  for (const [key, names] of Object.entries(fields)) if (visible(key === 'steps' ? 'workflow' : key)) for (const entity of data[key].filter(x => x.enabled)) {
    names.forEach((field, i) => (i < 2 ? required : consistent)(entity[field], `${key} / ${entity.id} / ${field}`));
    for (const id of entity.sourceIds || []) if (!sourceIds.has(id)) issues.push(`${entity.id}: bron ${id} ontbreekt of is verborgen.`);
    for (const event of entity.timeline || []) { required(event.date, 'Tijdlijn / datum'); required(event.description, 'Tijdlijn / toelichting'); if (!sourceIds.has(event.sourceId)) issues.push('Elke tijdlijnvermelding heeft een zichtbare bron nodig.'); }
  }
  for (const id of referencedAssetIds(data)) {
    const asset = data.assets.find(a => a.id === id);
    if (!asset?.approved) issues.push(`Afbeelding ${id}: publieke versie nog niet goedgekeurd.`);
    if (asset) { required(asset.alt, `Afbeelding ${id} / alt-tekst`); required(asset.caption, `Afbeelding ${id} / bijschrift`); for (const field of ['credit','title','objectLabel']) consistent(asset[field], `Afbeelding ${id} / ${field}`); }
  }
  if (visible('gallery')) for (const pair of data.comparisons.filter(x => x.enabled)) {
    if (!pair.leftId || !pair.rightId || pair.leftId === pair.rightId || !pair.sameObjectConfirmed) issues.push('Vergelijking: kies twee verschillende beelden en bevestig hetzelfde object.');
    for (const field of ['title','leftLabel','rightLabel']) required(pair[field], `Vergelijking / ${field}`);
  }
  if (visible('contact')) for (const field of ['title','description','buttonLabel']) required(data.cta[field], `Contact / ${field}`);
  if (visible('dossier')) { required(data.dossier.description, 'Dossier'); for (const item of data.dossier.items) { required(item.title, 'Dossieronderdeel'); consistent(item.description, 'Dossieronderdeel / toelichting'); } }
  if (data.homepageTeaser.enabled) {
    requiredAsset(data.homepageTeaser.assetId, 'Homepage / afbeelding');
    for (const field of ['title','description','buttonLabel']) required(data.homepageTeaser[field], `Homepage / ${field}`);
  }
  for (const source of data.sources.filter(s => s.enabled)) required(source.title, 'Bron / titel');
  return [...new Set(issues)];
}

export function publicProvenance(input, media = []) {
  const data = normalizeProvenance(input);
  const refs = new Set(referencedAssetIds(data));
  data.assets = data.assets.filter(a => refs.has(a.id) && a.approved).map(asset => {
    const record = media.find(m => m.id === asset.id && m.status === 'ready');
    const variants = (record?.variants || []).map(v => ({ url: v.url, width: v.width, height: v.height }));
    const largest = variants.at(-1);
    return { ...asset, url: largest?.url || '', width: largest?.width || 0, height: largest?.height || 0, variants, srcSet: variants.map(v => `${v.url} ${v.width}w`).join(', ') };
  });
  const visible = id => data.sections.some(s => s.id === id && s.enabled);
  for (const key of ['steps','methods','examples','faq','comparisons']) data[key] = visible(key === 'steps' ? 'workflow' : key === 'comparisons' ? 'gallery' : key) ? data[key].filter(x => x.enabled) : [];
  data.sections = data.sections.filter(s => s.enabled);
  if (!visible('gallery')) data.gallery = { assetIds: [] };
  if (!visible('dossier')) data.dossier = { description: languages(), items: [] };
  if (!visible('contact')) data.cta = { title: languages(), description: languages(), buttonLabel: languages(), action: 'consultation' };
  if (!data.homepageTeaser.enabled) data.homepageTeaser = { enabled: false };
  const sources = new Set([...data.methods, ...data.examples].flatMap(e => [...e.sourceIds, ...(e.timeline || []).map(t => t.sourceId)]));
  data.sources = data.sources.filter(s => s.enabled && sources.has(s.id));
  return data;
}
