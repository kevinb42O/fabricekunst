import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Award, Maximize2, ChevronLeft, ChevronRight, 
  Bookmark, History, BookOpen, Share2, CheckCircle2, PhoneCall,
  ArrowRight, FileText
} from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';
import { useLanguage } from '../context/LanguageContext';
import { getItemField } from '../utils/translationService';

export default function ItemDetailPage({ item, onNavigateBack, onRequestInquiry, catalog = [], onOpenItemDetail }) {
  const { t, language } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [zoomModalData, setZoomModalData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedImageIndex(0);
  }, [item]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] pt-32 pb-24 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-[#B8860B] mx-auto opacity-50" />
          <h2 className="text-2xl font-serif font-bold text-[#111111]">Item Niet Gevonden</h2>
          <p className="text-sm font-serif text-[#666666]">
            Het opgevraagde antiquarische meesterwerk kon niet worden teruggevonden in de catalogus.
          </p>
          <button
            onClick={onNavigateBack}
            className="px-6 py-2.5 rounded-sm bg-[#1C1A17] text-[#FAF7F2] font-mono text-xs uppercase font-semibold hover:bg-[#B8860B] hover:text-[#111111] transition-colors cursor-pointer"
          >
            Terug naar Collectie
          </button>
        </div>
      </div>
    );
  }

  // Calculate Prev / Next Item for continuous catalog browsing
  const currentIndex = catalog.findIndex(i => i.id === item.id);
  const prevItem = currentIndex > 0 ? catalog[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : null;

  const currentImage = item.images?.[selectedImageIndex] || item.images?.[0] || { url: "/images/scarron-spines-white-bg.jpg", caption: "" };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#111111] pt-28 pb-24 selection:bg-[#B8860B]/20">
      
      {/* ------------------------------------------------------------- */}
      {/* BREADCRUMB & HEADER CONTROL STRIP                             */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8CEB8]/70 pb-4">
          
          {/* Back button & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.18em] text-[#111111] hover:text-[#B8860B] transition-colors group font-mono cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#B8860B] group-hover:-translate-x-1 transition-transform" />
              <span>{t('item_detail.backToCatalog')}</span>
            </button>
            <span className="text-[#D8CEB8] font-mono text-xs">/</span>
            <span className="text-xs font-mono text-[#B8860B] font-bold uppercase tracking-wider">
              {item.century}
            </span>
            <span className="text-[#D8CEB8] font-mono text-xs hidden sm:inline">/</span>
            <span className="text-xs font-mono text-[#666666] hidden sm:inline">
              {item.ref}
            </span>
          </div>

          {/* Action pills */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-3 py-1 rounded bg-[#1C1A17] text-white font-bold tracking-wider">
              {item.ref}
            </span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-[#D8CEB8] text-[#111111] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors cursor-pointer text-[11px]"
              title="Kopieer directe link naar dit meesterwerk"
            >
              <Share2 className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>{copiedLink ? t('item_detail.copied') : t('item_detail.shareWork')}</span>
            </button>
          </div>
        </div>
      </div>


      {/* ------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN UNBOXED GALLERY & DOSSIER LAYOUT              */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: PHOTOGRAPHY & CONTINUOUS EDITORIAL DOSSIER   */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Primary High-Res Gallery Frame */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl bg-white border border-[#D8CEB8] overflow-hidden group shadow-sm">
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || item.title}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: item.title })}
                />

                {/* Click to Zoom indicator */}
                <button
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: item.title })}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-all shadow-sm opacity-80 group-hover:opacity-100 cursor-pointer"
                  title="Bekijk in hoge resolutie"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                
                {/* Carousel Navigation Arrows */}
                {item.images && item.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Caption */}
                {currentImage.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-[#D8CEB8] p-3 text-xs text-[#333333] italic font-serif">
                    {currentImage.caption}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery Strip */}
              {item.images && item.images.length > 1 && (
                <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-24 h-20 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer ${
                        selectedImageIndex === idx ? 'border-[#B8860B] ring-2 ring-[#B8860B]/30 scale-105 shadow-sm' : 'border-[#D8CEB8] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* CONTINUOUS EDITORIAL DOSSIER (CLEAN, NO OVERLAPPING BARS) */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-14 text-[#111111]">
              
              {/* SECTION I: BESCHRIJVING */}
              <section className="space-y-3">
                <div className="flex items-center space-x-3 text-[#B8860B]">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="text-xl font-serif font-bold text-[#111111]">
                    Beschrijving &amp; Bibliografie
                  </h3>
                </div>
                <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-4">
                  <p className="text-lg text-[#222222] font-serif leading-relaxed">
                    {getItemField(item, 'description', language)}
                  </p>
                </div>
              </section>

              {/* SECTION II: HISTORISCHE CONTEXT */}
              <section className="space-y-3">
                <div className="flex items-center space-x-3 text-[#B8860B]">
                  <History className="w-5 h-5" />
                  <h3 className="text-xl font-serif font-bold text-[#111111]">
                    {item.itemType === 'painting' ? "Kunsthistorische & Stijlcontext" : "Historische & Literaire Context"}
                  </h3>
                </div>
                <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-4 text-base text-[#333333] font-serif leading-relaxed">
                  {(getItemField(item, 'historicalContext', language) || getItemField(item, 'description', language) || "Dit historische meesterwerk vertegenwoordigt een zeldzaam tijdsdocument uit de Europese kunstgeschiedenis.")
                    .split('\n\n')
                    .map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph}
                      </p>
                    ))}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#D8CEB8]/60 mt-6 font-sans">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                        {item.itemType === 'painting' ? "Techniek & Medium" : "Drukker / Uitgeverij"}
                      </span>
                      <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{item.publisher}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                        {item.itemType === 'painting' ? "Signatuur & Datering" : "Plaats van Druk"}
                      </span>
                      <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{item.city || "Europa"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">Jaar &amp; Eeuw</span>
                      <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{item.year} ({item.century})</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION III: FYSIEKE BANDANALYSE & CONDITIERAPPORT */}
              <section className="space-y-3">
                <div className="flex items-center space-x-3 text-[#B8860B]">
                  <Bookmark className="w-5 h-5" />
                  <h3 className="text-xl font-serif font-bold text-[#111111]">
                    {item.itemType === 'painting' ? "Staat van het Doek & Restaurationele Details" : "Bandstijl & Conditierapport"}
                  </h3>
                </div>
                
                <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
                    <div className="border-l-2 border-[#B8860B] pl-4 space-y-1">
                      <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                        {item.itemType === 'painting' ? "Lijst & Inlijsting" : "Boekband & Materialen"}
                      </span>
                      <p className="text-sm font-serif font-bold text-[#111111]">{getItemField(item, 'binding', language)}</p>
                    </div>
                    <div className="border-l-2 border-[#B8860B] pl-4 space-y-1">
                      <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">Staat van Conservering</span>
                      <p className="text-sm font-serif font-bold text-[#111111]">{getItemField(item, 'condition', language)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
                      {item.itemType === 'painting' ? "Doek-, Paneel- & Restauratie Rapport" : "Gedetailleerd Papier- & Bindwerk Rapport"}
                    </h4>
                    <div className="text-sm text-[#333333] font-serif leading-relaxed space-y-3">
                      {(getItemField(item, 'conditionReport', language) || getItemField(item, 'condition_report', language) || "Het exemplaar bevindt zich in uitstekende staat. Het werk is geanalyseerd en geconserveerd volgens de hoogste museumstroomstandaarden.")
                        .split('\n\n')
                        .map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                    </div>
                  </div>

                  <div className="pt-2 text-xs font-mono text-[#555555] border-t border-[#D8CEB8]/60 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#B8860B]" />
                    <span>
                      {item.itemType === 'painting' 
                        ? `Specificaties & Medium: ${getItemField(item, 'collationSpecs', language) || `${item.dimensions || '48 x 38 cm'}. Inclusief authentieke lijst.`}`
                        : `Collatie & Formaat: ${getItemField(item, 'collationSpecs', language) || `${item.dimensions || 'In-8°'}. Compleet met alle katernen.`}`}
                    </span>
                  </div>

                </div>
              </section>

              {/* SECTION IV: PROVENANCEDOSSIER */}
              <section className="space-y-3">
                <div className="flex items-center space-x-3 text-[#B8860B]">
                  <Award className="w-5 h-5" />
                  <h3 className="text-xl font-serif font-bold text-[#111111]">
                    Herkomst &amp; Provenance
                  </h3>
                </div>

                <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-6">
                  
                  {getItemField(item, 'provenance', language) && (
                    <div className="border-l-2 border-[#B8860B] pl-4 py-1 space-y-1">
                      <span className="text-[11px] font-mono font-bold text-[#B8860B] uppercase block">Geverifieerde Herkomst</span>
                      <p className="text-base font-serif italic text-[#111111] leading-relaxed">
                        "{getItemField(item, 'provenance', language)}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
                      Eigendomsarchief &amp; Ex-Libris Geverifieerd
                    </h4>
                    <div className="text-sm text-[#333333] font-serif leading-relaxed space-y-3">
                      {(getItemField(item, 'provenanceDetails', language) || getItemField(item, 'provenance_details', language) || "Afkomstig uit een vooraanstaande particuliere bibliotheek. Dit werk is door Atelier Rembrandt grondig geanalyseerd op herkomstsporen, eigendomsstempels en echtheid van de binding.")
                        .split('\n\n')
                        .map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                    </div>
                  </div>

                  {/* Formeel Echtheidscertificaat Info Card */}
                  <div className="p-5 rounded-xl bg-white border border-[#D8CEB8] space-y-1.5 shadow-2xs">
                    <div className="flex items-center space-x-2 text-[#B8860B] font-mono font-bold text-xs uppercase">
                      <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                      <span>Formeel Echtheidscertificaat Inbegrepen</span>
                    </div>
                    <p className="text-xs font-serif text-[#555555] leading-relaxed">
                      Bij aankoop van dit antiquarische werk ontvangt u een officieel provenance-dossier van Atelier Rembrandt met de complete bibliografische documentatie.
                    </p>
                  </div>

                </div>
              </section>

            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: STICKY TITEL, METADATA & CONSULTATIE CARD    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28 lg:self-start">
            
            {/* Header Titles */}
            <div className="space-y-3 border-b border-[#D8CEB8]/70 pb-6">
              <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] font-mono">
                <Award className="w-3.5 h-3.5" />
                <span>Atelier Rembrandt Topstuk</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#111111] tracking-tight leading-[1.12]">
                {getItemField(item, 'title', language)}
              </h1>

              <div className="text-sm font-serif italic text-[#555555] space-y-1">
                <p className="text-base font-bold text-[#111111] not-italic">
                  {item.itemType === 'painting' ? `Kunstenaar: ${item.author}` : `${item.author} (${item.year})`}
                </p>
                <p>
                  {item.itemType === 'painting' ? `Techniek: ${item.publisher}` : `Uitgever: ${item.publisher} (${item.city || "Europa"})`}
                </p>
              </div>

              {(getItemField(item, 'subtitle', language) || item.subtitle) && (
                <p className="text-xs font-serif text-[#666666] leading-relaxed border-l-2 border-[#B8860B] pl-3 italic pt-1">
                  {getItemField(item, 'subtitle', language) || item.subtitle}
                </p>
              )}
            </div>

            {/* Price & Status Display */}
            <div className="flex items-center justify-between border-b border-[#D8CEB8]/70 pb-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block">Taxatie / Prijs</span>
                <span className="text-3xl font-serif font-bold text-[#B8860B]">{item.price}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block mb-1">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border inline-block ${
                  item.status === 'Beschikbaar' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  item.status === 'Gereserveerd' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  'bg-stone-100 text-stone-700 border-stone-300'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* Quick Bibliographic Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs">
                <span className="text-[#666666] uppercase block text-[10px]">Formaat</span>
                <span className="font-bold text-[#111111] font-serif text-sm mt-0.5 block">{item.dimensions || "In-8°"}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs">
                <span className="text-[#666666] uppercase block text-[10px]">Eeuw</span>
                <span className="font-bold text-[#111111] font-serif text-sm mt-0.5 block">{item.century}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs col-span-2">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[#666666] uppercase text-[10px]">
                    {item.itemType === 'painting' ? "Lijst & Inlijsting" : "Boekband"}
                  </span>
                  <span className="text-[10px] text-[#B8860B] font-bold">{item.ref}</span>
                </div>
                <span className="font-bold text-[#111111] font-serif text-xs leading-snug block">{item.binding || "Origineel"}</span>
              </div>
            </div>

            {/* Primary Action Consultation Block */}
            <div className="p-6 rounded-2xl bg-[#1C1A17] text-[#FAF7F2] border-2 border-[#B8860B]/40 shadow-xl space-y-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[#B8860B] font-mono font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Exclusieve Privé Consultatie</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white">
                  Interesse in dit zeldzame werk?
                </h3>
                <p className="text-xs text-stone-300 font-serif leading-relaxed">
                  Neem rechtstreeks contact op met Atelier Rembrandt voor vrijblijvende informatie, aanvullende foto's of een besloten bezichtiging.
                </p>
              </div>

              <button
                onClick={() => onRequestInquiry(item)}
                disabled={item.status === 'Verkocht'}
                className={`w-full py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  item.status === 'Verkocht'
                    ? 'bg-[#333333] text-stone-500 cursor-not-allowed border border-stone-600'
                    : 'bg-[#B8860B] hover:bg-white text-[#111111] border border-[#B8860B]'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>{item.status === 'Verkocht' ? 'Verkocht (Archief)' : 'Aanvraag / Doe Een Bod'}</span>
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-2 border-t border-stone-800">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#B8860B]" />
                  <span>100% Echtheid</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#B8860B]" />
                  <span>Discreet Transport</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM-TO-ITEM PREVIOUS / NEXT FOOTER NAVIGATION                */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-20 pt-10 border-t-2 border-[#D8CEB8] space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono text-[#B8860B] font-bold uppercase tracking-[0.2em]">
              Catalogus Navigatie
            </span>
            <h3 className="text-xl font-serif font-bold text-[#111111]">
              Ontdek Meer Antiquarische Topstukken
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Previous Item Card */}
            {prevItem ? (
              <div 
                onClick={() => onOpenItemDetail ? onOpenItemDetail(prevItem) : window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group p-5 rounded-2xl bg-white border border-[#D8CEB8] hover:border-[#111111] transition-all flex items-center space-x-4 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#FAF7F2] border border-[#D8CEB8]">
                  <img src={prevItem.images[0]?.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase tracking-wider flex items-center space-x-1">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Vorig Topstuk</span>
                  </span>
                  <h4 className="text-sm font-serif font-bold text-[#111111] truncate group-hover:text-[#B8860B] transition-colors">
                    {prevItem.title}
                  </h4>
                  <p className="text-xs font-mono text-[#666666]">
                    {prevItem.century} • {prevItem.price}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-[#D8CEB8] flex items-center justify-center text-xs font-mono text-[#888888]">
                Start van de Catalogus
              </div>
            )}

            {/* Next Item Card */}
            {nextItem ? (
              <div 
                onClick={() => onOpenItemDetail ? onOpenItemDetail(nextItem) : window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group p-5 rounded-2xl bg-white border border-[#D8CEB8] hover:border-[#111111] transition-all flex items-center justify-between space-x-4 cursor-pointer shadow-sm hover:shadow-md text-right"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase tracking-wider flex items-center justify-end space-x-1">
                    <span>Volgend Topstuk</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-sm font-serif font-bold text-[#111111] truncate group-hover:text-[#B8860B] transition-colors">
                    {nextItem.title}
                  </h4>
                  <p className="text-xs font-mono text-[#666666]">
                    {nextItem.century} • {nextItem.price}
                  </p>
                </div>
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#FAF7F2] border border-[#D8CEB8]">
                  <img src={nextItem.images[0]?.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-[#D8CEB8] flex items-center justify-center text-xs font-mono text-[#888888]">
                Einde van de Catalogus
              </div>
            )}

          </div>

          <div className="text-center pt-2">
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest text-[#111111] hover:text-[#B8860B] transition-colors cursor-pointer border-b border-[#111111] pb-1 hover:border-[#B8860B]"
            >
              <span>Bekijk de volledige catalogus</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B8860B]" />
            </button>
          </div>
        </div>

      </div>

      {/* High-Res Image Lightbox Modal */}
      {zoomModalData && (
        <ImageZoomModal
          images={zoomModalData.images}
          initialIndex={zoomModalData.initialIndex}
          title={zoomModalData.title}
          onClose={() => setZoomModalData(null)}
        />
      )}

    </div>
  );
}
