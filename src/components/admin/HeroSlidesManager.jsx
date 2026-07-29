import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Save, RefreshCw, Check, Sparkles } from 'lucide-react';
import { uploadCatalogImage, DEFAULT_HERO_IMAGE } from '../../utils/storage';

export default function HeroSlidesManager({ 
  heroImage = '', 
  onSaveHeroImage = () => {}, 
  onSaveSlides = () => {},
  onShowToast = () => {} 
}) {
  const [imageUrl, setImageUrl] = useState(heroImage || DEFAULT_HERO_IMAGE);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const publicUrl = await uploadCatalogImage(file);
      if (publicUrl) {
        setImageUrl(publicUrl);
        onShowToast("Nieuwe Hero foto succesvol geüpload!");
      }
    } catch (err) {
      console.error("Fout bij uploaden hero foto:", err);
      onShowToast("Uploaden mislukt. Probeer een andere afbeelding.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetDefault = () => {
    if (window.confirm("Herstellen naar de standaard originele Hero-afbeelding?")) {
      setImageUrl(DEFAULT_HERO_IMAGE);
      if (onSaveHeroImage) onSaveHeroImage(DEFAULT_HERO_IMAGE);
      if (onSaveSlides) onSaveSlides(DEFAULT_HERO_IMAGE);
      onShowToast("Hero foto hersteld naar standaard.");
    }
  };

  const handleSave = () => {
    if (onSaveHeroImage) onSaveHeroImage(imageUrl);
    if (onSaveSlides) onSaveSlides(imageUrl);
    setIsSaved(true);
    onShowToast("Hero homepage foto succesvol opgeslagen!");
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 text-[#1C1A18] font-sans animate-fade-in">
      
      {/* Header Bar */}
      <div className="p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C5A059]/15 text-[#8E7035] text-xs font-semibold mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Homepage Hero Visual</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#1C1A18]">
            Hero Achtergrondafbeelding
          </h2>
          <p className="text-xs text-[#6E675E] mt-1 font-medium">
            Beheer de centrale, monumentale achtergrondfoto van de homepage hero.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetDefault}
            className="px-3.5 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-[#6E675E] hover:text-[#1C1A18] text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Herstel naar standaard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Herstel Standaard</span>
          </button>

          <button
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
              isSaved ? 'bg-emerald-700 text-white' : 'bg-[#C5A059] hover:bg-[#B38F48] text-[#1C1A18]'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Opgeslagen!' : 'Foto Opslaan'}</span>
          </button>
        </div>
      </div>

      {/* Main Single Hero Image Upload Card */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-[#EBE7DF] shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Live Preview Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#1C1A18]">
                Huidige Hero Achtergrondfoto
              </label>
              <span className="text-[11px] font-mono text-[#8C8478]">Minimalistische Enkele Foto</span>
            </div>

            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-stone-900 border border-[#EBE7DF] shadow-inner group">
              <img 
                src={imageUrl} 
                alt="Hero preview" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between text-xs font-mono">
                <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px]">
                  Live Hero Preview
                </span>
                <span className="bg-[#C5A059] text-[#1C1A18] font-bold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider">
                  Enkele Foto
                </span>
              </div>
            </div>
          </div>

          {/* Upload Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <h3 className="text-base font-serif font-bold text-[#1C1A18] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Selecteer een Nieuwe Hero Foto</span>
              </h3>
              <p className="text-xs text-[#6E675E] leading-relaxed">
                Upload een haarscherpe foto van hoge resolutie. Er is bewúst gekozen voor 1 enkele foto voor een strakke, galeriestijl uitstraling zonder drukke slideshows.
              </p>
            </div>

            {/* Drag/Click File Upload Box */}
            <label className="relative border-2 border-dashed border-[#C5A059]/40 hover:border-[#C5A059] bg-[#FDFBF7] hover:bg-[#F9F5EC] p-6 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group">
              <div className="w-12 h-12 rounded-full bg-[#C5A059]/15 flex items-center justify-center text-[#8E7035] group-hover:scale-110 transition-transform mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#1C1A18] block">
                {isUploading ? 'Afbeelding Uploaden...' : 'Klik of sleep een nieuwe foto hier'}
              </span>
              <span className="text-[11px] text-[#8C8478] mt-1 block">
                JPG, PNG of WebP (Aanbevolen: minstens 1920x1080px)
              </span>

              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={isUploading} 
                className="hidden" 
              />
            </label>

            {/* Direct URL input */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono font-bold uppercase text-[#6E675E]">
                Of voer direct een afbeelding URL in:
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/your-hero-photo.jpg"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#EBE7DF] text-xs font-mono text-[#1C1A18] focus:border-[#C5A059] focus:outline-none bg-[#FDFBF7]"
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
