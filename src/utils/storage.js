import { INITIAL_CATALOG } from '../data/initialCatalog';
import { getCategorySlug, getCollectionGroupForItem, normalizeCatalogItemTaxonomy } from '../data/catalogTaxonomy';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const CATALOG_KEY = 'atelier_rembrandt_catalog';
const INQUIRIES_KEY = 'atelier_rembrandt_inquiries';
const OLD_CATALOG_KEY_2 = 'rare_art_books_catalog';
const OLD_INQUIRIES_KEY_2 = 'rare_art_books_inquiries';
const OLD_CATALOG_KEY = 'fabrice_boeken_kunst_catalog';
const OLD_INQUIRIES_KEY = 'fabrice_boeken_kunst_inquiries';

const HERO_IMAGE_KEY = 'atelier_rembrandt_hero_image';
const MOBILE_HERO_IMAGE_KEY = 'atelier_rembrandt_mobile_hero_image';
export const DEFAULT_HERO_IMAGE = '/images/provenience-light-cream-hero.jpg';
export const DEFAULT_MOBILE_HERO_IMAGE = '/images/hero/hero-scarron-engraving.jpg';

export const getHeroImage = () => {
  try {
    const saved = localStorage.getItem(HERO_IMAGE_KEY);
    if (saved && typeof saved === 'string' && saved.trim() !== '') return saved;
    return DEFAULT_HERO_IMAGE;
  } catch (err) {
    console.error("Fout bij ophalen hero image:", err);
    return DEFAULT_HERO_IMAGE;
  }
};

export const fetchHeroImageAsync = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'hero_image')
        .maybeSingle();

      if (!error && data && data.value) {
        localStorage.setItem(HERO_IMAGE_KEY, data.value);
        return data.value;
      }
    } catch (err) {
      console.error("Fout bij ophalen hero image van Supabase:", err);
    }
  }
  return getHeroImage();
};

export const saveHeroImageAsync = async (imageUrl) => {
  try {
    localStorage.setItem(HERO_IMAGE_KEY, imageUrl);
  } catch (err) {
    console.error("Fout bij opslaan hero image:", err);
    throw new Error('De desktop hero-afbeelding kon niet lokaal worden opgeslagen.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('admin_settings').upsert({
        key: 'hero_image',
        value: imageUrl,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (e) {
      console.error("Supabase hero image save exception:", e);
      throw new Error('De desktop hero-afbeelding is lokaal bewaard, maar niet naar de cloud gesynchroniseerd.');
    }
  }
  return imageUrl;
};

export const getMobileHeroImage = () => {
  try {
    const saved = localStorage.getItem(MOBILE_HERO_IMAGE_KEY);
    return saved && saved.trim() ? saved : DEFAULT_MOBILE_HERO_IMAGE;
  } catch (err) {
    console.error("Fout bij ophalen mobiele hero image:", err);
    return DEFAULT_MOBILE_HERO_IMAGE;
  }
};

export const fetchMobileHeroImageAsync = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'mobile_hero_image')
        .maybeSingle();

      if (!error && data?.value) {
        localStorage.setItem(MOBILE_HERO_IMAGE_KEY, data.value);
        return data.value;
      }
    } catch (err) {
      console.error("Fout bij ophalen mobiele hero image van Supabase:", err);
    }
  }
  return getMobileHeroImage();
};

