import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  History,
  Maximize2,
  Share2,
  ShieldCheck
} from 'lucide-react';
import ImageZoomModal from '../components/ImageZoomModal';
import ComparableSalesSection from '../components/ComparableSalesSection';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedItemDetailLabels } from '../data/catalogTaxonomy';
import {
  getItemField,
  getLocalizedCategory,
  getLocalizedCentury,
  getLocalizedPrice,
  getLocalizedStatus
} from '../utils/translationService';

const COPY = {
  nl: { share: 'Delen', shared: 'Link gekopieerd', photo: 'Foto', enlarge: 'Foto vergroten', previous: 'Vorige foto', next: 'Volgende foto', details: 'Objectdetails', provenance: 'Herkomst & Provenantie', history: 'Historische context', inquire: 'Aanvragen', more: 'Meer uit de collectie' },
  en: { share: 'Share', shared: 'Link copied', photo: 'Photo', enlarge: 'Enlarge photo', previous: 'Previous photo', next: 'Next photo', details: 'Work details', provenance: 'Provenance', history: 'Historical context', inquire: 'Inquire', more: 'More from the collection' },
  fr: { share: 'Partager', shared: 'Lien copié', photo: 'Photo', enlarge: 'Agrandir la photo', previous: 'Photo précédente', next: 'Photo suivante', details: 'Détails de l’œuvre', provenance: 'Provenance', history: 'Contexte historique', inquire: 'Demander', more: 'Plus de la collection' }
};

