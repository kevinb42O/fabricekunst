import { INITIAL_CATALOG } from '../data/initialCatalog';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const CATALOG_KEY = 'atelier_rembrandt_catalog';
const INQUIRIES_KEY = 'atelier_rembrandt_inquiries';
const HERO_SLIDES_KEY = 'atelier_rembrandt_hero_slides';
const OLD_CATALOG_KEY_2 = 'rare_art_books_catalog';
const OLD_INQUIRIES_KEY_2 = 'rare_art_books_inquiries';
const OLD_HERO_SLIDES_KEY_2 = 'rare_art_books_hero_slides';
const OLD_CATALOG_KEY = 'fabrice_boeken_kunst_catalog';
const OLD_INQUIRIES_KEY = 'fabrice_boeken_kunst_inquiries';
const OLD_HERO_SLIDES_KEY = 'fabrice_boeken_kunst_hero_slides';

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'scarron-1713',
    title: 'Les Œuvres de Monsieur Scarron',
    year: 'Amsterdam 1713',
    subtitle: 'Originele kopergravures & gemarmerde schutbladen in goudgestempeld leder.',
    image: '/images/hero/hero-scarron-candlelight.jpg',
    objectPosition: 'center 35%',
    tag: 'I'
  },
  {
    id: 'voltaire-theatre',
    title: 'Théâtre de Voltaire',
    year: 'Parijs 1829',
    subtitle: 'Met zeldzame kopergravure en antieke messing leesbril.',
    image: '/images/hero/hero-voltaire-glasses.jpg',
    objectPosition: 'center center',
    tag: 'II'
  },
  {
    id: 'scarron-engraving',
    title: '18e-Eeuwse Kopergravures',
    year: 'Amsterdam 1713',
    subtitle: 'Gedetailleerde koperetsing door meester-graveurs uit de Verlichting.',
    image: '/images/hero/hero-scarron-engraving.jpg',
    objectPosition: 'center top',
    tag: 'III'
  },
  {
    id: 'provenance-exlibris',
    title: 'Ex-Libris & Provenance',
    year: 'Historische Collectie',
    subtitle: 'Verifieerbare adellijke herkomst met origineel Vacheron-Poinsot stempel.',
    image: '/images/hero/hero-voltaire-exlibris.jpg',
    objectPosition: 'center center',
    tag: 'IV'
  }
];

export const getHeroSlides = () => {
  try {
    const saved = localStorage.getItem(HERO_SLIDES_KEY) || localStorage.getItem(OLD_HERO_SLIDES_KEY_2) || localStorage.getItem(OLD_HERO_SLIDES_KEY);
    if (!saved) return DEFAULT_HERO_SLIDES;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_HERO_SLIDES;
  } catch (err) {
    console.error("Fout bij ophalen hero slides:", err);
    return DEFAULT_HERO_SLIDES;
  }
};

export const saveHeroSlidesAsync = async (slides) => {
  try {
    localStorage.setItem(HERO_SLIDES_KEY, JSON.stringify(slides));
    return slides;
  } catch (err) {
    console.error("Fout bij opslaan hero slides:", err);
    return slides;
  }
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
};