export const saveMobileHeroImageAsync = async (imageUrl) => {
  try {
    localStorage.setItem(MOBILE_HERO_IMAGE_KEY, imageUrl);
  } catch (err) {
    console.error("Fout bij opslaan mobiele hero image:", err);
    throw new Error('De mobiele hero-afbeelding kon niet lokaal worden opgeslagen.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('admin_settings').upsert({
        key: 'mobile_hero_image',
        value: imageUrl,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (err) {
      console.error("Supabase mobiele hero image save exception:", err);
      throw new Error('De mobiele hero-afbeelding is lokaal bewaard, maar niet naar de cloud gesynchroniseerd.');
    }
  }
  return imageUrl;
};

// Helper to extract field value checking all camelCase, snake_case, and capitalization variations
const extractFieldValue = (item, fieldName, lang) => {
  if (!item) return '';
  const langLower = lang.toLowerCase();
  const langUpper = lang.toUpperCase();
  const langCap = lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();

  const camelField = fieldName;
  const snakeField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();

  const possibleKeys = [
    `${camelField}_${langLower}`,
    `${snakeField}_${langLower}`,
    `${camelField}${langCap}`,
    `${snakeField}${langCap}`,
    `${snakeField}_${langUpper}`,
    `${camelField}_${langUpper}`
  ];

  for (const key of possibleKeys) {
    if (item[key] !== undefined && item[key] !== null && typeof item[key] === 'string' && item[key].trim() !== '') {
      return item[key];
    }
  }
  return '';
}// Map database column names (snake_case) to frontend item object (camelCase)
const mapDbItemToFrontend = (dbItem) => {
  if (!dbItem) return dbItem;

  let extPayload = {};
  let cleanImages = [];

  if (Array.isArray(dbItem.images)) {
    for (const img of dbItem.images) {
      if (img && img.__ext__ && img.payload) {
        extPayload = img.payload;
      } else {
        cleanImages.push(img);
      }
    }
  }

  const title_en = dbItem.title_en || extPayload.title_en || extractFieldValue(dbItem, 'title', 'en');
  const title_fr = dbItem.title_fr || extPayload.title_fr || extractFieldValue(dbItem, 'title', 'fr');
  const subtitle_en = dbItem.subtitle_en || extPayload.subtitle_en || extractFieldValue(dbItem, 'subtitle', 'en');
  const subtitle_fr = dbItem.subtitle_fr || extPayload.subtitle_fr || extractFieldValue(dbItem, 'subtitle', 'fr');
  const description_en = dbItem.description_en || extPayload.description_en || extractFieldValue(dbItem, 'description', 'en');
  const description_fr = dbItem.description_fr || extPayload.description_fr || extractFieldValue(dbItem, 'description', 'fr');
  const binding_en = dbItem.binding_en || extPayload.binding_en || extractFieldValue(dbItem, 'binding', 'en');
  const binding_fr = dbItem.binding_fr || extPayload.binding_fr || extractFieldValue(dbItem, 'binding', 'fr');
  const condition_en = dbItem.condition_en || extPayload.condition_en || extractFieldValue(dbItem, 'condition', 'en');
  const condition_fr = dbItem.condition_fr || extPayload.condition_fr || extractFieldValue(dbItem, 'condition', 'fr');
  const provenance_en = dbItem.provenance_en || extPayload.provenance_en || extractFieldValue(dbItem, 'provenance', 'en');
  const provenance_fr = dbItem.provenance_fr || extPayload.provenance_fr || extractFieldValue(dbItem, 'provenance', 'fr');
  const publisher_en = dbItem.publisher_en || extPayload.publisher_en || extractFieldValue(dbItem, 'publisher', 'en');
  const publisher_fr = dbItem.publisher_fr || extPayload.publisher_fr || extractFieldValue(dbItem, 'publisher', 'fr');
  const city_en = dbItem.city_en || extPayload.city_en || extractFieldValue(dbItem, 'city', 'en');
  const city_fr = dbItem.city_fr || extPayload.city_fr || extractFieldValue(dbItem, 'city', 'fr');
  const dimensions_en = dbItem.dimensions_en || extPayload.dimensions_en || extractFieldValue(dbItem, 'dimensions', 'en');
  const dimensions_fr = dbItem.dimensions_fr || extPayload.dimensions_fr || extractFieldValue(dbItem, 'dimensions', 'fr');

  const historicalContext = dbItem.historical_context || dbItem.historicalContext || extPayload.historicalContext || '';
  const conditionReport = dbItem.condition_report || dbItem.conditionReport || extPayload.conditionReport || '';
  const provenanceDetails = dbItem.provenance_details || dbItem.provenanceDetails || extPayload.provenanceDetails || '';
  const collationSpecs = dbItem.collation_specs || dbItem.collationSpecs || extPayload.collationSpecs || '';
  const comparableSales = dbItem.comparable_sales || dbItem.comparableSales || extPayload.comparableSales || [];
  const emptyFields = dbItem.emptyFields || dbItem.empty_fields || extPayload.emptyFields || extPayload.empty_fields || {};
  const collectionGroup = dbItem.collection_group || dbItem.collectionGroup || extPayload.collectionGroup;
  const attributes = dbItem.attributes || extPayload.attributes || {};

  const item = {
    ...dbItem,
    id: dbItem.id,
    itemType: dbItem.item_type || dbItem.itemType || 'book',
    collectionGroup,
    ref: dbItem.ref || '',
    title: dbItem.title || '',
    subtitle: dbItem.subtitle || '',
    author: dbItem.author || '',
    publisher: dbItem.publisher || '',
    city: dbItem.city || '',
    year: dbItem.year || '',
    century: dbItem.century || '',
    category: getCategorySlug(dbItem.category || ''),
    price: dbItem.price || '',
    status: dbItem.status || 'Beschikbaar',
    featured: Boolean(dbItem.featured),
    condition: dbItem.condition || '',
    binding: dbItem.binding || '',
    dimensions: dbItem.dimensions || '',
    provenance: dbItem.provenance || '',
    description: dbItem.description || '',
    historicalContext,
    conditionReport,
    provenanceDetails,
    collationSpecs,
    comparableSales: Array.isArray(comparableSales) ? comparableSales : [],
    attributes: attributes && typeof attributes === 'object' && !Array.isArray(attributes) ? attributes : {},
    emptyFields,
    empty_fields: emptyFields,
    images: cleanImages,

    title_en,
    title_fr,
    subtitle_en,
    subtitle_fr,
    description_en,
    description_fr,
    binding_en,
    binding_fr,
    condition_en,
    condition_fr,
    provenance_en,
    provenance_fr,
    publisher_en,
    publisher_fr,
    city_en,
    city_fr,
    dimensions_en,
    dimensions_fr,

    provenance_details_en: extPayload.provenanceDetails_en || extractFieldValue(dbItem, 'provenanceDetails', 'en'),
    provenance_details_fr: extPayload.provenanceDetails_fr || extractFieldValue(dbItem, 'provenanceDetails', 'fr'),
    provenanceDetails_en: extPayload.provenanceDetails_en || extractFieldValue(dbItem, 'provenanceDetails', 'en'),
    provenanceDetails_fr: extPayload.provenanceDetails_fr || extractFieldValue(dbItem, 'provenanceDetails', 'fr'),

    condition_report_en: extPayload.conditionReport_en || extractFieldValue(dbItem, 'conditionReport', 'en'),
    condition_report_fr: extPayload.conditionReport_fr || extractFieldValue(dbItem, 'conditionReport', 'fr'),
    conditionReport_en: extPayload.conditionReport_en || extractFieldValue(dbItem, 'conditionReport', 'en'),
    conditionReport_fr: extPayload.conditionReport_fr || extractFieldValue(dbItem, 'conditionReport', 'fr'),

    historical_context_en: extPayload.historicalContext_en || extractFieldValue(dbItem, 'historicalContext', 'en'),
    historical_context_fr: extPayload.historicalContext_fr || extractFieldValue(dbItem, 'historicalContext', 'fr'),
    historicalContext_en: extPayload.historicalContext_en || extractFieldValue(dbItem, 'historicalContext', 'en'),
    historicalContext_fr: extPayload.historicalContext_fr || extractFieldValue(dbItem, 'historicalContext', 'fr'),

    collation_specs_en: extPayload.collationSpecs_en || extractFieldValue(dbItem, 'collationSpecs', 'en'),
    collation_specs_fr: extPayload.collationSpecs_fr || extractFieldValue(dbItem, 'collationSpecs', 'fr'),
    collationSpecs_en: extPayload.collationSpecs_en || extractFieldValue(dbItem, 'collationSpecs', 'en'),
    collationSpecs_fr: extPayload.collationSpecs_fr || extractFieldValue(dbItem, 'collationSpecs', 'fr')
  };

  return normalizeCatalogItemTaxonomy(item);
};

// Map frontend item object (camelCase) to database column names (snake_case)
const mapFrontendItemToDb = (item) => {
  const images = Array.isArray(item.images) ? [...item.images] : [];
  const cleanImages = images.filter(img => !img || !img.__ext__);
  cleanImages.push({
    __ext__: true,
    payload: {
      historicalContext: item.historicalContext || '',
      conditionReport: item.conditionReport || '',
      provenanceDetails: item.provenanceDetails || '',
      collationSpecs: item.collationSpecs || '',
      comparableSales: Array.isArray(item.comparableSales) ? item.comparableSales : [],
      title_en: item.title_en || '',
      title_fr: item.title_fr || '',
      subtitle_en: item.subtitle_en || '',
      subtitle_fr: item.subtitle_fr || '',
      description_en: item.description_en || '',
      description_fr: item.description_fr || '',
      binding_en: item.binding_en || '',
      binding_fr: item.binding_fr || '',
      condition_en: item.condition_en || '',
      condition_fr: item.condition_fr || '',
      provenance_en: item.provenance_en || '',
      provenance_fr: item.provenance_fr || '',
      provenanceDetails_en: item.provenanceDetails_en || '',
      provenanceDetails_fr: item.provenanceDetails_fr || '',
      conditionReport_en: item.conditionReport_en || '',
      conditionReport_fr: item.conditionReport_fr || '',
      historicalContext_en: item.historicalContext_en || '',
      historicalContext_fr: item.historicalContext_fr || '',
      collationSpecs_en: item.collationSpecs_en || '',
      collationSpecs_fr: item.collationSpecs_fr || '',
      publisher_en: item.publisher_en || '',
      publisher_fr: item.publisher_fr || '',
      city_en: item.city_en || '',
      city_fr: item.city_fr || '',
      dimensions_en: item.dimensions_en || '',
      dimensions_fr: item.dimensions_fr || '',
      collectionGroup: getCollectionGroupForItem(item),
      attributes: item.attributes || {},
      emptyFields: item.emptyFields || item.empty_fields || {}
    }
  });

  return {
    id: item.id,
    item_type: item.itemType || item.item_type || 'book',
    collection_group: getCollectionGroupForItem(item),
    ref: item.ref,
    title: item.title,
    subtitle: item.subtitle,
    author: item.author,
    publisher: item.publisher,
    city: item.city,
    year: item.year,
    century: item.century,
    category: getCategorySlug(item.category),
    price: item.price,
    status: item.status,
    featured: Boolean(item.featured),
    condition: item.condition,
    binding: item.binding,
    dimensions: item.dimensions,
    provenance: item.provenance,
    description: item.description,
    historical_context: item.historicalContext || item.historical_context || '',
    condition_report: item.conditionReport || item.condition_report || '',
    provenance_details: item.provenanceDetails || item.provenance_details || '',
    collation_specs: item.collationSpecs || item.collation_specs || '',
    comparable_sales: Array.isArray(item.comparableSales) ? item.comparableSales : [],
    attributes: item.attributes || {},
    images: cleanImages,
    
    // Multi-Language Fields (EN & FR)
    title_en: extractFieldValue(item, 'title', 'en'),
    title_fr: extractFieldValue(item, 'title', 'fr'),
    subtitle_en: extractFieldValue(item, 'subtitle', 'en'),
    subtitle_fr: extractFieldValue(item, 'subtitle', 'fr'),
    description_en: extractFieldValue(item, 'description', 'en'),
    description_fr: extractFieldValue(item, 'description', 'fr'),
    binding_en: extractFieldValue(item, 'binding', 'en'),
    binding_fr: extractFieldValue(item, 'binding', 'fr'),
    condition_en: extractFieldValue(item, 'condition', 'en'),
    condition_fr: extractFieldValue(item, 'condition', 'fr'),
    provenance_en: extractFieldValue(item, 'provenance', 'en'),
    provenance_fr: extractFieldValue(item, 'provenance', 'fr'),
    provenance_details_en: extractFieldValue(item, 'provenanceDetails', 'en'),
    provenance_details_fr: extractFieldValue(item, 'provenanceDetails', 'fr'),
    condition_report_en: extractFieldValue(item, 'conditionReport', 'en'),
    condition_report_fr: extractFieldValue(item, 'conditionReport', 'fr'),
    historical_context_en: extractFieldValue(item, 'historicalContext', 'en'),
    historical_context_fr: extractFieldValue(item, 'historicalContext', 'fr'),
    collation_specs_en: extractFieldValue(item, 'collationSpecs', 'en'),
    collation_specs_fr: extractFieldValue(item, 'collationSpecs', 'fr'),
    updated_at: new Date().toISOString()
  };
};

// Map frontend item object to minimal DB columns supported by any schema version
const mapFrontendItemToBasicDb = (item) => {
  const images = Array.isArray(item.images) ? [...item.images] : [];
  const cleanImages = images.filter(img => !img || !img.__ext__);
  cleanImages.push({
    __ext__: true,
    payload: {
      historicalContext: item.historicalContext || '',
      conditionReport: item.conditionReport || '',
      provenanceDetails: item.provenanceDetails || '',
      collationSpecs: item.collationSpecs || '',
      comparableSales: Array.isArray(item.comparableSales) ? item.comparableSales : [],
      title_en: item.title_en || '',
      title_fr: item.title_fr || '',
      subtitle_en: item.subtitle_en || '',
      subtitle_fr: item.subtitle_fr || '',
      description_en: item.description_en || '',
      description_fr: item.description_fr || '',
      binding_en: item.binding_en || '',
      binding_fr: item.binding_fr || '',
      condition_en: item.condition_en || '',
      condition_fr: item.condition_fr || '',
      provenance_en: item.provenance_en || '',
      provenance_fr: item.provenance_fr || '',
      provenanceDetails_en: item.provenanceDetails_en || '',
      provenanceDetails_fr: item.provenanceDetails_fr || '',
      conditionReport_en: item.conditionReport_en || '',
      conditionReport_fr: item.conditionReport_fr || '',
      historicalContext_en: item.historicalContext_en || '',
      historicalContext_fr: item.historicalContext_fr || '',
      collationSpecs_en: item.collationSpecs_en || '',
      collationSpecs_fr: item.collationSpecs_fr || '',
      publisher_en: item.publisher_en || '',
      publisher_fr: item.publisher_fr || '',
      city_en: item.city_en || '',
      city_fr: item.city_fr || '',
      dimensions_en: item.dimensions_en || '',
      dimensions_fr: item.dimensions_fr || '',
      collectionGroup: getCollectionGroupForItem(item),
      attributes: item.attributes || {},
      emptyFields: item.emptyFields || item.empty_fields || {}
    }
  });

  return {
    id: item.id,
    item_type: item.itemType || item.item_type || 'book',
    ref: item.ref,
    title: item.title,
    subtitle: item.subtitle,
    author: item.author,
    publisher: item.publisher,
    city: item.city,
    year: item.year,
    century: item.century,
    category: getCategorySlug(item.category),
    price: item.price,
    status: item.status,
    featured: Boolean(item.featured),
    condition: item.condition,
    binding: item.binding,
    dimensions: item.dimensions,
    provenance: item.provenance,
    description: item.description,
    images: cleanImages,
    updated_at: new Date().toISOString()
  };
};

// Map database inquiry (snake_case) to frontend inquiry object
const mapDbInquiryToFrontend = (dbInq) => ({
  id: dbInq.id,
  date: dbInq.date,
  itemTitle: dbInq.item_title,
  itemRef: dbInq.item_ref,
  name: dbInq.name,
  email: dbInq.email,
  phone: dbInq.phone,
  type: dbInq.type,
  message: dbInq.message,
  status: dbInq.status,
  notes: dbInq.notes
});

// Map frontend inquiry to database inquiry (snake_case)
const mapFrontendInquiryToDb = (inq) => ({
  id: inq.id,
  date: inq.date || new Date().toISOString(),
  item_title: inq.itemTitle,
  item_ref: inq.itemRef,
  name: inq.name,
  email: inq.email,
  phone: inq.phone,
  type: inq.type,
  message: inq.message,
  status: inq.status || 'Nieuw',
  notes: inq.notes
});

// --- CATALOG MANAGEMENT ---

export const getCatalog = () => {
  try {
    const saved = localStorage.getItem(CATALOG_KEY) || localStorage.getItem(OLD_CATALOG_KEY_2) || localStorage.getItem(OLD_CATALOG_KEY);
    if (!saved) {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(INITIAL_CATALOG));
      return INITIAL_CATALOG.map(mapDbItemToFrontend);
    }
    const parsed = JSON.parse(saved);
    return parsed.length > 0 ? parsed.map(mapDbItemToFrontend) : INITIAL_CATALOG.map(mapDbItemToFrontend);
  } catch (e) {
    console.error("Error reading catalog from localStorage", e);
    return INITIAL_CATALOG.map(mapDbItemToFrontend);
  }
};

