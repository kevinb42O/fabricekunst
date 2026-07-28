import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, ShieldCheck, Maximize2, ChevronLeft, ChevronRight, Award, Bookmark, 
  ArrowRight, BookOpen, ScrollText, CheckCircle2, History, PhoneCall
} from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedCentury, getLocalizedCategory, getLocalizedPrice } from '../utils/translationService';

export default function ItemDetailModal({ item, onClose, onRequestInquiry }) {
  const { t, language } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


  const [zoomModalData, setZoomModalData] = useState(null);


  if (!item) return null;

  const currentImage = item.images?.[selectedImageIndex] || item.images?.[0] || { url: "/images/scarron-spines-white-bg.jpg", caption: "" };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      
      {/* Main Museum Dossier Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1.0, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl bg-[#FAF7F2] border border-[#D8CEB8] rounded-3xl shadow-strong overflow-hidden my-auto max-h-[94vh] flex flex-col text-[#111111]"
      >
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8CEB8] bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded bg-[#1C1A17] text-xs font-mono text-[#FAF7F2] font-bold tracking-wider">
              {item.ref}
            </span>
            <span className="text-xs text-[#B8860B] font-bold uppercase tracking-widest font-mono hidden sm:inline">
              {getLocalizedCentury(item.century, language)} • {getLocalizedCategory(item.category, language)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
              item.status === 'Beschikbaar' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
              item.status === 'Gereserveerd' ? 'bg-amber-50 text-amber-800 border-amber-300' :
              'bg-stone-100 text-stone-700 border-stone-300'
            }`}>
              {item.status}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#FAF7F2] hover:bg-[#111111] hover:text-white text-[#111111] transition-colors border border-[#D8CEB8] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-10 flex-grow">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: High-Res Photography */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl bg-white border border-[#D8CEB8] overflow-hidden group shadow-sm">
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || item.title}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: item.title })}
                />
                
                {/* Carousel Navigation */}
                {item.images && item.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Click to Zoom Pill */}
                <button
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: item.title })}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-all shadow-xs cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {currentImage.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-[#D8CEB8] p-3 text-xs text-[#333333] italic font-serif">
                    {currentImage.caption}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {item.images && item.images.length > 1 && (
                <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-16 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                        selectedImageIndex === idx ? 'border-[#B8860B] ring-2 ring-[#B8860B]/30 scale-105' : 'border-[#D8CEB8] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Titles, Price, Specs & Consultation Action */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="space-y-2 border-b border-[#D8CEB8]/70 pb-4">
                <span className="text-xs font-mono font-bold text-[#B8860B] uppercase tracking-wider flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Antiquariaat Topstuk</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] leading-tight">
                  {getItemField(item, 'title', language)}
                </h2>
                <p className="text-sm font-serif italic text-[#555555]">
                  {item.author} ({item.year}) • {item.publisher}
                </p>
              </div>

              <div className="flex items-center justify-between border-b border-[#D8CEB8]/70 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block">Taxatie / Prijs</span>
                  <span className="text-2xl font-serif font-bold text-[#B8860B]">{getLocalizedPrice(item.price, language)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block mb-1">Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border inline-block ${
                    item.status === 'Beschikbaar' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    item.status === 'Gereserveerd' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                    'bg-stone-100 text-stone-700 border-stone-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-white border border-[#D8CEB8]">
                  <span className="text-[#666666] uppercase block text-[10px]">Formaat</span>
                  <span className="font-bold text-[#111111] font-serif text-xs mt-0.5 block">{item.dimensions || "In-8°"}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#D8CEB8]">
                  <span className="text-[#666666] uppercase block text-[10px]">Eeuw</span>
                  <span className="font-bold text-[#111111] font-serif text-xs mt-0.5 block">{getLocalizedCentury(item.century, language)}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#D8CEB8] col-span-2">
                  <span className="text-[#666666] uppercase block text-[10px]">Boekband</span>
                  <span className="font-bold text-[#111111] font-serif text-xs leading-snug block mt-0.5">{item.binding || "Kalfsleer"}</span>
                </div>
              </div>

              {/* Consultation Action Box */}
              <div className="p-5 rounded-2xl bg-[#1C1A17] text-[#FAF7F2] border border-[#B8860B]/40 space-y-3">
                <div className="space-y-1">
                  <span className="text-[#B8860B] font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Privé Consultatie</span>
                  </span>
                  <h4 className="text-base font-serif font-bold text-white">
                    Vrijblijvende Aanvraag
                  </h4>
                  <p className="text-xs text-stone-300 font-serif leading-relaxed">
                    Neem rechtstreeks contact op met Atelier Rembrandt voor bezichtiging of hoog-resolutie documentatie.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onRequestInquiry(item);
                  }}
                  disabled={item.status === 'Verkocht'}
                  className={`w-full py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    item.status === 'Verkocht'
                      ? 'bg-[#333333] text-stone-500 cursor-not-allowed border border-stone-600'
                      : 'bg-[#B8860B] hover:bg-white text-[#111111] border border-[#B8860B]'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{item.status === 'Verkocht' ? 'Verkocht (Archief)' : 'Aanvraag / Doe Een Bod'}</span>
                </button>
              </div>

            </div>

          </div>

          {/* --------------------------------------------------------- */}
          {/* CONTINUOUS EDITORIAL DOSSIER SECTIONS                      */}
          {/* --------------------------------------------------------- */}
          <div className="border-t border-[#D8CEB8] pt-8 space-y-10 text-[#111111]">
            
            {/* SECTION I */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-[#B8860B]">
                <BookOpen className="w-4 h-4" />
                <h3 className="text-[#111111] font-serif font-bold text-lg">
                  Beschrijving &amp; Bibliografie
                </h3>
              </div>
              <p className="text-base text-[#222222] font-serif leading-relaxed border-t border-[#D8CEB8]/70 pt-3">
                {item.description}
              </p>
            </section>

            {/* SECTION II */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-[#B8860B]">
                <History className="w-4 h-4" />
                <h3 className="text-[#111111] font-serif font-bold text-lg">
                  Historische &amp; Literaire Context
                </h3>
              </div>
              <div className="text-sm text-[#333333] font-serif leading-relaxed border-t border-[#D8CEB8]/70 pt-3 space-y-3">
                {(item.historicalContext || item.description || "Dit historische werk vertegenwoordigt een zeldzaam tijdsdocument uit de Europese antiquarische literatuurgeschiedenis.")
                  .split('\n\n')
                  .map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
              </div>
            </section>

            {/* SECTION III */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-[#B8860B]">
                <Bookmark className="w-4 h-4" />
                <h3 className="text-[#111111] font-serif font-bold text-lg">
                  Bandanalyse &amp; Conditie
                </h3>
              </div>
              <div className="text-sm text-[#333333] font-serif leading-relaxed border-t border-[#D8CEB8]/70 pt-3 space-y-3">
                <p><strong>Boekband:</strong> {item.binding}</p>
                <p><strong>Staat van conservering:</strong> {item.condition}</p>
                <div className="space-y-2 pt-2">
                  {(item.conditionReport || "Het exemplaar bevindt zich in uitstekende antiquarische staat. Het papier vertoont de authentieke frisse kenmerken van 18e/19e-eeuws scheppapier met ruime marges.")
                    .split('\n\n')
                    .map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                </div>
              </div>
            </section>

            {/* SECTION IV */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-[#B8860B]">
                <Award className="w-4 h-4" />
                <h3 className="text-[#111111] font-serif font-bold text-lg">
                  Herkomst &amp; Provenance
                </h3>
              </div>
              <div className="text-sm text-[#333333] font-serif leading-relaxed border-t border-[#D8CEB8]/70 pt-3 space-y-3">
                {item.provenance && (
                  <p className="italic font-serif text-[#111111] border-l-2 border-[#B8860B] pl-3 py-0.5">
                    "{item.provenance}"
                  </p>
                )}
                <div>
                  {(item.provenanceDetails || "Afkomstig uit een vooraanstaande particuliere bibliotheek. Dit werk is door Atelier Rembrandt grondig geanalyseerd op herkomstsporen.")
                    .split('\n\n')
                    .map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                </div>

                {/* Formeel Echtheidscertificaat Info Card */}
                <div className="p-4 rounded-xl bg-white border border-[#D8CEB8] space-y-1 mt-4 shadow-2xs">
                  <div className="flex items-center space-x-2 text-[#B8860B] font-mono font-bold text-xs uppercase">
                    <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                    <span>Formeel Echtheidscertificaat Inbegrepen</span>
                  </div>
                  <p className="text-xs font-serif text-[#555555] leading-relaxed">
                    Bij aankoop van dit werk ontvangt u een officieel provenance-dossier van Atelier Rembrandt met de complete documentatie.
                  </p>
                </div>
              </div>
            </section>

          </div>

        </div>

      </motion.div>

      {/* Lightbox Modal */}
      {zoomModalData && (
        <ImageZoomModal
          images={zoomModalData.images}
          initialIndex={zoomModalData.initialIndex}
          title={zoomModalData.title}
          onClose={() => setZoomModalData(null)}
        />
      )}

    </motion.div>
  );
}
