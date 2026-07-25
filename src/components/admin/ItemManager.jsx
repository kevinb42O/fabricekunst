import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Upload, Copy, Star, CheckCircle2, Image as ImageIcon, BookOpen, Layers, Palette, Bookmark, History, Loader2 } from 'lucide-react';
import { uploadCatalogImage } from '../../utils/storage';

export default function ItemManager({ items, onSaveItem, onDeleteItem, onShowToast }) {
  const [editingItem, setEditingItem] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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

  // Filter Logic
  const filtered = items.filter(item => {
    const matchesSearch =
      item.title?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.ref?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.author?.toLowerCase().includes(filterQuery.toLowerCase());

    const itemTypeVal = item.itemType || 'book';
    const matchesType = typeFilter === 'Alle' || itemTypeVal === typeFilter;
    const matchesStatus = statusFilter === 'Alle' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'Alle' || item.category === categoryFilter;

    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  const availableCount = items.filter(i => i.status === 'Beschikbaar').length;
  const reservedCount = items.filter(i => i.status === 'Gereserveerd').length;
  const soldCount = items.filter(i => i.status === 'Verkocht').length;
  const booksCount = items.filter(i => (i.itemType || 'book') === 'book').length;
  const paintingsCount = items.filter(i => i.itemType === 'painting').length;

  return (
    <div className="space-y-6 text-[#111111] animate-fade-in">
      
      {/* Museum Collection Control Header Bar */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D8CEB8] shadow-xs space-y-5">
        
        {/* Top Header Row: Title & Create New Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8CEB8]/70 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] tracking-tight">
              Collectie &amp; Catalogus Beheer
            </h2>
            <p className="text-xs font-serif text-[#666666] italic mt-0.5">
              Beheer antiquarische boeken, schilderijen en kunstwerken • {items.length} Objecten Totaal
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="px-6 py-3.5 rounded-2xl bg-[#111111] hover:bg-[#B8860B] hover:text-[#111111] text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Nieuw Stuk Invoeren</span>
          </button>
        </div>

        {/* Bottom Row: Search Input, Type Filter Segments, Status Dropdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Zoek op auteur, titel, ref of trefwoord..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs font-semibold text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 transition-all"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#111111]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Object Type Switcher */}
          <div className="lg:col-span-4 flex items-center p-1 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs font-mono">
            <button
              onClick={() => setTypeFilter('Alle')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all text-center cursor-pointer ${
                typeFilter === 'Alle' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              Alle ({items.length})
            </button>
            <button
              onClick={() => setTypeFilter('book')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                typeFilter === 'book' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Boeken ({booksCount})</span>
            </button>
            <button
              onClick={() => setTypeFilter('painting')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                typeFilter === 'painting' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Kunst ({paintingsCount})</span>
            </button>
          </div>

          {/* Status Dropdown Filter */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
            >
              <option value="Alle">Alle Status ({items.length})</option>
              <option value="Beschikbaar">Beschikbaar ({availableCount})</option>
              <option value="Gereserveerd">Gereserveerd ({reservedCount})</option>
              <option value="Verkocht">Verkocht (Archief) ({soldCount})</option>
            </select>
          </div>

        </div>

      </div>

      {/* Catalog Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#D8CEB8] shadow-sm space-y-2">
          <BookOpen className="w-10 h-10 text-[#B8860B] mx-auto" />
          <p className="text-sm font-serif font-bold text-[#111111]">Geen items gevonden</p>
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

      {/* Edit / Create Form Modal (Spacious & Elegant Museum Form) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white border-2 border-[#D8CEB8] rounded-3xl shadow-strong max-h-[94vh] flex flex-col overflow-hidden text-[#111111]">
            
            {/* Modal Top Header */}
            <div className="px-6 py-5 border-b border-[#D8CEB8] bg-[#FAF7F2] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
                  {editingItem.itemType === 'painting' ? (
                    <Palette className="w-5 h-5 text-[#D4AF37]" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#B8860B] tracking-widest block">
                    {isNew ? "Nieuw Museum Stuk" : editingItem.ref}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#111111]">
                    {isNew ? "Nieuw Object Invoeren in Collectie" : editingItem.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setEditingItem(null)}
                className="p-2.5 rounded-full bg-white text-[#111111] hover:bg-stone-200 border border-[#D8CEB8] transition-colors shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveForm} className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-grow text-sm font-sans">
              
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
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      Prijs / Taxatie
                    </label>
                    <input
                      type="text"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                      placeholder="€ 3.500 of Prijs op aanvraag"
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                    {editingItem.itemType === 'painting' ? "Titel van het Schilderij / Kunstwerk *" : "Titel van het Boek *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder={editingItem.itemType === 'painting' ? "Bijv. Stilleven met Boeken en Ganzenveer" : "Bijv. Voltaire — Œuvres Complètes"}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-serif font-bold text-base focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20"
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

                <div className="pt-2">
                  <label className="cursor-pointer inline-flex items-center space-x-2 text-xs font-bold text-[#111111] p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8]">
                    <input
                      type="checkbox"
                      checked={editingItem.featured || false}
                      onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })}
                      className="w-4 h-4 rounded border-[#D8CEB8] text-[#111111] focus:ring-[#B8860B]"
                    />
                    <span>Markeer als Topstuk op Homepage</span>
                  </label>
                </div>
              </div>

              {/* SECTION 2: TECHNIEK, LIJST & PROVENANCE (RUIME INPUTVELDEN) */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D8CEB8] space-y-6 shadow-xs">
                <h4 className="text-base font-serif font-bold text-[#111111] border-b border-[#D8CEB8] pb-3 flex items-center space-x-2.5">
                  <Bookmark className="w-5 h-5 text-[#B8860B]" />
                  <span>2. {editingItem.itemType === 'painting' ? "Techniek, Lijst & Restauratie" : "Bandstijl, Conditie & Provenance"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      {editingItem.itemType === 'painting' ? "Lijst & Inlijsting" : "Bandstijl (Binding)"}
                    </label>
                    <textarea
                      rows={3}
                      value={editingItem.binding || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, binding: e.target.value })}
                      placeholder={editingItem.itemType === 'painting' ? "Bijv. Originele 17e-eeuwse vergulde baroklijst op eiken kern..." : "Volledige kalfslederen band met goudstempels op de rug..."}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      Staat &amp; Conditie Summary
                    </label>
                    <textarea
                      rows={3}
                      value={editingItem.condition || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, condition: e.target.value })}
                      placeholder={editingItem.itemType === 'painting' ? "Bijv. Excellente museumstaat, authentiek craquelé..." : "Excellente antiquarische staat..."}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      {editingItem.itemType === 'painting' ? "Afmetingen (doek & met lijst)" : "Formaat & Afmetingen"}
                    </label>
                    <input
                      type="text"
                      value={editingItem.dimensions || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, dimensions: e.target.value })}
                      placeholder={editingItem.itemType === 'painting' ? "Bijv. 48 x 38 cm (met lijst 62 x 52 cm)" : "In-8° (21,5 x 13,5 cm)"}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                      {editingItem.itemType === 'painting' ? "Signatuur & Medium" : "Collatie & Specificaties"}
                    </label>
                    <input
                      type="text"
                      value={editingItem.collationSpecs || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, collationSpecs: e.target.value })}
                      placeholder={editingItem.itemType === 'painting' ? "Bijv. Olieverf op paneel. Gesigneerd linksonder 1645." : "52 delen compleet. In-8°. Ca. 28.000 pp."}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-mono focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                    Provenance (Korte Herkomst Omschrijving)
                  </label>
                  <input
                    type="text"
                    value={editingItem.provenance || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, provenance: e.target.value })}
                    placeholder={editingItem.itemType === 'painting' ? "Bijv. Collectie Jonkheer van der Heyden • Christie's 1988..." : "Ex-Libris Vacheron-Poinsot..."}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-serif italic focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                    {editingItem.itemType === 'painting' ? "Restauratie & Conditierapport (Doek/Paneel Dossier)" : "Uitgebreid Conditierapport (Museum Dossier)"}
                  </label>
                  <textarea
                    rows={4}
                    value={editingItem.conditionReport || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, conditionReport: e.target.value })}
                    placeholder={editingItem.itemType === 'painting' ? "UV-inspectie toont authentiek craquelé-netwerk. Massieve eiken drager..." : "Banden in rood Chagrin-halfleer in uitzonderlijk stevige staat..."}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                    Uitgebreid Provenance Verhaal &amp; Veilinghistorie
                  </label>
                  <textarea
                    rows={4}
                    value={editingItem.provenanceDetails || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, provenanceDetails: e.target.value })}
                    placeholder={editingItem.itemType === 'painting' ? "Herkomst uit de adellijke verzameling..." : "Afkomstig uit het kasteelarchief van de adellijke familie..."}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif"
                  />
                </div>
              </div>

              {/* SECTION 3: VERHAAL, HISTORISCHE CONTEXT & FOTO'S */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D8CEB8] space-y-6 shadow-xs">
                <h4 className="text-base font-serif font-bold text-[#111111] border-b border-[#D8CEB8] pb-3 flex items-center space-x-2.5">
                  <History className="w-5 h-5 text-[#B8860B]" />
                  <span>3. Verhaal, Historische Context &amp; Fotogalerij</span>
                </h4>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                    Algemene Beschrijving &amp; Overzicht
                  </label>
                  <textarea
                    rows={4}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Schrijf hier het overzicht achter dit meesterwerk..."
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                    Diepgaande Historische &amp; Kunsthistorische Context
                  </label>
                  <textarea
                    rows={5}
                    value={editingItem.historicalContext || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, historicalContext: e.target.value })}
                    placeholder="Schrijf hier de uitgebreide historische of kunsthistorische context..."
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 leading-relaxed font-serif"
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
              <div className="pt-6 flex items-center justify-end space-x-4 border-t border-[#D8CEB8] shrink-0">
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

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