export const fetchCatalogAsync = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Fetch items from items table
      const { data: dbItems, error } = await supabase.from('items').select('*').order('created_at', { ascending: true });

      // 2. Fetch extended item data (translations/extra fields) from admin_settings
      const { data: extSettings } = await supabase.from('admin_settings').select('*').like('key', 'item_ext_%');
      const extMap = {};
      if (extSettings && Array.isArray(extSettings)) {
        for (const row of extSettings) {
          try {
            const itemId = row.key.replace('item_ext_', '');
            const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
            if (itemId && parsed) extMap[itemId] = parsed;
          } catch (e) {
            console.error("Fout bij parsen van item_ext row:", e);
          }
        }
      }

      if (!error && dbItems && dbItems.length > 0) {
        const mapped = dbItems.map(dbItem => {
          const frontendItem = mapDbItemToFrontend(dbItem);
          const extData = extMap[dbItem.id];
          if (extData) {
            return normalizeCatalogItemTaxonomy({
              ...frontendItem,
              ...extData
            });
          }
          return frontendItem;
        });

        // Smart Merge with local data: preserve local non-empty fields if local has newer data
        const localCatalog = getCatalog();
        const mergedCatalog = mapped.map(remoteItem => {
          const localItem = localCatalog.find(l => l.id === remoteItem.id);
          if (!localItem) return remoteItem;
          return {
            ...remoteItem,
            emptyFields: remoteItem.emptyFields && Object.keys(remoteItem.emptyFields).length > 0 ? remoteItem.emptyFields : (localItem.emptyFields || remoteItem.empty_fields || localItem.empty_fields || {}),
            empty_fields: remoteItem.empty_fields && Object.keys(remoteItem.empty_fields).length > 0 ? remoteItem.empty_fields : (localItem.empty_fields || remoteItem.emptyFields || localItem.emptyFields || {}),
            historicalContext: remoteItem.historicalContext || localItem.historicalContext || '',
            conditionReport: remoteItem.conditionReport || localItem.conditionReport || '',
            provenanceDetails: remoteItem.provenanceDetails || localItem.provenanceDetails || '',
            collationSpecs: remoteItem.collationSpecs || localItem.collationSpecs || ''
          };
        });

        localStorage.setItem(CATALOG_KEY, JSON.stringify(mergedCatalog));
        return mergedCatalog;
      }
    } catch (e) {
      console.error("Supabase catalog fetch failed, falling back to local data", e);
    }
  }
  return getCatalog();
};

