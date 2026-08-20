import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, Search, Upload, Copy, Star, CheckCircle2, Image as ImageIcon, BookOpen, Layers, Palette, Bookmark, History, Loader2, Globe, Award, ShieldCheck, Check, Sparkles, Download, MoreVertical, ExternalLink, Landmark, ArrowDown, ArrowUp, ArrowUpDown, Filter } from 'lucide-react';
import {
  CATEGORIES,
  COLLECTION_GROUPS,
  ITEM_TYPES,
  getCategoriesForGroup,
  getCategorySlug,
  getCollectionGroupForItem,
  getDefaultCategoryForGroup,
  getItemTypesForGroup,
  getItemTypeDefinition,
  getLocalizedCategoryLabel,
  getLocalizedCollectionGroup,
  getLocalizedItemType
} from '../../data/catalogTaxonomy';
import { isR2CatalogImageUrl, uploadCatalogImage } from '../../utils/storage';
import { isPriceOnRequest, isFieldMarkedEmpty, copyTextToClipboard, parseAiJsonTranslation } from '../../utils/translationService';

const createComparableSale = () => ({
  id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  published: false,
  imageUrl: '',
  imageCaption: '',
  description: '',
  description_en: '',
  description_fr: '',
  seller: '',
  saleDate: '',
  lotNumber: '',
  realizedPrice: '',
  priceType: 'unknown',
  saleUrl: ''
});

const isSafeHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const parsePriceForSort = (value) => {
  const formattedPrice = String(value || '').replace(/[^\d,.-]/g, '');
  if (!/\d/.test(formattedPrice)) return null;

  const lastComma = formattedPrice.lastIndexOf(',');
  const lastDot = formattedPrice.lastIndexOf('.');
  const lastSeparatorIndex = Math.max(lastComma, lastDot);
  const decimalDigits = lastSeparatorIndex === -1
    ? ''
    : formattedPrice.slice(lastSeparatorIndex + 1).replace(/\D/g, '');
  const hasDecimalSeparator = decimalDigits.length > 0 && decimalDigits.length <= 2;
  const integerPart = hasDecimalSeparator
    ? formattedPrice.slice(0, lastSeparatorIndex).replace(/[^\d-]/g, '')
    : formattedPrice.replace(/[^\d-]/g, '');
  const normalizedPrice = hasDecimalSeparator
    ? `${integerPart}.${decimalDigits}`
    : integerPart;
  const numericPrice = Number.parseFloat(normalizedPrice);

  return Number.isFinite(numericPrice) ? numericPrice : null;
};

const isComparableSaleComplete = (sale) => isSafeHttpUrl(sale?.imageUrl);

const getItemTypeIcon = (type) => {
  if (type === 'book') return BookOpen;
  if (type === 'painting') return Palette;
  return Landmark;
};

