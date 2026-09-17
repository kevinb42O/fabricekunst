const localizedValues = (value) =>
  Object.values(value || {}).filter((entry) => typeof entry === "string");

/**
 * Makes editorial search forgiving without storing a second, lossy index.
 * Diacritics, punctuation and case never force an editor to remember an exact
 * spelling ("Oeuvres", "Œuvres" and "oeuvres" all find the same record).
 */
export const normalizeMediaSearchText = (value) =>
  String(value || "")
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const mediaTitle = (asset, language = "nl") =>
  asset?.metadata?.title?.[language] ||
  asset?.metadata?.title?.nl ||
  asset?.filename ||
  "Naamloos beeld";

/** The API normally returns variants in ascending order, but choosing by width
 * keeps every editor resilient to imported or manually repaired records. */
export const preferredMediaVariantUrl = (asset) =>
  [...(asset?.variants || [])]
    .filter((variant) => typeof variant?.url === "string" && variant.url)
    .sort((left, right) => Number(right.width || 0) - Number(left.width || 0))[0]
    ?.url || "";

export const catalogContextsFor = (asset) =>
  Array.isArray(asset?.catalog_contexts) ? asset.catalog_contexts : [];

const statusMatches = (asset, status) => {
  if (status === "all") return true;
  if (status === "ready") return asset.status === "ready";
  if (status === "draft")
    return asset.status !== "ready" && asset.status !== "archived";
  return asset.status === "archived";
};

const scopeMatches = (asset, scope) => {
  const usages = asset.media_asset_usages || [];
  if (scope === "all") return true;
  if (scope === "unused") return usages.length === 0;
  if (scope === "collection")
    return usages.some((usage) => usage.consumer_type === "catalog");
  if (scope === "provenance")
    return usages.some((usage) => usage.consumer_type === "provenance");
  if (scope === "rembrandt-project")
    return usages.some((usage) => usage.consumer_type === "rembrandt-project");
  if (scope === "site")
    return usages.some((usage) => usage.consumer_type === "site");
  return true;
};

const firstContext = (asset) => catalogContextsFor(asset)[0] || null;
const contextText = (context) =>
  [
    context?.title,
    context?.title_en,
    context?.title_fr,
    context?.author,
    context?.year,
    context?.item_type,
    context?.collection_group,
    ...(context?.placements || []),
  ]
    .filter(Boolean)
    .join(" ");

const searchableText = (asset) =>
  normalizeMediaSearchText([
    asset.filename,
    asset.id,
    ...localizedValues(asset.metadata?.title),
    ...localizedValues(asset.metadata?.caption),
    ...localizedValues(asset.metadata?.alt),
    ...localizedValues(asset.metadata?.objectLabel),
    asset.metadata?.rights,
    asset.metadata?.source,
    ...(asset.metadata?.tags || []),
    ...catalogContextsFor(asset).map(contextText),
  ].filter(Boolean).join(" "));

const relevanceFor = (asset, rawQuery) => {
  const query = normalizeMediaSearchText(rawQuery);
  if (!query) return 0;
  const title = normalizeMediaSearchText(mediaTitle(asset));
  const filename = normalizeMediaSearchText(asset.filename);
  const contexts = catalogContextsFor(asset);
  const context = normalizeMediaSearchText(contexts.map(contextText).join(" "));
  const all = searchableText(asset);
  let score = all.includes(query) ? 30 : 0;
  if (title.includes(query)) score += 110;
  if (title === query) score += 200;
  if (filename.includes(query)) score += 80;
  if (context.includes(query)) score += 70;
  for (const term of query.split(" ")) {
    if (title.includes(term)) score += 15;
    if (context.includes(term)) score += 10;
  }
  return score;
};

const compareText = (left, right) =>
  String(left || "").localeCompare(String(right || ""), "nl", {
    sensitivity: "base",
    numeric: true,
  });

