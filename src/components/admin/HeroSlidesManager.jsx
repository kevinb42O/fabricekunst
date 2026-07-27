import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Plus, Trash2, Save, MoveUp, MoveDown, Layers, RefreshCw, X } from 'lucide-react';
import { uploadCatalogImage, DEFAULT_HERO_SLIDES } from '../../utils/storage';

// Helper function to generate Roman numerals for slide tags
const toRoman = (num) => {
  const lookup = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let roman = '';
  let n = num;
  for (const [val, str] of lookup) {
    while (n >= val) {
      roman += str;
      n -= val;
    }
  }
  return roman || `V${num}`;
};

export default function HeroSlidesManager({ slides = [], onSaveSlides = () => {}, onShowToast = () => {} }) {
  const [currentSlides, setCurrentSlides] = useState(
    slides && slides.length > 0 ? [...slides] : [...DEFAULT_HERO_SLIDES]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [activeUploadIndex, setActiveUploadIndex] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  const handleSlideChange = (index, field, value) => {
    setCurrentSlides(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setActiveUploadIndex(index);

    try {
      const publicUrl = await uploadCatalogImage(file);
      if (publicUrl) {
        handleSlideChange(index, 'image', publicUrl);
        onShowToast(`Nieuwe hero afbeelding geüpload voor slide #${index + 1}`);
      }
    } catch (err) {
      console.error("Fout bij uploaden hero afbeelding:", err);
      onShowToast("Uploaden mislukt. Probeer een andere afbeelding.");
    } finally {
      setIsUploading(false);
      setActiveUploadIndex(null);
    }
  };

  const handleMoveSlide = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentSlides.length) return;

    setCurrentSlides(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleAddSlide = () => {
    const newId = `hero-slide-${Date.now()}`;
    const nextIndex = currentSlides.length + 1;
    const newSlide = {
      id: newId,
      title: '',
      year: `${new Date().getFullYear()}`,
      subtitle: '',
      image: '', // Leeg veld voor placeholder foto upload
      objectPosition: 'center center',
      tag: toRoman(nextIndex)
    };

    setCurrentSlides(prev => [...prev, newSlide]);
    setNewlyAddedId(newId);
    onShowToast(`Nieuwe slide #${nextIndex} toegevoegd! Vul de gegevens in en upload een foto.`);

    // Automatisch naar de nieuw aangemaakte slide scrollen
    setTimeout(() => {
      const el = document.getElementById(`hero-slide-card-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus direct op de titel van de nieuwe slide
        const titleInput = el.querySelector('input[data-field="title"]');
        if (titleInput) titleInput.focus();
      }
    }, 120);

    // Na 3.5 seconden de highlight ring uitschakelen
    setTimeout(() => {
      setNewlyAddedId(null);
    }, 3500);
  };

  const handleRemoveSlide = (index) => {
    if (currentSlides.length <= 1) {
      alert("Er moet minimaal 1 hero slide actief blijven.");
      return;
    }
    if (window.confirm("Weet je zeker dat je deze slide wilt verwijderen?")) {
      setCurrentSlides(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Herstellen naar de originele standaard hero-afbeeldingen?")) {
      setCurrentSlides([...DEFAULT_HERO_SLIDES]);
      onSaveSlides([...DEFAULT_HERO_SLIDES]);
      onShowToast("Hero slides hersteld naar standaard.");
    }
  };

  const handleSaveAll = () => {
    onSaveSlides(currentSlides);
    onShowToast("Hero homepage slides succesvol opgeslagen!");
  };

  return (
    <div className="space-y-6 text-[#1C1A18] font-sans animate-fade-in">
      
      {/* Header Bar */}
      <div className="p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C5A059]/15 text-[#8E7035] text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Homepage Visuals</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#1C1A18]">
            Hero Carrousel &amp; Banner Afbeeldingen
          </h2>
          <p className="text-xs text-[#6E675E] mt-1 font-medium">
            Pas de beelden, titels en subtitels van de monumentale homepage hero carrousel aan.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-[#6E675E] hover:text-[#1C1A18] text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Herstel naar standaard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Herstel Standaard</span>
          </button>

          <button
            onClick={handleAddSlide}
            className="px-4 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] hover:border-[#C5A059] text-[#1C1A18] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#C5A059]" />
            <span>+ Slide Toevoegen</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-lg bg-[#C5A059] hover:bg-[#B38F48] text-[#1C1A18] text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Alles Opslaan</span>
          </button>
        </div>
      </div>

      {/* Slides Editor Cards */}
      <div className="space-y-6">
        {currentSlides.map((slide, idx) => {
          const isNewlyAdded = slide.id === newlyAddedId;

          return (
            <div 
              key={slide.id || idx}
              id={`hero-slide-card-${slide.id}`}
              className={`p-6 rounded-xl bg-white border shadow-sm space-y-6 transition-all duration-500 ${
                isNewlyAdded 
                  ? 'border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-md' 
                  : 'border-[#EBE7DF] hover:border-[#C5A059]/50'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-full bg-[#1C1A18] text-[#C5A059] flex items-center justify-center font-serif font-bold text-sm">
                    {slide.tag || idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#1C1A18] flex items-center gap-2">
                      Hero Slide #{idx + 1}
                      {isNewlyAdded && (
                        <span className="text-[10px] font-sans font-bold bg-[#C5A059] text-[#1C1A18] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Nieuw
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] font-mono text-[#8C8478]">ID: {slide.id}</span>
                  </div>
                </div>

                {/* Move & Action Controls */}
                <div className="flex items-center space-x-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveSlide(idx, -1)}
                    className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] disabled:opacity-30 text-[#1C1A18] hover:bg-stone-200 transition-colors cursor-pointer"
                    title="Omhoog verplaatsen"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === currentSlides.length - 1}
                    onClick={() => handleMoveSlide(idx, 1)}
                    className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] disabled:opacity-30 text-[#1C1A18] hover:bg-stone-200 transition-colors cursor-pointer"
                    title="Omlaag verplaatsen"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveSlide(idx)}
                    className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors ml-2 cursor-pointer"
                    title="Slide verwijderen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Form Fields & Image Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Image Preview & File Upload */}
                <div className="lg:col-span-5 space-y-3">
                  <label className="block text-xs font-mono font-bold uppercase text-[#1C1A18]">
                    Hero Afbeelding (Sfeerfoto)
                  </label>

                  {slide.image ? (
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-stone-900 border border-[#EBE7DF] group">
                      <img 
                        src={slide.image} 
                        alt={slide.title || `Slide ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase bg-[#C5A059] text-[#1C1A18] font-bold px-2 py-0.5 rounded self-start">
                          Preview
                        </span>
                        <div>
                          <p className="text-xs font-serif font-bold text-white truncate">{slide.title || 'Geen titel ingevuld'}</p>
                          <p className="text-[10px] text-stone-300 truncate">{slide.year}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Lege Placeholder voor Foto Upload */
                    <label className="relative aspect-[16/9] rounded-xl border-2 border-dashed border-[#C5A059]/60 hover:border-[#C5A059] bg-[#FDFBF7] hover:bg-[#F5F0E6] transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-[#C5A059]/15 text-[#8E7035] group-hover:bg-[#C5A059] group-hover:text-[#1C1A18] transition-all flex items-center justify-center mb-2 shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-[#1C1A18] mb-1">
                        {isUploading && activeUploadIndex === idx ? 'Uploaden bezig...' : 'Klik om foto te uploaden'}
                      </p>
                      <p className="text-[11px] text-[#6E675E]">
                        Selecteer een afbeelding vanaf je computer (PNG, JPG, WebP)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, idx)}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Upload or Image URL controls */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <label className="flex-1 py-2.5 px-4 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] hover:border-[#C5A059] text-[#1C1A18] text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer">
                        <Upload className="w-4 h-4 text-[#C5A059]" />
                        <span>
                          {isUploading && activeUploadIndex === idx 
                            ? 'Uploaden bezig...' 
                            : slide.image ? 'Wijzig Foto' : 'Upload Foto'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, idx)}
                          className="hidden"
                        />
                      </label>

                      {slide.image && (
                        <button
                          type="button"
                          onClick={() => handleSlideChange(idx, 'image', '')}
                          className="px-3 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-[#EBE7DF] text-stone-600 text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                          title="Foto verwijderen"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Wissen</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={slide.image || ''}
                      onChange={(e) => handleSlideChange(idx, 'image', e.target.value)}
                      placeholder="Of plak direct een afbeelding URL..."
                      className="w-full px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-xs font-mono text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                {/* Right Column: Slide Text Details */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Title & Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono font-bold uppercase text-[#1C1A18] mb-1">
                        Hoofdtitel (Boek / Kunstwerk)
                      </label>
                      <input
                        type="text"
                        data-field="title"
                        value={slide.title || ''}
                        onChange={(e) => handleSlideChange(idx, 'title', e.target.value)}
                        placeholder="bijv. Zeldzaam 17e-Eeuwse Atlas..."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-xs font-serif font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-[#1C1A18] mb-1">
                        Jaar / Plaats
                      </label>
                      <input
                        type="text"
                        value={slide.year || ''}
                        onChange={(e) => handleSlideChange(idx, 'year', e.target.value)}
                        placeholder="bijv. Amsterdam 1680"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-xs font-sans text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                  </div>

                  {/* Subtitle Description */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-[#1C1A18] mb-1">
                      Subtitel / Beschrijving
                    </label>
                    <textarea
                      rows={2}
                      value={slide.subtitle || ''}
                      onChange={(e) => handleSlideChange(idx, 'subtitle', e.target.value)}
                      placeholder="Korte beschrijving van deze hero slide..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-xs text-[#1C1A18] font-sans focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Tag Roman Numeral */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-[#1C1A18] mb-1">
                      Romeins Tag Nummer (I, II, III...)
                    </label>
                    <input
                      type="text"
                      value={slide.tag || ''}
                      onChange={(e) => handleSlideChange(idx, 'tag', e.target.value)}
                      className="w-24 px-3.5 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-xs font-mono font-bold text-[#1C1A18] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

