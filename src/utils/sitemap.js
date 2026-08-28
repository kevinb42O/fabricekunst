import { getItemSlug } from "./itemSlug.js";
import { DEFAULT_SHARE_IMAGE, SITE_NAME, SITE_URL } from "./seo.js";
import {
  SUPPORTED_LANGUAGES,
  getLanguageAlternates,
  localizePath,
} from "./locales.js";

const STATIC_ROUTES = [
  "/",
  "/collectie",
  "/topstukken",
  "/herkomst",
  "/voorwaarden",
  "/privacy",
];

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function validLastmod(item) {
  const value =
    item?.updated_at || item?.created_at || item?.updatedAt || item?.createdAt;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function alternateLinks(route) {
  return Object.entries(getLanguageAlternates(route))
    .map(
      ([hreflang, path]) =>
        `\n    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(`${SITE_URL}${path}`)}" />`,
    )
    .join("");
}

function itemEntry(item, language) {
  const slug = getItemSlug(item);
  if (!slug) return "";
  const route = `/collectie/${slug}`;
  const loc = `${SITE_URL}${localizePath(route, language)}`;
  const lastmod = validLastmod(item);
  const primaryImage = (Array.isArray(item.images) ? item.images : []).find(
    (image) => image?.url && !image.__ext__,
  );
  const imageUrl = primaryImage?.url
    ? new URL(primaryImage.url, SITE_URL).href
    : "";
  const title =
    (language !== "nl" && item[`title_${language}`]) ||
    item.title ||
    item.title_en ||
    item.title_fr ||
    SITE_NAME;

  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${alternateLinks(route)}${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}${imageUrl ? `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n      <image:title>${escapeXml(title)}</image:title>${primaryImage.caption ? `\n      <image:caption>${escapeXml(primaryImage.caption)}</image:caption>` : ""}\n    </image:image>` : ""}\n  </url>`;
}

export function buildSitemapXml(
  catalogItems = [],
  { rembrandtProject = null } = {},
) {
  const seen = new Set();
  const uniqueItems = catalogItems.filter((item) => {
    const slug = getItemSlug(item);
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });

  const routes =
    rembrandtProject?.isEnabled === true
      ? [...STATIC_ROUTES, "/rembrandt-project"]
      : STATIC_ROUTES;
  const staticEntries = routes.flatMap((route) =>
    SUPPORTED_LANGUAGES.map((language) => {
      const localizedRoute = localizePath(route, language);
      const image =
        route === "/"
          ? `\n    <image:image>\n      <image:loc>${escapeXml(DEFAULT_SHARE_IMAGE)}</image:loc>\n      <image:title>${escapeXml(`${SITE_NAME} — Antiquariaat & Boekenkunst`)}</image:title>\n    </image:image>`
          : "";
      const lastmod =
        route === "/rembrandt-project" ? validLastmod(rembrandtProject) : "";
      return `  <url>\n    <loc>${SITE_URL}${localizedRoute}</loc>${alternateLinks(route)}${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}${image}\n  </url>`;
    }),
  );
  const itemEntries = uniqueItems
    .flatMap((item) =>
      SUPPORTED_LANGUAGES.map((language) => itemEntry(item, language)),
    )
    .filter(Boolean);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...staticEntries, ...itemEntries].join("\n")}\n</urlset>\n`;
}