export const getItemTranslationStatus = (item) => {
  if (!item) return { isComplete: false, completeCount: 0, totalLangs: 3, details: { nl: { missing: [] }, en: { missing: [] }, fr: { missing: [] } } };

  const getRawVal = (fieldName, lang) => {
    const camelField = fieldName.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    const snakeField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();

    if (lang === 'nl') {
      const keysToCheck = [fieldName, camelField, snakeField];
      for (const k of keysToCheck) {
        if (item[k] !== undefined && item[k] !== null && typeof item[k] === 'string' && item[k].trim() !== '') {
          return item[k];
        }
      }
      return '';
    }

    const langLower = lang.toLowerCase();
    const langUpper = lang.toUpperCase();
    const langCap = lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();

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

  const fieldLabels = getItemTypeDefinition(item.itemType).fieldLabels;

  const keyLabels = {
    title: fieldLabels.title,
    subtitle: 'Subtitel',
    author: fieldLabels.author,
    publisher: fieldLabels.publisher,
    city: fieldLabels.city,
    dimensions: fieldLabels.dimensions,
    binding: fieldLabels.binding,
    condition: 'Staat & Conditie',
    provenance: 'Herkomst Summary',
    description: 'Beschrijving',
    conditionReport: 'Conditierapport',
    provenanceDetails: 'Provenance Details',
    historicalContext: 'Historische Context',
    collationSpecs: 'Collatie Specs'
  };

  // Base form fields expected for the master Dutch record
  const masterFormFields = [
    'title',
    'publisher',
    'city',
    'dimensions',
    'binding',
    'condition',
    'provenance',
    'description'
  ];

  // Extended optional fields that become active if filled or NVT in Dutch
  const optionalExtendedFields = [
    'subtitle',
    'author',
    'conditionReport',
    'provenanceDetails',
    'historicalContext',
    'collationSpecs'
  ];

  const details = {
    nl: { code: 'nl', label: 'Nederlands', missing: [] },
    en: { code: 'en', label: 'English', missing: [] },
    fr: { code: 'fr', label: 'Français', missing: [] }
  };

  // 1. Check Dutch [NL] master form fields
  for (const field of masterFormFields) {
    const val = getRawVal(field, 'nl');
    const isNvt = isFieldMarkedEmpty(item, field, 'nl');
    if ((!val || typeof val !== 'string' || val.trim() === '') && !isNvt) {
      details.nl.missing.push(keyLabels[field] || field);
    }
  }

  // Active fields in Dutch (master fields + any optional fields filled or marked NVT in Dutch)
  const activeFieldsForTranslation = [
    ...masterFormFields,
    ...optionalExtendedFields.filter(field => {
      const val = getRawVal(field, 'nl');
      const isNvt = isFieldMarkedEmpty(item, field, 'nl');
      return isNvt || (val && typeof val === 'string' && val.trim() !== '');
    })
  ];

  // 2. Check English [EN] & French [FR] against active fields
  for (const lang of ['en', 'fr']) {
    for (const field of activeFieldsForTranslation) {
      const val = getRawVal(field, lang);
      const isNvt = isFieldMarkedEmpty(item, field, lang);

      // Metadata fields (publisher, city, dimensions, author) fallback to Dutch value if non-empty
      const nlVal = getRawVal(field, 'nl');
      const isMetadataField = ['publisher', 'city', 'dimensions', 'author'].includes(field);
      const hasFallback = isMetadataField && nlVal && typeof nlVal === 'string' && nlVal.trim() !== '';

      if ((!val || typeof val !== 'string' || val.trim() === '') && !isNvt && !hasFallback) {
        details[lang].missing.push(keyLabels[field] || field);
      }
    }
  }

  let completeCount = 0;
  if (details.nl.missing.length === 0) completeCount++;
  if (details.en.missing.length === 0) completeCount++;
  if (details.fr.missing.length === 0) completeCount++;

  return {
    isComplete: completeCount === 3,
    completeCount,
    totalLangs: 3,
    details
  };
};

const getTranslationTooltip = (translationStatus) => {
  if (translationStatus.isComplete) {
    return 'Vertalingen compleet · Nederlands, Engels en Frans';
  }

  const missingSummary = Object.values(translationStatus.details)
    .filter((language) => language.missing.length > 0)
    .map((language) => `${language.label}: ${language.missing.length} ${language.missing.length === 1 ? 'veld' : 'velden'}`)
    .join(' · ');

  return `Vertaalstatus ${translationStatus.completeCount}/3 · ${missingSummary}`;
};

export default function ItemManager({
  items,
  onSaveItem,
  onDeleteItem,
  onShowToast,
  onOpenCertificate,
  createRequestKey = 0,
  onCreateRequestHandled = () => {}
}) {
  const [editingItem, setEditingItem] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(false);
  const [formLang, setFormLang] = useState('nl');
  const [editorTab, setEditorTab] = useState('specs'); // 'specs' | 'multilingual'
  const [openMenuId, setOpenMenuId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleSaveFormRef = React.useRef();
  
  // Global Keyboard Shortcut (Cmd+S / Ctrl+S to Save, Esc to Close)
  useEffect(() => {
    if (!editingItem) return;
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (handleSaveFormRef.current) handleSaveFormRef.current();
      } else if (e.key === 'Escape') {
        setEditingItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItem]);

  // AI Translation Helper State
  const [showAiImportModal, setShowAiImportModal] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState('');

  
  // Filtering State
  const [filterQuery, setFilterQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Alle'); // 'Alle' | 'book' | 'painting'
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [categoryFilter, setCategoryFilter] = useState('Alle');

  // Input for adding photo via URL in modal
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const emptyItem = {
    itemType: 'book',
    collectionGroup: 'books',
    id: '',
    ref: `FB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    subtitle: '',
    author: '',
    publisher: '',
    city: '',
    year: new Date().getFullYear().toString(),
    century: '18e Eeuw',
    category: 'literature-philosophy',
    price: 'Prijs op aanvraag',
    status: 'Beschikbaar',
    featured: false,
    condition: 'Excellente antiquarische staat. Originele band met goudstempels.',
    binding: 'Volledige lederen band met goudstempels op de rug.',
    dimensions: 'In-8°',
    provenance: 'Herkomst uit particuliere collectie.',
    description: '',
    historicalContext: '',
    conditionReport: '',
    provenanceDetails: '',
    collationSpecs: '',
    comparableSales: [],
    attributes: {},
    images: []
  };

  const handleCreateNew = () => {
    setEditingItem({ ...emptyItem, id: `item-${Date.now()}` });
    setIsNew(true);
    setImageUploadError(false);
  };

  useEffect(() => {
    if (!createRequestKey) return;
    handleCreateNew();
    onCreateRequestHandled();
  }, [createRequestKey]);

  const handleEdit = (item) => {
    setEditingItem({
      ...item,
      images: item.images ? [...item.images] : [],
      comparableSales: Array.isArray(item.comparableSales)
        ? item.comparableSales.map(sale => ({ ...sale }))
        : []
    });
    setIsNew(false);
    setImageUploadError(false);
    setFormLang('nl');
  };

  const handleItemSurfaceClick = (event, item) => {
    if (event.target.closest('button, a, input, select, textarea, label, [role="menu"]')) return;
    handleEdit(item);
  };

  const getFormField = (field) => {
    if (!editingItem) return '';
    if (formLang === 'nl') return editingItem[field] || '';
    
    const langLower = formLang.toLowerCase();
    const langUpper = formLang.toUpperCase();
    const langCap = formLang.charAt(0).toUpperCase() + formLang.slice(1).toLowerCase();

    const camelField = field;
    const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();

    const possibleKeys = [
      `${camelField}_${langLower}`,
      `${snakeField}_${langLower}`,
      `${camelField}${langCap}`,
      `${snakeField}_${langUpper}`,
      `${camelField}_${langUpper}`,
      `${snakeField}${langCap}`
    ];

    for (const key of possibleKeys) {
      if (editingItem[key] !== undefined && editingItem[key] !== null && editingItem[key] !== '') {
        return editingItem[key];
      }
    }

    return '';
  };

  const isFieldNvt = (field, lang = formLang) => {
    return isFieldMarkedEmpty(editingItem, field, lang);
  };

  const toggleFieldNvt = (field, lang = formLang) => {
    if (!editingItem) return;
    const key = `${field}_${lang}`;
    const rawEmpty = editingItem.emptyFields || editingItem.empty_fields;
    const currentEmpty = typeof rawEmpty === 'object' && rawEmpty !== null && !Array.isArray(rawEmpty)
      ? { ...rawEmpty }
      : {};

    if (currentEmpty[key] || currentEmpty[field]) {
      delete currentEmpty[key];
      delete currentEmpty[field];
    } else {
      currentEmpty[key] = true;
    }

    setEditingItem({
      ...editingItem,
      emptyFields: currentEmpty,
      empty_fields: currentEmpty
    });
  };

  const toggleLangNvt = (lang = formLang) => {
    if (!editingItem) return;
    const key = `lang_${lang}`;
    const rawEmpty = editingItem.emptyFields || editingItem.empty_fields;
    const currentEmpty = typeof rawEmpty === 'object' && rawEmpty !== null && !Array.isArray(rawEmpty)
      ? { ...rawEmpty }
      : {};

    if (currentEmpty[key]) {
      delete currentEmpty[key];
    } else {
      currentEmpty[key] = true;
    }

    setEditingItem({
      ...editingItem,
      emptyFields: currentEmpty,
      empty_fields: currentEmpty
    });
  };

  const isLangNvt = (lang = formLang) => {
    if (!editingItem) return false;
    const rawEmpty = editingItem.emptyFields || editingItem.empty_fields;
    if (!rawEmpty) return false;
    const key = `lang_${lang}`;
    if (Array.isArray(rawEmpty)) return rawEmpty.includes(key);
    if (typeof rawEmpty === 'object') return Boolean(rawEmpty[key]);
    return false;
  };

  const renderFieldHeader = (label, field, required = false) => {
    const isNvt = isFieldNvt(field, formLang);
    return (
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
          <span className="text-[#B8860B] text-[10px] ml-1 font-mono">[{formLang.toUpperCase()}]</span>
        </label>
        <button
          type="button"
          onClick={() => toggleFieldNvt(field, formLang)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer border ${
            isNvt
              ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-xs'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-300'
          }`}
          title={isNvt ? "Klik om weer in te vullen" : "Markeer dit veld als N.v.t. / Bewust leeg"}
        >
          <span>{isNvt ? "✓ Bewust Leeg (N.v.t.)" : "+ Markeer N.v.t."}</span>
        </button>
      </div>
    );
  };

  const updateFormField = (field, value) => {
    if (!editingItem) return;
    
    // Auto-unmark N.v.t. if typing new value
    let newEmptyFields = editingItem.emptyFields || editingItem.empty_fields;
    const key = `${field}_${formLang}`;
    if (value && value.trim() !== '' && newEmptyFields && typeof newEmptyFields === 'object') {
      if (newEmptyFields[key] || newEmptyFields[field]) {
        newEmptyFields = { ...newEmptyFields };
        delete newEmptyFields[key];
        delete newEmptyFields[field];
      }
    }

    if (formLang === 'nl') {
      setEditingItem({ ...editingItem, [field]: value, emptyFields: newEmptyFields, empty_fields: newEmptyFields });
    } else {
      const langLower = formLang.toLowerCase();
      const langCap = formLang.charAt(0).toUpperCase() + formLang.slice(1).toLowerCase();
      const camelField = field;
      const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();

      setEditingItem({
        ...editingItem,
        emptyFields: newEmptyFields,
        empty_fields: newEmptyFields,
        [`${camelField}_${langLower}`]: value,
        [`${snakeField}_${langLower}`]: value,
        [`${camelField}${langCap}`]: value
      });
    }
  };

  // AI Translation Prompt Copy & Import Handlers (Context-Aware per active tab)
  const handleCopyAiPrompt = async () => {
    if (!editingItem) return;

    const fieldLabels = getItemTypeDefinition(editingItem.itemType).fieldLabels;

    const fieldsToTranslate = [
      { key: 'title', label: fieldLabels.title },
      { key: 'subtitle', label: 'Ondertitel / Korte Subtitel' },
      { key: 'publisher', label: fieldLabels.publisher },
      { key: 'city', label: fieldLabels.city },
      { key: 'description', label: 'Algemene Beschrijving & Overzicht' },
      { key: 'binding', label: fieldLabels.binding },
      { key: 'condition', label: 'Staat & Conditie Summary' },
      { key: 'collationSpecs', label: fieldLabels.collationSpecs },
      { key: 'provenance', label: 'Provenance (Korte Herkomst Omschrijving)' },
      { key: 'conditionReport', label: fieldLabels.conditionReport },
      { key: 'provenanceDetails', label: 'Uitgebreid Provenance Verhaal & Veilinghistorie' },
      { key: 'historicalContext', label: 'Diepgaande Historische & Kunsthistorische Context' }
    ];

    let sourceLangName = 'Nederlands';
    let targetLangInstruction = 'het Engels (en) en Frans (fr)';
    let targetKeys = (fKey) => [`${fKey}_en`, `${fKey}_fr`];

    if (formLang === 'en') {
      sourceLangName = 'Engels';
      targetLangInstruction = 'het Nederlands (nl) en Frans (fr)';
      targetKeys = (fKey) => [fKey, `${fKey}_fr`];
    } else if (formLang === 'fr') {
      sourceLangName = 'Frans';
      targetLangInstruction = 'het Nederlands (nl) en Engels (en)';
      targetKeys = (fKey) => [fKey, `${fKey}_en`];
    }

    const objectTypeLabel = getLocalizedItemType(editingItem.itemType, 'nl');
    const collectionGroupLabel = getLocalizedCollectionGroup(getCollectionGroupForItem(editingItem), 'nl');
    let promptText = `Vertaal de onderstaande gegevens van een ${objectTypeLabel} binnen de collectie ${collectionGroupLabel} van het ${sourceLangName} naar ${targetLangInstruction}.\n`;
    promptText += `Gebruik hoogwaardig vakjargon dat past bij het opgegeven objecttype.\n`;
    promptText += `Als een sectie "Niet ingevuld / Bewust leeg" is, vul dan in de JSON voor de corresponderende sleutels een lege string "" in.\n\n`;
    promptText += `Retourneer UITSLUITEND een geldig JSON object (geen inleidende tekst, geen markdown opmaak rond de code):\n\n`;

    const sampleJson = {};
    fieldsToTranslate.forEach(f => {
      const keys = targetKeys(f.key);
      keys.forEach(k => { sampleJson[k] = ""; });
    });
    promptText += `${JSON.stringify(sampleJson, null, 2)}\n\n`;
    promptText += `BRONGEGEVENS (${sourceLangName.toUpperCase()}):\n---------------------------\n`;

    fieldsToTranslate.forEach(f => {
      const val = getFormField(f.key);
      const isNvt = isFieldNvt(f.key, formLang);
      const content = (isNvt || !val || (typeof val === 'string' && val.trim() === '')) ? '[Niet ingevuld / Bewust leeg]' : val.trim();
      promptText += `* ${f.label} [${f.key}]:\n${content}\n\n`;
    });

    const success = await copyTextToClipboard(promptText);
    if (success && onShowToast) {
      onShowToast(`AI-vertaalprompt met ${sourceLangName} als bron is gekopieerd.`, 'info');
    }
  };

  const setFieldVariantKeys = (targetObj, emptyFieldsObj, key, val) => {
    targetObj[key] = val;
    delete emptyFieldsObj[key];

    const langMatch = key.match(/^(.*?)_(en|fr|nl)$/i);
    if (langMatch) {
      const base = langMatch[1];
      const lang = langMatch[2].toLowerCase();
      const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);

      const camelBase = base.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      const snakeBase = base.replace(/([A-Z])/g, '_$1').toLowerCase();

      targetObj[`${camelBase}_${lang}`] = val;
      targetObj[`${snakeBase}_${lang}`] = val;
      targetObj[`${camelBase}${langCap}`] = val;
      targetObj[`${snakeBase}${langCap}`] = val;

      delete emptyFieldsObj[`${camelBase}_${lang}`];
      delete emptyFieldsObj[`${snakeBase}_${lang}`];
      delete emptyFieldsObj[`${camelBase}${langCap}`];
      delete emptyFieldsObj[`${snakeBase}${langCap}`];
    } else {
      const camelBase = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      const snakeBase = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      targetObj[camelBase] = val;
      targetObj[snakeBase] = val;

      delete emptyFieldsObj[camelBase];
      delete emptyFieldsObj[snakeBase];
    }
  };

  const handleImportAiTranslation = () => {
    if (!aiJsonInput || !aiJsonInput.trim()) return;

    const data = parseAiJsonTranslation(aiJsonInput);
    if (!data) {
      if (onShowToast) onShowToast("Ongeldige JSON. Controleer het resultaat van de AI.", "error");
      return;
    }

    const updatedItem = { ...editingItem };
    const rawEmpty = updatedItem.emptyFields || updatedItem.empty_fields;
    const newEmptyFields = typeof rawEmpty === 'object' && rawEmpty !== null && !Array.isArray(rawEmpty)
      ? { ...rawEmpty }
      : {};
    let count = 0;

    Object.keys(data).forEach(key => {
      const val = data[key];
      if (typeof val === 'string' && val.trim() !== '') {
        setFieldVariantKeys(updatedItem, newEmptyFields, key, val.trim());
        count++;
      }
    });

    updatedItem.emptyFields = newEmptyFields;
    updatedItem.empty_fields = newEmptyFields;

    setEditingItem(updatedItem);
    setShowAiImportModal(false);
    setAiJsonInput('');
    if (onShowToast) onShowToast(`${count} vertaalvelden zijn geïmporteerd.`);
  };

  const handleDuplicate = (item) => {
    let newRef = `FB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    while (items.some(i => i.ref === newRef)) {
      newRef = `FB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const duplicatedItem = {
      ...item,
      id: `item-${Date.now()}`,
      ref: newRef,
      title: `${item.title} (Kopie)`
    };
    onSaveItem(duplicatedItem);
    if (onShowToast) onShowToast(`Gedupliceerd: "${duplicatedItem.title}"`);
  };

  const handleStatusChange = (item, newStatus) => {
    const updated = { ...item, status: newStatus };
    onSaveItem(updated);
    if (onShowToast) onShowToast(`Status van "${item.title}" gewijzigd naar ${newStatus}`);
  };

  const handleBatchStatusChange = async (newStatus) => {
    if (selectedItemIds.length === 0) return;
    const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
    try {
      await Promise.all(selectedItems.map((item) => onSaveItem({ ...item, status: newStatus })));
      if (onShowToast) onShowToast(`Status van ${selectedItems.length} objecten gewijzigd naar "${newStatus}"`);
      setSelectedItemIds([]);
    } catch (error) {
      console.error('Batch status update failed:', error);
      if (onShowToast) onShowToast('Niet alle statussen konden worden opgeslagen.', 'error');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItemIds.length === 0) return;
    setItemToDelete({ isBatch: true, count: selectedItemIds.length });
  };

  const handleToggleFeatured = (item) => {
    const updated = { ...item, featured: !item.featured };
    onSaveItem(updated);
    if (onShowToast) onShowToast(updated.featured ? `Gemarkeerd als Topstuk!` : `Topstuk markering verwijderd.`);
  };

  const handleSaveForm = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.title || !editingItem.title.trim()) {
      if (onShowToast) onShowToast("Kan niet opslaan: vul ten minste een titel in.", 'error');
      setEditorTab('specs');
      return;
    }

    if (isUploading) {
      if (onShowToast) onShowToast('Wacht tot alle afbeeldingen volledig naar R2 zijn geüpload.', 'error');
      return;
    }

    if (imageUploadError) {
      if (onShowToast) onShowToast('Minstens één R2-upload is mislukt. Upload die afbeelding opnieuw voordat u opslaat.', 'error');
      return;
    }

    const invalidPublishedSaleIndex = (editingItem.comparableSales || [])
      .findIndex(sale => sale.published && !isComparableSaleComplete(sale));
    if (invalidPublishedSaleIndex !== -1) {
      if (onShowToast) onShowToast(`Comparable sale ${invalidPublishedSaleIndex + 1} is onvolledig of bevat een ongeldige URL of datum.`, 'error');
      setEditorTab('comparable-sales');
      return;
    }

    if (onShowToast) onShowToast(`"${editingItem.title}" wordt opgeslagen...`, 'loading');

    let result;
    try {
      result = await onSaveItem(editingItem);
    } catch (error) {
      console.error('Item save failed:', error);
      if (onShowToast) onShowToast('Opslaan mislukt. Uw invoer blijft open zodat niets verloren gaat.', 'error');
      return;
    }
    if (!result || result.success === false || result.error) {
      if (onShowToast) onShowToast(`Cloudsynchronisatie mislukt: ${result?.error || 'onbekende fout'}`, 'error');
      return;
    }
    if (onShowToast) onShowToast(`"${editingItem.title}" is opgeslagen.`);
    setEditingItem(null);
  };
  handleSaveFormRef.current = handleSaveForm;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if ((editingItem?.images?.length || 0) + files.length > 30) {
      if (onShowToast) onShowToast('Een catalogusitem kan maximaal 30 afbeeldingen bevatten.', 'error');
      e.target.value = '';
      return;
    }
    setIsUploading(true);
    setImageUploadError(false);

    for (const file of files) {
      try {
        const publicUrl = await uploadCatalogImage(file);
        if (publicUrl) {
          setEditingItem(prev => ({
            ...prev,
            images: [
              ...prev.images,
              { url: publicUrl, caption: file.name }
            ]
          }));
        }
      } catch (err) {
        console.error("Fout bij uploaden foto:", err);
        setImageUploadError(true);
        if (onShowToast) onShowToast(err?.message || 'De foto kon niet naar R2 worden geüpload.', 'error');
      }
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const addComparableSale = () => {
    setEditingItem(prev => ({
      ...prev,
      comparableSales: [...(prev.comparableSales || []), createComparableSale()]
    }));
  };

  const updateComparableSale = (index, field, value) => {
    setEditingItem(prev => ({
      ...prev,
      comparableSales: (prev.comparableSales || []).map((sale, saleIndex) => (
        saleIndex === index ? { ...sale, [field]: value } : sale
      ))
    }));
  };

  const removeComparableSale = (index) => {
    if (!window.confirm('Deze comparable sale verwijderen?')) return;
    setEditingItem(prev => ({
      ...prev,
      comparableSales: (prev.comparableSales || []).filter((_, saleIndex) => saleIndex !== index)
    }));
  };

  const moveComparableSale = (index, direction) => {
    setEditingItem(prev => {
      const comparableSales = [...(prev.comparableSales || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= comparableSales.length) return prev;
      [comparableSales[index], comparableSales[targetIndex]] = [comparableSales[targetIndex], comparableSales[index]];
      return { ...prev, comparableSales };
    });
  };

  const handleComparableImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setImageUploadError(false);
    try {
      const publicUrl = await uploadCatalogImage(file);
      if (publicUrl) {
        updateComparableSale(index, 'imageUrl', publicUrl);
        updateComparableSale(index, 'imageCaption', file.name);
      }
    } catch (err) {
      console.error('Fout bij uploaden comparable sale foto:', err);
      setImageUploadError(true);
      if (onShowToast) onShowToast(err?.message || 'De foto kon niet naar R2 worden geüpload.', 'error');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleAddImageUrl = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newImageUrl.trim()) return;
    if (!isR2CatalogImageUrl(newImageUrl.trim())) {
      if (onShowToast) onShowToast('Gebruik uitsluitend een publieke R2-URL (media.atelierrembrandt.com).', 'error');
      return;
    }
    setEditingItem(prev => ({
      ...prev,
      images: [
        ...(prev.images || []),
        { url: newImageUrl.trim(), caption: newImageCaption.trim() || 'Afbeelding' }
      ]
    }));
    setNewImageUrl('');
    setNewImageCaption('');
    if (onShowToast) onShowToast("Afbeeldings-URL toegevoegd aan de galerij.");
  };

  const removeImage = (index) => {
    setEditingItem(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const makePrimaryImage = (index) => {
    if (index === 0) return;
    setEditingItem(prev => {
      const newImgs = [...prev.images];
      const selected = newImgs.splice(index, 1)[0];
      newImgs.unshift(selected);
      return { ...prev, images: newImgs };
    });
    if (onShowToast) onShowToast("Hoofdafbeelding gewijzigd.");
  };

  const moveImageUp = (index) => {
    if (index <= 0) return;
    setEditingItem(prev => {
      const newImgs = [...prev.images];
      const temp = newImgs[index - 1];
      newImgs[index - 1] = newImgs[index];
      newImgs[index] = temp;
      return { ...prev, images: newImgs };
    });
  };

  const moveImageDown = (index) => {
    setEditingItem(prev => {
      if (!prev.images || index >= prev.images.length - 1) return prev;
      const newImgs = [...prev.images];
      const temp = newImgs[index + 1];
      newImgs[index + 1] = newImgs[index];
      newImgs[index] = temp;
      return { ...prev, images: newImgs };
    });
  };

  const updateImageCaption = (index, caption) => {
    setEditingItem(prev => {
      const newImgs = [...prev.images];
      newImgs[index] = { ...newImgs[index], caption };
      return { ...prev, images: newImgs };
    });
  };

  // Add Topstuk filter toggle state & view mode ('table' | 'grid')
  const [onlyTopstukken, setOnlyTopstukken] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isCompactView, setIsCompactView] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateCompactView = (event) => setIsCompactView(event.matches);
    setIsCompactView(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateCompactView);
    return () => mediaQuery.removeEventListener('change', updateCompactView);
  }, []);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItemIds(filtered.map(i => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelectItem = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filter Logic
  const filtered = items.filter(item => {
    const matchesSearch =
      item.title?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.ref?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.author?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(filterQuery.toLowerCase());

    const itemTypeVal = item.itemType || 'book';
    const matchesType = typeFilter === 'Alle' || itemTypeVal === typeFilter;
    const matchesStatus = statusFilter === 'Alle' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'Alle' || getCategorySlug(item.category) === categoryFilter;
    const matchesTopstuk = !onlyTopstukken || Boolean(item.featured);

    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesTopstuk;
  });

  const getSortValue = (item, key) => {
    switch (key) {
      case 'id':
        return item.ref || item.id || '';
      case 'image':
        return Boolean(item.images?.[0]?.url || item.image) ? 1 : 0;
      case 'title':
        return `${item.title || ''} ${item.author || item.subtitle || ''}`;
      case 'type':
        return getLocalizedItemType(item.itemType, 'nl');
      case 'translation':
        return getItemTranslationStatus(item).completeCount;
      case 'period': {
        const year = Number.parseInt(item.year, 10);
        if (Number.isFinite(year)) return year;
        const century = Number.parseInt(item.century, 10);
        return Number.isFinite(century) ? century * 100 : item.century || '';
      }
      case 'status':
        return item.status || '';
      case 'price': {
        return parsePriceForSort(item.price);
      }
      default:
        return '';
    }
  };

  const sortedItems = [...filtered].sort((first, second) => {
    if (!sortConfig.key) return 0;

    const firstValue = getSortValue(first, sortConfig.key);
    const secondValue = getSortValue(second, sortConfig.key);
    if (sortConfig.key === 'price' && (firstValue === null || secondValue === null)) {
      if (firstValue === secondValue) return 0;
      return firstValue === null ? 1 : -1;
    }
    let comparison;
    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      comparison = firstValue - secondValue;
    } else {
      comparison = String(firstValue).localeCompare(String(secondValue), 'nl', { numeric: true, sensitivity: 'base' });
    }
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, className = '') => {
    const isActive = sortConfig.key === key;
    const SortIcon = isActive
      ? sortConfig.direction === 'asc' ? ArrowUp : ArrowDown
      : ArrowUpDown;

    return (
      <th aria-sort={isActive ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={`p-0 ${className}`}>
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className="group flex w-full items-center gap-1.5 px-3.5 py-3.5 text-left transition-colors hover:bg-[#F1ECE2] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B8860B]"
          title={`Sorteer op ${label}`}
        >
          <span>{label}</span>
          <SortIcon className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? 'text-[#B8860B]' : 'text-[#AAA295] group-hover:text-[#555555]'}`} aria-hidden="true" />
        </button>
      </th>
    );
  };

  const availableCount = items.filter(i => i.status === 'Beschikbaar').length;
  const reservedCount = items.filter(i => i.status === 'Gereserveerd').length;
  const soldCount = items.filter(i => i.status === 'Verkocht').length;
  const groupCounts = COLLECTION_GROUPS.reduce((counts, group) => ({
    ...counts,
    [group.slug]: items.filter((item) => getCollectionGroupForItem(item) === group.slug).length
  }), {});
  const editingCollectionGroup = getCollectionGroupForItem(editingItem || { itemType: 'book' });
  const editingTypeOptions = getItemTypesForGroup(editingCollectionGroup);
  const editingTypeDefinition = getItemTypeDefinition(editingItem?.itemType || 'book');
  const editingFieldLabels = editingTypeDefinition.fieldLabels;

  return (
    <div className="admin-items space-y-6 text-[#111111] animate-fade-in">
      
      {/* Toolbar & Filters (Refactored for cleaner layout) */}
      <div className="admin-items__toolbar p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-4">
        
        {/* Top Row: Search & Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Zoek in collectie (titel, auteur, ID...)"
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
            />
            {filterQuery && (
              <button 
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleCreateNew}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gray-300" />
            <span>Nieuw object</span>
          </button>
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mr-2 hidden sm:flex">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="Alle">Type: Alle</option>
            {ITEM_TYPES.map((itemType) => (
              <option key={itemType.slug} value={itemType.slug}>
                {getLocalizedItemType(itemType.slug, 'nl', true)}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="Alle">Status: Alle</option>
            <option value="Beschikbaar">Beschikbaar</option>
            <option value="Gereserveerd">Gereserveerd</option>
            <option value="Verkocht">Verkocht</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="Alle">Categorie: Alle</option>
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {getLocalizedCategoryLabel(category.slug, 'nl')}
              </option>
            ))}
          </select>

          {/* Topstuk Toggle */}
          <div className="flex items-center space-x-2 sm:ml-auto pl-2">
            <span className="text-sm font-medium text-gray-700">Topstuk</span>
            <button
              onClick={() => setOnlyTopstukken(!onlyTopstukken)}
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                onlyTopstukken ? 'bg-[#111111]' : 'bg-[#e5e7eb]'
              }`}
              title="Filter alleen topstukken"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                onlyTopstukken ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Collection Sub-header & Metrics Summary */}
      <div className="admin-items__summary flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#111111]">
            Collectie &amp; Catalogus Beheer
          </h2>
          <div className="admin-items__counts flex items-center space-x-3 text-xs font-sans text-[#666666] mt-1">
            <span>Totaal: <strong className="text-[#111111] font-mono">{items.length}</strong> objecten</span>
            <span>•</span>
            {COLLECTION_GROUPS.map((group) => (
              <React.Fragment key={group.slug}>
                <span>•</span>
                <span>
                  <strong className="text-[#111111] font-mono">{groupCounts[group.slug] || 0}</strong>{' '}
                  {getLocalizedCollectionGroup(group.slug, 'nl')}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* View Mode Toggle (Table vs Grid) */}
        <div className="admin-view-toggle flex items-center space-x-1 p-1 rounded-xl bg-white border border-[#D8CEB8] text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg font-serif font-bold transition-all ${
              viewMode === 'table' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            Tabel
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg font-serif font-bold transition-all ${
              viewMode === 'grid' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            Raster
          </button>
        </div>
      </div>

      {/* Catalog Items Section */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#D8CEB8] shadow-sm space-y-3">
          <BookOpen className="w-10 h-10 text-[#B8860B] mx-auto" />
          <p className="text-sm font-serif font-bold text-[#111111]">Geen items gevonden in collectie</p>
          <p className="text-xs text-[#888888]">Er zijn geen objecten die voldoen aan het huidige zoek- of filter-criteria.</p>
          <button
            onClick={() => {
              setFilterQuery('');
              setTypeFilter('Alle');
              setStatusFilter('Alle');
              setCategoryFilter('Alle');
              setOnlyTopstukken(false);
            }}
            className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#B8860B] text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
          >
            <X className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Alle Filters Wissen</span>
          </button>
        </div>
      ) : viewMode === 'table' && !isCompactView ? (
        /* Data Table Layout (Screenshot Style) */
        <div className="bg-white rounded-3xl border border-[#D8CEB8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#D8CEB8] font-serif text-[#555555] font-bold">
                  <th className="p-3.5 w-10 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedItemIds.length === filtered.length && filtered.length > 0}
                      className="rounded border-[#D8CEB8] text-[#111111] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  {renderSortHeader('ID', 'id', 'font-mono text-[11px]')}
                  {renderSortHeader('Afbeelding', 'image')}
                  {renderSortHeader('Titel & Auteur', 'title')}
                  {renderSortHeader('Type', 'type')}
                  {renderSortHeader('Vertaling', 'translation')}
                  {renderSortHeader('Periode', 'period')}
                  {renderSortHeader('Status', 'status')}
                  {renderSortHeader('Prijs', 'price')}
                  <th className="p-3.5 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D8]">
                {sortedItems.map((item) => {
                  const img = item.images?.[0]?.url || item.image || '/images/scarron-spines-white-bg.jpg';
                  const isSelected = selectedItemIds.includes(item.id);
                  const translationStatus = getItemTranslationStatus(item);

                  return (
                    <tr
                      key={item.id} 
                      onClick={(event) => handleItemSurfaceClick(event, item)}
                      data-admin-tooltip="Klik om te bewerken"
                      className={`admin-item-row transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="p-3.5 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="rounded border-[#D8CEB8] text-[#111111] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5 font-mono font-bold text-[#111111] whitespace-nowrap">
                        {item.ref || item.id}
                      </td>

                      <td className="p-3.5">
                        <div className="w-11 h-11 rounded-xl bg-stone-100 border border-[#D8CEB8] overflow-hidden shrink-0">
                          <img src={img} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="admin-item-title-button font-serif font-bold text-[#111111] line-clamp-1"
                          data-admin-tooltip="Open in de editor"
                        >
                          {item.title}
                        </button>
                        <div className="text-[11px] text-[#666666] line-clamp-1">
                          {item.author || item.subtitle || 'Atelier Rembrandt'}
                        </div>
                      </td>

                      <td className="p-3.5 font-serif">
                        {getLocalizedItemType(item.itemType, 'nl')}
                      </td>

                      {/* Translation status with the shared cursor-following tooltip */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div
                          className="relative inline-block"
                          data-admin-tooltip={getTranslationTooltip(translationStatus)}
                        >
                          <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 border cursor-help transition-all ${
                            translationStatus.isComplete 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                              : translationStatus.completeCount === 2
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                          }`}>
                            {translationStatus.isComplete ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>3/3 Talen</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{translationStatus.completeCount}/3 Talen</span>
                              </>
                            )}
                          </div>

                        </div>
                      </td>

                      <td className="p-3.5 text-[#555555] font-serif">
                        {item.century || item.year || 'Historisch'}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-serif font-bold ${
                          item.status === 'Beschikbaar' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : item.status === 'Gereserveerd'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-stone-200 text-stone-700 border border-stone-300'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-serif font-bold text-[#111111] whitespace-nowrap">
                        {item.price || 'Prijs op aanvraag'}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenCertificate && onOpenCertificate(item)}
                            className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-colors"
                            aria-label="Certificaat maken"
                            data-admin-tooltip="Certificaat maken"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                            aria-label="Object bewerken"
                            data-admin-tooltip="Bewerken"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/collectie/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                            aria-label="Object op de website bekijken"
                            data-admin-tooltip="Bekijken op de website"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                            className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                            aria-label="Object verwijderen"
                            data-admin-tooltip="Verwijderen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(item)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              item.featured
                                ? 'bg-amber-100 border-amber-300 text-[#B8860B]'
                                : 'bg-[#FAF7F2] border-[#D8CEB8] text-stone-400 hover:text-[#B8860B]'
                            }`}
                            aria-label={item.featured ? 'Topstukmarkering verwijderen' : 'Als topstuk markeren'}
                            data-admin-tooltip={item.featured ? 'Topstukmarkering verwijderen' : 'Als topstuk markeren'}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Batch Action Bar Footer */}
          <div className="p-3.5 bg-[#FAF7F2] border-t border-[#D8CEB8] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-[#666666] font-medium">
                Geselecteerd: <strong className="text-[#111111] font-mono">{selectedItemIds.length}</strong> van {filtered.length}
              </span>

              {selectedItemIds.length > 0 && (
                <div className="flex items-center space-x-2 animate-fade-in">
                  <span className="text-[10px] font-mono text-stone-400">| Batch:</span>
                  <button
                    onClick={() => handleBatchStatusChange('Beschikbaar')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-all border border-emerald-300 cursor-pointer"
                  >
                    Set Beschikbaar
                  </button>
                  <button
                    onClick={() => handleBatchStatusChange('Gereserveerd')}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold transition-all border border-amber-300 cursor-pointer"
                  >
                    Set Gereserveerd
                  </button>
                  <button
                    onClick={() => handleBatchStatusChange('Verkocht')}
                    className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold transition-all border border-stone-400 cursor-pointer"
                  >
                    Set Verkocht
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold transition-all border border-red-300 cursor-pointer"
                  >
                    Verwijder ({selectedItemIds.length})
                  </button>
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-[#888888]">
              {filtered.length} objecten in weergave
            </div>
          </div>
        </div>
      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const translationStatus = getItemTranslationStatus(item);
            const mainImgUrl = item.images && item.images[0]?.url ? item.images[0].url : item.image || "/images/scarron-spines-white-bg.jpg";
            const isMenuOpen = openMenuId === item.id;

            return (
              <div
                key={item.id}
                onClick={(event) => handleItemSurfaceClick(event, item)}
                data-admin-tooltip="Klik om te bewerken"
                className="admin-item-card group relative bg-white border border-[#D8CEB8]/80 rounded-3xl shadow-sm hover:shadow-[0_20px_40px_rgba(17,17,17,0.1)] hover:border-[#111111] transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden"
              >
                {/* Top Hero Image Showcase */}
                <div className="relative aspect-[4/3] w-full bg-[#FAF7F2] overflow-hidden border-b border-[#EAE4D8]">
                  <img
                    src={mainImgUrl}
                    alt={item.title || ''}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-1000 ease-out"
                  />

                  {/* Subtle Dark Vignette Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-auto">
                    {/* Left Badges */}
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-[9.5px] font-mono tracking-wider font-bold text-[#111111] px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-xs border border-stone-200/90">
                        {item.ref}
                      </span>

                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100/90 backdrop-blur-md text-stone-800 border border-stone-300/80 flex items-center space-x-1 shadow-xs">
                        {React.createElement(getItemTypeIcon(item.itemType), { className: 'w-3 h-3 text-stone-600' })}
                        <span>{getLocalizedItemType(item.itemType, 'nl', true)}</span>
                      </span>

                      {item.featured && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#111111]/90 backdrop-blur-md text-[#D4AF37] border border-[#B8860B]/50 flex items-center space-x-1 shadow-xs ring-1 ring-[#D4AF37]/30">
                          <Star className="w-3 h-3 fill-[#D4AF37]" />
                          <span>Topstuk</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Status Select Pill */}
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      className={`text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer focus:outline-none shadow-sm border transition-all duration-300 ${
                        item.status === 'Beschikbaar'
                          ? 'bg-emerald-700/95 text-white border-emerald-800 hover:bg-emerald-800'
                          : item.status === 'Gereserveerd'
                          ? 'bg-amber-700/95 text-white border-amber-800 hover:bg-amber-800'
                          : 'bg-stone-900/95 text-white border-stone-800 hover:bg-black'
                      }`}
                    >
                      <option value="Beschikbaar" className="bg-white text-stone-900 font-sans">Beschikbaar</option>
                      <option value="Gereserveerd" className="bg-white text-stone-900 font-sans">Gereserveerd</option>
                      <option value="Verkocht" className="bg-white text-stone-900 font-sans">Verkocht</option>
                    </select>
                  </div>

                  {/* Hover Quick Action Overlay on Image Bottom */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    <a
                      href={`/collectie/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-full bg-white/95 text-[#111111] hover:bg-[#111111] hover:text-white transition-all duration-300 text-[11px] font-serif font-bold flex items-center space-x-1.5 shadow-lg"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Bekijk op site</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item)}
                      className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 ${
                        item.featured
                          ? 'bg-amber-500 text-white shadow-amber-500/30'
                          : 'bg-white/95 text-stone-700 hover:text-[#B8860B] hover:bg-white'
                      }`}
                      aria-label={item.featured ? 'Topstukmarkering verwijderen' : 'Als topstuk markeren'}
                      data-admin-tooltip={item.featured ? 'Topstukmarkering verwijderen' : 'Als topstuk markeren'}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Card Body Information */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-mono font-bold text-[#B8860B] uppercase tracking-[0.15em] block truncate">
                      {getLocalizedCategoryLabel(item.category, 'nl')} • {item.century}
                    </span>

                    <h4 className="text-[15px] font-serif font-bold text-[#111111] line-clamp-2 leading-snug tracking-tight transition-colors duration-300">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="admin-item-title-button text-left"
                        data-admin-tooltip="Open in de editor"
                      >
                        {item.title}
                      </button>
                    </h4>

                    <p className="text-xs text-[#666666] line-clamp-1 font-serif italic">
                      {item.author || item.subtitle || 'Atelier Rembrandt'} {item.year ? `(${item.year})` : ''}
                    </p>
                  </div>

                  <div className="pt-2.5 flex items-baseline justify-between border-t border-[#FAF7F2]">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-[#888888]">Prijs</span>
                    <span className="text-sm font-serif font-bold text-[#111111] tracking-tight">
                      {item.price || 'Prijs op aanvraag'}
                    </span>
                  </div>
                </div>

                {/* Card Footer Toolbar */}
                <div className="px-5 py-3 bg-[#FAF7F2] border-t border-[#EAE4D8] flex items-center justify-between gap-2">
                  {/* Translation status with the shared cursor-following tooltip */}
                  <div
                    className="relative inline-block"
                    data-admin-tooltip={getTranslationTooltip(translationStatus)}
                  >
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 border cursor-help transition-all duration-300 ${
                      translationStatus.isComplete
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : translationStatus.completeCount === 2
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                    }`}>
                      {translationStatus.isComplete ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>3/3 Talen</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{translationStatus.completeCount}/3 Talen</span>
                        </>
                      )}
                    </div>

                  </div>

                  {/* Action Buttons: Primary Edit Button + Contextual Menu */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#111111] text-white hover:bg-[#B8860B] text-xs font-serif font-bold transition-all duration-300 flex items-center space-x-1.5 shadow-sm active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Bewerken</span>
                    </button>

                    {/* Dropdown Menu for lower-frequency actions */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : item.id);
                        }}
                        className={`p-1.5 rounded-xl border transition-all duration-200 ${
                          isMenuOpen
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white border-[#D8CEB8] text-stone-600 hover:text-[#111111] hover:border-stone-400'
                        }`}
                        aria-label="Meer acties voor dit object"
                        data-admin-tooltip="Meer acties"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          {/* Backdrop click closer */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />

                          {/* Contextual Menu Content */}
                          <div className="absolute right-0 bottom-full mb-2 z-50 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#D8CEB8] py-1.5 text-xs text-[#111111] animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                if (onOpenCertificate) onOpenCertificate(item);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-[#FAF7F2] flex items-center space-x-2.5 text-[#B8860B] font-medium transition-colors"
                            >
                              <Award className="w-4 h-4 shrink-0 text-[#B8860B]" />
                              <span>Echtheidscertificaat (PDF)</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDuplicate(item);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-[#FAF7F2] flex items-center space-x-2.5 font-medium transition-colors"
                            >
                              <Copy className="w-4 h-4 shrink-0 text-stone-500" />
                              <span>Dupliceer item</span>
                            </button>

                            <a
                              href={`/collectie/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuId(null)}
                              className="w-full px-3.5 py-2 text-left hover:bg-[#FAF7F2] flex items-center space-x-2.5 font-medium transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0 text-stone-500" />
                              <span>Bekijk op site</span>
                            </a>

                            <div className="my-1 border-t border-stone-100" />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setItemToDelete(item);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-700 flex items-center space-x-2.5 font-medium transition-colors"
                            >
                              <Trash2 className="w-4 h-4 shrink-0 text-rose-600" />
                              <span>Verwijderen</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dedicated Full-Screen Editorial Workspace (Portal for 100% Viewport Coverage) */}
      {editingItem && createPortal(
        <div className="admin-item-editor fixed inset-0 z-[9999] w-screen h-screen bg-[#FAF8F5] text-[#1C1A18] flex flex-col font-sans overflow-hidden animate-fade-in" role="dialog" aria-modal="true" aria-label={isNew ? 'Nieuw object invoeren' : `${editingItem.title} bewerken`}>
          
          {/* Top Sticky Luxury Header Bar */}
          <header className="admin-item-editor__header px-5 sm:px-7 py-3.5 bg-[#161412] text-white border-b border-[#2C2926] flex items-center justify-between gap-4 shrink-0 shadow-md">
            {/* Left section: Close & Item Title Info */}
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-2.5 rounded-xl bg-[#25221F] hover:bg-[#332F2B] text-stone-300 hover:text-white transition-all flex items-center space-x-1.5 cursor-pointer border border-[#3A3530]"
                title="Sluit editor (Esc)"
              >
                <X className="w-4 h-4 text-stone-400" />
                <span className="text-xs font-semibold hidden sm:inline">Sluiten</span>
              </button>

              <div className="h-6 w-[1px] bg-[#2C2926] hidden sm:block" />

              <div className="min-w-0 hidden md:block">
                <h3 className="text-sm font-serif font-bold text-stone-100 truncate">
                  {isNew ? 'Nieuw object invoeren' : editingItem.title}
                </h3>
              </div>
            </div>

            {/* Center section: Multi-language status indicators */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-[#23201D] p-1.5 rounded-xl border border-[#332F2B]">
              {[
                { id: 'nl', label: 'Nederlands' },
                { id: 'en', label: 'English' },
                { id: 'fr', label: 'Français' }
              ].map((lang) => {
                const status = getItemTranslationStatus(editingItem).details[lang.id];
                const isMissing = status?.missing?.length > 0;
                const isActive = formLang === lang.id;

                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setFormLang(lang.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#C5A059] text-black font-bold shadow-xs'
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-black/20 text-black'
                        : isMissing ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isMissing ? `${status.missing.length} open` : (
                        <>
                          <Check className="w-3 h-3" aria-hidden="true" />
                          <span className="sr-only">Compleet</span>
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right section: AI Prompt, AI Import, Save Button */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyAiPrompt}
                className="px-3.5 py-2 rounded-xl bg-[#25221F] hover:bg-[#332F2B] text-stone-200 hover:text-white text-xs font-mono font-semibold transition-all border border-[#3A3530] flex items-center space-x-1.5 cursor-pointer"
                title="Kopieer gegevens van actieve taal als prompt voor ChatGPT / Claude"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden xl:inline">1. Kopieer AI Prompt ({formLang.toUpperCase()})</span>
                <span className="xl:hidden">Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiImportModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#25221F] hover:bg-[#332F2B] text-stone-200 hover:text-white text-xs font-mono font-semibold transition-all border border-[#3A3530] flex items-center space-x-1.5 cursor-pointer"
                title="Plak JSON van ChatGPT of Claude"
              >
                <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden xl:inline">2. Importeer Vertaling</span>
                <span className="xl:hidden">Importeer</span>
              </button>

              <button
                type="button"
                onClick={handleSaveForm}
                className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Opslaan</span>
                <span className="text-[10px] opacity-70 font-mono hidden sm:inline">(Cmd+S)</span>
              </button>
            </div>
          </header>

          {/* Two-Column Editor Layout Workspace */}
          <div className="admin-item-editor__body flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-[#FAF8F5]">

            {/* LEFT COLUMN: Media, Type Switcher & Core Commercial Stats (4 cols) */}
            <div className="admin-item-editor__sidebar lg:col-span-4 border-r border-[#E6E1D7] bg-[#F4F1EA] p-5 sm:p-6 space-y-6 overflow-y-auto">

              {/* Collection Group Switcher */}
              <div className="p-4 rounded-2xl bg-white border border-[#E0D9CC] space-y-3 shadow-xs">
                <label className="block text-[11px] font-mono font-bold text-[#1C1A18] uppercase tracking-widest">
                  Collectiedomein
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COLLECTION_GROUPS.map((group) => {
                    const isActive = editingCollectionGroup === group.slug;

                    return (
                      <button
                        key={group.slug}
                        type="button"
                        onClick={() => {
                          const allowedTypes = getItemTypesForGroup(group.slug);
                          const currentType = editingItem.itemType || 'book';
                          const nextType = allowedTypes.some((itemType) => itemType.slug === currentType)
                            ? currentType
                            : allowedTypes[0]?.slug || currentType;
                          const currentCategory = getCategorySlug(editingItem.category);
                          const categoryIsValid = getCategoriesForGroup(group.slug)
                            .some((category) => category.slug === currentCategory);

                          setEditingItem({
                            ...editingItem,
                            itemType: nextType,
                            collectionGroup: group.slug,
                            category: categoryIsValid
                              ? currentCategory
                              : getDefaultCategoryForGroup(group.slug, nextType)
                          });
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-sm'
                            : 'bg-[#F9F7F2] text-[#666666] hover:text-[#1C1A18] border-[#E0D9CC]'
                        }`}
                      >
                        {getLocalizedCollectionGroup(group.slug, 'nl')}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Item Type Switcher */}
              <div className="p-4 rounded-2xl bg-white border border-[#E0D9CC] space-y-3 shadow-xs">
                <label className="block text-[11px] font-mono font-bold text-[#1C1A18] uppercase tracking-widest">
                  Objecttype
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {editingTypeOptions.map((itemType) => {
                    const Icon = getItemTypeIcon(itemType.slug);
                    const isActive = (editingItem.itemType || 'book') === itemType.slug;

                    return (
                      <button
                        key={itemType.slug}
                        type="button"
                        onClick={() => setEditingItem({
                          ...editingItem,
                          itemType: itemType.slug,
                          collectionGroup: editingCollectionGroup,
                          category: getCategoriesForGroup(editingCollectionGroup)
                            .some((category) => category.slug === getCategorySlug(editingItem.category))
                            ? getCategorySlug(editingItem.category)
                            : getDefaultCategoryForGroup(editingCollectionGroup, itemType.slug)
                        })}
                        className={`py-3 px-3 rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                          isActive
                            ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-sm'
                            : 'bg-[#F9F7F2] text-[#666666] hover:text-[#1C1A18] border-[#E0D9CC]'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#C5A059]" />
                        <span>{getLocalizedItemType(itemType.slug, 'nl')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commercial Meta */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9CC] space-y-4 shadow-xs">
                <h4 className="text-xs font-mono font-bold text-[#1C1A18] uppercase tracking-wider border-b border-[#E0D9CC] pb-2 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  <span>Commerciële Status & Prijs</span>
                </h4>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">
                      Ref Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.ref}
                      onChange={(e) => setEditingItem({ ...editingItem, ref: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs text-[#1C1A18] font-mono font-bold focus:outline-none focus:border-[#1C1A18] focus:ring-2 focus:ring-[#C5A059]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">
                      Status *
                    </label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18]"
                    >
                      <option value="Beschikbaar">Beschikbaar</option>
                      <option value="Gereserveerd">Gereserveerd</option>
                      <option value="Verkocht">Verkocht (Archief)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider">
                        Prijs / Taxatie
                      </label>
                      
                      {/* Modern Switch Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const poa = isPriceOnRequest(editingItem.price);
                          setEditingItem({
                            ...editingItem,
                            price: poa ? '€ ' : 'Prijs op aanvraag'
                          });
                        }}
                        className="flex items-center space-x-1.5 cursor-pointer group"
                      >
                        <span className="text-[10px] font-mono text-[#666666] group-hover:text-[#1C1A18]">
                          Prijs op aanvraag:
                        </span>
                        <div className={`w-8 h-4.5 rounded-full transition-colors relative p-0.5 ${
                          isPriceOnRequest(editingItem.price) ? 'bg-[#C5A059]' : 'bg-stone-300'
                        }`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            isPriceOnRequest(editingItem.price) ? 'translate-x-3.5' : 'translate-x-0'
                          }`} />
                        </div>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                      placeholder="€ 3.500 of Prijs op aanvraag"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18]"
                    />
                  </div>

                  <label className={`cursor-pointer flex items-center space-x-2.5 text-xs font-semibold p-3 rounded-xl border transition-all ${
                    editingItem.featured
                      ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#8C6D23]'
                      : 'bg-[#F9F7F2] border-[#E0D9CC] text-[#666666] hover:text-[#1C1A18]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editingItem.featured || false}
                      onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })}
                      className="w-4 h-4 rounded border-[#E0D9CC] text-[#C5A059] focus:ring-[#C5A059]"
                    />
                    <span>Topstuk op de homepage</span>
                  </label>
                </div>
              </div>

              {/* Gallery / Photos */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9CC] space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E0D9CC] pb-2">
                  <h4 className="text-xs font-mono font-bold text-[#1C1A18] uppercase tracking-wider flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                    <span>Fotogalerij ({editingItem.images?.length || 0})</span>
                  </h4>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-2 py-1 rounded-lg bg-[#F9F7F2] hover:bg-stone-200 text-[#1C1A18] text-[10px] font-mono font-bold border border-[#E0D9CC] transition-all cursor-pointer"
                    >
                      {showUrlInput ? 'Verberg URL' : '+ Via URL'}
                    </button>
                    <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-[#1C1A18] text-white hover:bg-stone-800 text-[11px] font-mono font-bold transition-all flex items-center space-x-1">
                      <Upload className="w-3 h-3 text-[#C5A059]" />
                      <span>+ Upload</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                {/* Collapsible Photo URL Adder */}
                {showUrlInput && (
                  <form onSubmit={handleAddImageUrl} className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E0D9CC] space-y-2 text-xs animate-fade-in">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://... (Directe Afbeelding URL)"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D9CC] text-xs font-mono focus:outline-none focus:border-[#1C1A18]"
                    />
                    <input
                      type="text"
                      value={newImageCaption}
                      onChange={(e) => setNewImageCaption(e.target.value)}
                      placeholder="Bijschrift (bijv. Detail stempel / Rug)"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E0D9CC] text-xs font-sans focus:outline-none focus:border-[#1C1A18]"
                    />
                    <button
                      type="submit"
                      disabled={!newImageUrl.trim()}
                      className="w-full py-1.5 rounded-lg bg-[#1C1A18] text-white font-mono font-bold text-[11px] hover:bg-[#C5A059] hover:text-black transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      Voeg Afbeelding URL Toe
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {editingItem.images?.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-[#E0D9CC] group bg-[#F9F7F2] flex flex-col shadow-xs">
                      <div className="aspect-4/3 relative overflow-hidden shrink-0">
                        <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
                        {idx === 0 ? (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-[#1C1A18] text-white text-[9px] font-mono font-bold">
                            Hoofdfoto
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makePrimaryImage(idx)}
                            className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 hover:bg-[#C5A059] hover:text-black text-white text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          >
                            Maak Hoofd
                          </button>
                        )}

                        {/* Reorder & Remove buttons */}
                        <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImageUp(idx)}
                              className="p-1 rounded bg-black/70 hover:bg-stone-800 text-white transition-all text-[9px] cursor-pointer"
                              title="Verplaats omhoog in volgorde"
                            >
                              ▲
                            </button>
                          )}
                          {idx < (editingItem.images?.length - 1) && (
                            <button
                              type="button"
                              onClick={() => moveImageDown(idx)}
                              className="p-1 rounded bg-black/70 hover:bg-stone-800 text-white transition-all text-[9px] cursor-pointer"
                              title="Verplaats omlaag in volgorde"
                            >
                              ▼
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1 rounded bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs cursor-pointer"
                            title="Verwijder Foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Caption editor */}
                      <div className="p-1.5 bg-white border-t border-[#E0D9CC]">
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={(e) => updateImageCaption(idx, e.target.value)}
                          placeholder="Bijschrift..."
                          className="w-full text-[10px] px-1.5 py-0.5 bg-[#F9F7F2] border border-transparent hover:border-[#E0D9CC] focus:border-[#C5A059] rounded text-[#1C1A18] font-sans focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificate PDF Button */}
              {!isNew && onOpenCertificate && (
                <button
                  type="button"
                  onClick={() => onOpenCertificate(editingItem)}
                  className="w-full py-3 px-4 rounded-xl bg-amber-50 border border-amber-300 text-[#8C6D23] hover:bg-[#C5A059] hover:text-black font-serif font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  <span>Echtheidscertificaat Genereren (PDF)</span>
                </button>
              )}

            </div>

            {/* RIGHT COLUMN: Multi-tab Editorial Form & Detailed Specs (8 cols) */}
            <div className="admin-item-editor__content lg:col-span-8 flex flex-col overflow-y-auto p-5 sm:p-8 space-y-6">

              {/* Form Section Navigation Tabs */}
              <div className="admin-item-editor__tabs flex items-center justify-between border-b border-[#E0D9CC] pb-3 shrink-0">
                <div className="flex items-center space-x-2">
                  {[
                    { id: 'specs', label: '1. Kern & Bibliografische Data' },
                    { id: 'multilingual', label: '2. Drietalige Inhoud & Staat' },
                    { id: 'comparable-sales', label: '3. Comparable Sales' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditorTab(t.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        editorTab === t.id
                          ? 'bg-[#1C1A18] text-white shadow-sm'
                          : 'bg-white text-[#666666] hover:text-[#1C1A18] border border-[#E0D9CC]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Mobile Language Tab Switcher */}
                <div className="flex lg:hidden items-center space-x-1">
                  {['nl', 'en', 'fr'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setFormLang(lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                        formLang === lang ? 'bg-[#C5A059] text-black' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: KERN & SPECIFICATIES */}
              {editorTab === 'specs' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Title & Subtitle */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E0D9CC] space-y-5 shadow-xs">
                    <div>
                      {renderFieldHeader(editingFieldLabels.title, "title", true)}
                      <input
                        type="text"
                        required
                        value={getFormField('title')}
                        onChange={(e) => updateFormField('title', e.target.value)}
                        placeholder={isFieldNvt('title', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : editingFieldLabels.title}
                        className={`w-full px-4 py-3 rounded-xl border text-[#1C1A18] font-serif font-bold text-base focus:outline-none focus:border-[#1C1A18] focus:ring-2 focus:ring-[#C5A059]/20 ${
                          isFieldNvt('title', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                        }`}
                      />
                    </div>

                    <div>
                      {renderFieldHeader("Ondertitel / Korte Subtitel", "subtitle")}
                      <input
                        type="text"
                        value={getFormField('subtitle')}
                        onChange={(e) => updateFormField('subtitle', e.target.value)}
                        placeholder={isFieldNvt('subtitle', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Bijv. Parijs 1829 • 52 Delen Compleet"}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#1C1A18] font-serif italic focus:outline-none focus:border-[#1C1A18] ${
                          isFieldNvt('subtitle', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Author, Dates & Category */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E0D9CC] space-y-5 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#1C1A18] uppercase tracking-wider mb-2">
                          {editingFieldLabels.author}
                        </label>
                        <input
                          type="text"
                          value={editingItem.author}
                          onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                          placeholder={editingFieldLabels.author}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-sm text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-[#1C1A18] uppercase tracking-wider mb-2">
                          Datering &amp; Eeuw
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editingItem.year}
                            onChange={(e) => setEditingItem({ ...editingItem, year: e.target.value })}
                            placeholder="1645"
                            className="w-full px-3 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-sm text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18]"
                          />
                          <select
                            value={editingItem.century}
                            onChange={(e) => setEditingItem({ ...editingItem, century: e.target.value })}
                            className="w-full px-2 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18]"
                          >
                            <option value="16e Eeuw">16e Eeuw</option>
                            <option value="17e Eeuw">17e Eeuw</option>
                            <option value="18e Eeuw">18e Eeuw</option>
                            <option value="19e Eeuw">19e Eeuw</option>
                            <option value="20e Eeuw">20e Eeuw</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-[#1C1A18] uppercase tracking-wider mb-2">
                          Categorie
                        </label>
                        <select
                          value={editingItem.category}
                          onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-sm text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18]"
                        >
                          {getCategoriesForGroup(editingCollectionGroup).map((category) => (
                            <option key={category.slug} value={category.slug}>
                              {getLocalizedCategoryLabel(category.slug, 'nl')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        {renderFieldHeader(editingFieldLabels.publisher, "publisher")}
                        <input
                          type="text"
                          value={getFormField('publisher')}
                          onChange={(e) => updateFormField('publisher', e.target.value)}
                          placeholder={isFieldNvt('publisher', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : editingFieldLabels.publisher}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18] ${
                            isFieldNvt('publisher', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                          }`}
                        />
                      </div>

                      <div>
                        {renderFieldHeader(editingFieldLabels.city, "city")}
                        <input
                          type="text"
                          value={getFormField('city')}
                          onChange={(e) => updateFormField('city', e.target.value)}
                          placeholder={isFieldNvt('city', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : editingFieldLabels.city}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18] ${
                            isFieldNvt('city', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: DRIETALIGE INHOUD & STAAT */}
              {editorTab === 'multilingual' && (
                <div className="space-y-6 animate-fade-in">

                  {/* Active Language Bar */}
                  <div className="p-4 rounded-2xl bg-[#1C1A18] text-white flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-[#C5A059]" />
                      <div>
                        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          Invoertaal voor onderstaande velden: <span className="text-[#C5A059]">{formLang === 'nl' ? 'Nederlands' : formLang === 'en' ? 'English' : 'Français'}</span>
                        </h4>
                        <p className="text-[11px] text-stone-400 font-serif">
                          Geselecteerde inhoud wordt gekoppeld aan de {formLang.toUpperCase()} taalweergave.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-[#25221F] p-1 rounded-xl border border-[#3A3530]">
                      {['nl', 'en', 'fr'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setFormLang(lang)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                            formLang === lang ? 'bg-[#C5A059] text-black shadow-xs' : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Physical & Technical Specs */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E0D9CC] space-y-5 shadow-xs">
                    <h4 className="text-xs font-mono font-bold text-[#1C1A18] uppercase tracking-wider border-b border-[#E0D9CC] pb-2 flex items-center space-x-2">
                      <Bookmark className="w-4 h-4 text-[#C5A059]" />
                      <span>{editingFieldLabels.section}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        {renderFieldHeader(editingFieldLabels.binding, "binding")}
                        <textarea
                          rows={3}
                          value={getFormField('binding')}
                          onChange={(e) => updateFormField('binding', e.target.value)}
                          placeholder={isFieldNvt('binding', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : editingFieldLabels.binding}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] leading-relaxed ${
                            isFieldNvt('binding', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                          }`}
                        />
                      </div>

                      <div>
                        {renderFieldHeader("Staat & Conditie Summary", "condition")}
                        <textarea
                          rows={3}
                          value={getFormField('condition')}
                          onChange={(e) => updateFormField('condition', e.target.value)}
                          placeholder={isFieldNvt('condition', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Beschrijf de actuele staat en eventuele restauraties"}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] leading-relaxed ${
                            isFieldNvt('condition', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        {renderFieldHeader(editingFieldLabels.dimensions, "dimensions")}
                        <input
                          type="text"
                          value={getFormField('dimensions')}
                          onChange={(e) => updateFormField('dimensions', e.target.value)}
                          placeholder={isFieldNvt('dimensions', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Bijv. In-8° (21,5 x 13,5 cm)"}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] font-semibold focus:outline-none focus:border-[#1C1A18] ${
                            isFieldNvt('dimensions', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                          }`}
                        />
                      </div>

                      <div>
                        {renderFieldHeader(editingFieldLabels.collationSpecs, "collationSpecs")}
                        <input
                          type="text"
                          value={getFormField('collationSpecs')}
                          onChange={(e) => updateFormField('collationSpecs', e.target.value)}
                          placeholder={isFieldNvt('collationSpecs', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "52 delen compleet. In-8°."}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] font-mono focus:outline-none focus:border-[#1C1A18] ${
                            isFieldNvt('collationSpecs', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Long Form Texts */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E0D9CC] space-y-5 shadow-xs">
                    <h4 className="text-xs font-mono font-bold text-[#1C1A18] uppercase tracking-wider border-b border-[#E0D9CC] pb-2 flex items-center space-x-2">
                      <History className="w-4 h-4 text-[#C5A059]" />
                      <span>Beschrijving &amp; Historische Context</span>
                    </h4>

                    <div>
                      {renderFieldHeader("Algemene Beschrijving & Overzicht", "description")}
                      <textarea
                        rows={4}
                        value={getFormField('description')}
                        onChange={(e) => updateFormField('description', e.target.value)}
                        placeholder={isFieldNvt('description', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Schrijf hier het overzicht achter dit meesterwerk..."}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] leading-relaxed font-serif ${
                          isFieldNvt('description', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                        }`}
                      />
                    </div>

                    <div>
                      {renderFieldHeader("Diepgaande Historische & Kunsthistorische Context", "historicalContext")}
                      <textarea
                        rows={5}
                        value={getFormField('historicalContext')}
                        onChange={(e) => updateFormField('historicalContext', e.target.value)}
                        placeholder={isFieldNvt('historicalContext', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Schrijf hier de uitgebreide historische context..."}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] leading-relaxed font-serif ${
                          isFieldNvt('historicalContext', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                        }`}
                      />
                    </div>

                    <div>
                      {renderFieldHeader("Provenance (Korte Herkomst Omschrijving)", "provenance")}
                      <input
                        type="text"
                        value={getFormField('provenance')}
                        onChange={(e) => updateFormField('provenance', e.target.value)}
                        placeholder={isFieldNvt('provenance', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Ex-Libris Vacheron-Poinsot..."}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] font-serif italic focus:outline-none focus:border-[#1C1A18] ${
                          isFieldNvt('provenance', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                        }`}
                      />
                    </div>

                    <div>
                      {renderFieldHeader(editingFieldLabels.conditionReport, "conditionReport")}
                      <textarea
                        rows={3}
                        value={getFormField('conditionReport')}
                        onChange={(e) => updateFormField('conditionReport', e.target.value)}
                        placeholder={isFieldNvt('conditionReport', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Gedetailleerd conditierapport..."}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] leading-relaxed font-serif ${
                          isFieldNvt('conditionReport', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                        }`}
                      />
                    </div>

                    <div>
                      {renderFieldHeader("Uitgebreid Provenance Verhaal & Veilinghistorie", "provenanceDetails")}
                      <textarea
                        rows={3}
                        value={getFormField('provenanceDetails')}
                        onChange={(e) => updateFormField('provenanceDetails', e.target.value)}
                        placeholder={isFieldNvt('provenanceDetails', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Afkomstig uit het kasteelarchief..."}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] leading-relaxed font-serif ${
                          isFieldNvt('provenanceDetails', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#F9F7F2] border-[#E0D9CC]'
                        }`}
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: COMPARABLE SALES */}
              {editorTab === 'comparable-sales' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-[#1C1A18] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-serif font-bold">Comparable Sales</h4>
                        <p className="text-[11px] text-stone-400 font-serif mt-1">
                          Voeg vergelijkbare verkopen toe. Een afbeelding is het enige verplichte veld; zet “Tonen op website” aan om de referentie publiek te tonen.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addComparableSale}
                      className="min-h-11 px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-white text-black text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Comparable Sale toevoegen</span>
                    </button>
                  </div>

                  {(editingItem.comparableSales || []).length === 0 && (
                    <div className="py-14 px-6 text-center rounded-2xl border border-dashed border-[#CFC6B6] bg-white">
                      <Award className="w-9 h-9 text-[#C5A059] mx-auto mb-3" />
                      <h4 className="text-base font-serif font-bold text-[#1C1A18]">Nog geen vergelijkbare verkopen</h4>
                      <p className="text-xs font-serif text-[#666666] mt-1">Dit onderdeel blijft onzichtbaar op de productpagina.</p>
                    </div>
                  )}

                  {(editingItem.comparableSales || []).map((sale, index) => {
                    const descriptionField = formLang === 'nl' ? 'description' : `description_${formLang}`;
                    const isComplete = isComparableSaleComplete(sale);

                    return (
                      <section key={sale.id} className="rounded-2xl bg-white border border-[#E0D9CC] shadow-xs overflow-hidden">
                        <header className="px-5 py-4 bg-[#F4F1EA] border-b border-[#E0D9CC] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#1C1A18] text-[#C5A059] font-mono font-bold text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-serif font-bold text-[#1C1A18]">
                                {sale.seller || `Comparable Sale ${index + 1}`}
                              </h4>
                              <span className={`text-[10px] font-mono font-bold uppercase ${isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {isComplete ? 'Klaar om te tonen' : 'Concept — afbeelding vereist'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className={`min-h-9 px-3 rounded-lg border flex items-center gap-2 text-[11px] font-mono font-bold cursor-pointer ${
                              sale.published ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-[#D8CEB8] text-[#666666]'
                            }`}>
                              <input
                                type="checkbox"
                                checked={Boolean(sale.published)}
                                onChange={(event) => updateComparableSale(index, 'published', event.target.checked)}
                                className="w-4 h-4 rounded text-[#C5A059] focus:ring-[#C5A059]"
                              />
                              <span>Tonen op website</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => moveComparableSale(index, -1)}
                              disabled={index === 0}
                              title="Naar boven"
                              className="w-9 h-9 rounded-lg border border-[#D8CEB8] bg-white hover:border-[#C5A059] disabled:opacity-30 cursor-pointer"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveComparableSale(index, 1)}
                              disabled={index === editingItem.comparableSales.length - 1}
                              title="Naar beneden"
                              className="w-9 h-9 rounded-lg border border-[#D8CEB8] bg-white hover:border-[#C5A059] disabled:opacity-30 cursor-pointer"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeComparableSale(index)}
                              title="Comparable sale verwijderen"
                              className="w-9 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </header>

                        <div className="p-5 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
                          <div className="xl:col-span-5 space-y-4">
                            <div className="aspect-4/3 rounded-xl border border-[#E0D9CC] bg-[#F4F1EA] overflow-hidden flex items-center justify-center">
                              {sale.imageUrl ? (
                                <img src={sale.imageUrl} alt={sale.imageCaption || ''} className="w-full h-full object-contain" />
                              ) : (
                                <div className="text-center text-[#888888]">
                                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-[#C5A059]" />
                                  <span className="text-xs font-serif">Nog geen referentieafbeelding</span>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                              <input
                                type="url"
                                value={sale.imageUrl || ''}
                                onChange={(event) => updateComparableSale(index, 'imageUrl', event.target.value)}
                                placeholder="https://... afbeeldings-URL"
                                className="min-w-0 px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs font-mono focus:outline-none focus:border-[#1C1A18]"
                              />
                              <label className="min-h-10 px-3.5 py-2.5 rounded-xl bg-[#1C1A18] hover:bg-[#C5A059] text-white hover:text-black text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" />
                                <span>{isUploading ? 'Uploaden...' : 'Upload'}</span>
                                <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(event) => handleComparableImageUpload(index, event)} />
                              </label>
                            </div>

                            <input
                              type="text"
                              value={sale.imageCaption || ''}
                              onChange={(event) => updateComparableSale(index, 'imageCaption', event.target.value)}
                              placeholder="Afbeeldingsbijschrift / alternatieve tekst"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs font-serif focus:outline-none focus:border-[#1C1A18]"
                            />
                          </div>

                          <div className="xl:col-span-7 space-y-5">
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <label className="text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider">
                                  Korte omschrijving ({formLang.toUpperCase()})
                                </label>
                                <div className="flex items-center gap-1 bg-[#F4F1EA] p-1 rounded-lg">
                                  {['nl', 'en', 'fr'].map(lang => (
                                    <button
                                      key={lang}
                                      type="button"
                                      onClick={() => setFormLang(lang)}
                                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${formLang === lang ? 'bg-[#C5A059] text-black' : 'text-[#666666]'}`}
                                    >
                                      {lang}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea
                                rows={3}
                                value={sale[descriptionField] || ''}
                                onChange={(event) => updateComparableSale(index, descriptionField, event.target.value)}
                                placeholder="Omschrijf kort waarom dit een relevant vergelijkbaar object is..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-sm font-serif leading-relaxed focus:outline-none focus:border-[#1C1A18]"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">Veilinghuis / Verkoper</label>
                                <input
                                  type="text"
                                  value={sale.seller || ''}
                                  onChange={(event) => updateComparableSale(index, 'seller', event.target.value)}
                                  placeholder="Bijv. Bonhams London"
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs font-semibold focus:outline-none focus:border-[#1C1A18]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">Verkoopdatum</label>
                                <input
                                  type="date"
                                  max={new Date().toISOString().slice(0, 10)}
                                  value={sale.saleDate || ''}
                                  onChange={(event) => updateComparableSale(index, 'saleDate', event.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs font-mono focus:outline-none focus:border-[#1C1A18]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">Lotnummer</label>
                                <input
                                  type="text"
                                  value={sale.lotNumber || ''}
                                  onChange={(event) => updateComparableSale(index, 'lotNumber', event.target.value)}
                                  placeholder="Bijv. 194"
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs font-mono focus:outline-none focus:border-[#1C1A18]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">Gerealiseerde prijs</label>
                                <input
                                  type="text"
                                  value={sale.realizedPrice || ''}
                                  onChange={(event) => updateComparableSale(index, 'realizedPrice', event.target.value)}
                                  placeholder="Bijv. GBP 15,000"
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs font-semibold focus:outline-none focus:border-[#1C1A18]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">Prijssoort</label>
                                <select
                                  value={sale.priceType || 'unknown'}
                                  onChange={(event) => updateComparableSale(index, 'priceType', event.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs focus:outline-none focus:border-[#1C1A18]"
                                >
                                  <option value="unknown">Niet gespecificeerd</option>
                                  <option value="hammer">Hamerprijs</option>
                                  <option value="including-premium">Inclusief opgeld</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-1">Link naar verkoop</label>
                                <div className="relative">
                                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C5A059]" />
                                  <input
                                    type="url"
                                    value={sale.saleUrl || ''}
                                    onChange={(event) => updateComparableSale(index, 'saleUrl', event.target.value)}
                                    placeholder="https://..."
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E0D9CC] text-xs font-mono focus:outline-none focus:border-[#1C1A18]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

        </div>,
        document.body
      )}

      {/* AI TRANSLATION IMPORT POPUP MODAL (Portal with z-[10000]) */}
      {showAiImportModal && createPortal(
        <div className="admin-item-dialog fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF7F2] text-[#111111] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-[#D8CEB8] shadow-strong">
            <div className="flex items-center justify-between border-b border-[#D8CEB8] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-[#C5A059] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#111111]">
                    Importeer AI Vertaling (JSON)
                  </h3>
                  <p className="text-xs text-stone-600 font-sans">
                    Plak hieronder het JSON antwoord van ChatGPT of Claude.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiImportModal(false)}
                className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md border border-red-700 transition-all cursor-pointer shrink-0 flex items-center justify-center hover:scale-105 active:scale-95"
                title="Sluiten"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                  Plak JSON Resultaat:
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setAiJsonInput(text);
                    } catch (e) {
                      // Clipboard permission denied
                    }
                  }}
                  className="text-xs font-mono font-bold text-[#B8860B] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Plak van Klembord</span>
                </button>
              </div>

              <textarea
                value={aiJsonInput}
                onChange={(e) => setAiJsonInput(e.target.value)}
                placeholder={`{\n  "title_en": "...",\n  "title_fr": "...",\n  ...\n}`}
                rows={9}
                className="w-full p-4 font-mono text-xs bg-white text-[#111111] border border-[#D8CEB8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent resize-y"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAiImportModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D8CEB8] text-xs font-mono font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleImportAiTranslation}
                disabled={!aiJsonInput || !aiJsonInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF7F2] hover:bg-[#B8860B] hover:text-black font-mono text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-[#C5A059]" />
                <span>Toepassen &amp; Vul In</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {itemToDelete.isBatch ? 'Geselecteerde objecten verwijderen' : 'Object verwijderen'}
              </h3>
              <p className="text-gray-500 mb-6">
                {itemToDelete.isBatch 
                  ? `Weet je zeker dat je ${itemToDelete.count} objecten definitief wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.` 
                  : `Weet je zeker dat je het object "${itemToDelete.title}" definitief wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
              </p>
              <div className="flex items-center space-x-3">
                <button 
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors cursor-pointer"
                  onClick={() => setItemToDelete(null)}
                >
                  Annuleren
                </button>
                <button 
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex justify-center"
                  onClick={async () => {
                    if (itemToDelete.isBatch) {
                      const count = selectedItemIds.length;
                      try {
                        await Promise.all(selectedItemIds.map((id) => onDeleteItem(id)));
                        if (onShowToast) onShowToast(`${count} objecten verwijderd uit de collectie.`);
                        setSelectedItemIds([]);
                      } catch (error) {
                        if (onShowToast) onShowToast('Niet alle objecten konden worden verwijderd.', 'error');
                      }
                    } else {
                      onDeleteItem(itemToDelete.id);
                      if (onShowToast) onShowToast(`"${itemToDelete.title}" verwijderd.`);
                    }
                    setItemToDelete(null);
                  }}
                >
                  Definitief Verwijderen
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
