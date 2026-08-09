import React, { useState } from 'react';
import { Building2, CalendarDays, ExternalLink, Gavel, ZoomIn } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ImageZoomModal from './ImageZoomModal';

const getLocalizedDescription = (sale, language) => {
  if (language === 'en') return sale.description_en || sale.description || '';
  if (language === 'fr') return sale.description_fr || sale.description || '';
  return sale.description || '';
};

const isSafeUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isCompletePublishedSale = (sale) => (
  sale?.published === true
  && isSafeUrl(sale.imageUrl)
  && Boolean(sale.description || sale.description_en || sale.description_fr)
  && Boolean(sale.seller)
  && Boolean(sale.saleDate)
  && Boolean(sale.realizedPrice)
);

export default function ComparableSalesSection({ sales = [], compact = false }) {
  const { t, language } = useLanguage();
  const [zoomIndex, setZoomIndex] = useState(null);
  const visibleSales = Array.isArray(sales) ? sales.filter(isCompletePublishedSale) : [];

  if (visibleSales.length === 0) return null;

  const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-GB' : 'nl-BE';
  const formatDate = (date) => {
    const parsedDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return date;
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(parsedDate);
  };

  const zoomImages = visibleSales.map((sale) => {
    const desc = getLocalizedDescription(sale, language);
    const details = [
      sale.seller,
      sale.saleDate ? formatDate(sale.saleDate) : null,
      sale.realizedPrice ? `${t('item_detail.comparableSaleRealized')}: ${sale.realizedPrice}` : null,
    ].filter(Boolean).join(' • ');

    return {
      url: sale.imageUrl,
      caption: sale.imageCaption || (details ? `${desc} (${details})` : desc),
    };
  });

  return (
    <section className="space-y-3">
      <div className={`flex items-center text-[#B8860B] ${compact ? 'space-x-2' : 'space-x-3'}`}>
        <Gavel className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        <h3 className={`font-serif font-bold text-[#111111] ${compact ? 'text-lg' : 'text-xl'}`}>
          {t('item_detail.comparableSaleTitle')}
        </h3>
      </div>

      <div className={`border-t border-[#D8CEB8]/70 pt-4 ${compact ? 'space-y-5' : 'space-y-8'}`}>
        {visibleSales.map((sale, index) => {
          const description = getLocalizedDescription(sale, language);
          const priceTypeKey = sale.priceType === 'hammer'
            ? 'comparableSaleHammer'
            : sale.priceType === 'including-premium'
              ? 'comparableSalePremium'
              : null;

          return (
            <article
              key={sale.id || index}
              className={`grid grid-cols-1 bg-white border border-[#D8CEB8] overflow-hidden shadow-xs ${
                compact ? 'md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] rounded-xl' : 'sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] rounded-2xl'
              }`}
            >
              <button
                type="button"
                onClick={() => setZoomIndex(index)}
                aria-label={`${t('item_detail.comparableSaleZoom')} - ${sale.seller || description}`}
                className={`group relative w-full bg-[#F4F1EA] overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:ring-inset cursor-pointer ${
                  compact ? 'min-h-52' : 'min-h-64'
                }`}
              >
                <img
                  src={sale.imageUrl}
                  alt={sale.imageCaption || description}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-visible:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all transform scale-95 group-hover:scale-100 bg-black/80 text-white px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 text-xs font-mono border border-white/20">
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>{t('item_detail.comparableSaleZoom')}</span>
                  </div>
                </div>

                {/* Corner zoom badge */}
                <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-md bg-black/40 text-white/90 group-hover:bg-[#B8860B] group-hover:text-white transition-colors backdrop-blur-xs">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </button>

              <div className={`flex flex-col justify-center ${compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'}`}>
                <div className="space-y-4">
                  <div>
                    {sale.lotNumber && (
                      <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase tracking-wider">
                        {t('item_detail.comparableSaleLot')} {sale.lotNumber}
                      </span>
                    )}
                    <p className={`font-serif font-bold text-[#111111] leading-snug mt-1 ${compact ? 'text-base' : 'text-lg'}`}>
                      {description}
                    </p>
                  </div>

                  <dl className="space-y-2 text-xs text-[#444444]">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                      <div>
                        <dt className="sr-only">{t('item_detail.comparableSaleSeller')}</dt>
                        <dd className="font-serif font-semibold text-[#111111]">{sale.seller}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                      <div>
                        <dt className="sr-only">{t('item_detail.comparableSaleDate')}</dt>
                        <dd className="font-serif">{formatDate(sale.saleDate)}</dd>
                      </div>
                    </div>
                  </dl>

                  <div className="border-t border-[#D8CEB8]/70 pt-4">
                    <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider">
                      {t('item_detail.comparableSaleRealized')}
                    </span>
                    <strong className={`block font-serif text-[#B8860B] mt-0.5 ${compact ? 'text-xl' : 'text-2xl'}`}>
                      {sale.realizedPrice}
                    </strong>
                    {priceTypeKey && (
                      <span className="block text-[10px] font-mono text-[#666666] mt-1">
                        {t(`item_detail.${priceTypeKey}`)}
                      </span>
                    )}
                  </div>
                </div>

                {isSafeUrl(sale.saleUrl) && (
                  <a
                    href={sale.saleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 min-h-11 mt-5 px-4 py-2.5 rounded-md bg-[#1C1A17] hover:bg-[#B8860B] text-white hover:text-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                  >
                    <span>{t('item_detail.comparableSaleView')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {zoomIndex !== null && (
        <ImageZoomModal
          images={zoomImages}
          initialIndex={zoomIndex}
          title={visibleSales[zoomIndex]?.seller
            ? `${t('item_detail.comparableSaleTitle')} — ${visibleSales[zoomIndex].seller}`
            : t('item_detail.comparableSaleTitle')
          }
          onClose={() => setZoomIndex(null)}
        />
      )}
    </section>
  );
}