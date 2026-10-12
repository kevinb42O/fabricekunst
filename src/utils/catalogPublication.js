// Legacy catalog entries remain published until explicitly saved as a draft.
export const isCatalogItemPublished = (item) =>
  typeof item?.is_published === "boolean"
    ? item.is_published
    : item?.isPublished !== false;

export const getCatalogItemStatus = (item) =>
  isCatalogItemPublished(item) ? item.status || "Beschikbaar" : "Concept";

export const withCatalogItemStatus = (item, selection) => ({
  ...item,
  status: selection === "Concept" ? item.status || "Beschikbaar" : selection,
  isPublished: selection !== "Concept",
  is_published: selection !== "Concept",
});

export const needsCatalogPublication = (item, previousItem) =>
  isCatalogItemPublished(item) &&
  (!previousItem || !isCatalogItemPublished(previousItem));

export const hasCatalogPhoto = (item) =>
  Boolean(item?.image || item?.images?.some((image) => image?.url && !image.__ext__));

// The canonical database flag wins over an older extension payload.
export const mergeCatalogItemExtension = (item, extension) => ({
  ...item,
  ...(extension && typeof extension === "object" && !Array.isArray(extension) ? extension : {}),
  is_published: isCatalogItemPublished(item),
  isPublished: isCatalogItemPublished(item),
});