export const saveCatalog = (items) => {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Error saving catalog to localStorage", e);
  }
};

export const formatSupabaseErrorMessage = (error) => {
  if (!error) return null;
  const msg = typeof error === 'string' ? error : (error.message || '');
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'Geen verbinding met de Supabase cloud server. Controleer uw internetverbinding.';
  }
  if (msg.includes('duplicate key') || msg.includes('23505')) {
    return 'Er bestaat al een meesterwerk met deze unieke referentie-code.';
  }
  if (msg.includes('permission denied') || msg.includes('JWT') || msg.includes('401') || msg.includes('403')) {
    return 'Sessie verlopen of onvoldoende rechten in de database.';
  }
  return 'Cloud-synchronisatie kon niet worden afgerond op de server.';
};

export const saveCatalogAsync = async (items) => {
  saveCatalog(items);
  let supabaseSuccess = true;
  let supabaseError = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const dbItems = items.map(mapFrontendItemToDb);
      const { error } = await supabase.from('items').upsert(dbItems, { onConflict: 'id' });
      if (error) {
        console.warn("Supabase catalog upsert warning (retrying with basic fields):", error.message);
        const baseItems = items.map(mapFrontendItemToBasicDb);
        const { error: err2 } = await supabase.from('items').upsert(baseItems, { onConflict: 'id' });
        if (err2) {
          supabaseSuccess = false;
          supabaseError = formatSupabaseErrorMessage(err2);
        }
      }

      // Save extended items to admin_settings so no translation or detail is ever lost
      for (const item of items) {
        await supabase.from('admin_settings').upsert({
          key: `item_ext_${item.id}`,
          value: JSON.stringify(item),
          updated_at: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Supabase catalog save failed", e);
      supabaseSuccess = false;
      supabaseError = formatSupabaseErrorMessage(e);
    }
  }

  return {
    catalog: items,
    success: supabaseSuccess,
    backend: isSupabaseConfigured() ? 'supabase' : 'local',
    error: supabaseError
  };
};

export const saveItemAsync = async (item) => {
  const currentCatalog = getCatalog();
  const index = currentCatalog.findIndex(i => i.id === item.id);
  let updatedCatalog;
  if (index !== -1) {
    updatedCatalog = [...currentCatalog];
    updatedCatalog[index] = item;
  } else {
    updatedCatalog = [item, ...currentCatalog];
  }

  saveCatalog(updatedCatalog);

  let supabaseSuccess = true;
  let supabaseError = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      let mainTableSuccess = false;
      const dbItem = mapFrontendItemToDb(item);
      const { error } = await supabase.from('items').upsert(dbItem, { onConflict: 'id' });
      
      if (!error) {
        mainTableSuccess = true;
      } else {
        console.warn("Supabase item upsert warning (retrying with basic schema):", error.message);
        const basicDbItem = mapFrontendItemToBasicDb(item);
        const { error: fallbackErr } = await supabase.from('items').upsert(basicDbItem, { onConflict: 'id' });
        if (!fallbackErr) {
          mainTableSuccess = true;
        } else {
          console.warn("Supabase basic schema upsert warning:", fallbackErr.message);
          supabaseError = formatSupabaseErrorMessage(fallbackErr || error);
        }
      }

      // Save full item JSON into admin_settings as a bulletproof secondary backup
      let extBackupSuccess = false;
      try {
        const { error: extErr } = await supabase.from('admin_settings').upsert({
          key: `item_ext_${item.id}`,
          value: JSON.stringify(item),
          updated_at: new Date().toISOString()
        });
        if (!extErr) extBackupSuccess = true;
      } catch (backupErr) {
        console.warn("Could not save item_ext backup:", backupErr);
      }

      // If either main items table OR admin_settings JSON backup succeeded, cloud save is verified!
      if (mainTableSuccess || extBackupSuccess) {
        supabaseSuccess = true;
        supabaseError = null;
      } else {
        supabaseSuccess = false;
      }

    } catch (e) {
      console.error("Supabase item save exception:", e);
      supabaseSuccess = false;
      supabaseError = formatSupabaseErrorMessage(e);
    }
  }

  // Attach non-enumerable or direct array property for backward compatibility
  const resultObj = updatedCatalog;
  resultObj.catalog = updatedCatalog;
  resultObj.success = supabaseSuccess;
  resultObj.backend = isSupabaseConfigured() ? 'supabase' : 'local';
  resultObj.error = supabaseError;

  return resultObj;
};

