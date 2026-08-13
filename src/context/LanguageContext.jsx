import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_TAGS,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  getLanguageFromPath,
  localizePath,
  normalizeLanguage,
  stripLanguagePrefix
} from '../utils/locales';

const LanguageContext = createContext();

const STORAGE_KEY = 'atelier_language';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const readCookieLanguage = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)atelier_language=([^;]+)/);
  return normalizeLanguage(match ? decodeURIComponent(match[1]) : '');
};

const readSavedLanguage = () => {
  try {
    const localLanguage = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
    if (localLanguage) return localLanguage;
  } catch {
    // Cookies remain available when localStorage is blocked.
  }
  return readCookieLanguage();
};

const detectSystemLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const pathLanguage = getLanguageFromPath(window.location.pathname);
  if (pathLanguage) return pathLanguage;

  const queryLanguage = normalizeLanguage(new URLSearchParams(window.location.search).get('lang'));
  if (queryLanguage) return queryLanguage;

  const savedLanguage = readSavedLanguage();
  if (savedLanguage) return savedLanguage;

  return detectBrowserLanguage(navigator.languages || [navigator.language || '']);
};

function updateLanguageUrl(language, { replace = false } = {}) {
  if (typeof window === 'undefined') return;
  const route = stripLanguagePrefix(window.location.pathname);
  if (route === '/admin' || route.startsWith('/admin/')) return;
  const pathname = localizePath(route, language);
  const search = new URLSearchParams(window.location.search);
  search.delete('lang');
  const query = search.toString();
  const nextUrl = `${pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl === currentUrl) return;
  window.history[replace ? 'replaceState' : 'pushState']({ language }, '', nextUrl);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectSystemLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // The first-party cookie below is the persistence fallback.
    }
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(language)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
    document.documentElement.lang = LANGUAGE_TAGS[language] || language;
    updateLanguageUrl(language, { replace: true });
  }, [language]);

  useEffect(() => {
    const syncLanguageFromUrl = () => {
      const pathLanguage = getLanguageFromPath(window.location.pathname) || 'nl';
      if (pathLanguage && pathLanguage !== language) setLanguageState(pathLanguage);
    };
    const syncLanguageAcrossTabs = (event) => {
      if (event.key !== STORAGE_KEY) return;
      const savedLanguage = normalizeLanguage(event.newValue);
      if (savedLanguage && savedLanguage !== language) setLanguageState(savedLanguage);
    };
    window.addEventListener('popstate', syncLanguageFromUrl);
    window.addEventListener('storage', syncLanguageAcrossTabs);
    return () => {
      window.removeEventListener('popstate', syncLanguageFromUrl);
      window.removeEventListener('storage', syncLanguageAcrossTabs);
    };
  }, [language]);

  const setLanguage = (newLang) => {
    const languageToSet = normalizeLanguage(newLang);
    if (!SUPPORTED_LANGUAGES.includes(languageToSet) || languageToSet === language) return;
    updateLanguageUrl(languageToSet);
    setLanguageState(languageToSet);
  };

  /**
   * Safe translate helper.
   * Usage: t('nav.brandTitle') or t('voltaire.photoOf', { current: 1, total: 5 })
   */
  const t = (path, params = {}) => {
    const keys = path.split('.');
    let dict = translations[language] || translations.en;

    for (const key of keys) {
      if (dict && dict[key] !== undefined) {
        dict = dict[key];
      } else {
        // Fallback to Dutch or English if missing
        let fallbackDict = translations.nl;
        for (const fk of keys) {
          if (fallbackDict && fallbackDict[fk] !== undefined) {
            fallbackDict = fallbackDict[fk];
          } else {
            fallbackDict = null;
            break;
          }
        }
        if (fallbackDict !== null) {
          dict = fallbackDict;
        } else {
          dict = undefined;
        }
        break;
      }
    }

    if (typeof dict === 'string') {
      let result = dict;
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
      return result;
    }

    return dict;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
