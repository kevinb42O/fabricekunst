export const UPDATE_CATEGORIES = {
  page: 'Nieuwe pagina',
  feature: 'Grote update',
  fix: 'Verbetering & oplossing',
};

const STORAGE_KEY = 'atelier-rembrandt-dashboard-updates-viewed-v1';
const validIds = (value) => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string'))].slice(-200) : [];

export function readViewedUpdates() {
  try { return validIds(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return []; }
}

export function saveViewedUpdates(ids) {
  const viewed = validIds([...readViewedUpdates(), ...ids]);
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed)); }
  catch { /* Updates remain readable when browser storage is blocked. */ }
  return viewed;
}

export const formatUpdateDate = date => new Intl.DateTimeFormat('nl-BE', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Brussels',
}).format(new Date(`${date}T12:00:00Z`));
