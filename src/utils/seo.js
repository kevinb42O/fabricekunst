import { getItemSlug } from "./itemSlug.js";
import {
  LANGUAGE_TAGS,
  getLanguageAlternates,
  localizePath,
  stripLanguagePrefix,
} from "./locales.js";
import {
  localizedProjectValue,
  publishedRembrandtProject,
} from "./rembrandtProject.js";

export const SITE_URL = "https://www.atelierrembrandt.com";
export const SITE_NAME = "Atelier Rembrandt";
export const DEFAULT_SHARE_IMAGE = `${SITE_URL}/images/provenience-light-cream-hero.jpg`;

const PAGE_COPY = {
  nl: {
    home: {
      title: "Atelier Rembrandt — Antiquarische boeken & kunst",
      description:
        "Ontdek zeldzame antiquarische boeken, prenten en historische kunstobjecten, zorgvuldig geselecteerd en gedocumenteerd op herkomst.",
    },
    catalogus: {
      title: "Collecties antiquarische boeken & kunst — Atelier Rembrandt",
      description:
        "Bekijk de actuele collecties zeldzame boeken, prenten, schilderijen en historische objecten van Atelier Rembrandt.",
    },
    topstukken: {
      title: "Topstukken — Atelier Rembrandt",
      description:
        "Ontdek de topstukken uit de collecties van Atelier Rembrandt: uitzonderlijke boeken en kunstobjecten met gedocumenteerde herkomst.",
    },
    herkomst: {
      title: "Herkomstonderzoek & provenance — Atelier Rembrandt",
      description:
        "Lees hoe Atelier Rembrandt de herkomst, authenticiteit en historische context van ieder boek en kunstobject onderzoekt.",
    },
    rembrandtProject: {
      title: "The Rembrandt Project — Atelier Rembrandt",
      description:
        "Volg het technische, kunsthistorische en herkomstonderzoek naar een intrigerend schilderij met de signatuur Rembrandt f. 1637.",
    },
    privacy: {
      title: "Privacyverklaring — Atelier Rembrandt",
      description:
        "Lees hoe Atelier Rembrandt persoonsgegevens verwerkt en beschermt.",
    },
    voorwaarden: {
      title: "Algemene voorwaarden — Atelier Rembrandt",
      description: "Lees de algemene voorwaarden van Atelier Rembrandt.",
    },
    notFound: {
      title: "Pagina niet gevonden — Atelier Rembrandt",
      description: "Deze pagina of dit object kon niet worden gevonden.",
    },
  },
  en: {
    home: {
      title: "Atelier Rembrandt — Rare books & works of art",
      description:
        "Discover rare antiquarian books, prints and historic works of art, carefully selected and documented for provenance.",
    },
    catalogus: {
      title: "Rare books & art collection — Atelier Rembrandt",
      description:
        "Explore the current collection of rare books, prints, paintings and historic objects at Atelier Rembrandt.",
    },
    topstukken: {
      title: "Highlights — Atelier Rembrandt",
      description:
        "Discover outstanding rare books and works of art from the Atelier Rembrandt collection, each with documented provenance.",
    },
    herkomst: {
      title: "Provenance research — Atelier Rembrandt",
      description:
        "Learn how Atelier Rembrandt researches the provenance, authenticity and historical context of every book and work of art.",
    },
    rembrandtProject: {
      title: "The Rembrandt Project — Atelier Rembrandt",
      description:
        "Follow the technical, art-historical and provenance investigation of an intriguing painting bearing the signature Rembrandt f. 1637.",
    },
    privacy: {
      title: "Privacy notice — Atelier Rembrandt",
      description:
        "Learn how Atelier Rembrandt processes and protects personal information.",
    },
    voorwaarden: {
      title: "Terms and conditions — Atelier Rembrandt",
      description: "Read the terms and conditions of Atelier Rembrandt.",
    },
    notFound: {
      title: "Page not found — Atelier Rembrandt",
      description: "This page or object could not be found.",
    },
  },
  fr: {
    home: {
      title: "Atelier Rembrandt — Livres rares & œuvres d’art",
      description:
        "Découvrez des livres anciens, estampes et œuvres d’art historiques, sélectionnés avec soin et documentés par leur provenance.",
    },
    catalogus: {
      title: "Collection de livres rares & d’art — Atelier Rembrandt",
      description:
        "Parcourez la collection actuelle de livres rares, estampes, tableaux et objets historiques de l’Atelier Rembrandt.",
    },
    topstukken: {
      title: "Chefs-d’œuvre — Atelier Rembrandt",
      description:
        "Découvrez les pièces majeures de la collection Atelier Rembrandt, des livres rares et œuvres d’art à la provenance documentée.",
    },
    herkomst: {
      title: "Recherche de provenance — Atelier Rembrandt",
      description:
        "Découvrez comment Atelier Rembrandt étudie la provenance, l’authenticité et le contexte historique de chaque objet.",
    },
    rembrandtProject: {
      title: "The Rembrandt Project — Atelier Rembrandt",
      description:
        "Suivez les recherches techniques, historiques et de provenance autour d’un tableau portant la signature Rembrandt f. 1637.",
    },
    privacy: {
      title: "Confidentialité — Atelier Rembrandt",
      description:
        "Découvrez comment Atelier Rembrandt traite et protège les données personnelles.",
    },
    voorwaarden: {
      title: "Conditions générales — Atelier Rembrandt",
      description: "Consultez les conditions générales de l’Atelier Rembrandt.",
    },
    notFound: {
      title: "Page introuvable — Atelier Rembrandt",
      description: "Cette page ou cet objet est introuvable.",
    },
  },
};

