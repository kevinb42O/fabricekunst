import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Award, Maximize2, ChevronLeft, ChevronRight, 
  Bookmark, History, BookOpen, Share2, CheckCircle2, PhoneCall,
  ArrowRight, FileText
} from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedStatus, getLocalizedPrice, getLocalizedCentury, getLocalizedCategory } from '../utils/translationService';

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
      <div className="min-h-screen bg-white pt-32 pb-24 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-[#B8860B] mx-auto opacity-50" />
          <h2 className="text-2xl font-serif font-bold text-[#111111]">{t('item_detail.notFoundTitle')}</h2>
          <p className="text-sm font-serif text-[#666666]">
            {t('item_detail.notFoundDesc')}
          </p>
          <button
            onClick={onNavigateBack}
            className="px-6 py-2.5 rounded-sm bg-[#1C1A17] text-white font-mono text-xs uppercase font-semibold hover:bg-[#B8860B] hover:text-[#111111] transition-colors cursor-pointer"
          >
            {t('item_detail.backToCatalog')}
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
    <div className="bg-white min-h-screen text-[#111111] pt-22 sm:pt-28 pb-16 sm:pb-24 selection:bg-[#B8860B]/20">
      
      {/* ------------------------------------------------------------- */}
      {/* BREADCRUMB & HEADER CONTROL STRIP                             */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8CEB8]/70 pb-4">
          
          {/* Back button & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.18em] text-[#111111] hover:text-[#B8860B] transition-colors group font-mono cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-[#B8860B] group-hover:-translate-x-1 transition-transform" />
              <span>{t('item_detail.backToCatalog')}</span>
            </button>
            <span className="text-[#D8CEB8] font-mono text-xs">/</span>
            <span className="text-xs font-mono text-[#B8860B] font-bold uppercase tracking-wider">
              {getLocalizedCentury(item.century, language)}
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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D8CEB8] text-[#111111] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors cursor-pointer text-[11px] min-h-[36px]"
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
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: PHOTOGRAPHY & CONTINUOUS EDITORIAL DOSSIER   */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-12 order-2 lg:order-1">
            
            {/* Primary High-Res Gallery Frame */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-xl sm:rounded-2xl bg-white border border-[#D8CEB8] overflow-hidden group shadow-sm">
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || getItemField(item, 'title', language)}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: getItemField(item, 'title', language) })}
                />

                {/* Click to Zoom indicator */}
                <button
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: getItemField(item, 'title', language) })}
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


              </div>

              {/* Thumbnail Gallery Strip */}
              {item.images && item.images.length > 1 && (
                <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto mobile-scroll-x pb-2 snap-x snap-mandatory">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-18 h-14 sm:w-24 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer snap-start ${
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
            <div className="space-y-10 sm:space-y-14 text-[#111111]">
              
              {/* SECTION I: BESCHRIJVING */}
              {getItemField(item, 'description', language) && (
                <section className="space-y-3">
                  <div className="flex items-center space-x-3 text-[#B8860B]">
                    <BookOpen className="w-5 h-5" />
                    <h3 className="text-xl font-serif font-bold text-[#111111]">
                      {t('item_detail.descriptionBiblio')}
                    </h3>
                  </div>
                  <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-4">
                    <p className="text-lg text-[#222222] font-serif leading-relaxed">
                      {getItemField(item, 'description', language)}
                    </p>
                  </div>
                </section>
              )}

              {/* SECTION II: HISTORISCHE CONTEXT */}
              {getItemField(item, 'historicalContext', language) && (
                <section className="space-y-3">
                  <div className="flex items-center space-x-3 text-[#B8860B]">
                    <History className="w-5 h-5" />
                    <h3 className="text-xl font-serif font-bold text-[#111111]">
                      {item.itemType === 'painting' ? t('item_detail.artHistoricalContext') : t('item_detail.historicalContext')}
                    </h3>
                  </div>
                  <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-4 text-base text-[#333333] font-serif leading-relaxed">
                    {getItemField(item, 'historicalContext', language)
                      .split('\n\n')
                      .map((paragraph, pIdx) => (
                        <p key={pIdx}>
                          {paragraph}
                        </p>
                      ))}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-[#D8CEB8]/60 mt-4 sm:mt-6 font-sans">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                          {item.itemType === 'painting' ? t('item_detail.techniqueMedium') : t('item_detail.printerPublisher')}
                        </span>
                        <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{item.publisher}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                          {item.itemType === 'painting' ? t('item_detail.signatureDate') : t('item_detail.placeOfPrint')}
                        </span>
                        <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{item.city || "Europa"}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">{t('item_detail.yearCentury')}</span>
                        <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{item.year} ({getLocalizedCentury(item.century, language)})</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION III: FYSIEKE BANDANALYSE & CONDITIERAPPORT */}
              {(getItemField(item, 'binding', language) || getItemField(item, 'condition', language) || getItemField(item, 'conditionReport', language)) && (
                <section className="space-y-3">
                  <div className="flex items-center space-x-3 text-[#B8860B]">
                    <Bookmark className="w-5 h-5" />
                    <h3 className="text-xl font-serif font-bold text-[#111111]">
                      {item.itemType === 'painting' ? t('item_detail.canvasConditionReport') : t('item_detail.bindingConditionReport')}
                    </h3>
                  </div>
                  
                  <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 font-sans">
                      {getItemField(item, 'binding', language) && (
                        <div className="border-l-2 border-[#B8860B] pl-4 space-y-1">
                          <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                            {item.itemType === 'painting' ? t('item_detail.frameBinding') : t('item_detail.bindingMaterials')}
                          </span>
                          <p className="text-sm font-serif font-bold text-[#111111]">{getItemField(item, 'binding', language)}</p>
                        </div>
                      )}
                      {getItemField(item, 'condition', language) && (
                        <div className="border-l-2 border-[#B8860B] pl-4 space-y-1">
                          <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">{t('item_detail.conservationState')}</span>
                          <p className="text-sm font-serif font-bold text-[#111111]">{getItemField(item, 'condition', language)}</p>
                        </div>
                      )}
                    </div>

                    {getItemField(item, 'conditionReport', language) && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
                          {item.itemType === 'painting' ? t('item_detail.canvasRestorationReport') : t('item_detail.detailedPaperReport')}
                        </h4>
                        <div className="text-sm text-[#333333] font-serif leading-relaxed space-y-3">
                          {getItemField(item, 'conditionReport', language)
                            .split('\n\n')
                            .map((paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ))}
                        </div>
                      </div>
                    )}

                    {getItemField(item, 'collationSpecs', language) && (
                      <div className="pt-2 text-xs font-mono text-[#555555] border-t border-[#D8CEB8]/60 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-[#B8860B]" />
                        <span>
                          {item.itemType === 'painting' 
                            ? `${t('item_detail.specsMedium')}: ${getItemField(item, 'collationSpecs', language)}`
                            : `${t('item_detail.collationFormat')}: ${getItemField(item, 'collationSpecs', language)}`}
                        </span>
                      </div>
                    )}

                  </div>
                </section>
              )}

              {/* SECTION IV: PROVENANCEDOSSIER */}
              {(getItemField(item, 'provenance', language) || getItemField(item, 'provenanceDetails', language)) && (
                <section className="space-y-3">
                  <div className="flex items-center space-x-3 text-[#B8860B]">
                    <Award className="w-5 h-5" />
                    <h3 className="text-xl font-serif font-bold text-[#111111]">
                      {t('item_detail.provenanceTitle')}
                    </h3>
                  </div>

                  <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-6">
                    
                    {getItemField(item, 'provenance', language) && (
                      <div className="border-l-2 border-[#B8860B] pl-4 py-1 space-y-1">
                        <span className="text-[11px] font-mono font-bold text-[#B8860B] uppercase block">{t('item_detail.verifiedProvenance')}</span>
                        <p className="text-base font-serif italic text-[#111111] leading-relaxed">
                          "{getItemField(item, 'provenance', language)}"
                        </p>
                      </div>
                    )}

                    {getItemField(item, 'provenanceDetails', language) && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
                          {t('item_detail.ownershipArchive')}
                        </h4>
                        <div className="text-sm text-[#333333] font-serif leading-relaxed space-y-3">
                          {getItemField(item, 'provenanceDetails', language)
                            .split('\n\n')
                            .map((paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Formeel Echtheidscertificaat Info Card */}
                    <div className="p-5 rounded-xl bg-white border border-[#D8CEB8] space-y-1.5 shadow-2xs">
                      <div className="flex items-center space-x-2 text-[#B8860B] font-mono font-bold text-xs uppercase">
                        <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                        <span>{t('item_detail.certificateIncluded')}</span>
                      </div>
                      <p className="text-xs font-serif text-[#555555] leading-relaxed">
                        {t('item_detail.certificateDesc')}
                      </p>
                    </div>

                  </div>
                </section>
              )}

            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: STICKY TITEL, METADATA & CONSULTATIE CARD    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-8 lg:sticky lg:top-28 lg:self-start order-1 lg:order-2">
            
            {/* Header Titles */}
            <div className="space-y-3 border-b border-[#D8CEB8]/70 pb-6">
              <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] font-mono">
                <Award className="w-3.5 h-3.5" />
                <span>{t('item_detail.topstukBadge')}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-[#111111] tracking-tight leading-[1.12]">
                {getItemField(item, 'title', language)}
              </h1>

              <div className="text-sm font-serif italic text-[#555555] space-y-1">
                <p className="text-base font-bold text-[#111111] not-italic">
                  {item.itemType === 'painting' ? `${t('item_detail.artist')}: ${item.author}` : `${item.author} (${item.year})`}
                </p>
                <p>
                  {item.itemType === 'painting' ? `${t('item_detail.technique')}: ${item.publisher}` : `${t('item_detail.publisherTechnique')}: ${item.publisher} (${item.city || "Europa"})`}
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
                <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block">{t('item_detail.valuationPrice')}</span>
                <span className="text-3xl font-serif font-bold text-[#B8860B]">{getLocalizedPrice(item.price, language)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block mb-1">{t('item_detail.status')}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border inline-block ${
                  item.status === 'Beschikbaar' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  item.status === 'Gereserveerd' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  'bg-stone-100 text-stone-700 border-stone-300'
                }`}>
                  {getLocalizedStatus(item.status, language)}
                </span>
              </div>
            </div>

            {/* Quick Bibliographic Specs Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs">
                <span className="text-[#666666] uppercase block text-[10px]">{t('item_detail.format')}</span>
                <span className="font-bold text-[#111111] font-serif text-sm mt-0.5 block">{item.dimensions || "In-8°"}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs">
                <span className="text-[#666666] uppercase block text-[10px]">{t('item_detail.century')}</span>
                <span className="font-bold text-[#111111] font-serif text-sm mt-0.5 block">{getLocalizedCentury(item.century, language)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs col-span-2">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[#666666] uppercase text-[10px]">
                    {item.itemType === 'painting' ? t('item_detail.frameBinding') : t('item_detail.binding')}
                  </span>
                  <span className="text-[10px] text-[#B8860B] font-bold">{item.ref}</span>
                </div>
                <span className="font-bold text-[#111111] font-serif text-xs leading-snug block">{getItemField(item, 'binding', language) || item.binding || "Origineel"}</span>
              </div>
            </div>

            {/* Primary Action Consultation Block */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#1C1A17] text-[#FAF7F2] border-2 border-[#B8860B]/40 shadow-xl space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#B8860B] font-mono font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('item_detail.directAvailable')}</span>
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-white">
                  {t('item_detail.addToCollection')}
                </h3>
                <p className="text-xs text-stone-300 font-serif leading-relaxed">
                  {t('item_detail.inquiryContactText')}
                </p>
              </div>

              <button
                onClick={() => onRequestInquiry(item)}
                disabled={item.status === 'Verkocht'}
                className={`w-full py-3.5 sm:py-4 rounded-lg sm:rounded-xl text-xs font-mono font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[48px] ${
                  item.status === 'Verkocht'
                    ? 'bg-[#333333] text-stone-500 cursor-not-allowed border border-stone-600'
                    : 'bg-[#B8860B] hover:bg-white text-[#111111] border border-[#B8860B]'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>{item.status === 'Verkocht' ? t('item_detail.soldArchive') : t('item_detail.requestPurchaseBtn')}</span>
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-2 border-t border-stone-800">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#B8860B]" />
                  <span>{t('item_detail.officialCert')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#B8860B]" />
                  <span>{t('item_detail.insuredCourier')}</span>
                </div>
              </div>
            </div>

            {/* Buyer Process Card: How Purchasing Works */}
            <div className="p-5 rounded-2xl bg-white border border-[#D8CEB8] space-y-3 shadow-xs">
              <h4 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider border-b border-[#D8CEB8]/60 pb-2">
                {t('item_detail.howPurchaseWorks')}
              </h4>
              
              <div className="space-y-2.5 text-xs font-serif text-[#444444]">
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#B8860B] text-[#B8860B] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <p><strong className="text-[#111111]">{t('item_detail.step1Title')}</strong> {t('item_detail.step1Desc')}</p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#B8860B] text-[#B8860B] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <p><strong className="text-[#111111]">{t('item_detail.step2Title')}</strong> {t('item_detail.step2Desc')}</p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#B8860B] text-[#B8860B] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <p><strong className="text-[#111111]">{t('item_detail.step3Title')}</strong> {t('item_detail.step3Desc')}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM-TO-ITEM PREVIOUS / NEXT FOOTER NAVIGATION                */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-12 sm:mt-20 pt-6 sm:pt-10 border-t-2 border-[#D8CEB8] space-y-4 sm:space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono text-[#B8860B] font-bold uppercase tracking-[0.2em]">
              {t('item_detail.catalogNav')}
            </span>
            <h3 className="text-xl font-serif font-bold text-[#111111]">
              {t('item_detail.discoverMore')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
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
                    <span>{t('item_detail.prevTopstuk')}</span>
                  </span>
                  <h4 className="text-sm font-serif font-bold text-[#111111] truncate group-hover:text-[#B8860B] transition-colors">
                    {getItemField(prevItem, 'title', language)}
                  </h4>
                  <p className="text-xs font-mono text-[#666666]">
                    {getLocalizedCentury(prevItem.century, language)} • {getLocalizedPrice(prevItem.price, language)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-[#D8CEB8] flex items-center justify-center text-xs font-mono text-[#888888]">
                {t('item_detail.startCatalog')}
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
                    <span>{t('item_detail.nextTopstuk')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-sm font-serif font-bold text-[#111111] truncate group-hover:text-[#B8860B] transition-colors">
                    {getItemField(nextItem, 'title', language)}
                  </h4>
                  <p className="text-xs font-mono text-[#666666]">
                    {getLocalizedCentury(nextItem.century, language)} • {getLocalizedPrice(nextItem.price, language)}
                  </p>
                </div>
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#FAF7F2] border border-[#D8CEB8]">
                  <img src={nextItem.images[0]?.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-[#D8CEB8] flex items-center justify-center text-xs font-mono text-[#888888]">
                {t('item_detail.endCatalog')}
              </div>
            )}

          </div>

          <div className="text-center pt-2">
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest text-[#111111] hover:text-[#B8860B] transition-colors cursor-pointer border-b border-[#111111] pb-1 hover:border-[#B8860B]"
            >
              <span>{t('item_detail.viewFullCatalog')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B8860B]" />
            </button>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE STICKY THUMB-ZONE ACTION BAR (MOBILE UX BEST PRACTICE)  */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#D8CEB8] p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] z-40 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-mono text-[#8E7035] font-bold uppercase tracking-wider block">{item.ref}</span>
          <span className="text-base font-serif font-bold text-[#111111] block leading-tight truncate">
            {getLocalizedPrice(item.price, language)}
          </span>
        </div>

        <button
          onClick={() => onRequestInquiry && onRequestInquiry(item)}
          className="px-5 py-3 rounded-md bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-serif text-xs font-semibold uppercase tracking-[0.14em] shadow-md transition-all duration-300 flex items-center space-x-2 shrink-0 cursor-pointer min-h-[44px]"
        >
          <span>{t('item_detail.inquireAction') || 'Aanvragen'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
        </button>
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
