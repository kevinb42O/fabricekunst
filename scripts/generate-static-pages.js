import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCatalogForBuild } from './catalog-source.js';
import { buildPageSeo, getPageKind } from '../src/utils/seo.js';
import { getItemSlug } from '../src/utils/itemSlug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const shellPath = path.join(distDir, 'index.html');

if (!fs.existsSync(shellPath)) {
  throw new Error('dist/index.html is missing. Run this script after the Vite build.');
}

const shell = fs.readFileSync(shellPath, 'utf8');
const { items, source } = await loadCatalogForBuild();

function escapeAttribute(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function replaceMeta(html, selector, content) {
  const escaped = escapeAttribute(content);
  const attribute = selector.startsWith('og:') ? 'property' : 'name';
  const expression = new RegExp(`<meta\\s+${attribute}=["']${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${selector}" content="${escaped}" />`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderSeoHtml(seo) {
  let html = shell.replace(/<html\b([^>]*)\blang=["'][^"']*["']([^>]*)>/i, `<html$1lang="${escapeAttribute(seo.locale)}"$2>`);
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttribute(seo.title)}</title>`);
  html = replaceMeta(html, 'description', seo.description);
  html = replaceMeta(html, 'robots', seo.robots);
  html = replaceMeta(html, 'og:title', seo.title);
  html = replaceMeta(html, 'og:description', seo.description);
  html = replaceMeta(html, 'og:type', seo.type);
  html = replaceMeta(html, 'og:url', seo.canonical);
  html = replaceMeta(html, 'og:image', seo.image);
  html = replaceMeta(html, 'og:image:alt', seo.imageAlt);
  html = replaceMeta(html, 'og:locale', seo.locale.replace('-', '_'));
  html = replaceMeta(html, 'twitter:title', seo.title);
  html = replaceMeta(html, 'twitter:description', seo.description);
  html = replaceMeta(html, 'twitter:image', seo.image);
  html = replaceMeta(html, 'twitter:image:alt', seo.imageAlt);

  const canonicalTag = `<link rel="canonical" href="${escapeAttribute(seo.canonical)}" />`;
  html = /<link\s+rel=["']canonical["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag)
    : html.replace('</head>', `    ${canonicalTag}\n  </head>`);

  const json = JSON.stringify(seo.structuredData).replace(/</g, '\\u003c');
  const pageData = `<script id="page-structured-data" type="application/ld+json">${json}</script>`;
  html = html.replace('</head>', `    ${pageData}\n  </head>`);
  return html;
}

function writePage(route, page, item = null) {
  const seo = buildPageSeo({ page, item, language: 'nl', pathname: route, items });
  const outputDir = route === '/' ? distDir : path.join(distDir, route.replace(/^\//, ''));
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderSeoHtml(seo), 'utf8');
}

const staticRoutes = [
  { route: '/', page: 'home' },
  { route: '/collectie', page: 'catalogus' },
  { route: '/topstukken', page: 'topstukken' },
  { route: '/herkomst', page: 'herkomst' },
  { route: '/voorwaarden', page: 'voorwaarden' },
  { route: '/privacy', page: 'privacy' }
];
for (const { route, page } of staticRoutes) writePage(route, getPageKind(route, page));

const seenSlugs = new Set();
for (const item of items) {
  const slug = getItemSlug(item);
  if (!slug || seenSlugs.has(slug)) continue;
  seenSlugs.add(slug);
  writePage(`/collectie/${slug}`, 'item', item);
}

console.log(`Generated SEO HTML for ${staticRoutes.length} pages and ${seenSlugs.size} catalog items from ${source}.`);
