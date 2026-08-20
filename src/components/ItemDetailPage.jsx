import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Award, Maximize2, ChevronLeft, ChevronRight, 
  Bookmark, History, BookOpen, Share2,
  ArrowRight, FileText
} from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';
import ComparableSalesSection from './ComparableSalesSection';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedItemDetailLabels } from '../data/catalogTaxonomy';
import { getItemField, getLocalizedStatus, getLocalizedPrice, getLocalizedCentury, getLocalizedCategory } from '../utils/translationService';
import { getArtworkImageTransitionName, getArtworkTitleTransitionName } from '../utils/viewTransitions';
import { getImagePresentation, rememberImagePresentation } from '../utils/imagePresentation';
import { trackItemViewed } from '../hooks/useAnalytics';
import PriceAssurance from './PriceAssurance';
import ArtworkContactActions from './ArtworkContactActions';

export default function ItemDetailPage({ item, onNavigateBack, onRequestInquiry, catalog = [], onOpenItemDetail }) {
  const { t, language } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [zoomModalData, setZoomModalData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const currentImage = item?.images?.[selectedImageIndex] || item?.images?.[0] || { url: "/images/scarron-spines-white-bg.jpg", caption: "" };
  const [imagePresentation, setImagePresentation] = useState(() => getImagePresentation(currentImage.url));
  const stageHeightLimit = imagePresentation.orientation === 'portrait' ? 82 : imagePresentation.orientation === 'square' ? 78 : 72;
  const imageStageStyle = {
    '--detail-image-ratio': imagePresentation.ratio,
    '--detail-stage-width-cap': `${imagePresentation.ratio * stageHeightLimit}svh`,
  };


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedImageIndex(0);
  }, [item]);

  useEffect(() => {
    setImagePresentation(getImagePresentation(currentImage.url));
  }, [currentImage.url]);

  useEffect(() => {
    if (item?.id) trackItemViewed(item, 'item_detail');
  }, [item?.id]);

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

  const detailLabels = getLocalizedItemDetailLabels(item.itemType, language);
  const localizedPublisher = getItemField(item, 'publisher', language);
  const localizedCity = getItemField(item, 'city', language);
  const localizedDimensions = getItemField(item, 'dimensions', language);

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

  const handleInquiryClick = () => {
    onRequestInquiry?.(item);
  };

  return (
    <div className="item-detail-page bg-white min-h-screen text-[#111111] pt-28 pb-16 sm:pb-24 selection:bg-[#B8860B]/20">
      
      {/* ------------------------------------------------------------- */}
      {/* BREADCRUMB & HEADER CONTROL STRIP                             */}
      {/* ------------------------------------------------------------- */}
      <div className="page-shell-detail mb-4 sm:mb-8">
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
          </div>

          {/* Action pills */}
          <div className="flex items-center space-x-3 text-xs font-mono">
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
      <div className="page-shell-detail">
        <h1 className="sr-only">{getItemField(item, 'title', language)}</h1>
        
        <div className="detail-hero-grid grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: PHOTOGRAPHY & CONTINUOUS EDITORIAL DOSSIER   */}
          {/* ========================================================= */}
          <div className="detail-media-column lg:col-span-7 space-y-8 sm:space-y-12 order-2 lg:order-1">
            
            {/* Primary High-Res Gallery Frame */}
            <div className="space-y-4">
              <div
                className={`detail-image-stage detail-image-stage--${imagePresentation.orientation} relative rounded-lg bg-[#F4F1EB] border border-[#D8CEB8]/80 overflow-hidden group shadow-sm`}
                style={imageStageStyle}
              >
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || getItemField(item, 'title', language)}
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                  draggable="false"
                  onLoad={(event) => setImagePresentation(rememberImagePresentation(currentImage.url, event.currentTarget))}
                  style={{ viewTransitionName: selectedImageIndex === 0 ? getArtworkImageTransitionName(item.id) : 'none' }}
                  className="w-full h-full object-contain cursor-zoom-in transition-transform duration-700 group-hover:scale-[1.015]"
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: getItemField(item, 'title', language) })}
                />

                {/* Click to Zoom indicator */}
                <button
                  onClick={() => setZoomModalData({ images: item.images, initialIndex: selectedImageIndex, title: getItemField(item, 'title', language) })}
                  aria-label={t('item_detail.zoomImage') || 'Vergroot afbeelding'}
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
                      aria-label={t('item_detail.previousImage') || 'Vorige afbeelding'}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      aria-label={t('item_detail.nextImage') || 'Volgende afbeelding'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-[#111111] hover:text-[#B8860B] border border-[#D8CEB8] transition-colors shadow-md cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}


              </div>

              {currentImage.caption && (
                <p className="font-serif text-sm italic leading-relaxed text-[#655B50]">
                  {currentImage.caption}
                </p>
              )}

              {/* Thumbnail Gallery Strip */}
              {item.images && item.images.length > 1 && (
                <div className="detail-thumbnail-rail flex items-center space-x-2 sm:space-x-3 overflow-x-auto mobile-scroll-x pb-2 snap-x snap-mandatory">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`${t('item_detail.image') || 'Afbeelding'} ${idx + 1}: ${img.caption || getItemField(item, 'title', language)}`}
                      aria-current={selectedImageIndex === idx ? 'true' : undefined}
                      className={`relative w-18 h-14 sm:w-24 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer snap-start ${
                        selectedImageIndex === idx ? 'border-[#B8860B] ring-2 ring-[#B8860B]/30 opacity-100 shadow-sm' : 'border-[#D8CEB8] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* CONTINUOUS EDITORIAL DOSSIER (CLEAN, NO OVERLAPPING BARS) */}
            {/* --------------------------------------------------------- */}
            <div className="detail-dossier-copy max-w-4xl space-y-10 sm:space-y-14 text-[#111111]">
              
              {/* SECTION I: BESCHRIJVING */}
              {getItemField(item, 'description', language) && (
                <section className="detail-dossier-section space-y-3">
                  <div className="flex items-center space-x-3 text-[#B8860B]">
                    {item.itemType === 'book'
                      ? <BookOpen className="w-5 h-5" />
                      : <FileText className="w-5 h-5" />}
                    <h3 className="text-xl font-serif font-bold text-[#111111]">
                      {detailLabels.descriptionSection}
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
                <section className="detail-dossier-section space-y-3">
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
                          {detailLabels.publisher}
                        </span>
                        <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{localizedPublisher || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                          {detailLabels.city}
                        </span>
                        <span className="text-sm font-serif font-bold text-[#111111] mt-1 block">{localizedCity || '—'}</span>
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
                <section className="detail-dossier-section space-y-3">
                  <div className="flex items-center space-x-3 text-[#B8860B]">
                    <Bookmark className="w-5 h-5" />
                    <h3 className="text-xl font-serif font-bold text-[#111111]">
                      {detailLabels.physicalSection}
                    </h3>
                  </div>
                  
                  <div className="border-t border-[#D8CEB8]/70 pt-4 space-y-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 font-sans">
                      {getItemField(item, 'binding', language) && (
                        <div className="border-l-2 border-[#B8860B] pl-4 space-y-1">
                          <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block">
                            {detailLabels.binding}
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
                          {detailLabels.conditionReport}
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
                          {detailLabels.specifications}: {getItemField(item, 'collationSpecs', language)}
                        </span>
                      </div>
                    )}

                  </div>
                </section>
              )}

              {/* SECTION IV: PROVENANCEDOSSIER */}
              {(getItemField(item, 'provenance', language) || getItemField(item, 'provenanceDetails', language)) && (
                <section className="detail-dossier-section space-y-3">
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
                        <p className="text-base font-serif text-[#111111] leading-relaxed">
                          {getItemField(item, 'provenance', language)}
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

              <ComparableSalesSection sales={item.comparableSales} />

            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: STICKY TITEL, METADATA & CONSULTATIE CARD    */}
          {/* ========================================================= */}
          <div className="detail-summary-column lg:col-span-5 space-y-5 sm:space-y-8 lg:sticky lg:top-28 lg:self-start order-1 lg:order-2">
            
            {/* Header Titles */}
            <div className="detail-summary-heading space-y-3 border-b border-[#D8CEB8]/70 pb-6">
              <h2
                style={{ viewTransitionName: getArtworkTitleTransitionName(item.id) }}
                className="display-detail-wide text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-[#111111] tracking-tight leading-[1.12]"
              >
                {getItemField(item, 'title', language)}
              </h2>

              <div className="text-sm font-serif italic text-[#555555] space-y-1">
                <p className="text-base font-bold text-[#111111] not-italic">
                  {detailLabels.maker}: {item.author}
                </p>
                <p>
                  {detailLabels.publisher}: {localizedPublisher || '—'}{localizedCity ? ` (${localizedCity})` : ''}
                </p>
              </div>

            </div>

            {/* Price & Status Display */}
            <div className="detail-summary-price flex items-center justify-between border-b border-[#D8CEB8]/70 pb-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block">{t('item_detail.valuationPrice')}</span>
                <span className="text-3xl font-serif font-bold text-[#B8860B]">{getLocalizedPrice(item.price, language)}</span>
                <PriceAssurance showDuties className="max-w-md" />
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
            <div className="detail-summary-specs grid grid-cols-2 gap-2 sm:gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs">
                <span className="text-[#666666] uppercase block text-[10px]">{t('item_detail.format')}</span>
                <span className="font-bold text-[#111111] font-serif text-sm mt-0.5 block">{localizedDimensions || '—'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D8CEB8]/80 shadow-2xs">
                <span className="text-[#666666] uppercase block text-[10px]">{t('item_detail.century')}</span>
                <span className="font-bold text-[#111111] font-serif text-sm mt-0.5 block">{getLocalizedCentury(item.century, language)}</span>
              </div>
            </div>

            {/* Primary Action Consultation Block */}
            <div className="detail-summary-action border-y border-[#D8CEB8] py-5 sm:py-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-serif font-bold text-[#111111]">
                  {t('commerce.askArtwork')}
                </h3>
                <p className="text-sm text-[#555555] font-serif leading-relaxed">
                  {t('commerce.askArtworkDesc')}
                </p>
              </div>

              <ArtworkContactActions item={item} onPurchase={handleInquiryClick} />

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
                onClick={() => onOpenItemDetail ? onOpenItemDetail(prevItem, 'item_detail_previous') : window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group p-5 rounded-2xl bg-white border border-[#D8CEB8] hover:border-[#111111] transition-all flex items-center space-x-4 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#FAF7F2] border border-[#D8CEB8]">
                  <img src={prevItem.images[0]?.url} alt="" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                onClick={() => onOpenItemDetail ? onOpenItemDetail(nextItem, 'item_detail_next') : window.scrollTo({ top: 0, behavior: 'smooth' })}
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
                  <img src={nextItem.images[0]?.url} alt="" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
          <span className="mt-0.5 block truncate font-sans text-[7px] font-bold uppercase tracking-[0.08em] text-[#6A6056]">{t('commerce.shippingIncluded')}</span>
        </div>

        <button
          onClick={handleInquiryClick}
          className="px-5 py-3 rounded-md bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-serif text-xs font-semibold uppercase tracking-[0.14em] shadow-md transition-all duration-300 flex items-center space-x-2 shrink-0 cursor-pointer min-h-[44px]"
        >
          <span>{t('commerce.purchase')}</span>
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