// Map database column names (snake_case) to frontend item object (camelCase)
const mapDbItemToFrontend = (dbItem) => {
  if (!dbItem) return dbItem;

  const title_en = extractFieldValue(dbItem, 'title', 'en');
  const title_fr = extractFieldValue(dbItem, 'title', 'fr');
  const subtitle_en = extractFieldValue(dbItem, 'subtitle', 'en');
  const subtitle_fr = extractFieldValue(dbItem, 'subtitle', 'fr');
  const description_en = extractFieldValue(dbItem, 'description', 'en');
  const description_fr = extractFieldValue(dbItem, 'description', 'fr');
  const binding_en = extractFieldValue(dbItem, 'binding', 'en');
  const binding_fr = extractFieldValue(dbItem, 'binding', 'fr');
  const condition_en = extractFieldValue(dbItem, 'condition', 'en');
  const condition_fr = extractFieldValue(dbItem, 'condition', 'fr');
  const provenance_en = extractFieldValue(dbItem, 'provenance', 'en');
  const provenance_fr = extractFieldValue(dbItem, 'provenance', 'fr');
  const provenance_details_en = extractFieldValue(dbItem, 'provenanceDetails', 'en');
  const provenance_details_fr = extractFieldValue(dbItem, 'provenanceDetails', 'fr');
  const condition_report_en = extractFieldValue(dbItem, 'conditionReport', 'en');
  const condition_report_fr = extractFieldValue(dbItem, 'conditionReport', 'fr');
  const historical_context_en = extractFieldValue(dbItem, 'historicalContext', 'en');
  const historical_context_fr = extractFieldValue(dbItem, 'historicalContext', 'fr');
  const collation_specs_en = extractFieldValue(dbItem, 'collationSpecs', 'en');
  const collation_specs_fr = extractFieldValue(dbItem, 'collationSpecs', 'fr');

  return {
    ...dbItem,
    id: dbItem.id,
    itemType: dbItem.item_type || dbItem.itemType || 'book',
    ref: dbItem.ref || '',
    title: dbItem.title || '',
    subtitle: dbItem.subtitle || '',
    author: dbItem.author || '',
    publisher: dbItem.publisher || '',
    city: dbItem.city || '',
    year: dbItem.year || '',
    century: dbItem.century || '',
    category: dbItem.category || '',
    price: dbItem.price || '',
    status: dbItem.status || 'Beschikbaar',
    featured: Boolean(dbItem.featured),
    condition: dbItem.condition || '',
    binding: dbItem.binding || '',
    dimensions: dbItem.dimensions || '',
    provenance: dbItem.provenance || '',
    description: dbItem.description || '',
    historicalContext: dbItem.historical_context || dbItem.historicalContext || '',
    conditionReport: dbItem.condition_report || dbItem.conditionReport || '',
    provenanceDetails: dbItem.provenance_details || dbItem.provenanceDetails || '',
    collationSpecs: dbItem.collation_specs || dbItem.collationSpecs || '',
    images: dbItem.images || [],

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

    provenance_details_en,
    provenance_details_fr,
    provenanceDetails_en: provenance_details_en,
    provenanceDetails_fr: provenance_details_fr,

    condition_report_en,
    condition_report_fr,
    conditionReport_en: condition_report_en,
    conditionReport_fr: condition_report_fr,

    historical_context_en,
    historical_context_fr,
    historicalContext_en: historical_context_en,
    historicalContext_fr: historical_context_fr,

    collation_specs_en,
    collation_specs_fr,
    collationSpecs_en: collation_specs_en,
    collationSpecs_fr: collation_specs_fr
  };
};

// Map frontend item object (camelCase) to database column names (snake_case)
const mapFrontendItemToDb = (item) => ({
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
  category: item.category,
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
  images: item.images || [],
  
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
});

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
      const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbItemToFrontend);
        localStorage.setItem(CATALOG_KEY, JSON.stringify(mapped));
        return mapped;
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

export const saveCatalogAsync = async (items) => {
  saveCatalog(items);
  if (isSupabaseConfigured() && supabase) {
    try {
      const dbItems = items.map(mapFrontendItemToDb);
      const { error } = await supabase.from('items').upsert(dbItems, { onConflict: 'id' });
      if (error) console.error("Error upserting catalog to Supabase", error);
    } catch (e) {
      console.error("Supabase catalog save failed", e);
    }
  }
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

  if (isSupabaseConfigured() && supabase) {
    try {
      const dbItem = mapFrontendItemToDb(item);
      const { error } = await supabase.from('items').upsert(dbItem, { onConflict: 'id' });
      if (error) console.error("Supabase item save error:", error);
    } catch (e) {
      console.error("Supabase item save exception:", e);
    }
  }
  return updatedCatalog;
};

