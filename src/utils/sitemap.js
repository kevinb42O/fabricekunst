import { getItemSlug } from './itemSlug.js';
import { DEFAULT_SHARE_IMAGE, SITE_NAME, SITE_URL } from './seo.js';

const STATIC_ROUTES = ['/', '/collectie', '/topstukken', '/herkomst', '/voorwaarden', '/privacy'];

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function validLastmod(item) {
  const value = item?.updated_at || item?.created_at || item?.updatedAt || item?.createdAt;
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function itemEntry(item) {
  const slug = getItemSlug(item);
  if (!slug) return '';
  const loc = `${SITE_URL}/collectie/${slug}`;
  const lastmod = validLastmod(item);
  const primaryImage = (Array.isArray(item.images) ? item.images : []).find((image) => image?.url && !image.__ext__);
  const imageUrl = primaryImage?.url ? new URL(primaryImage.url, SITE_URL).href : '';
  const title = item.title || item.title_en || item.title_fr || SITE_NAME;

  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${imageUrl ? `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n      <image:title>${escapeXml(title)}</image:title>${primaryImage.caption ? `\n      <image:caption>${escapeXml(primaryImage.caption)}</image:caption>` : ''}\n    </image:image>` : ''}\n  </url>`;
}

export function buildSitemapXml(catalogItems = []) {
  const seen = new Set();
  const uniqueItems = catalogItems.filter((item) => {
    const slug = getItemSlug(item);
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });

  const staticEntries = STATIC_ROUTES.map((route) => {
    const image = route === '/'
      ? `\n    <image:image>\n      <image:loc>${escapeXml(DEFAULT_SHARE_IMAGE)}</image:loc>\n      <image:title>${escapeXml(`${SITE_NAME} — Antiquariaat & Boekenkunst`)}</image:title>\n    </image:image>`
      : '';
    return `  <url>\n    <loc>${SITE_URL}${route}</loc>${image}\n  </url>`;
  });
  const itemEntries = uniqueItems.map(itemEntry).filter(Boolean);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[...staticEntries, ...itemEntries].join('\n')}\n</urlset>\n`;
}
