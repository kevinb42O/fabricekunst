import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'atelier_language';

const detectSystemLanguage = () => {
  if (typeof window === 'undefined') return 'en';

  const savedLang = localStorage.getItem(STORAGE_KEY);
  if (savedLang && ['nl', 'en', 'fr'].includes(savedLang)) {
    return savedLang;
  }

  const browserLangs = navigator.languages || [navigator.language || ''];
  for (const lang of browserLangs) {
    const l = lang.toLowerCase();
    if (l.startsWith('nl')) return 'nl';
    if (l.startsWith('fr')) return 'fr';
    if (l.startsWith('en')) return 'en';
  }

  // Fallback for any other system language is English, as instructed
  return 'en';
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectSystemLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (e) {
      console.warn('Could not save language preference to localStorage:', e);
    }
  }, [language]);

  const setLanguage = (newLang) => {
    if (['nl', 'en', 'fr'].includes(newLang)) {
      setLanguageState(newLang);
    }
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