export const deleteItemAsync = async (itemId) => {
  const currentCatalog = getCatalog();
  const updatedCatalog = currentCatalog.filter(i => i.id !== itemId);
  saveCatalog(updatedCatalog);

  let supabaseSuccess = true;
  let supabaseError = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      const { error: extError } = await supabase.from('admin_settings').delete().eq('key', `item_ext_${itemId}`);
      if (error || extError) {
        console.error("Supabase item delete error:", error || extError);
        supabaseSuccess = false;
        supabaseError = formatSupabaseErrorMessage(error || extError);
      }
    } catch (e) {
      console.error("Supabase item delete exception:", e);
      supabaseSuccess = false;
      supabaseError = formatSupabaseErrorMessage(e);
    }
  }

  const resultObj = updatedCatalog;
  resultObj.catalog = updatedCatalog;
  resultObj.success = supabaseSuccess;
  resultObj.backend = isSupabaseConfigured() ? 'supabase' : 'local';
  resultObj.error = supabaseError;

  return resultObj;
};

// --- IMAGE UPLOAD HELPER ---

export const uploadCatalogImage = async (file) => {
  if (!file) return null;

  if (!isSupabaseConfigured() || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.warn("No active session for R2 upload");
      throw new Error("No active session");
    }

    const res = await fetch('/api/r2-presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to get presigned URL: ${res.statusText}`);
    }

    const { presignedUrl, publicUrl } = await res.json();

    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      }
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload to R2: ${uploadRes.statusText}`);
    }

    return publicUrl;
  } catch (e) {
    console.error("Image upload exception, falling back to Data URL", e);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target.result);
      reader.readAsDataURL(file);
    });
  }
};

// --- INQUIRIES MANAGEMENT ---

export const getInquiries = () => {
  // Personal inquiry data is never restored from browser storage in production.
  if (isSupabaseConfigured()) return [];

  try {
    const saved = localStorage.getItem(INQUIRIES_KEY) || localStorage.getItem(OLD_INQUIRIES_KEY_2) || localStorage.getItem(OLD_INQUIRIES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Fout bij ophalen aanvragen", e);
    return [];
  }
};

export const fetchInquiriesAsync = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('inquiries').select('*').order('date', { ascending: false });
      if (!error && data) {
        localStorage.removeItem(INQUIRIES_KEY);
        localStorage.removeItem(OLD_INQUIRIES_KEY_2);
        localStorage.removeItem(OLD_INQUIRIES_KEY);
        return data.map(mapDbInquiryToFrontend);
      }
    } catch (e) {
      console.error("Supabase inquiries fetch error", e);
    }
  }
  return getInquiries();
};

export const saveInquiry = (inquiry) => {
  try {
    const current = getInquiries();
    const newInquiry = {
      id: `inq-${crypto.randomUUID()}`,
      date: new Date().toISOString(),
      status: "Nieuw",
      ...inquiry
    };
    const updated = [newInquiry, ...current];
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(updated));
    return newInquiry;
  } catch (e) {
    console.error("Fout bij opslaan aanvraag", e);
    return null;
  }
};

export const saveInquiryAsync = async (inquiry) => {
  if (isSupabaseConfigured() && supabase) {
    const newInquiry = {
      id: `inq-${crypto.randomUUID()}`,
      date: new Date().toISOString(),
      status: 'Nieuw',
      ...inquiry
    };

    try {
      const dbInq = mapFrontendInquiryToDb(newInquiry);
      const { error } = await supabase.from('inquiries').insert(dbInq);
      if (error) {
        console.error("Supabase inquiry insert error", error);
        throw new Error('Aanvraag kon niet veilig worden opgeslagen.');
      } else {
        // Trigger push notification to admin securely via Vercel serverless function
        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inquiryId: newInquiry.id
          })
        }).catch(err => console.error("Fout bij triggeren push API:", err));
      }
    } catch (e) {
      console.error("Supabase inquiry insert exception", e);
      throw e;
    }
    return newInquiry;
  }

  return saveInquiry(inquiry);
};

export const updateInquiryStatus = (id, newStatus) => {
  try {
    const current = getInquiries();
    const updated = current.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Fout bij bijwerken aanvraag status", e);
    return [];
  }
};

export const updateInquiryStatusAsync = async (id, newStatus) => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('inquiries').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      return fetchInquiriesAsync();
    } catch (e) {
      console.error("Supabase inquiry status update exception", e);
      throw new Error('De status kon niet naar de cloud worden opgeslagen.');
    }
  }
  return updateInquiryStatus(id, newStatus);
};

export const updateInquiryNotes = (id, notes) => {
  try {
    const current = getInquiries();
    const updated = current.map(inq => inq.id === id ? { ...inq, notes } : inq);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Fout bij bijwerken aanvraag notitie", e);
    return getInquiries();
  }
};

export const updateInquiryNotesAsync = async (id, notes) => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('inquiries').update({ notes }).eq('id', id);
      if (error) throw error;
      return fetchInquiriesAsync();
    } catch (e) {
      console.error("Supabase inquiry notes update exception", e);
      throw new Error('De notitie kon niet naar de cloud worden opgeslagen.');
    }
  }
  return updateInquiryNotes(id, notes);
};

export const deleteInquiry = (id) => {
  try {
    const current = getInquiries();
    const updated = current.filter(inq => inq.id !== id);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Fout bij verwijderen aanvraag", e);
    return getInquiries();
  }
};

export const deleteInquiryAsync = async (id) => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('inquiries').delete().eq('id', id);
      if (error) throw error;
      return fetchInquiriesAsync();
    } catch (e) {
      console.error("Supabase inquiry delete exception", e);
      throw new Error('De aanvraag kon niet uit de cloud worden verwijderd.');
    }
  }
  return deleteInquiry(id);
};

// --- AUTHENTICATION & ADMIN USERS (SUPABASE AUTH + RLS PROFILE) ---

const getAdminProfileForAuthUser = async (authUser) => {
  if (!authUser?.id || !supabase) return null;

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('user_id, email, name, role, active')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (error || !data?.active || !['admin', 'developer'].includes(data.role)) {
    return null;
  }

  return {
    id: data.user_id,
    email: data.email || authUser.email,
    name: data.name || authUser.email,
    role: data.role
  };
};

export const authenticateAdminUserAsync = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Authenticatiedienst is momenteel niet geconfigureerd.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error || !data.user) {
      return { success: false, message: 'Toegang geweigerd. Controleer e-mailadres en wachtwoord.' };
    }

    const user = await getAdminProfileForAuthUser(data.user);
    if (!user) {
      await supabase.auth.signOut();
      return { success: false, message: 'Dit account heeft geen actieve beheerderstoegang.' };
    }

    return { success: true, user };
  } catch (e) {
    console.error("Authenticatiefout:", e);
    return { success: false, message: 'Fout bij verifiëren van inloggegevens.' };
  }
};

export const getCurrentAdminSessionAsync = async () => {
  if (!isSupabaseConfigured() || !supabase) return { success: false, user: null };

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return { success: false, user: null };

    const user = await getAdminProfileForAuthUser(data.session.user);
    if (!user) {
      await supabase.auth.signOut();
      return { success: false, user: null };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Fout bij herstellen van beheerderssessie:', error);
    return { success: false, user: null };
  }
};

export const signOutAdminAsync = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Fout bij afmelden:', error);
};

export const updateAdminPasswordAsync = async (email, currentPassword, newPassword) => {
  const cleanEmail = email.trim().toLowerCase();
  const authResult = await authenticateAdminUserAsync(cleanEmail, currentPassword);
  if (!authResult.success) {
    return { success: false, message: 'Huidige wachtwoord is onjuist.' };
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('Supabase Auth password update error:', error);
      return { success: false, message: 'Het wachtwoord kon niet veilig worden bijgewerkt.' };
    }

    const { error: sessionError } = await supabase.auth.signOut({ scope: 'others' });
    if (sessionError) console.error('Andere beheerderssessies konden niet worden afgemeld:', sessionError);

    return { success: true, message: 'Wachtwoord succesvol gewijzigd!' };
  } catch (error) {
    console.error('Supabase Auth password update exception:', error);
    return { success: false, message: 'Verbindingsfout bij bijwerken wachtwoord.' };
  }
};

export const exportDataJSON = () => {
  const data = {
    catalog: getCatalog(),
    inquiries: getInquiries(),
    exportedAt: new Date().toISOString(),
    version: "1.0"
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `antiquariaat_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importDataJSON = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.catalog && Array.isArray(parsed.catalog)) {
      saveCatalogAsync(parsed.catalog);
    }
    if (parsed.inquiries && Array.isArray(parsed.inquiries)) {
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(parsed.inquiries));
    }
    return true;
  } catch (e) {
    console.error("Ongeldige JSON backup", e);
    return false;
  }
};