/**
 * One deterministic search and filtering pipeline for the library and all
 * consumer pickers. Returning score alongside the asset keeps sorting explicit
 * and lets the UI add more views without duplicating matching rules.
 */
export const findMediaAssets = (
  media,
  {
    query = "",
    status = "all",
    scope = "all",
    collectionGroup = "",
    workId = "",
    sort = "relevance",
    readyOnly = false,
  } = {},
) => {
  const terms = normalizeMediaSearchText(query).split(" ").filter(Boolean);
  const results = (media || [])
    .filter((asset) => !readyOnly || asset.status === "ready")
    .filter((asset) => statusMatches(asset, status))
    .filter((asset) => scopeMatches(asset, scope))
    .filter((asset) => {
      const contexts = catalogContextsFor(asset);
      return !collectionGroup || contexts.some((context) => context.collection_group === collectionGroup);
    })
    .filter((asset) => !workId || catalogContextsFor(asset).some((context) => context.item_id === workId))
    .map((asset) => ({ asset, score: relevanceFor(asset, query) }))
    .filter(({ asset }) => {
      const haystack = searchableText(asset);
      return terms.every((term) => haystack.includes(term));
    });

  return results.sort((left, right) => {
    const leftContext = firstContext(left.asset);
    const rightContext = firstContext(right.asset);
    if (sort === "title") {
      return compareText(mediaTitle(left.asset), mediaTitle(right.asset));
    }
    if (sort === "usage") {
      const difference = (right.asset.media_asset_usages?.length || 0) - (left.asset.media_asset_usages?.length || 0);
      return difference || compareText(mediaTitle(left.asset), mediaTitle(right.asset));
    }
    if (sort === "collection") {
      return compareText(leftContext?.collection_group, rightContext?.collection_group) ||
        compareText(leftContext?.title, rightContext?.title) ||
        compareText(mediaTitle(left.asset), mediaTitle(right.asset));
    }
    if (sort === "oldest") {
      return new Date(left.asset.created_at || 0) - new Date(right.asset.created_at || 0);
    }
    if (sort === "recent") {
      return new Date(right.asset.updated_at || right.asset.created_at || 0) - new Date(left.asset.updated_at || left.asset.created_at || 0);
    }
    if (terms.length) {
      return right.score - left.score || compareText(mediaTitle(left.asset), mediaTitle(right.asset));
    }
    return new Date(right.asset.updated_at || right.asset.created_at || 0) - new Date(left.asset.updated_at || left.asset.created_at || 0);
  });
};

export const collectionGroupsFor = (media) =>
  [...new Set((media || []).flatMap(catalogContextsFor).map((context) => context.collection_group).filter(Boolean))]
    .sort(compareText);

export const collectionWorksFor = (media, collectionGroup = "") => {
  const works = new Map();
  for (const context of (media || []).flatMap(catalogContextsFor)) {
    if (!context?.item_id || (collectionGroup && context.collection_group !== collectionGroup)) continue;
    works.set(context.item_id, context);
  }
  return [...works.values()].sort((left, right) => compareText(left.title, right.title));
};

export const groupMediaByCollection = (results) => {
  const groups = new Map();
  for (const result of results || []) {
    const contexts = catalogContextsFor(result.asset);
    // A reusable image may legitimately belong to more than one work. In the
    // grouped view it must appear under each truthful work, never be silently
    // assigned to whichever context happened to be first in the API response.
    for (const context of contexts.length ? contexts : [null]) {
      const key = context?.item_id || "unassigned";
      const label = context?.title || "Niet aan een collectiewerk gekoppeld";
      const group = groups.get(key) || { key, label, context, results: [] };
      group.results.push({ ...result, context });
      groups.set(key, group);
    }
  }
  return [...groups.values()].sort((left, right) => {
    if (left.key === "unassigned") return 1;
    if (right.key === "unassigned") return -1;
    return compareText(left.context?.collection_group, right.context?.collection_group) || compareText(left.label, right.label);
  });
};
