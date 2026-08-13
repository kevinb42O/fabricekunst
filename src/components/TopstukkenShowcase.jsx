import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedCategory, getLocalizedPrice } from '../utils/translationService';
import { LUXURY_EASE } from '../utils/motion';
import { getArtworkImageTransitionName, getArtworkTitleTransitionName } from '../utils/viewTransitions';
import { rememberImagePresentation } from '../utils/imagePresentation';

export default function TopstukkenShowcase({ 
  items = [], 
  transitionItemId,
  onOpenFullCatalog = () => {}, 
  onOpenItemDetail = () => {}, 
  onRequestInquiry = () => {} 
}) {
  const { t, language } = useLanguage();
  // Filter items marked as featured (Op Homepage Tonen)
  const featuredItems = items.filter(item => item && item.featured);
  
  // Fallback: If no items are marked featured, take items from catalog
  const sourceItems = featuredItems.length > 0 ? featuredItems : items;

  const displayItems = sourceItems;

  const spotlightItem = displayItems[0];
  const gridItems = displayItems.slice(1, 4);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.14, delayChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.95, ease: LUXURY_EASE }
    }
  };

  return (
    <section id="topstukken" className="masterpieces-showcase py-28 sm:py-36 lg:py-40 bg-white relative overflow-hidden">

      <div className="page-shell-wide relative z-10 space-y-12 sm:space-y-20">
        
        {/* Section Header (Sotheby's / Christie's Gallery Style) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#D8CEB8] pb-10">
          <div className="space-y-4 max-w-3xl">
            <h2 className="display-section-wide text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.1]">
              {t('topstukken.title')}
            </h2>
            <p className="text-base sm:text-lg text-[#444444] font-serif italic leading-relaxed">
              {t('topstukken.subtitle')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenFullCatalog}
            className="px-6 sm:px-8 py-4 bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-serif font-semibold text-xs sm:text-sm uppercase tracking-[0.16em] shadow-xs transition-colors duration-300 shrink-0 border border-[#B8860B]/40 hover:border-[#B8860B] cursor-pointer flex items-center space-x-2.5 min-h-[50px] w-full lg:w-auto justify-center"
          >
            <span>{t('catalog.viewAllCollection')}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>



        {/* ------------------------------------------------------------- */}
        {/* FEATURED SPOTLIGHT ITEM (EDITED MAISON HERITAGE PRESENTATION)  */}
        {/* ------------------------------------------------------------- */}
        {spotlightItem && (
          <motion.div
            key={spotlightItem.id}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, ease: LUXURY_EASE }}
            onClick={() => onOpenItemDetail(spotlightItem)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpenItemDetail(spotlightItem);
              }
            }}
            role="link"
            tabIndex={0}
            aria-label={getItemField(spotlightItem, 'title', language)}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center group cursor-pointer py-6"
          >
            {/* Spotlight Photography (Frameless, Pristine Edge-to-Edge) */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden bg-neutral-50 aspect-[4/3] sm:aspect-[16/11]">
                <img
                  src={spotlightItem.images?.[0]?.url || '/images/scarron-spines-white-bg.jpg'}
                  alt={getItemField(spotlightItem, 'title', language)}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  onLoad={(event) => rememberImagePresentation(event.currentTarget.currentSrc, event.currentTarget)}
                  style={{ viewTransitionName: transitionItemId === spotlightItem.id ? getArtworkImageTransitionName(spotlightItem.id) : 'none' }}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
                />
              </div>
            </div>

            {/* Spotlight Content Column (Pure Editorial Typography - Edited Harder) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-xs sm:text-sm font-serif tracking-[0.18em] text-[#8E7035] uppercase font-semibold">
                  <span>{getLocalizedCategory(spotlightItem.category, language)}</span>
                </div>

                <h3
                  style={{ viewTransitionName: transitionItemId === spotlightItem.id ? getArtworkTitleTransitionName(spotlightItem.id) : 'none' }}
                  className="display-feature-wide text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#111111] leading-[1.15] group-hover:text-[#B8860B] transition-colors duration-300"
                >
                  {getItemField(spotlightItem, 'title', language)}
                </h3>

                {spotlightItem.author && (
                  <p className="text-sm sm:text-base font-serif italic text-[#555555]">
                    {spotlightItem.author} {spotlightItem.year ? `(${spotlightItem.year})` : ''}
                  </p>
                )}
              </div>

              {/* Localized Provenance Highlight Quote (Fixed Localization Bug) */}
              {getItemField(spotlightItem, 'provenance', language) && (
                <div className="border-l border-[#8E7035] pl-4 py-2 space-y-1.5 bg-neutral-50 my-3">
                  <span className="text-xs font-serif tracking-[0.16em] text-[#8E7035] uppercase font-semibold block">{t('topstukken.provenanceBadge')}</span>
                  <p className="text-sm font-serif text-[#333333] leading-relaxed">{getItemField(spotlightItem, 'provenance', language)}</p>
                </div>
              )}

              <div className="mobile-spotlight-details pt-6 border-t border-[#D8CEB8]/60 flex items-center justify-between gap-6">
                <div>
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#111111]">{getLocalizedPrice(spotlightItem.price, language)}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestInquiry(spotlightItem);
                  }}
                  className="inline-flex items-center space-x-2 text-xs sm:text-sm font-serif font-semibold uppercase tracking-[0.16em] text-[#111111] border-b border-[#111111] pb-1 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
                >
                  <span>{t('topstukken.buyInquire')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ASYMMETRIC HIGH-FASHION MAGAZINE GALLERY (#2, #3, #4)          */}
        {/* ------------------------------------------------------------- */}
        {gridItems.length > 0 && (
          <motion.div
            key="homepage-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="mobile-featured-rail grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pt-8 md:pt-12 items-start"
          >
            {gridItems.map((item, idx) => {
              const itemTitle = getItemField(item, 'title', language);
              const mainImage = item.images && item.images.length > 0 ? item.images[0]?.url : '/images/scarron-spines-white-bg.jpg';
              
              // High-fashion editorial magazine layout logic:
              // Index 0 (Left): 5 columns, portrait vertical (aspect-4/5), top-aligned
              // Index 1 (Right): 7 columns, landscape (aspect-16/11), staggered top margin (md:mt-16 lg:mt-24) to balance height & eliminate whitespace
              // Index 2+ (Wide): 12 columns, wide cinematic editorial feature
              let colSpan = "md:col-span-5 lg:col-span-5";
              let aspect = "aspect-[4/5] sm:aspect-[3/4]";
              let staggeredClass = "md:mt-0";

              if (idx % 3 === 1) {
                colSpan = "md:col-span-7 lg:col-span-7";
                aspect = "aspect-[4/3] sm:aspect-[16/11]";
                staggeredClass = "md:mt-16 lg:mt-24";
              } else if (idx % 3 === 2) {
                colSpan = "md:col-span-12 lg:col-span-12";
                aspect = "aspect-[16/9] sm:aspect-[21/9]";
                staggeredClass = "md:mt-8 lg:mt-12";
              }

              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  onClick={() => onOpenItemDetail(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOpenItemDetail(item);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={itemTitle}
                  className={`${colSpan} ${staggeredClass} flex flex-col justify-between group cursor-pointer space-y-5`}
                >
                  <div className="space-y-4">
                    {/* Image Showcase (High-Fashion Editorial Frameless) */}
                    <div className={`${aspect} bg-neutral-50 overflow-hidden relative group/img`}>
                      <img
                        src={mainImage}
                        alt={itemTitle}
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                        onLoad={(event) => rememberImagePresentation(event.currentTarget.currentSrc, event.currentTarget)}
                        style={{ viewTransitionName: transitionItemId === item.id ? getArtworkImageTransitionName(item.id) : 'none' }}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
                      />
                      <div className="absolute inset-0 bg-[#111111]/0 group-hover:bg-[#111111]/5 transition-colors duration-500 pointer-events-none" />
                    </div>

                    {/* Body Content */}
                    <div className="space-y-2.5">
                      <div className="flex items-center text-xs font-serif tracking-[0.18em] text-[#8E7035] uppercase font-semibold">
                        <span>{getLocalizedCategory(item.category, language)}</span>
                      </div>

                      <h3
                        style={{ viewTransitionName: transitionItemId === item.id ? getArtworkTitleTransitionName(item.id) : 'none' }}
                        className="display-editorial-card-wide text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#111111] leading-snug group-hover:text-[#B8860B] transition-colors duration-300"
                      >
                        {itemTitle}
                      </h3>

                      {item.author && (
                        <p className="text-xs sm:text-sm text-[#555555] font-serif italic">
                          {item.author} {item.year ? `(${item.year})` : ''}
                        </p>
                      )}

                      {item.subtitle && (
                        <p className="text-xs text-[#666666] font-serif line-clamp-2 leading-relaxed pt-1">
                          {getItemField(item, 'subtitle', language)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pinned Bottom Details Bar */}
                  <div className="pt-4 border-t border-[#D8CEB8]/60 flex items-center justify-between gap-4 mt-auto">
                    <div>
                      <span className="text-lg sm:text-xl font-serif font-bold text-[#111111]">
                        {getLocalizedPrice(item.price, language) || t('topstukken.priceOnRequest')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>
    </section>
  );
}