export const resetToInitialData = () => {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(INITIAL_CATALOG));
    localStorage.removeItem(INQUIRIES_KEY);
    return true;
  } catch (e) {
    console.error("Fout bij herstellen initiële data", e);
    return false;
  }
};

// --- HERKOMST & PROVENANCE PAGE CMS MANAGEMENT ---
const PROVENANCE_PAGE_KEY = 'atelier_rembrandt_provenance_page';

export const DEFAULT_PROVENANCE_DATA = {
  hero: {
    badge: 'Herkomst & Expertise',
    badge_en: 'Provenance & Expertise',
    badge_fr: 'Provenance & Expertise',
    title: 'Gecertificeerde Provenance & Wetenschappelijk Onderzoek',
    title_en: 'Certified Provenance & Bibliographical Research',
    title_fr: 'Provenance Certifiée & Recherche Bibliographique',
    subtitle: 'Elk zeldzaam meesterwerk in onze collectie wordt vergezeld van een aantoonbare herkomstgeschiedenis en een grondig bibliografisch verificatierapport.',
    subtitle_en: 'Every rare masterwork in our collection is accompanied by a documented provenance history and a rigorous bibliographical verification report.',
    subtitle_fr: 'Chaque chef-d’œuvre rare de notre collection est accompagné d’un historique de provenance documenté et d’un rapport de vérification bibliographique rigoureux.',
    bgImage: '/images/hero/hero-voltaire-exlibris.jpg'
  },
  protocol: {
    badge: 'Gecertificeerd Verificatieprotocol',
    badge_en: 'Certified Verification Protocol',
    badge_fr: 'Protocole de Vérification Certifié',
    title: 'Het Protocol van Authenticiteit & Verificatie',
    title_en: 'The Protocol of Authenticity & Verification',
    title_fr: 'Le Protocole d’Authenticité & de Vérification',
    subtitle: 'Voordat een antiquarisch meesterwerk in onze gecureerde collectie wordt opgenomen, doorloopt het ons vierstappen-onderzoeksprotocol.',
    subtitle_en: 'Before an antiquarian masterpiece is included in our curated collection, it undergoes our four-step research protocol.',
    subtitle_fr: 'Avant d’intégrer notre collection sélectionnée, chaque ouvrage précieux franchit notre protocole d’examen en quatre étapes.',
    steps: [
      {
        step: '01',
        title: 'Fysiek & Materieel Onderzoek',
        title_en: 'Physical & Material Analysis',
        title_fr: 'Examen Physique & Matériel',
        description: 'Nauwkeurige inspectie van papierstructuur, watermerken, binding, marmerpapier en 18e-eeuws rood roggevel shagreen leder.',
        description_en: 'Meticulous inspection of paper structure, watermarks, binding, marbled endpapers, and 18th-century red shagreen leather.',
        description_fr: 'Inspection minutieuse de la structure du papier, des filigranes, de la reliure, des papiers marbrés et du chagrin rouge du XVIIIe siècle.'
      },
      {
        step: '02',
        title: 'Archief & Provenance Check',
        title_en: 'Archive & Provenance Verification',
        title_fr: 'Vérification d’Archives & Provenance',
        description: 'Verificatie van ex-libris stempels, eigenaarsinscripties en historische veilingcatalogi uit adellijke en bibliofiele privécollecties.',
        description_en: 'Verification of bookplates, ownership inscriptions, and historical auction catalogues from noble and bibliophilic private collections.',
        description_fr: 'Vérification des ex-libris, inscriptions de propriété et catalogues de ventes historiques issus de collections privées nobles.'
      },
      {
        step: '03',
        title: 'Bibliografische Match',
        title_en: 'Bibliographical Matching',
        title_fr: 'Concordance Bibliographique',
        description: 'Kruisverwijzing met standaard naslagwerken (Brunet, Cohen-de Ricci, Graesse) voor oplage, gravure-aantallen en zeldzaamheid.',
        description_en: 'Cross-referencing with standard reference works (Brunet, Cohen-de Ricci, Graesse) for edition size, plate counts, and rarity.',
        description_fr: 'Recoupement avec les ouvrages de référence (Brunet, Cohen-de Ricci, Graesse) pour les tirages, le nombre de planches et la rareté.'
      },
      {
        step: '04',
        title: 'Certificaat van Echtheid',
        title_en: 'Certificate of Authenticity',
        title_fr: 'Certificat d’Authenticité',
        description: 'Elk werk wordt geleverd met een officieel Atelier Rembrandt echtheidscertificaat met gedetailleerde conditiestatus en herkomst.',
        description_en: 'Every work is delivered with an official Atelier Rembrandt Certificate of Authenticity specifying condition status and provenance.',
        description_fr: 'Chaque œuvre est délivrée avec un Certificat d’Authenticité officiel de l’Atelier Rembrandt détaillant l’état et la provenance.'
      }
    ]
  },
  story: {
    badge: 'Ex-Libris & Eigendomssporen',
    badge_en: 'Bookplates & Provenance Traces',
    badge_fr: 'Ex-Libris & Traces de Propriété',
    title: 'Aantoonbare Historie van Franse Topverzamelaars',
    title_en: 'Documented History of Distinguished French Collectors',
    title_fr: 'Histoire Documentée des Grands Collectionneurs Français',
    quote: 'Een antiek boek ontleent zijn ultieme waarde aan de tastbare bewijzen van zijn reis door de eeuwen heen.',
    quote_en: 'An antique book derives its ultimate value from the tangible evidence of its journey through the centuries.',
    quote_fr: 'Un livre ancien tire sa valeur ultime des preuves tangibles de son voyage à travers les siècles.',
    quoteAuthor: 'Atelier Rembrandt',
    quoteAuthor_en: 'Atelier Rembrandt',
    quoteAuthor_fr: 'Atelier Rembrandt',
    narrative: 'Zeldzame stukken uit onze privé-bibliotheek worden niet alleen geanalyseerd op fysieke staat, maar ook op provenance. Heraldieke stempels, ex-libris afbeeldingen en marginalia vormen de ononderbroken keten van eigenaarskap sinds de eerste druk.',
    narrative_en: 'Rare items from our private library are analyzed not only for physical condition, but also for provenance. Armorial stamps, bookplates, and marginalia form the unbroken chain of ownership since the first edition.',
    narrative_fr: 'Les pièces rares de notre bibliothèque privée ne sont pas seulement analysées pour leur état physique, maar aussi pour leur provenance. Armoiries, ex-libris et marginalia constituent la chaîne ininterrompue de propriété depuis l’édition originale.',
    image: '/images/voltaire-marbled-endpaper-exlibris.jpg',
    imageCaption: 'Ex-Libris Vacheron-Poinsot op handgemaakt gemarmerd schutblad (1829).',
    imageCaption_en: 'Vacheron-Poinsot armorial bookplate on handmade marbled endpaper (1829).',
    imageCaption_fr: 'Vacheron-Poinsot ex-libris armorié sur garde marbrée faite main (1829).',
    bullets: [
      'Adellijk Heraldiek Stempel (Vacheron-Poinsot)',
      'Ongebroken Eigendomsreeks (1829 – Heden)'
    ],
    bullets_en: [
      'Noble Armorial Stamp (Vacheron-Poinsot)',
      'Unbroken Chain of Ownership (1829 – Present)'
    ],
    bullets_fr: [
      'Timbre Armorié Noble (Vacheron-Poinsot)',
      'Chaîne de Propriété Ininterrompue (1829 – Présent)'
    ]
  },
  cta: {
    badge: 'Particuliere Expertise & Consultatie',
    badge_en: 'Private Advisory & Consultation',
    badge_fr: 'Expertise Privée & Consultation',
    title: 'Wilt u de Herkomst van uw Eigen Collectie Laten Verifiëren?',
    title_en: 'Would You Like to Verify the Provenance of Your Collection?',
    title_fr: 'Souhaitez-vous Faire Vérifier la Provenance de Votre Collection ?',
    subtitle: 'Atelier Rembrandt adviseert verzamelaars en erfgenamen bij de waardebepaling, conservering en authenticiteitsverificatie van historische privé-bibliotheken.',
    subtitle_en: 'Atelier Rembrandt advises collectors and heirs on valuation, conservation, and authenticity verification for historic private libraries.',
    subtitle_fr: 'L’Atelier Rembrandt conseille les collectionneurs et héritiers pour l’évaluation, la conservation et la vérification d’authenticité de bibliothèques historiques.',
    buttonText: 'Privé Consultatie Aanvragen',
    buttonText_en: 'Request Private Consultation',
    buttonText_fr: 'Demander une Consultation Privée'
  }
};