export default function MobileItemDetailPage({ item, onNavigateBack, onRequestInquiry, catalog = [], onOpenItemDetail }) {
  const { language, t } = useLanguage();
  const labels = COPY[language] || COPY.en;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(0);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [item]);

  if (!item) {
    return (
      <div className="min-h-screen bg-white px-5 pb-24 pt-[calc(7rem+env(safe-area-inset-top,0px))] text-center">
        <BookOpen className="mx-auto h-10 w-10 text-[#8E7035]" />
        <h1 className="mt-5 font-serif text-3xl font-bold text-[#111111]">{t('item_detail.notFoundTitle')}</h1>
        <p className="mt-3 font-serif text-base leading-relaxed text-[#5B5147]">{t('item_detail.notFoundDesc')}</p>
        <button type="button" onClick={onNavigateBack} className="mt-7 min-h-12 bg-[#1C1A17] px-6 font-sans text-xs font-bold uppercase tracking-wider text-white">
          {t('item_detail.backToCatalog')}
        </button>
      </div>
    );
  }

  const images = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : [{ url: '/images/scarron-spines-white-bg.jpg', caption: '' }];
  const activeImage = images[selectedImageIndex] || images[0];
  const detailLabels = getLocalizedItemDetailLabels(item.itemType, language);
  const currentIndex = catalog.findIndex((candidate) => candidate.id === item.id);
  const previousItem = currentIndex > 0 ? catalog[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : null;
  const normalizedStatus = String(item.status || '').toLowerCase();
  const statusClass = normalizedStatus.includes('reserv')
    ? 'border-amber-300 bg-amber-50 text-amber-900'
    : (normalizedStatus.includes('verkocht') || normalizedStatus.includes('sold') || normalizedStatus.includes('vendu'))
      ? 'border-stone-300 bg-stone-100 text-stone-700'
      : 'border-emerald-300 bg-emerald-50 text-emerald-800';

  const handleShare = async () => {
    const shareData = {
      title: getItemField(item, 'title', language),
      text: getItemField(item, 'subtitle', language),
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback(true);
        window.setTimeout(() => setShareFeedback(false), 2200);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        await navigator.clipboard?.writeText?.(window.location.href);
        setShareFeedback(true);
        window.setTimeout(() => setShareFeedback(false), 2200);
      }
    }
  };

  const showPreviousImage = () => setSelectedImageIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  const showNextImage = () => setSelectedImageIndex((index) => (index === images.length - 1 ? 0 : index + 1));

  const rawDossierSections = [
    {
      key: 'description',
      title: detailLabels.descriptionSection,
      icon: BookOpen,
      content: getItemField(item, 'description', language)
    },
    {
      key: 'historicalContext',
      title: labels.history,
      icon: History,
      content: getItemField(item, 'historicalContext', language)
    },
    {
      key: 'provenance',
      title: labels.provenance,
      icon: ShieldCheck,
      content: getItemField(item, 'provenance', language)
    },
    {
      key: 'conditionReport',
      title: detailLabels.physicalSection,
      icon: FileCheck2,
      content: getItemField(item, 'conditionReport', language) || getItemField(item, 'condition', language)
    }
  ].filter((section) => section.content);
  const seenParagraphs = new Set();
  const dossierSections = rawDossierSections
    .map((section) => ({
      ...section,
      paragraphs: String(section.content)
        .split('\n\n')
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .filter((paragraph) => {
          const key = paragraph.toLocaleLowerCase().replace(/\s+/g, ' ');
          if (seenParagraphs.has(key)) return false;
          seenParagraphs.add(key);
          return true;
        })
    }))
    .filter((section) => section.paragraphs.length > 0);

  return (
    <div className="mobile-item-detail min-h-screen bg-[#FFFEFC] pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(4rem+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="px-4 pt-4 min-[390px]:px-5 min-[600px]:px-8">
        <div className="flex items-center justify-between border-b border-[#D8CEB8]/80 pb-3">
          <button
            type="button"
            onClick={onNavigateBack}
            className="flex min-h-11 items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#302A24]"
          >
            <ArrowLeft className="h-4 w-4 text-[#8E7035]" />
            {t('item_detail.backToCatalog')}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex min-h-11 items-center gap-2 px-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#302A24]"
            aria-live="polite"
          >
            <Share2 className="h-4 w-4 text-[#8E7035]" />
            {shareFeedback ? labels.shared : labels.share}
          </button>
        </div>
      </div>

      <section aria-label={`${labels.photo} ${selectedImageIndex + 1}`} className="mt-4">
        <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-[#F1ECE3] min-[600px]:mx-8 min-[600px]:min-h-[430px]">
          <img
            src={activeImage.url}
            alt={activeImage.caption || getItemField(item, 'title', language)}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="max-h-[62svh] w-full object-contain"
          />

          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label={labels.enlarge}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[#111111] shadow-sm backdrop-blur-md"
          >
            <Maximize2 className="h-[18px] w-[18px]" />
          </button>

          {images.length > 1 && (
            <>
              <button type="button" onClick={showPreviousImage} aria-label={labels.previous} className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#1C1A17]/85 text-white backdrop-blur-md">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={showNextImage} aria-label={labels.next} className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#1C1A17]/85 text-white backdrop-blur-md">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-2 font-sans text-[10px] font-bold tracking-[0.12em] text-[#40372F] backdrop-blur-md">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>

      </section>

      <main className="px-4 pt-5 min-[390px]:px-5 min-[600px]:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E7035]">
            <span>{getLocalizedCategory(item.category, language)}</span>
          </div>

          <div className="mt-4 border-b border-[#D8CEB8] pb-6">
            <h1 className="text-balance font-serif text-[2.25rem] font-bold leading-[1.02] tracking-[-0.03em] text-[#111111] min-[390px]:text-[2.55rem]">
              {getItemField(item, 'title', language)}
            </h1>
            {item.author && (
              <p className="mt-4 font-serif text-base font-semibold text-[#2F2923]">
                {detailLabels.maker}: {item.author}
              </p>
            )}
            {(item.publisher || item.city) && (
              <p className="mt-1 font-serif text-sm italic leading-relaxed text-[#665B50]">
                {[item.publisher, item.city].filter(Boolean).join(' · ')}
              </p>
            )}
            {getItemField(item, 'subtitle', language) && (
              <p className="mt-4 border-l-2 border-[#8E7035] pl-4 font-serif text-sm italic leading-relaxed text-[#5A4E43]">
                {getItemField(item, 'subtitle', language)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-[#D8CEB8] py-5">
            <div>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#6A6056]">{t('item_detail.valuationPrice')}</span>
              <strong className="mt-1 block font-serif text-2xl text-[#8E7035]">{getLocalizedPrice(item.price, language)}</strong>
            </div>
            <div className="text-right">
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#6A6056]">{t('item_detail.status')}</span>
              <span className={`mt-2 inline-flex min-h-8 items-center rounded-full border px-3 font-sans text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                {getLocalizedStatus(item.status, language)}
              </span>
            </div>
          </div>

          <section aria-labelledby="mobile-object-details" className="mt-12">
            <h2 id="mobile-object-details" className="font-serif text-3xl font-bold text-[#111111]">{labels.details}</h2>
            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-[#D8CEB8] bg-[#D8CEB8]">
              {[
                [t('item_detail.century'), getLocalizedCentury(item.century, language)],
                [t('item_detail.format'), item.dimensions || '—'],
                [detailLabels.publisher, item.publisher || '—'],
                [detailLabels.city, item.city || '—']
              ].map(([term, value]) => (
                <div key={term} className="min-h-[88px] bg-white p-4">
                  <dt className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-[#71675D]">{term}</dt>
                  <dd className="mt-2 font-serif text-sm font-semibold leading-snug text-[#2F2923]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-12 space-y-12">
            {dossierSections.map((section) => {
              const Icon = section.icon;
              return (
                <section key={section.key} className="border-t border-[#D8CEB8] pt-6">
                  <div className="flex items-center gap-3 text-[#8E7035]">
                    <Icon className="h-5 w-5" />
                    <h2 className="font-serif text-2xl font-bold text-[#111111]">{section.title}</h2>
                  </div>
                  <div className="mt-4 space-y-4 font-serif text-[1.0625rem] leading-[1.72] text-[#40372F]">
                    {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  </div>
                </section>
              );
            })}

            <ComparableSalesSection sales={item.comparableSales || item.comparable_sales || []} compact />
          </div>

          <section className="mt-14 border-t border-[#D8CEB8] pt-6">
            <h2 className="font-serif text-2xl font-bold text-[#111111]">{labels.more}</h2>
            <div className="mt-4 grid gap-3">
              {[previousItem, nextItem].filter(Boolean).map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => onOpenItemDetail(candidate)}
                  className="grid min-h-[88px] grid-cols-[72px_1fr_auto] items-center gap-4 border border-[#D8CEB8] bg-white p-2 text-left"
                >
                  <img src={candidate.images?.[0]?.url} alt="" loading="lazy" className="h-[72px] w-[72px] object-cover" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-serif text-base font-bold leading-tight text-[#111111]">{getItemField(candidate, 'title', language)}</span>
                    <span className="mt-1 block font-sans text-[10px] uppercase tracking-wider text-[#8E7035]">{getLocalizedPrice(candidate.price, language)}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#8E7035]" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D8CEB8] bg-[#FFFEFC]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-10px_30px_rgba(38,29,20,0.1)] backdrop-blur-xl min-[390px]:px-5">
        <button
          type="button"
          onClick={() => onRequestInquiry(item)}
          disabled={item.status === 'Verkocht'}
          className="flex min-h-12 w-full items-center justify-between bg-[#1C1A17] px-5 font-sans text-[10px] font-bold uppercase tracking-[0.13em] text-white disabled:opacity-45"
        >
          {labels.inquire}
          <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
        </button>
      </div>

      {zoomOpen && (
        <ImageZoomModal
          images={images}
          initialIndex={selectedImageIndex}
          title={getItemField(item, 'title', language)}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}
