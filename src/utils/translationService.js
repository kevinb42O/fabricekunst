/**
 * Atelier Rembrandt — Antiquarian Translation Service
 * Specialized multi-language translation engine with bibliofilie glossary support
 */

export const ANTIQUARIAN_GLOSSARY = {
  en: {
    "chagrin halfleer": "half shagreen leather",
    "chagrin-leder": "shagreen leather",
    "rood chagrin": "red shagreen",
    "kopergravures": "copper engravings",
    "kopergravure": "copper engraving",
    "koperetsing": "copper etching",
    "koperetsingen": "copper etchings",
    "ex-libris": "ex-libris bookplate",
    "ex-libris vignet": "armorial bookplate",
    "gemarmerde schutbladen": "marbled endpapers",
    "gemarmerd schutblad": "marbled endpaper",
    "goudstempels": "gold-tooled motifs",
    "goudstempeling": "gold tooling",
    "goudgestempeld": "gold-tooled",
    "goudgestempelde": "gold-tooled",
    "scheppapier": "handmade laid paper",
    "lompenhoudend scheppapier": "rag laid paper",
    "volleder": "full leather",
    "kalfsleder": "calfskin leather",
    "kalfsleer": "calfskin leather",
    "marokijn": "morocco leather",
    "katernen": "gatherings",
    "in-8°": "octavo (In-8°)",
    "in-4°": "quarto (In-4°)",
    "in-folio": "folio (In-folio)",
    "verlichtingserfgoed": "enlightenment heritage",
    "oude meesters": "Old Masters",
    "prijs op aanvraag": "Price on request",
    "gecureerde": "curated",
    "bewezen herkomst": "documented provenance",
    "echtheidscertificaat": "Certificate of Authenticity"
  },
  fr: {
    "chagrin halfleer": "demi-chagrin",
    "chagrin-leder": "cuir chagrin",
    "rood chagrin": "chagrin rouge",
    "kopergravures": "gravures sur cuivre",
    "kopergravure": "gravure sur cuivre",
    "koperetsing": "eau-forte sur cuivre",
    "koperetsingen": "eaux-fortes sur cuivre",
    "ex-libris": "ex-libris",
    "ex-libris vignet": "vignette ex-libris",
    "gemarmerde schutbladen": "gardes marbrées",
    "gemarmerd schutblad": "garde marbrée",
    "goudstempels": "fers dorés à l'or",
    "goudstempeling": "dorure à l'or",
    "goudgestempeld": "doré à l'or",
    "goudgestempelde": "doré à l'or",
    "scheppapier": "papier vergé fait main",
    "lompenhoudend scheppapier": "papier vergé de chiffons",
    "volleder": "plein cuir",
    "kalfsleder": "plein veau d'époque",
    "kalfsleer": "veau d'époque",
    "marokijn": "maroquin",
    "katernen": "cahiers",
    "in-8°": "in-8°",
    "in-4°": "in-4°",
    "in-folio": "in-folio",
    "verlichtingserfgoed": "patrimoine des Lumières",
    "oude meesters": "Maîtres Anciens",
    "prijs op aanvraag": "Prix sur demande",
    "gecureerde": "sélectionnée",
    "bewezen herkomst": "provenance documentée",
    "echtheidscertificaat": "Certificat d'Authenticité"
  }
};

export const CENTURY_TRANSLATIONS = {
  en: {
    '16e Eeuw': '16th Century',
    '17e Eeuw': '17th Century',
    '18e Eeuw': '18th Century',
    '19e Eeuw': '19th Century',
    '20e Eeuw': '20th Century',
  },
  fr: {
    '16e Eeuw': '16e Siècle',
    '17e Eeuw': '17e Siècle',
    '18e Eeuw': '18e Siècle',
    '19e Eeuw': '19e Siècle',
    '20e Eeuw': '20e Siècle',
  }
};