export const deleteItemAsync = async (itemId) => {
  const currentCatalog = getCatalog();
  const updatedCatalog = currentCatalog.filter(i => i.id !== itemId);
  saveCatalog(updatedCatalog);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) console.error("Supabase item delete error:", error);
    } catch (e) {
      console.error("Supabase item delete exception:", e);
    }
  }
  return updatedCatalog;
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
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `catalog/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('catalog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error("Supabase image upload error:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('catalog-images')
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
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
  try {
    const saved = localStorage.getItem(INQUIRIES_KEY) || localStorage.getItem(OLD_INQUIRIES_KEY_2) || localStorage.getItem(OLD_INQUIRIES_KEY);
    return saved ? JSON.parse(saved) : [
      {
        id: "inq-1",
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        itemTitle: "Voltaire — Œuvres Complètes (52 delen)",
        itemRef: "FB-1829-VOL",
        name: "Graaf De Limburg Stirum",
        email: "d.limburg@heritage-collection.be",
        phone: "+32 475 88 12 34",
        type: "Privé-bezichtiging aanvragen",
        message: "Goedendag, ik zou graag een afspraak maken voor een privé-bezichtiging van de 52-delige Voltaire reeks met ex-libris Vacheron-Poinsot. Bent u aanstaande donderdag beschikbaar?",
        status: "Nieuw"
      },
      {
        id: "inq-2",
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        itemTitle: "Les Œuvres de Monsieur Scarron (1713)",
        itemRef: "FB-1713-SCA",
        name: "Jean-Pierre Vacheron",
        email: "jp.vacheron@antiquariat-paris.fr",
        phone: "+33 6 12 34 56 78",
        type: "Doe een bod",
        message: "Beste, hartelijke groeten uit Parijs. Ik bied € 2.600 voor de 3-delige Scarron uit 1713. Is verzending naar Frankrijk in een geconditioneerde verpakking mogelijk?",
        status: "In behandeling"
      }
    ];
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
        const mapped = data.map(mapDbInquiryToFrontend);
        localStorage.setItem(INQUIRIES_KEY, JSON.stringify(mapped));
        return mapped;
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
      id: `inq-${Date.now()}`,
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
  const newInquiry = saveInquiry(inquiry);
  if (newInquiry && isSupabaseConfigured() && supabase) {
    try {
      const dbInq = mapFrontendInquiryToDb(newInquiry);
      const { error } = await supabase.from('inquiries').insert(dbInq);
      if (error) console.error("Supabase inquiry insert error", error);
    } catch (e) {
      console.error("Supabase inquiry insert exception", e);
    }
  }
  return newInquiry;
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
  const updated = updateInquiryStatus(id, newStatus);
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('inquiries').update({ status: newStatus }).eq('id', id);
      if (error) console.error("Supabase inquiry status update error", error);
    } catch (e) {
      console.error("Supabase inquiry status update exception", e);
    }
  }
  return updated;
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
  const updated = updateInquiryNotes(id, notes);
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('inquiries').update({ notes }).eq('id', id);
      if (error) console.error("Supabase inquiry notes update error", error);
    } catch (e) {
      console.error("Supabase inquiry notes update exception", e);
    }
  }
  return updated;
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
  const updated = deleteInquiry(id);
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('inquiries').delete().eq('id', id);
      if (error) console.error("Supabase inquiry delete error", error);
    } catch (e) {
      console.error("Supabase inquiry delete exception", e);
    }
  }
  return updated;
};

// --- AUTHENTICATION & ADMIN USERS (SECURE DATABASE AUTH) ---

export const authenticateAdminUserAsync = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Authenticatiedienst is momenteel niet geconfigureerd.' };
  }

  try {
    // 1. Check admin_settings table (key: user_<email>)
    const { data: settingsData } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', `user_${cleanEmail}`)
      .maybeSingle();

    if (settingsData && settingsData.value) {
      try {
        const parsed = typeof settingsData.value === 'string' ? JSON.parse(settingsData.value) : settingsData.value;
        if (parsed.password === password) {
          return {
            success: true,
            user: {
              email: cleanEmail,
              name: parsed.name || cleanEmail,
              role: parsed.role || 'admin'
            }
          };
        } else {
          return { success: false, message: 'Toegang geweigerd. Controleer e-mailadres en wachtwoord.' };
        }
      } catch (e) {
        console.error("Fout bij parsen van account uit admin_settings", e);
      }
    }

    // 2. Check admin_users table if present
    const { data: userData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (userData && userData.password === password) {
      return {
        success: true,
        user: {
          email: userData.email,
          name: userData.name,
          role: userData.role
        }
      };
    }

    return { success: false, message: 'Toegang geweigerd. Controleer e-mailadres en wachtwoord.' };
  } catch (e) {
    console.error("Authenticatiefout:", e);
    return { success: false, message: 'Fout bij verifiëren van inloggegevens.' };
  }
};

export const updateAdminPasswordAsync = async (email, currentPassword, newPassword) => {
  const cleanEmail = email.trim().toLowerCase();
  const authResult = await authenticateAdminUserAsync(cleanEmail, currentPassword);
  if (!authResult.success) {
    return { success: false, message: 'Huidige wachtwoord is onjuist.' };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      // Upsert into admin_settings
      const userPayload = JSON.stringify({
        password: newPassword,
        name: authResult.user?.name || cleanEmail,
        role: authResult.user?.role || 'admin'
      });

      await supabase.from('admin_settings').upsert({
        key: `user_${cleanEmail}`,
        value: userPayload,
        updated_at: new Date().toISOString()
      });

      // Try updating admin_users table if present
      await supabase.from('admin_users').update({
        password: newPassword,
        updated_at: new Date().toISOString()
      }).eq('email', cleanEmail);

      return { success: true, message: 'Wachtwoord succesvol gewijzigd!' };
    } catch (e) {
      console.error("Supabase password update exception:", e);
      return { success: false, message: 'Verbindingsfout bij bijwerken wachtwoord.' };
    }
  }

  return { success: false, message: 'Database niet beschikbaar.' };
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
    title: 'Gecertificeerde Provenance & Wetenschappelijk Onderzoek',
    subtitle: 'Elk zeldzaam meesterwerk in onze collectie wordt vergezeld van een aantoonbare herkomstgeschiedenis en een grondig bibliografisch verificatierapport.',
    bgImage: '/images/hero/hero-voltaire-exlibris.jpg'
  },
  protocol: {
    badge: 'Gecertificeerd Verificatieprotocol',
    title: 'Het Protocol van Authenticiteit & Verificatie',
    subtitle: 'Voordat een antiquarisch meesterwerk in onze gecureerde collectie wordt opgenomen, doorloopt het ons vierstappen-onderzoeksprotocol.',
    steps: [
      {
        step: '01',
        title: 'Fysiek & Materieel Onderzoek',
        description: 'Nauwkeurige inspectie van papierstructuur, watermerken, binding, marmerpapier en 18e-eeuws rood roggevel shagreen leder.'
      },
      {
        step: '02',
        title: 'Archief & Provenance Check',
        description: 'Verificatie van ex-libris stempels, eigenaarsinscripties en historische veilingcatalogi uit adellijke en bibliofiele privécollecties.'
      },
      {
        step: '03',
        title: 'Bibliografische Match',
        description: 'Kruisverwijzing met standaard naslagwerken (Brunet, Cohen-de Ricci, Graesse) voor oplage, gravure-aantallen en zeldzaamheid.'
      },
      {
        step: '04',
        title: 'Certificaat van Echtheid',
        description: 'Elk werk wordt geleverd met een officieel Atelier Rembrandt echtheidscertificaat met gedetailleerde conditiestatus en herkomst.'
      }
    ]
  },
  story: {
    badge: 'Ex-Libris & Eigendomssporen',
    title: 'Aantoonbare Historie van Franse Topverzamelaars',
    quote: 'Een antiek boek ontleent zijn ultieme waarde aan de tastbare bewijzen van zijn reis door de eeuwen heen.',
    quoteAuthor: 'Atelier Rembrandt',
    narrative: 'Zeldzame stukken uit onze privé-bibliotheek worden niet alleen geanalyseerd op fysieke staat, maar ook op provenance. Heraldieke stempels, ex-libris afbeeldingen en marginalia vormen de ononderbroken keten van eigenaarskap sinds de eerste druk.',
    image: '/images/voltaire-marbled-endpaper-exlibris.jpg',
    imageCaption: 'Ex-Libris Vacheron-Poinsot op handgemaakt gemarmerd schutblad (1829).',
    bullets: [
      'Adellijk Heraldiek Stempel (Vacheron-Poinsot)',
      'Ongebroken Eigendomsreeks (1829 – Heden)'
    ]
  },
  cta: {
    badge: 'Particuliere Expertise & Consultatie',
    title: 'Wilt u de Herkomst van uw Eigen Collectie Laten Verifiëren?',
    subtitle: 'Atelier Rembrandt adviseert verzamelaars en erfgenamen bij de waardebepaling, conservering en authenticiteitsverificatie van historische privé-bibliotheken.',
    buttonText: 'Privé Consultatie Aanvragen'
  }
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
        steps: Array.isArray(parsed.protocol?.steps) && parsed.protocol.steps.length === 4 
          ? parsed.protocol.steps 
          : DEFAULT_PROVENANCE_DATA.protocol.steps
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
            steps: Array.isArray(parsed.protocol?.steps) && parsed.protocol.steps.length === 4 
              ? parsed.protocol.steps 
              : DEFAULT_PROVENANCE_DATA.protocol.steps
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
      if (error) console.error("Supabase herkomst page save error:", error);
    } catch (err) {
      console.error("Supabase herkomst page save exception:", err);
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FAQ_ITEMS;
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
        if (Array.isArray(parsed) && parsed.length > 0) {
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
      if (error) console.error("Supabase FAQ save error:", error);
    } catch (err) {
      console.error("Supabase FAQ save exception:", err);
    }
  }
  return faqItems;
};

