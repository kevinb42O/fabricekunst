import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Upload, Copy, Star, CheckCircle2, Image as ImageIcon, BookOpen, Layers, Palette, Bookmark, History, Loader2, Globe, Award, ShieldCheck, Check, Sparkles, Download } from 'lucide-react';
import { uploadCatalogImage } from '../../utils/storage';
import { isPriceOnRequest, isFieldMarkedEmpty, copyTextToClipboard, parseAiJsonTranslation } from '../../utils/translationService';

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

  const keyLabels = {
    title: 'Titel',
    subtitle: 'Subtitel',
    publisher: 'Drukker / Uitgever',
    city: 'Plaats van Uitgave',
    dimensions: 'Formaat & Afmetingen',
    description: 'Algemene Beschrijving',
    binding: 'Boekband / Lijst',
    condition: 'Conditie Summary',
    provenance: 'Herkomst Summary',
    conditionReport: 'Conditierapport',
    provenanceDetails: 'Provenance Details',
    historicalContext: 'Historische Context',
    collationSpecs: 'Collatie Specs'
  };

  const fieldsToCheck = [
    'title',
    'subtitle',
    'publisher',
    'city',
    'dimensions',
    'description',
    'binding',
    'condition',
    'provenance',
    'conditionReport',
    'provenanceDetails',
    'historicalContext',
    'collationSpecs'
  ];

  const details = {
    nl: { code: 'nl', flag: '🇳🇱', label: 'Nederlands', missing: [] },
    en: { code: 'en', flag: '🇬🇧', label: 'English', missing: [] },
    fr: { code: 'fr', flag: '🇫🇷', label: 'Français', missing: [] }
  };

  // Check all 3 languages uniformly
  for (const lang of ['nl', 'en', 'fr']) {
    for (const field of fieldsToCheck) {
      const val = getRawVal(field, lang);
      const isMarkedNvt = isFieldMarkedEmpty(item, field, lang);
      if ((!val || typeof val !== 'string' || val.trim() === '') && !isMarkedNvt) {
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

export default function ItemManager({ items, onSaveItem, onDeleteItem, onShowToast, onOpenCertificate }) {
  const [editingItem, setEditingItem] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formLang, setFormLang] = useState('nl');

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

  const emptyItem = {
    itemType: 'book',
    id: '',
    ref: `FB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    subtitle: '',
    author: '',
    publisher: '',
    city: '',
    year: new Date().getFullYear().toString(),
    century: '18e Eeuw',
    category: 'Literatuur & Filosofie',
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
    images: [
      { url: '/images/scarron-spines-white-bg.jpg', caption: 'Hoofdafbeelding' }
    ]
  };

  const handleCreateNew = () => {
    setEditingItem({ ...emptyItem, id: `item-${Date.now()}` });
    setIsNew(true);
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item, images: item.images ? [...item.images] : [] });
    setIsNew(false);
    setFormLang('nl');
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

    const fieldsToTranslate = [
      { key: 'title', label: editingItem.itemType === 'painting' ? 'Titel van het Schilderij' : 'Titel van het Boek' },
      { key: 'subtitle', label: 'Ondertitel / Korte Subtitel' },
      { key: 'publisher', label: editingItem.itemType === 'painting' ? 'Galerie / Atelier' : 'Drukker / Uitgever (Publisher / Printer)' },
      { key: 'city', label: editingItem.itemType === 'painting' ? 'Plaats van ontstaan' : 'Plaats van Uitgave (Place of Printing)' },
      { key: 'description', label: 'Algemene Beschrijving & Overzicht' },
      { key: 'binding', label: editingItem.itemType === 'painting' ? 'Lijst & Inlijsting' : 'Bandstijl (Binding)' },
      { key: 'condition', label: 'Staat & Conditie Summary' },
      { key: 'collationSpecs', label: editingItem.itemType === 'painting' ? 'Signatuur & Medium' : 'Collatie & Specificaties' },
      { key: 'provenance', label: 'Provenance (Korte Herkomst Omschrijving)' },
      { key: 'conditionReport', label: editingItem.itemType === 'painting' ? 'Restauratie & Conditierapport' : 'Uitgebreid Conditierapport' },
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

    let promptText = `Vertaal de onderstaande gegevens van een antiquarisch/kunst object van het ${sourceLangName} naar ${targetLangInstruction}.\n`;
    promptText += `Gebruik hoogwaardig antiquarisch, bibliofiel en kunsthistorisch jargon.\n`;
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
      onShowToast(`📋 AI Vertaal-prompt (bron: ${sourceLangName}) gekopieerd naar klembord!`);
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
      if (onShowToast) onShowToast("⚠️ Ongeldige JSON code. Controleer het resultaat van de AI.", "error");
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
    if (onShowToast) onShowToast(`✨ Success! ${count} vertaalvelden geïmporteerd.`);
  };

  const handleDuplicate = (item) => {
    const duplicatedItem = {
      ...item,
      id: `item-${Date.now()}`,
      ref: `FB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
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

  const handleToggleFeatured = (item) => {
    const updated = { ...item, featured: !item.featured };
    onSaveItem(updated);
    if (onShowToast) onShowToast(updated.featured ? `Gemarkeerd als Topstuk!` : `Topstuk markering verwijderd.`);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!editingItem.title.trim()) return;
    onSaveItem(editingItem);
    if (onShowToast) onShowToast(`"${editingItem.title}" opgeslagen in collectie!`);
    setEditingItem(null);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);

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
      }
    }
    setIsUploading(false);
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setEditingItem(prev => ({
      ...prev,
      images: [
        ...prev.images,
        { url: newImageUrl.trim(), caption: newImageCaption.trim() || 'Afbeelding' }
      ]
    }));
    setNewImageUrl('');
    setNewImageCaption('');
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
  };

  // Add Topstuk filter toggle state & view mode ('table' | 'grid')
  const [onlyTopstukken, setOnlyTopstukken] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
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
    const matchesCategory = categoryFilter === 'Alle' || item.category === categoryFilter;
    const matchesTopstuk = !onlyTopstukken || Boolean(item.featured);

    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesTopstuk;
  });

  const availableCount = items.filter(i => i.status === 'Beschikbaar').length;
  const reservedCount = items.filter(i => i.status === 'Gereserveerd').length;
  const soldCount = items.filter(i => i.status === 'Verkocht').length;
  const booksCount = items.filter(i => (i.itemType || 'book') === 'book').length;
  const paintingsCount = items.filter(i => i.itemType === 'painting').length;

  return (
    <div className="space-y-6 text-[#111111] animate-fade-in">
      
      {/* Top Filter & Toolbar Bar (Screenshot Style) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Primary Action Button */}
        <button
          onClick={handleCreateNew}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#111111] to-[#2A2825] hover:from-[#B8860B] hover:to-[#D4AF37] text-white text-xs font-serif font-bold transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>+ Nieuw Stuk Invoeren</span>
        </button>

        {/* Center: Search Box */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Zoek in collectie (titel, auteur, ID...)"
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111] transition-all"
          />
          {filterQuery && (
            <button 
              onClick={() => setFilterQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#111111]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs font-serif">
          <span className="text-[10px] font-mono text-[#888888] px-1.5 hidden sm:inline">Type:</span>
          <button
            onClick={() => setTypeFilter('Alle')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              typeFilter === 'Alle' ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('book')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              typeFilter === 'book' ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            Boek
          </button>
          <button
            onClick={() => setTypeFilter('painting')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              typeFilter === 'painting' ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            Kunst
          </button>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs font-serif">
          <span className="text-[10px] font-mono text-[#888888] px-1.5 hidden sm:inline">Status:</span>
          <button
            onClick={() => setStatusFilter('Alle')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === 'Alle' ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('Beschikbaar')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === 'Beschikbaar' ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            Beschikbaar
          </button>
          <button
            onClick={() => setStatusFilter('Gereserveerd')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === 'Gereserveerd' ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            Gereserveerd
          </button>
        </div>

        {/* Topstuk Toggle Switch */}
        <div className="flex items-center space-x-2 border-l border-[#D8CEB8] pl-3 py-1">
          <span className="text-xs font-serif font-bold text-[#111111]">Topstuk</span>
          <button
            onClick={() => setOnlyTopstukken(!onlyTopstukken)}
            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
              onlyTopstukken ? 'bg-[#B8860B]' : 'bg-stone-300'
            }`}
            title="Filter alleen topstukken"
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              onlyTopstukken ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>

      </div>

      {/* Collection Sub-header & Metrics Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#111111]">
            Collectie &amp; Catalogus Beheer
          </h2>
          <div className="flex items-center space-x-3 text-xs font-sans text-[#666666] mt-1">
            <span>Totaal: <strong className="text-[#111111] font-mono">{items.length}</strong> objecten</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-[#B8860B]" />
              <span><strong className="text-[#111111] font-mono">{booksCount}</strong> Boeken</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Palette className="w-3.5 h-3.5 text-[#4A6B5D]" />
              <span><strong className="text-[#111111] font-mono">{paintingsCount}</strong> Kunst</span>
            </span>
          </div>
        </div>

        {/* View Mode Toggle (Table vs Grid) */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-white border border-[#D8CEB8] text-xs self-start sm:self-auto">
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
        <div className="text-center py-16 bg-white rounded-3xl border border-[#D8CEB8] shadow-sm space-y-2">
          <BookOpen className="w-10 h-10 text-[#B8860B] mx-auto" />
          <p className="text-sm font-serif font-bold text-[#111111]">Geen items gevonden in collectie</p>
          <p className="text-xs text-[#888888]">Pas uw zoekopdracht of filter-opties aan.</p>
        </div>
      ) : viewMode === 'table' ? (
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
                  <th className="p-3.5 font-mono text-[11px]">ID</th>
                  <th className="p-3.5">Afbeelding</th>
                  <th className="p-3.5">Titel &amp; Auteur</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Vertaling</th>
                  <th className="p-3.5">Periode</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Prijs</th>
                  <th className="p-3.5 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D8]">
                {filtered.map((item) => {
                  const img = item.images?.[0]?.url || item.image || '/images/scarron-spines-white-bg.jpg';
                  const isSelected = selectedItemIds.includes(item.id);
                  const translationStatus = getItemTranslationStatus(item);

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-[#FAF7F2]/80 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}
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
                        <div className="font-serif font-bold text-[#111111] line-clamp-1">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#666666] line-clamp-1">
                          {item.author || item.subtitle || 'Atelier Rembrandt'}
                        </div>
                      </td>

                      <td className="p-3.5 font-serif">
                        {item.itemType === 'painting' ? 'Schilderij' : 'Boek'}
                      </td>

                      {/* Translation Status Badge with Hover Tooltip */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="relative group/tooltip inline-block">
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

                          {/* Hover Tooltip showing missing field counts */}
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block z-50 w-56 p-3 bg-[#111111] text-white rounded-2xl shadow-2xl border border-[#B8860B]/40 text-xs font-sans pointer-events-none animate-fade-in">
                            <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                              <span className="font-serif font-bold text-xs text-[#D4AF37] flex items-center space-x-1.5">
                                <Globe className="w-3.5 h-3.5 text-[#B8860B]" />
                                <span>Vertaalstatus ({translationStatus.completeCount}/3)</span>
                              </span>
                              {translationStatus.isComplete ? (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">100% OK</span>
                              ) : (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">Ontbreekt</span>
                              )}
                            </div>

                            <div className="space-y-1.5 text-[11px]">
                              {Object.values(translationStatus.details).map((langInfo) => (
                                <div key={langInfo.code} className="flex items-center justify-between font-mono text-[10px]">
                                  <span className="font-bold">{langInfo.flag} {langInfo.label}</span>
                                  {langInfo.missing.length === 0 ? (
                                    <span className="text-emerald-400 font-bold">✓ Compleet</span>
                                  ) : (
                                    <span className="text-amber-400 font-bold">{langInfo.missing.length} ontbrekend</span>
                                  )}
                                </div>
                              ))}
                            </div>
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
                            onClick={() => onOpenCertificate && onOpenCertificate(item)}
                            className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-colors"
                            title="Echtheidscertificaat (PDF) Genereren"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                            title="Bewerken"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/collectie/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                            title="Bekijk op site"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleFeatured(item)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              item.featured
                                ? 'bg-amber-100 border-amber-300 text-[#B8860B]'
                                : 'bg-[#FAF7F2] border-[#D8CEB8] text-stone-400 hover:text-[#B8860B]'
                            }`}
                            title={item.featured ? 'Gemarkeerd als Topstuk' : 'Markeer als Topstuk'}
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
          <div className="p-3.5 bg-[#FAF7F2] border-t border-[#D8CEB8] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[#666666]">
                Geselecteerde items ({selectedItemIds.length})
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#888888]">
              {filtered.length} resultaten weergegeven
            </div>
          </div>
        </div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-4 flex flex-col justify-between hover:border-[#111111] transition-all group"
            >
              <div className="space-y-3">
                
                {/* Header Badge Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono text-[#111111] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#D8CEB8]">
                      {item.ref}
                    </span>
                    {item.itemType === 'painting' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 flex items-center space-x-1">
                        <Palette className="w-3 h-3 text-amber-700" />
                        <span>Schilderij</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-300 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-stone-600" />
                        <span>Boek</span>
                      </span>
                    )}
                    {item.featured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#B8860B] border border-[#B8860B]/40 flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-[#B8860B]" />
                        <span>Topstuk</span>
                      </span>
                    )}
                  </div>

                  {/* Translation Status Badge in Grid View */}
                  {(() => {
                    const translationStatus = getItemTranslationStatus(item);
                    return (
                      <div className="relative group/tooltip inline-block">
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center space-x-1 border cursor-help transition-all ${
                          translationStatus.isComplete 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : translationStatus.completeCount === 2
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {translationStatus.isComplete ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>3/3 Talen</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span>{translationStatus.completeCount}/3 Talen</span>
                            </>
                          )}
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block z-50 w-56 p-3 bg-[#111111] text-white rounded-2xl shadow-2xl border border-[#B8860B]/40 text-xs font-sans pointer-events-none animate-fade-in">
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                            <span className="font-serif font-bold text-xs text-[#D4AF37] flex items-center space-x-1.5">
                              <Globe className="w-3.5 h-3.5 text-[#B8860B]" />
                              <span>Vertaalstatus ({translationStatus.completeCount}/3)</span>
                            </span>
                            {translationStatus.isComplete ? (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">100% OK</span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">Ontbreekt</span>
                            )}
                          </div>

                          <div className="space-y-1.5 text-[11px]">
                            {Object.values(translationStatus.details).map((langInfo) => (
                              <div key={langInfo.code} className="flex items-center justify-between font-mono text-[10px]">
                                <span className="font-bold">{langInfo.flag} {langInfo.label}</span>
                                {langInfo.missing.length === 0 ? (
                                  <span className="text-emerald-400 font-bold">✓ Compleet</span>
                                ) : (
                                  <span className="text-amber-400 font-bold">{langInfo.missing.length} ontbrekend</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none transition-colors ${
                      item.status === 'Beschikbaar' ? 'bg-emerald-100 text-emerald-900 border border-emerald-500/40' :
                      item.status === 'Gereserveerd' ? 'bg-amber-100 text-amber-900 border border-amber-500/40' :
                      'bg-stone-200 text-stone-800 border border-stone-300'
                    }`}
                  >
                    <option value="Beschikbaar">Beschikbaar</option>
                    <option value="Gereserveerd">Gereserveerd</option>
                    <option value="Verkocht">Verkocht</option>
                  </select>
                </div>

                {/* Main Content Row */}
                <div className="flex items-start space-x-3">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#D8CEB8] bg-[#FAF7F2] shrink-0">
                    <img
                      src={item.images && item.images[0]?.url ? item.images[0].url : "/images/scarron-spines-white-bg.jpg"}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0 flex-grow space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase tracking-wider block truncate">
                      {item.category} • {item.century}
                    </span>
                    <h4 className="text-sm font-serif font-bold text-[#111111] line-clamp-2 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#555555] truncate">
                      {item.author} ({item.year})
                    </p>
                    <p className="text-xs font-serif text-[#111111] font-bold">
                      {item.price}
                    </p>
                  </div>
                </div>

              </div>

              {/* Action Buttons Row */}
              <div className="pt-3 border-t border-[#D8CEB8] flex items-center justify-between text-xs">
                
                <button
                  onClick={() => handleToggleFeatured(item)}
                  className={`p-2 rounded-xl border transition-colors ${
                    item.featured
                      ? 'bg-[#FAF7F2] border-[#B8860B] text-[#B8860B]'
                      : 'bg-white border-[#D8CEB8] text-[#888888] hover:text-[#111111]'
                  }`}
                  title={item.featured ? "Verwijder topstuk markering" : "Markeer als topstuk op homepage"}
                >
                  <Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-[#B8860B]' : ''}`} />
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onOpenCertificate && onOpenCertificate(item)}
                    className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-colors"
                    title="Echtheidscertificaat (PDF) Genereren"
                  >
                    <Award className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(item)}
                    className="p-2 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-stone-200 transition-colors"
                    title="Dupliceer item"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleEdit(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#111111] text-white hover:bg-stone-800 text-xs font-bold transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Bewerken</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Weet je zeker dat je "${item.title}" wilt verwijderen?`)) {
                        onDeleteItem(item.id);
                        if (onShowToast) onShowToast(`"${item.title}" verwijderd.`);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Form Modal (Spacious & Seamless Museum Form) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl lg:max-w-5xl bg-[#FAF7F2] border border-[#D8CEB8] rounded-3xl shadow-strong max-h-[92vh] flex flex-col overflow-hidden text-[#111111]">
            
            {/* Modal Top Header */}
            <div className="px-6 sm:px-8 py-4 border-b border-[#D8CEB8] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-sm shrink-0">
                  {editingItem.itemType === 'painting' ? (
                    <Palette className="w-5 h-5 text-[#C5A059]" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-[#C5A059]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[#111111] text-[#FAF7F2] font-mono text-[10px] font-bold tracking-wider">
                      {isNew ? "NIEUW" : editingItem.ref}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#C5A059] uppercase tracking-wider hidden sm:inline">
                      {editingItem.itemType === 'painting' ? "Schilderij & Kunst" : "Antiquarisch Boek"}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#111111] truncate mt-0.5">
                    {isNew ? "Nieuw Object Invoeren in Collectie" : editingItem.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* AI TRANSLATION HELPER HEADER BUTTONS */}
                <div className="flex items-center space-x-1.5 bg-[#FAF7F2] p-1 rounded-2xl border border-[#D8CEB8]">
                  <button
                    type="button"
                    onClick={handleCopyAiPrompt}
                    className="px-3 py-1.5 rounded-xl bg-[#111111] text-[#FAF7F2] hover:bg-[#B8860B] hover:text-black text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    title={`Kopieer velden van actieve taal [${formLang.toUpperCase()}] als AI vertaal-prompt`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="hidden md:inline">1. Kopieer AI Prompt ({formLang === 'nl' ? '🇳🇱 NL' : formLang === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'})</span>
                    <span className="md:hidden">Prompt ({formLang.toUpperCase()})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAiImportModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-[#111111] border border-[#D8CEB8] text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    title="Plak en importeer de JSON vertaling van ChatGPT / Claude in 1 klik"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span className="hidden md:inline">2. Importeer Vertaling</span>
                    <span className="md:hidden">Importeer</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-2.5 rounded-full bg-[#FAF7F2] text-[#111111] hover:bg-[#111111] hover:text-white border border-[#D8CEB8] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveForm} className="px-6 sm:px-8 py-5 overflow-y-auto space-y-6 flex-grow text-sm font-sans">
              
              {/* PURE MANUAL MULTI-LANGUAGE TAB BAR */}
              <div className="p-4 rounded-2xl bg-[#1C1A17] text-[#FAF7F2] border border-[#B8860B]/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-[#B8860B]" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <span>Drietalig Handmatig Beheer</span>
                      <span className="px-2 py-0.5 rounded bg-[#B8860B] text-black text-[10px]">
                        Actieve taal: {formLang === 'nl' ? '🇳🇱 Nederlands' : formLang === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-300 font-serif">
                      Klik op een taaltabblad om de velden handmatig per taal in te voeren.
                    </p>
                  </div>
                </div>

                {/* Language Tab Switcher */}
                <div className="flex items-center space-x-1 bg-black/60 p-1.5 rounded-xl border border-stone-700 font-mono text-xs w-full sm:w-auto justify-center">
                  {[
                    { id: 'nl', label: '🇳🇱 Nederlands' },
                    { id: 'en', label: '🇬🇧 English' },
                    { id: 'fr', label: '🇫🇷 Français' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFormLang(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        formLang === tab.id
                          ? 'bg-[#B8860B] text-black shadow-md scale-105'
                          : 'text-stone-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ITEM TYPE SWITCHER */}
              <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#D8CEB8] space-y-3 shadow-xs">
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-widest">
                  Type Kunstobject *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ 
                      ...editingItem, 
                      itemType: 'book',
                      category: editingItem.itemType === 'painting' ? 'Literatuur & Filosofie' : editingItem.category 
                    })}
                    className={`py-4 px-5 rounded-2xl text-xs font-serif font-bold transition-all flex items-center justify-center space-x-3 cursor-pointer ${
                      (editingItem.itemType || 'book') === 'book'
                        ? 'bg-[#111111] text-white shadow-lg border-2 border-[#111111]'
                        : 'bg-white text-[#555555] hover:text-[#111111] border-2 border-[#D8CEB8]'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-sm font-serif font-bold">Antiquarisch Boek</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingItem({ 
                      ...editingItem, 
                      itemType: 'painting',
                      category: editingItem.itemType === 'book' ? 'Oude Meesters' : editingItem.category 
                    })}
                    className={`py-4 px-5 rounded-2xl text-xs font-serif font-bold transition-all flex items-center justify-center space-x-3 cursor-pointer ${
                      editingItem.itemType === 'painting'
                        ? 'bg-[#111111] text-white shadow-lg border-2 border-[#111111]'
                        : 'bg-white text-[#555555] hover:text-[#111111] border-2 border-[#D8CEB8]'
                    }`}
                  >
                    <Palette className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-sm font-serif font-bold">Schilderij & Kunstwerk</span>
                  </button>
                </div>
              </div>

              {/* SECTION 1: BASISINFORMATIE */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D8CEB8] space-y-6 shadow-xs">
                <h4 className="text-base font-serif font-bold text-[#111111] border-b border-[#D8CEB8] pb-3 flex items-center space-x-2.5">
                  <Layers className="w-5 h-5 text-[#B8860B]" />
                  <span>1. Basisinformatie &amp; Prijs</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      Ref Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.ref}
                      onChange={(e) => setEditingItem({ ...editingItem, ref: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-mono font-bold focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      Status *
                    </label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                    >
                      <option value="Beschikbaar">Beschikbaar</option>
                      <option value="Gereserveerd">Gereserveerd</option>
                      <option value="Verkocht">Verkocht (Archief)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
                        Prijs / Taxatie
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const poa = isPriceOnRequest(editingItem.price);
                          setEditingItem({
                            ...editingItem,
                            price: poa ? '€ ' : 'Prijs op aanvraag'
                          });
                        }}
                        className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isPriceOnRequest(editingItem.price)
                            ? 'bg-[#1C1A17] text-[#B8860B] border-[#1C1A17] shadow-xs'
                            : 'bg-[#FAF7F2] text-[#666666] border-[#D8CEB8] hover:text-[#111111] hover:border-[#111111]'
                        }`}
                        title="Schakel tussen 'Prijs op aanvraag' en een vast Euro bedrag"
                      >
                        <span>{isPriceOnRequest(editingItem.price) ? '✓ Prijs op aanvraag' : '+ Prijs op aanvraag'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                      placeholder="€ 3.500 of Prijs op aanvraag"
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                    />
                    <p className="text-[11px] font-serif text-[#666666] italic mt-1.5">
                      💡 Wordt op de website automatisch gelokaliseerd: EN (&ldquo;Price on request&rdquo;) &bull; FR (&ldquo;Prix sur demande&rdquo;)
                    </p>
                  </div>
                </div>

                <div>
                  {renderFieldHeader(editingItem.itemType === 'painting' ? "Titel van het Schilderij / Kunstwerk" : "Titel van het Boek", "title", true)}
                  <input
                    type="text"
                    required
                    value={getFormField('title')}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    placeholder={isFieldNvt('title', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. Stilleven met Boeken en Ganzenveer" : "Bijv. Voltaire — Œuvres Complètes")}
                    className={`w-full px-4 py-3.5 rounded-xl border text-[#111111] font-serif font-bold text-base focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 ${
                      isFieldNvt('title', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
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
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#111111] font-serif italic focus:outline-none focus:border-[#111111] ${
                      isFieldNvt('subtitle', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      {editingItem.itemType === 'painting' ? "Kunstenaar / Meester" : "Auteur / Schrijver"}
                    </label>
                    <input
                      type="text"
                      value={editingItem.author}
                      onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                      placeholder={editingItem.itemType === 'painting' ? "Bijv. School van Leiden (cirkel van H. Steenwijck)" : "Bijv. Voltaire"}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      Datering &amp; Eeuw
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editingItem.year}
                        onChange={(e) => setEditingItem({ ...editingItem, year: e.target.value })}
                        placeholder="1645"
                        className="w-full px-3 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                      />
                      <select
                        value={editingItem.century}
                        onChange={(e) => setEditingItem({ ...editingItem, century: e.target.value })}
                        className="w-full px-2 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
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
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      Categorie
                    </label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                    >
                      {editingItem.itemType === 'painting' ? (
                        <>
                          <option value="Oude Meesters">Oude Meesters (16e-18e Eeuw)</option>
                          <option value="19e-Eeuwse Schilderkunst">19e-Eeuwse Schilderkunst</option>
                          <option value="Portretten & Miniaturen">Portretten & Miniaturen</option>
                          <option value="Stillevens & Landschappen">Stillevens & Landschappen</option>
                          <option value="Religieuze Kunst & Iconen">Religieuze Kunst & Iconen</option>
                          <option value="Grafiek & Tekeningen">Grafiek & Tekeningen</option>
                        </>
                      ) : (
                        <>
                          <option value="Literatuur & Filosofie">Literatuur & Filosofie</option>
                          <option value="Literatuur & Satire">Literatuur & Satire</option>
                          <option value="Wetenschap & Illustraties">Wetenschap & Illustraties</option>
                          <option value="Kartografie & Reizen">Kartografie & Reizen</option>
                          <option value="Bijbels & Religie">Bijbels & Religie</option>
                          <option value="Klassieke Oudheid">Klassieke Oudheid</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    {renderFieldHeader(editingItem.itemType === 'painting' ? "Galerie / Atelier / Werkplaats" : "Drukker / Uitgever (Publisher / Printer)", "publisher")}
                    <input
                      type="text"
                      value={getFormField('publisher') || editingItem.publisher || ''}
                      onChange={(e) => {
                        updateFormField('publisher', e.target.value);
                        setEditingItem(prev => ({ ...prev, publisher: e.target.value }));
                      }}
                      placeholder={isFieldNvt('publisher', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. Atelier Rembrandt / Galerie" : "Bijv. Chez Baudouin / Elzevier")}
                      className={`w-full px-4 py-3 rounded-xl border text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111] ${
                        isFieldNvt('publisher', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                      }`}
                    />
                  </div>

                  <div>
                    {renderFieldHeader(editingItem.itemType === 'painting' ? "Plaats van ontstaan (Atelier / Origine)" : "Plaats van Uitgave (Place of Printing)", "city")}
                    <input
                      type="text"
                      value={getFormField('city') || editingItem.city || ''}
                      onChange={(e) => {
                        updateFormField('city', e.target.value);
                        setEditingItem(prev => ({ ...prev, city: e.target.value }));
                      }}
                      placeholder={isFieldNvt('city', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. Delft / Antwerpen" : "Bijv. Parijs / Amsterdam / Leiden")}
                      className={`w-full px-4 py-3 rounded-xl border text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111] ${
                        isFieldNvt('city', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className={`cursor-pointer inline-flex items-center space-x-2.5 text-xs font-bold p-3.5 rounded-xl border transition-all ${
                    editingItem.featured 
                      ? 'bg-[#B8860B]/10 border-[#B8860B] text-[#B8860B]' 
                      : 'bg-[#FAF7F2] border-[#D8CEB8] text-[#111111] hover:border-[#111111]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editingItem.featured || false}
                      onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })}
                      className="w-4 h-4 rounded border-[#D8CEB8] text-[#B8860B] focus:ring-[#B8860B]"
                    />
                    <span>⭐ Op Homepage Tonen (Recent Aanwinst / Topstuk)</span>
                  </label>
                </div>
              </div>

              {/* SECTION 2: TECHNIEK, LIJST & PROVENANCE */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D8CEB8] space-y-6 shadow-xs">
                <h4 className="text-base font-serif font-bold text-[#111111] border-b border-[#D8CEB8] pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Bookmark className="w-5 h-5 text-[#B8860B]" />
                    <span>2. {editingItem.itemType === 'painting' ? "Techniek, Lijst & Restauratie" : "Bandstijl, Conditie & Provenance"}</span>
                  </div>
                  <span className="text-[#B8860B] font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#D8CEB8]">
                    INVOERTAAL: {formLang.toUpperCase()}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    {renderFieldHeader(editingItem.itemType === 'painting' ? "Lijst & Inlijsting" : "Bandstijl (Binding)", "binding")}
                    <textarea
                      rows={3}
                      value={getFormField('binding')}
                      onChange={(e) => updateFormField('binding', e.target.value)}
                      placeholder={isFieldNvt('binding', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. Originele 17e-eeuwse vergulde baroklijst..." : "Volledige kalfslederen band met goudstempels op de rug...")}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed ${
                        isFieldNvt('binding', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                      }`}
                    />
                  </div>

                  <div>
                    {renderFieldHeader("Staat & Conditie Summary", "condition")}
                    <textarea
                      rows={3}
                      value={getFormField('condition')}
                      onChange={(e) => updateFormField('condition', e.target.value)}
                      placeholder={isFieldNvt('condition', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. Excellente museumstaat, authentiek craquelé..." : "Excellente antiquarische staat...")}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed ${
                        isFieldNvt('condition', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    {renderFieldHeader(editingItem.itemType === 'painting' ? "Afmetingen (doek & met lijst)" : "Formaat & Afmetingen", "dimensions")}
                    <input
                      type="text"
                      value={getFormField('dimensions') || editingItem.dimensions || ''}
                      onChange={(e) => {
                        updateFormField('dimensions', e.target.value);
                        setEditingItem(prev => ({ ...prev, dimensions: e.target.value }));
                      }}
                      placeholder={isFieldNvt('dimensions', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. 48 x 38 cm (met lijst 62 x 52 cm)" : "In-8° (21,5 x 13,5 cm)")}
                      className={`w-full px-4 py-3 rounded-xl border text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111] ${
                        isFieldNvt('dimensions', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                      }`}
                    />
                  </div>

                  <div>
                    {renderFieldHeader(editingItem.itemType === 'painting' ? "Signatuur & Medium" : "Collatie & Specificaties", "collationSpecs")}
                    <input
                      type="text"
                      value={getFormField('collationSpecs')}
                      onChange={(e) => updateFormField('collationSpecs', e.target.value)}
                      placeholder={isFieldNvt('collationSpecs', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. Olieverf op paneel. Gesigneerd linksonder 1645." : "52 delen compleet. In-8°. Ca. 28.000 pp.")}
                      className={`w-full px-4 py-3 rounded-xl border text-sm text-[#111111] font-mono focus:outline-none focus:border-[#111111] ${
                        isFieldNvt('collationSpecs', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  {renderFieldHeader("Provenance (Korte Herkomst Omschrijving)", "provenance")}
                  <input
                    type="text"
                    value={getFormField('provenance')}
                    onChange={(e) => updateFormField('provenance', e.target.value)}
                    placeholder={isFieldNvt('provenance', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Bijv. Collectie Jonkheer van der Heyden • Christie's 1988..." : "Ex-Libris Vacheron-Poinsot...")}
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#111111] font-serif italic focus:outline-none focus:border-[#111111] ${
                      isFieldNvt('provenance', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                    }`}
                  />
                </div>

                <div>
                  {renderFieldHeader(editingItem.itemType === 'painting' ? "Restauratie & Conditierapport (Doek/Paneel Dossier)" : "Uitgebreid Conditierapport (Museum Dossier)", "conditionReport")}
                  <textarea
                    rows={4}
                    value={getFormField('conditionReport')}
                    onChange={(e) => updateFormField('conditionReport', e.target.value)}
                    placeholder={isFieldNvt('conditionReport', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "UV-inspectie toont authentiek craquelé-netwerk. Massieve eiken drager..." : "Banden in rood Chagrin-halfleer in uitzonderlijk stevige staat...")}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif ${
                      isFieldNvt('conditionReport', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                    }`}
                  />
                </div>

                <div>
                  {renderFieldHeader("Uitgebreid Provenance Verhaal & Veilinghistorie", "provenanceDetails")}
                  <textarea
                    rows={4}
                    value={getFormField('provenanceDetails')}
                    onChange={(e) => updateFormField('provenanceDetails', e.target.value)}
                    placeholder={isFieldNvt('provenanceDetails', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : (editingItem.itemType === 'painting' ? "Herkomst uit de adellijke verzameling..." : "Afkomstig uit het kasteelarchief van de adellijke familie...")}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif ${
                      isFieldNvt('provenanceDetails', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                    }`}
                  />
                </div>
              </div>

              {/* SECTION 3: VERHAAL, HISTORISCHE CONTEXT & FOTO'S */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D8CEB8] space-y-6 shadow-xs">
                <h4 className="text-base font-serif font-bold text-[#111111] border-b border-[#D8CEB8] pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <History className="w-5 h-5 text-[#B8860B]" />
                    <span>3. Verhaal, Historische Context &amp; Fotogalerij</span>
                  </div>
                  <span className="text-[#B8860B] font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#D8CEB8]">
                    INVOERTAAL: {formLang.toUpperCase()}
                  </span>
                </h4>

                <div>
                  {renderFieldHeader("Algemene Beschrijving & Overzicht", "description")}
                  <textarea
                    rows={4}
                    value={getFormField('description')}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    placeholder={isFieldNvt('description', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Schrijf hier het overzicht achter dit meesterwerk..."}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif ${
                      isFieldNvt('description', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                    }`}
                  />
                </div>

                <div>
                  {renderFieldHeader("Diepgaande Historische & Kunsthistorische Context", "historicalContext")}
                  <textarea
                    rows={5}
                    value={getFormField('historicalContext')}
                    onChange={(e) => updateFormField('historicalContext', e.target.value)}
                    placeholder={isFieldNvt('historicalContext', formLang) ? "✓ Bewust leeg gelaten (N.v.t.)" : "Schrijf hier de uitgebreide historische of kunsthistorische context..."}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif ${
                      isFieldNvt('historicalContext', formLang) ? 'bg-amber-50/60 border-amber-300' : 'bg-[#FAF7F2] border-[#D8CEB8]'
                    }`}
                  />
                </div>

                {/* File Upload & Gallery */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#111111] uppercase tracking-wider text-xs font-mono">
                      Fotogalerij ({editingItem.images?.length || 0} Afbeeldingen)
                    </label>

                    <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#111111] text-white hover:bg-stone-800 transition-all flex items-center space-x-2 font-bold text-xs shadow-md">
                      <Upload className="w-4 h-4 text-[#D4AF37]" />
                      <span>Upload Foto's</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {editingItem.images?.map((img, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden border border-[#D8CEB8] group bg-[#FAF7F2] shadow-xs">
                        <div className="aspect-square relative overflow-hidden">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#111111] text-white text-[10px] font-mono font-bold">
                              Hoofdafbeelding
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            title="Verwijder Foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="pt-6 flex items-center justify-between border-t border-[#D8CEB8] shrink-0">
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => onOpenCertificate && onOpenCertificate(editingItem)}
                    className="px-5 py-3 rounded-xl bg-amber-50 border border-amber-300 text-[#B8860B] hover:bg-[#B8860B] hover:text-white font-serif font-bold text-xs transition-all flex items-center space-x-2 shadow-sm"
                  >
                    <Award className="w-4 h-4" />
                    <span>Echtheidscertificaat (PDF)</span>
                  </button>
                )}
                
                <div className="flex items-center space-x-4 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-6 py-3.5 rounded-xl bg-[#FAF7F2] text-[#111111] font-bold text-xs uppercase tracking-wider hover:bg-stone-200 border border-[#D8CEB8] transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-xl bg-[#111111] hover:bg-[#B8860B] hover:text-[#111111] text-white font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#D4AF37]" />
                    <span>Object Opslaan in Collectie</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* AI TRANSLATION IMPORT POPUP MODAL */}
      {showAiImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
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
                className="p-2 rounded-full bg-white hover:bg-[#111111] hover:text-white border border-[#D8CEB8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
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
        </div>
      )}

    </div>
  );
}