const mergeProtocolSteps = (savedSteps = []) => {
  return DEFAULT_PROVENANCE_DATA.protocol.steps.map((defaultStep, idx) => {
    const savedStep = savedSteps[idx] || {};
    return {
      ...defaultStep,
      ...savedStep
    };
  });
};

export const getProvenanceData = () => {
  try {
    const saved = localStorage.getItem(PROVENANCE_PAGE_KEY);
    if (!saved) return DEFAULT_PROVENANCE_DATA;
    const parsed = JSON.parse(saved);
    return {
      hero: { ...DEFAULT_PROVENANCE_DATA.hero, ...(parsed.hero || {}) },
      protocol: { 
        ...DEFAULT_PROVENANCE_DATA.protocol, 
        ...(parsed.protocol || {}),
        steps: mergeProtocolSteps(parsed.protocol?.steps)
      },
      story: { ...DEFAULT_PROVENANCE_DATA.story, ...(parsed.story || {}) },
      cta: { ...DEFAULT_PROVENANCE_DATA.cta, ...(parsed.cta || {}) }
    };
  } catch (err) {
    console.error("Fout bij ophalen herkomst pagina data:", err);
    return DEFAULT_PROVENANCE_DATA;
  }
};

export const fetchProvenanceDataAsync = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'herkomst_page_data')
        .maybeSingle();

      if (!error && data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        const merged = {
          hero: { ...DEFAULT_PROVENANCE_DATA.hero, ...(parsed.hero || {}) },
          protocol: { 
            ...DEFAULT_PROVENANCE_DATA.protocol, 
            ...(parsed.protocol || {}),
            steps: mergeProtocolSteps(parsed.protocol?.steps)
          },
          story: { ...DEFAULT_PROVENANCE_DATA.story, ...(parsed.story || {}) },
          cta: { ...DEFAULT_PROVENANCE_DATA.cta, ...(parsed.cta || {}) }
        };
        localStorage.setItem(PROVENANCE_PAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.error("Supabase herkomst page fetch error:", err);
    }
  }
  return getProvenanceData();
};