export const CATEGORY_TRANSLATIONS = {
  en: {
    'Literatuur & Filosofie': 'Literature & Philosophy',
    'Literatuur & Satire': 'Literature & Satire',
    'Wetenschap & Illustraties': 'Science & Illustrations',
    'Kartografie & Reizen': 'Cartography & Travels',
    'Bijbels & Religie': 'Bibles & Religion',
    'Klassieke Oudheid': 'Classical Antiquity',
    'Oude Meesters': 'Old Masters',
    '19e-Eeuwse Schilderkunst': '19th-Century Painting',
    'Portretten & Miniaturen': 'Portraits & Miniatures',
    'Stillevens & Landschappen': 'Still Lifes & Landscapes',
    'Religieuze Kunst & Iconen': 'Religious Art & Icons',
    'Grafiek & Tekeningen': 'Prints & Drawings',
  },
  fr: {
    'Literatuur & Filosofie': 'Littérature & Philosophie',
    'Literatuur & Satire': 'Littérature & Satire',
    'Wetenschap & Illustraties': 'Science & Illustrations',
    'Kartografie & Reizen': 'Cartographie & Voyages',
    'Bijbels & Religie': 'Bibles & Religion',
    'Klassieke Oudheid': 'Antiquité Classique',
    'Oude Meesters': 'Maîtres Anciens',
    '19e-Eeuwse Schilderkunst': 'Peinture du XIXe Siècle',
    'Portretten & Miniaturen': 'Portraits & Miniatures',
    'Stillevens & Landschappen': 'Natures Mortes & Paysages',
    'Religieuze Kunst & Iconen': 'Art Religieux & Icônes',
    'Grafiek & Tekeningen': 'Estampes & Dessins',
  }
};

export function getLocalizedCentury(century, language = 'nl') {
  if (!century) return '';
  if (language === 'nl') return century;
  return CENTURY_TRANSLATIONS[language]?.[century] || century;
}

export function getLocalizedCategory(category, language = 'nl') {
  if (!category) return '';
  if (language === 'nl') return category;
  return CATEGORY_TRANSLATIONS[language]?.[category] || category;
}

/**
 * Translates a given text to targetLang ('en' | 'fr')
 * Applies glossary replacements to ensure precise bibliofilie jargon.
 */
export async function autoTranslateText(text, targetLang = 'en') {
  if (!text || typeof text !== 'string' || text.trim() === '') return '';
  if (targetLang === 'nl') return text;

  try {
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=nl|${targetLang}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Translation API request failed');

    const data = await response.json();
    let translated = data?.responseData?.translatedText || text;

    const glossary = ANTIQUARIAN_GLOSSARY[targetLang] || {};
    Object.keys(glossary).forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      translated = translated.replace(regex, glossary[term]);
    });

    return translated;
  } catch (error) {
    console.warn(`Translation API warning (${targetLang}):`, error);
    
    let fallbackText = text;
    const glossary = ANTIQUARIAN_GLOSSARY[targetLang] || {};
    Object.keys(glossary).forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      fallbackText = fallbackText.replace(regex, glossary[term]);
    });
    return fallbackText;
  }
}

/**
 * Auto-translates all text fields of an item to both English and French.
 * Returns an object with the updated EN and FR fields.
 */
export async function autoTranslateItemFields(item) {
  if (!item) return {};

  const [
    title_en, title_fr,
    subtitle_en, subtitle_fr,
    description_en, description_fr,
    provenance_en, provenance_fr,
    condition_report_en, condition_report_fr
  ] = await Promise.all([
    autoTranslateText(item.title, 'en'),
    autoTranslateText(item.title, 'fr'),
    autoTranslateText(item.subtitle, 'en'),
    autoTranslateText(item.subtitle, 'fr'),
    autoTranslateText(item.description, 'en'),
    autoTranslateText(item.description, 'fr'),
    autoTranslateText(item.provenance, 'en'),
    autoTranslateText(item.provenance, 'fr'),
    autoTranslateText(item.conditionReport || item.condition_report, 'en'),
    autoTranslateText(item.conditionReport || item.condition_report, 'fr')
  ]);

  return {
    ...item,
    title_en,
    title_fr,
    subtitle_en,
    subtitle_fr,
    description_en,
    description_fr,
    provenance_en,
    provenance_fr,
    condition_report_en: condition_report_en,
    condition_report_fr: condition_report_fr,
    conditionReport_en: condition_report_en,
    conditionReport_fr: condition_report_fr
  };
}

/**
 * Helper to safely extract the translated or fallback text field from an item
 * Usage: getItemField(item, 'title', language)
 */
export function getItemField(item, field, language = 'nl') {
  if (!item) return '';
  if (language === 'nl') return item[field] || '';

  const localizedKey = `${field}_${language}`;
  if (item[localizedKey] && item[localizedKey].trim() !== '') {
    return item[localizedKey];
  }

  return item[field] || '';
}
