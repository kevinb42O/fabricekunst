import { INITIAL_CATALOG } from '../data/initialCatalog';

const CATALOG_KEY = 'fabrice_boeken_kunst_catalog';
const INQUIRIES_KEY = 'fabrice_boeken_kunst_inquiries';
const PASSCODE_KEY = 'fabrice_admin_pin';

// Default Admin PIN Code: "5438"
const DEFAULT_PASSCODE = "5438";

export const getCatalog = () => {
  try {
    const saved = localStorage.getItem(CATALOG_KEY);
    if (!saved) {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(INITIAL_CATALOG));
      return INITIAL_CATALOG;
    }
    const parsed = JSON.parse(saved);
    let filtered = parsed.filter(item => item.id !== 'blaeu-atlas-1662');

    // Ensure all items from INITIAL_CATALOG exist and have proper itemType
    INITIAL_CATALOG.forEach(initialItem => {
      const exists = filtered.some(i => i.id === initialItem.id);
      if (!exists) {
        filtered.push(initialItem);
      }
    });

    filtered = filtered.map(item => {
      const initial = INITIAL_CATALOG.find(i => i.id === item.id);
      return {
        itemType: item.itemType || initial?.itemType || 'book',
        ...item,
        historicalContext: item.historicalContext || initial?.historicalContext,
        conditionReport: item.conditionReport || initial?.conditionReport,
        provenanceDetails: item.provenanceDetails || initial?.provenanceDetails,
        collationSpecs: item.collationSpecs || initial?.collationSpecs,
      };
    });

    // Ensure Voltaire has /images/voltaire-theatre-bust-reading-glasses.jpg as primary image 0
    const voltaire = filtered.find(item => item.id === 'voltaire-1829-52delig');
    if (voltaire && voltaire.images && voltaire.images[0]?.url !== '/images/voltaire-theatre-bust-reading-glasses.jpg') {
      const bustIdx = voltaire.images.findIndex(img => img.url === '/images/voltaire-theatre-bust-reading-glasses.jpg');
      if (bustIdx !== -1) {
        const bustImg = voltaire.images.splice(bustIdx, 1)[0];
        voltaire.images.unshift(bustImg);
      }
    }

    localStorage.setItem(CATALOG_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error("Fout bij ophalen catalogus uit LocalStorage", e);
    return INITIAL_CATALOG;
  }
};

export const saveCatalog = (items) => {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Fout bij opslaan catalogus", e);
  }
};

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
        message: "Goedendag Fabrice, ik zou graag een afspraak maken voor een privé-bezichtiging van de 52-delige Voltaire reeks met ex-libris Vacheron-Poinsot. Bent u aanstaande donderdag beschikbaar?",
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
        message: "Beste Fabrice, hartelijke groeten uit Parijs. Ik bied € 2.600 voor de 3-delige Scarron uit 1713. Is verzending naar Frankrijk in een geconditioneerde verpakking mogelijk?",
        status: "In behandeling"
      }
    ];
  } catch (e) {
    console.error("Fout bij ophalen aanvragen", e);
    return [];
  }
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

export const verifyAdminPasscode = (pin) => {
  const currentPin = localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
  return pin === currentPin;
};

export const getCurrentPasscode = () => {
  return localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
};

export const updateAdminPasscode = (newPin) => {
  localStorage.setItem(PASSCODE_KEY, newPin);
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
  link.download = `fabrice_boeken_kunst_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importDataJSON = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.catalog && Array.isArray(parsed.catalog)) {
      saveCatalog(parsed.catalog);
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
    localStorage.removeItem(PASSCODE_KEY);
    return true;
  } catch (e) {
    console.error("Fout bij herstellen initiële data", e);
    return false;
  }
};

