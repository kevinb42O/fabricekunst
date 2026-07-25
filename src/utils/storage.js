import { INITIAL_CATALOG } from '../data/initialCatalog';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const CATALOG_KEY = 'fabrice_boeken_kunst_catalog';
const INQUIRIES_KEY = 'fabrice_boeken_kunst_inquiries';

// Map database column names (snake_case) to frontend item object (camelCase)
const mapDbItemToFrontend = (dbItem) => ({
  id: dbItem.id,
  itemType: dbItem.item_type || 'book',
  ref: dbItem.ref,
  title: dbItem.title,
  subtitle: dbItem.subtitle,
  author: dbItem.author,
  publisher: dbItem.publisher,
  city: dbItem.city,
  year: dbItem.year,
  century: dbItem.century,
  category: dbItem.category,
  price: dbItem.price,
  status: dbItem.status,
  featured: dbItem.featured,
  condition: dbItem.condition,
  binding: dbItem.binding,
  dimensions: dbItem.dimensions,
  provenance: dbItem.provenance,
  description: dbItem.description,
  historicalContext: dbItem.historical_context,
  conditionReport: dbItem.condition_report,
  provenanceDetails: dbItem.provenance_details,
  collationSpecs: dbItem.collation_specs,
  images: dbItem.images || []
});

// Map frontend item object (camelCase) to database column names (snake_case)
const mapFrontendItemToDb = (item) => ({
  id: item.id,
  item_type: item.itemType || 'book',
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
  historical_context: item.historicalContext,
  condition_report: item.conditionReport,
  provenance_details: item.provenanceDetails,
  collation_specs: item.collationSpecs,
  images: item.images || [],
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
    const saved = localStorage.getItem(CATALOG_KEY);
    if (!saved) {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(INITIAL_CATALOG));
      return INITIAL_CATALOG;
    }
    const parsed = JSON.parse(saved);
    return parsed.length > 0 ? parsed : INITIAL_CATALOG;
  } catch (e) {
    console.error("Error reading catalog from localStorage", e);
    return INITIAL_CATALOG;
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
    const saved = localStorage.getItem(INQUIRIES_KEY);
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
