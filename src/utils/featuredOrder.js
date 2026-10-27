import { isCatalogItemPublished } from './catalogPublication.js';

const rank = (item) => Number.isInteger(item?.featuredOrder) && item.featuredOrder >= 0
  ? item.featuredOrder : Number.MAX_SAFE_INTEGER;

export const compareFeaturedItems = (left, right) => {
  const difference = rank(left) - rank(right);
  if (difference) return difference;
  // The public catalog historically used creation order. Keep that fallback
  // consistent when the dashboard loads its catalog in reverse order.
  return String(left.created_at || '').localeCompare(String(right.created_at || ''));
};

export const getFeaturedItems = (items = [], { includeDrafts = false } = {}) =>
  items.filter((item) => item?.featured && (includeDrafts || isCatalogItemPublished(item)))
    .sort(compareFeaturedItems);

export const withFeaturedOrder = (items) => items.map((item, index) => ({ ...item, featuredOrder: index }));
