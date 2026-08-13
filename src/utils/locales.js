export const SUPPORTED_LANGUAGES = ['nl', 'en', 'fr'];
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_TAGS = { nl: 'nl-BE', en: 'en', fr: 'fr' };

export function normalizeLanguage(value) {
  const language = String(value || '').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(language) ? language : '';
}

export function getLanguageFromPath(pathname) {
  const firstSegment = String(pathname || '/').split('/').filter(Boolean)[0];
  return normalizeLanguage(firstSegment);
}

export function stripLanguagePrefix(pathname) {
  const path = `/${String(pathname || '/').replace(/^\/+/, '')}`;
  const language = getLanguageFromPath(path);
  if (!language) return path === '//' ? '/' : path;
  const stripped = path.replace(new RegExp(`^/${language}(?=/|$)`, 'i'), '') || '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

export function localizePath(pathname, language) {
  const cleanPath = stripLanguagePrefix(pathname).replace(/\/{2,}/g, '/');
  const normalizedPath = cleanPath === '/' ? '/' : cleanPath.replace(/\/$/, '');
  const lang = normalizeLanguage(language) || DEFAULT_LANGUAGE;
  if (normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) return normalizedPath;
  if (lang === 'nl') return normalizedPath;
  return normalizedPath === '/' ? `/${lang}` : `/${lang}${normalizedPath}`;
}

export function getLanguageAlternates(pathname) {
  const route = stripLanguagePrefix(pathname);
  return {
    'nl-BE': localizePath(route, 'nl'),
    en: localizePath(route, 'en'),
    fr: localizePath(route, 'fr'),
    'x-default': localizePath(route, 'nl')
  };
}

export function detectBrowserLanguage(languages = []) {
  for (const value of languages) {
    const language = normalizeLanguage(value);
    if (language) return language;
  }
  return DEFAULT_LANGUAGE;
}