export const saveProvenanceDataAsync = async (data) => {
  try {
    localStorage.setItem(PROVENANCE_PAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Fout bij lokaal opslaan herkomst page data:", err);
    throw new Error('De herkomstpagina kon niet lokaal worden opgeslagen.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const payload = JSON.stringify(data);
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'herkomst_page_data',
          value: payload,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (err) {
      console.error("Supabase herkomst page save exception:", err);
      throw new Error('De herkomstpagina is lokaal bewaard, maar niet naar de cloud gesynchroniseerd.');
    }
  }
  return data;
};

// ==========================================
// FAQ ITEMS STORAGE & SUPABASE SYNC
// ==========================================
const FAQ_ITEMS_KEY = 'atelier_rembrandt_faq_items';

export const DEFAULT_FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Hoe wordt de echtheid en herkomst van elk werk gegarandeerd?',
    answer: 'Elk werk in onze collectie wordt grondig onderzocht op papier-watermerken, bandstijl en ex-libris eigendomsstempels. Bij aankoop ontvangt u een fysiek, door Atelier Rembrandt ondertekend Certificaat van Echtheid met het volledige bibliografische dossier.',
    question_en: 'How is the authenticity and provenance of each work guaranteed?',
    answer_en: 'Every work in our collection is thoroughly inspected for watermarks, binding style, and armorial bookplates. Upon purchase, you receive a physical Certificate of Authenticity signed by Atelier Rembrandt alongside the full bibliographical dossier.',
    question_fr: 'Comment la provenance et l’authenticité de chaque œuvre sont-elles garanties ?',
    answer_fr: 'Chaque ouvrage est rigoureusement analysé : filigranes, style de reliure et marques d’ex-libris. Lors de l’achat, vous recevez un Certificat d’Authenticité physique signé par l’Atelier Rembrandt avec le dossier bibliographique complet.',
    displayOrder: 1
  },
  {
    id: 'faq-2',
    question: 'Hoe werkt de verzending van kwetsbare historische boeken of kunst?',
    answer: 'Onze werken worden geconditioneerd en discreet verpakt in maatwerk zuurvrij materiaal. Verzending vindt altijd plaats via een gespecialiseerde koeriersdienst met 100% volledige verzekering van de waarde.',
    question_en: 'How are fragile historical books or artworks shipped and packaged?',
    answer_en: 'Our items are climate-controlled and custom-packaged using archival acid-free materials. Shipping is always conducted via specialized courier services with 100% full value insurance.',
    question_fr: 'Comment s’effectue l’emballage et le transport d’ouvrages précieux et fragiles ?',
    answer_fr: 'Nos œuvres sont conditionnées dans des matériaux neutres et sans acide. L’expédition est confiée à un transporteur spécialisé avec assurance à 100 % de la valeur.',
    displayOrder: 2
  },
  {
    id: 'faq-3',
    question: 'Is een besloten privé-bezichtiging mogelijk vóór aankoop?',
    answer: 'Jazeker. U bent van harte welkom voor een besloten bezichtiging op afspraak in ons atelier. Bij hoogwaardige topstukken is een persoonlijke presentatie bij u op locatie (Europa) eveneens mogelijk.',
    question_en: 'Is a private viewing possible prior to purchase?',
    answer_en: 'Yes. You are welcome for a private viewing by appointment at our atelier. For high-value masterworks, personal presentations at your location (within Europe) can also be arranged.',
    question_fr: 'Est-il possible d’organiser une présentation privée avant l’achat ?',
    answer_fr: 'Absolument. Nous vous accueillons sur rendez-vous dans notre atelier pour une présentation privée. Pour les pièces maîtresses, une présentation à votre domicile (en Europe) est également envisageable.',
    displayOrder: 3
  },
  {
    id: 'faq-4',
    question: 'Hoe werkt het aanvragen van een optie of aankoop?',
    answer: 'Wanneer u een aanvraag indient via de knop op de pagina, wordt het werk direct 48 uur voor u in optie gehouden. U ontvangt binnen 2 uur persoonlijk bericht met de specificaties en factuur.',
    question_en: 'How does requesting a purchase or hold work?',
    answer_en: 'When you submit an inquiry via the page, the item is immediately placed on hold for you for 48 hours. You will receive a personal response within 2 hours with full specifications and invoice details.',
    question_fr: 'Comment fonctionne la réservation ou l’option d’achat ?',
    answer_fr: 'Dès l’envoi de votre demande via le site, l’œuvre est réservée pour vous pendant 48 heures. Vous recevrez une réponse personnelle sous 2 heures avec la facture et les modalités.',
    displayOrder: 4
  },
  {
    id: 'faq-5',
    question: 'Zijn er meer foto’s of conditierapporten beschikbaar op verzoek?',
    answer: 'Absoluut. Wij leveren graag aanvullende hoge-resolutie detailfoto’s, UV-licht opnames van de binding of een uitgebreid collatierapport per e-mail of WhatsApp.',
    question_en: 'Are additional photographs or condition reports available upon request?',
    answer_en: 'Absolutely. We are pleased to provide supplementary high-resolution photographs, UV light inspection images of bindings, or collation reports via email or WhatsApp.',
    question_fr: 'Est-il possible d’obtenir des photos supplémentaires ou un rapport de condition ?',
    answer_fr: 'Tout à fait. Nous fournissons volontiers des visuels haute définition complémentaires, des clichés sous lumière UV ou un rapport de collation détaillé par e-mail ou WhatsApp.',
    displayOrder: 5
  },
  {
    id: 'faq-6',
    question: 'Kunt u helpen bij het zoeken naar een specifiek historisch zeldzaam boek?',
    answer: 'Ja. Via ons internationale netwerk van adellijke bibliotheken, veilinghuizen en privé-verzamelaars voeren wij gerichte zoekopdrachten uit voor bibliofielen en kunstverzamelaars.',
    question_en: 'Can you assist in sourcing a specific rare historical book?',
    answer_en: 'Yes. Through our international network of noble libraries, auction houses, and private collectors, we conduct targeted search assignments for bibliophiles and art collectors.',
    question_fr: 'Pouvez-vous nous aider à rechercher un ouvrage historique spécifique ?',
    answer_fr: 'Oui. Grâce à notre réseau international de bibliothèques privées, maisons de ventes et collectionneurs, nous réalisons des recherches ciblées pour les bibliophiles.',
    displayOrder: 6
  }
];

export const getFaqItems = () => {
  try {
    const saved = localStorage.getItem(FAQ_ITEMS_KEY);
    if (!saved) return DEFAULT_FAQ_ITEMS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : DEFAULT_FAQ_ITEMS;
  } catch (err) {
    console.error("Fout bij ophalen FAQ items:", err);
    return DEFAULT_FAQ_ITEMS;
  }
};

export const fetchFaqItemsAsync = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'faq_items')
        .maybeSingle();

      if (!error && data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed)) {
          localStorage.setItem(FAQ_ITEMS_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (err) {
      console.error("Supabase FAQ fetch error:", err);
    }
  }
  return getFaqItems();
};

export const saveFaqItemsAsync = async (faqItems) => {
  try {
    localStorage.setItem(FAQ_ITEMS_KEY, JSON.stringify(faqItems));
  } catch (err) {
    console.error("Fout bij lokaal opslaan FAQ items:", err);
    throw new Error('De FAQ kon niet lokaal worden opgeslagen.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const payload = JSON.stringify(faqItems);
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'faq_items',
          value: payload,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (err) {
      console.error("Supabase FAQ save exception:", err);
      throw new Error('De FAQ is lokaal bewaard, maar niet naar de cloud gesynchroniseerd.');
    }
  }
  return faqItems;
};
