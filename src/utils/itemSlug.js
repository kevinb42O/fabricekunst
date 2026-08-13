export function getItemSlug(item) {
  const title = item?.title || item?.title_en || item?.title_fr || item?.id || 'object';
  return String(title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || String(item?.id || 'object');
}

export function itemMatchesRoute(item, routeValue) {
  const normalizedRoute = decodeURIComponent(String(routeValue || '')).toLowerCase();
  return item?.id?.toLowerCase() === normalizedRoute
    || item?.ref?.toLowerCase() === normalizedRoute
    || getItemSlug(item) === normalizedRoute;
}
