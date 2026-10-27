import { getFeaturedItems } from '../utils/featuredOrder.js';
import React from 'react';
import ArtworkPriceStatus from './ArtworkPriceStatus';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedCategory } from '../utils/translationService';
import { LUXURY_EASE } from '../utils/motion';
import { getArtworkImageTransitionName, getArtworkTitleTransitionName } from '../utils/viewTransitions';
import { rememberImagePresentation } from '../utils/imagePresentation';
import { getItemSlug } from '../utils/itemSlug';
import { localizePath } from '../utils/locales';

export default function TopstukkenShowcase({
  items = [],
  transitionItemId,
  onOpenFullCatalog = () => {},
  onOpenItemDetail = () => {}
}) {
  const { t, language } = useLanguage();
  const displayItems = getFeaturedItems(items).slice(0, 4);
  if (displayItems.length === 0) return null;

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


        <div className="featured-works-list">
          {displayItems.map((item, index) => {
            const title = getItemField(item, 'title', language);
            const mainImage = item.images?.[0]?.url || '/images/scarron-spines-white-bg.jpg';
            const placement = index === 0 ? 'home_spotlight' : 'home_featured_grid';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.8, ease: LUXURY_EASE }}
                onClick={() => onOpenItemDetail(item, placement)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenItemDetail(item, placement);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={title}
                className={`featured-work ${index % 2 === 1 ? 'featured-work--text-left' : 'featured-work--text-right'} min-w-0 break-words group cursor-pointer`}
              >
                <div className="featured-work__layout">
                  <div className="featured-work__image min-w-0 overflow-hidden">
                    <img
                      src={mainImage}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      onLoad={(event) => rememberImagePresentation(event.currentTarget.currentSrc, event.currentTarget)}
                      style={{ viewTransitionName: transitionItemId === item.id ? getArtworkImageTransitionName(item.id) : 'none' }}
                      className="featured-artwork-image"
                    />
                  </div>
                  <div className="featured-work__content min-w-0 space-y-6">
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm font-serif tracking-[0.18em] text-[#8E7035] uppercase font-semibold">
                        {getLocalizedCategory(item.category, language)}
                      </p>
                      <h3
                        style={{ viewTransitionName: transitionItemId === item.id ? getArtworkTitleTransitionName(item.id) : 'none' }}
                        className="display-feature-wide text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[color:#B8860B] leading-[1.15] group-hover:text-[#111111] transition-colors duration-300"
                      >
                        <a
                          href={localizePath(`/collectie/${getItemSlug(item)}`, language)}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onOpenItemDetail(item, `${placement}_title`);
                          }}
                        >
                          {title}
                        </a>
                      </h3>
                      {item.author && <p className="text-sm sm:text-base font-serif italic text-[#555555]">{item.author} {item.year ? `(${item.year})` : ''}</p>}
                      {getItemField(item, 'subtitle', language) && <p className="text-sm font-serif text-[#666666] leading-relaxed">{getItemField(item, 'subtitle', language)}</p>}
                    </div>
                    {getItemField(item, 'provenance', language) && (
                      <div className="border-l border-[#8E7035] pl-4 py-2 space-y-1.5 bg-neutral-50">
                        <span className="text-xs font-serif tracking-[0.16em] text-[#8E7035] uppercase font-semibold block">{t('topstukken.provenanceBadge')}</span>
                        <p className="text-sm font-serif text-[#333333] leading-relaxed">{getItemField(item, 'provenance', language)}</p>
                      </div>
                    )}
                    <div className="border-t border-[#D8CEB8]/60 pt-6">
                      <ArtworkPriceStatus item={item} priceClassName="text-2xl sm:text-3xl font-serif font-bold text-[#111111]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