function localizedField(item, field, language) {
  if (!item) return "";
  if (language !== "nl" && item[`${field}_${language}`])
    return item[`${field}_${language}`];
  return item[field] || item[`${field}_en`] || item[`${field}_fr`] || "";
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const shortened = text
    .slice(0, maxLength + 1)
    .replace(/\s+\S*$/, "")
    .replace(/[\s,;:.-]+$/, "");
  return `${shortened || text.slice(0, maxLength).trim()}…`;
}

function absoluteUrl(value) {
  if (!value) return "";
  try {
    return new URL(value, SITE_URL).href;
  } catch {
    return "";
  }
}

function normalizePath(pathname) {
  const path = String(pathname || "/")
    .split("?")[0]
    .split("#")[0];
  if (path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

function parsePrice(value) {
  const raw = cleanText(value);
  if (!raw || !/[0-9]/.test(raw)) return null;
  const numeric = raw
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const price = Number.parseFloat(numeric);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function availabilityFor(status) {
  const value = cleanText(status).toLowerCase();
  if (/verkocht|sold|vendu/.test(value)) return "https://schema.org/SoldOut";
  if (/gereserveerd|reserved|réservé/.test(value))
    return "https://schema.org/LimitedAvailability";
  if (/niet beschikbaar|unavailable|indisponible/.test(value))
    return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

export function getPageKind(pathname, currentPage = "home") {
  const path = stripLanguagePrefix(normalizePath(pathname)).toLowerCase();
  if (path === "/topstukken") return "topstukken";
  if (path === "/rembrandt-project" || path === "/rembrandt-project/preview") return "rembrandtProject";
  if (currentPage === "item-detail") return "item";
  if (currentPage === "not-found") return "notFound";
  return currentPage;
}

export function buildPageSeo({
  page = "home",
  item = null,
  language = "nl",
  pathname = "/",
  items = [],
  projectData = null,
} = {}) {
  const lang = PAGE_COPY[language] ? language : "nl";
  const copy = PAGE_COPY[lang];
  const pageKind =
    page === "item" && !item
      ? "notFound"
      : page === "item"
        ? "item"
        : copy[page]
          ? page
          : "home";
  const itemTitle = localizedField(item, "title", lang);
  const itemDescription =
    localizedField(item, "description", lang) ||
    localizedField(item, "subtitle", lang);
  const itemImage = absoluteUrl(item?.images?.find((image) => image?.url)?.url);
  const routePath =
    pageKind === "item" && item
      ? `/collectie/${getItemSlug(item)}`
      : pageKind === "rembrandtProject" && stripLanguagePrefix(normalizePath(pathname)).toLowerCase() === '/rembrandt-project/preview'
        ? '/rembrandt-project'
      : stripLanguagePrefix(normalizePath(pathname));
  const canonicalPath = localizePath(routePath, lang);
  const canonical = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
  const alternates = Object.fromEntries(
    Object.entries(getLanguageAlternates(routePath)).map(([hreflang, path]) => [
      hreflang,
      `${SITE_URL}${path === "/" ? "/" : path}`,
    ]),
  );

  const project =
    pageKind === "rembrandtProject" && projectData
      ? publishedRembrandtProject(projectData)
      : null;
  const hiddenProject =
    pageKind === "rembrandtProject" && project?.isEnabled !== true;
  const effectiveCanonical = hiddenProject
    ? `${SITE_URL}${localizePath("/", lang)}`
    : canonical;
  const effectiveAlternates = hiddenProject
    ? Object.fromEntries(
        Object.entries(getLanguageAlternates("/")).map(([hreflang, path]) => [
          hreflang,
          `${SITE_URL}${path === "/" ? "/" : path}`,
        ]),
      )
    : alternates;
  const title =
    pageKind === "item" && itemTitle
      ? truncate(`${itemTitle} — ${SITE_NAME}`, 72)
      : hiddenProject
        ? copy.notFound.title
      : pageKind === "rembrandtProject"
        ? truncate(
            localizedProjectValue(
              project?.settings?.seoTitle,
              lang,
              copy.rembrandtProject.title,
            ),
            72,
          )
        : copy[pageKind]?.title || copy.home.title;
  const description =
    pageKind === "item"
      ? truncate(
          itemDescription || `${itemTitle} uit de collectie van ${SITE_NAME}.`,
          158,
        )
      : hiddenProject
        ? copy.notFound.description
      : pageKind === "rembrandtProject"
        ? truncate(
            localizedProjectValue(
              project?.settings?.seoDescription,
              lang,
              copy.rembrandtProject.description,
            ),
            158,
          )
        : copy[pageKind]?.description || copy.home.description;

  return {
    title,
    description,
    canonical: effectiveCanonical,
    image:
      itemImage ||
      absoluteUrl(
        project?.settings?.socialImage || project?.settings?.heroImage,
      ) ||
      DEFAULT_SHARE_IMAGE,
    imageAlt: pageKind === "item" ? itemTitle : title,
    type: pageKind === "item" ? "product" : "website",
    language: lang,
    locale: LANGUAGE_TAGS[lang],
    alternates: effectiveAlternates,
    robots:
      pageKind === "notFound" ||
      hiddenProject ||
      stripLanguagePrefix(normalizePath(pathname)).toLowerCase() === '/rembrandt-project/preview' ||
      (pageKind === "rembrandtProject" && project?.isEnabled !== true)
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    structuredData: buildStructuredData({
      page: hiddenProject ? "notFound" : pageKind,
      item,
      language: lang,
      canonical: effectiveCanonical,
      items,
      projectData: project,
    }),
  };
}

export function buildStructuredData({
  page,
  item,
  language = "nl",
  canonical,
  items = [],
  projectData = null,
}) {
  const inLanguage = LANGUAGE_TAGS[language] || LANGUAGE_TAGS.nl;
  const publicProject =
    page === "rembrandtProject" && projectData
      ? publishedRembrandtProject(projectData)
      : null;
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name:
        page === "item" && item
          ? localizedField(item, "title", language)
          : PAGE_COPY[language]?.[page]?.title,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      inLanguage,
    },
  ];

  if (page !== "home" && page !== "notFound") {
    const labels =
      language === "fr"
        ? { home: "Accueil", collection: "Collections" }
        : language === "en"
          ? { home: "Home", collection: "Collections" }
          : { home: "Home", collection: "Collecties" };
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        position: 1,
        name: labels.home,
        item: `${SITE_URL}${localizePath("/", language)}`,
      },
    ];
    if (page === "item") {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: labels.collection,
        item: `${SITE_URL}${localizePath("/collectie", language)}`,
      });
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: localizedField(item, "title", language),
        item: canonical,
      });
    } else {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: PAGE_COPY[language]?.[page]?.title || SITE_NAME,
        item: canonical,
      });
    }
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: breadcrumbItems,
    });
  }

  if (page === "catalogus" && items.length) {
    graph.push({
      "@type": "ItemList",
      "@id": `${canonical}#collection`,
      name: PAGE_COPY[language].catalogus.title,
      numberOfItems: items.length,
      itemListElement: items.map((catalogItem, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: localizedField(catalogItem, "title", language),
        url: `${SITE_URL}${localizePath(`/collectie/${getItemSlug(catalogItem)}`, language)}`,
      })),
    });
  }

  if (page === "rembrandtProject" && publicProject?.isEnabled === true) {
    graph[0]["@type"] = "AboutPage";
    graph[0].name = localizedProjectValue(
      publicProject.settings?.title,
      language,
      "The Rembrandt Project",
    );
    graph[0].description = localizedProjectValue(
      publicProject.settings?.intro,
      language,
      "",
    );
    graph.push({
      "@type": "ItemList",
      "@id": `${canonical}#research-updates`,
      name: localizedProjectValue(
        publicProject.settings?.title,
        language,
        "The Rembrandt Project",
      ),
      numberOfItems: publicProject.updates.length,
      itemListElement: publicProject.updates.map((update, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Article",
          "@id": `${canonical}#update-${update.slug}`,
          headline: localizedProjectValue(update.title, language, ""),
          description: localizedProjectValue(update.summary, language, ""),
          datePublished: update.publishedAt || update.eventDate,
          dateModified: update.publishedAt || update.eventDate,
          inLanguage,
          isPartOf: { "@id": `${canonical}#webpage` },
        },
      })),
    });
  }

  if (page === "item" && item) {
    const price = parsePrice(item.price);
    const images = (Array.isArray(item.images) ? item.images : [])
      .filter((image) => image?.url && !image.__ext__)
      .map((image) => absoluteUrl(image.url))
      .filter(Boolean);
    // Google Product rich results require an Offer, review, or aggregateRating.
    // "Prijs op aanvraag" is deliberately a non-price value managed in the admin
    // dashboard, so do not publish incomplete Product markup for those items.
    if (price) {
      graph.push({
        "@type": "Product",
        "@id": `${canonical}#product`,
        url: canonical,
        name: localizedField(item, "title", language),
        description: truncate(
          localizedField(item, "description", language) ||
            localizedField(item, "subtitle", language),
          5000,
        ),
        image: images,
        sku: item.ref || item.id,
        category: localizedField(item, "category", language) || item.category,
        itemCondition: "https://schema.org/UsedCondition",
        brand: { "@type": "Brand", name: SITE_NAME },
        seller: { "@id": `${SITE_URL}/#organization` },
        offers: {
          "@type": "Offer",
          url: canonical,
          price,
          priceCurrency: "EUR",
          availability: availabilityFor(item.status),
          itemCondition: "https://schema.org/UsedCondition",
          seller: { "@id": `${SITE_URL}/#organization` },
        },
      });
    }
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function setMeta(selector, attribute, value, keyAttribute, keyValue) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(keyAttribute, keyValue);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

export function applySeoToDocument(seo) {
  document.title = seo.title;
  document.documentElement.lang =
    seo.language === "nl" ? "nl-BE" : seo.language;
  setMeta(
    'meta[name="description"]',
    "content",
    seo.description,
    "name",
    "description",
  );
  setMeta('meta[name="robots"]', "content", seo.robots, "name", "robots");
  setMeta(
    'meta[property="og:title"]',
    "content",
    seo.title,
    "property",
    "og:title",
  );
  setMeta(
    'meta[property="og:description"]',
    "content",
    seo.description,
    "property",
    "og:description",
  );
  setMeta(
    'meta[property="og:type"]',
    "content",
    seo.type,
    "property",
    "og:type",
  );
  setMeta(
    'meta[property="og:url"]',
    "content",
    seo.canonical,
    "property",
    "og:url",
  );
  setMeta(
    'meta[property="og:image"]',
    "content",
    seo.image,
    "property",
    "og:image",
  );
  setMeta(
    'meta[property="og:image:alt"]',
    "content",
    seo.imageAlt,
    "property",
    "og:image:alt",
  );
  setMeta(
    'meta[property="og:locale"]',
    "content",
    seo.locale.replace("-", "_"),
    "property",
    "og:locale",
  );
  setMeta(
    'meta[name="twitter:title"]',
    "content",
    seo.title,
    "name",
    "twitter:title",
  );
  setMeta(
    'meta[name="twitter:description"]',
    "content",
    seo.description,
    "name",
    "twitter:description",
  );
  setMeta(
    'meta[name="twitter:image"]',
    "content",
    seo.image,
    "name",
    "twitter:image",
  );
  setMeta(
    'meta[name="twitter:image:alt"]',
    "content",
    seo.imageAlt,
    "name",
    "twitter:image:alt",
  );

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = seo.canonical;

  document.head
    .querySelectorAll("link[data-seo-alternate]")
    .forEach((element) => element.remove());
  for (const [hreflang, href] of Object.entries(seo.alternates)) {
    const alternate = document.createElement("link");
    alternate.rel = "alternate";
    alternate.hreflang = hreflang;
    alternate.href = href;
    alternate.dataset.seoAlternate = "true";
    document.head.appendChild(alternate);
  }

  let structuredData = document.getElementById("page-structured-data");
  if (!structuredData) {
    structuredData = document.createElement("script");
    structuredData.id = "page-structured-data";
    structuredData.type = "application/ld+json";
    document.head.appendChild(structuredData);
  }
  structuredData.textContent = JSON.stringify(seo.structuredData);
}
