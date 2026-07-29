import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, BookOpen, Mail, ArrowRight, ShieldCheck, Truck, FileCheck, PhoneCall, ChevronRight, CheckCircle2, Star, Sparkles, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedCentury, getLocalizedCategory, getLocalizedStatus, getLocalizedPrice } from '../utils/translationService';

export default function TopstukkenShowcase({ 
  items = [], 
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
      transition: { staggerChildren: 0.12 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" }
    }
  };

  return (
    <section id="topstukken" className="py-28 sm:py-36 lg:py-40 bg-transparent relative overflow-hidden">
      
      {/* Ambient Glow Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#B8860B]/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 sm:space-y-20">
        
        {/* Section Header (Sotheby's / Christie's Gallery Style) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#D8CEB8] pb-10">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.1]">
              {t('topstukken.title')}
            </h2>
            <p className="text-base sm:text-lg text-[#444444] font-serif italic leading-relaxed">
              {t('topstukken.subtitle')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenFullCatalog}
            className="px-6 sm:px-8 py-4 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs uppercase tracking-[0.2em] shadow-xs transition-colors duration-300 shrink-0 border border-[#B8860B]/40 hover:border-[#B8860B] cursor-pointer flex items-center space-x-2.5 min-h-[50px] w-full lg:w-auto justify-center"
          >
            <span>{t('catalog.viewAllCollection')} ({items.length})</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>



        {/* ------------------------------------------------------------- */}
        {/* FEATURED SPOTLIGHT ITEM (FRAMELESS MAISON HERITAGE PRESENTATION) */}
        {/* ------------------------------------------------------------- */}
        {spotlightItem && (
          <motion.div
            key={spotlightItem.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            onClick={() => onOpenItemDetail(spotlightItem)}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center group cursor-pointer py-6"
          >
            {/* Spotlight Photography (Frameless, Pristine Edge-to-Edge) */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden bg-[#FAF7F2] aspect-[4/3] sm:aspect-[16/11]">
                <img
                  src={spotlightItem.images?.[0]?.url || '/images/scarron-spines-white-bg.jpg'}
                  alt={getItemField(spotlightItem, 'title', language)}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
                />
              </div>
            </div>

            {/* Spotlight Content Column (Pure Editorial Typography) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-[11px] font-mono tracking-[0.25em] text-[#8E7035] uppercase font-medium">
                  <span>{getLocalizedCategory(spotlightItem.category, language)}</span>
                  <span>•</span>
                  <span>REF. {spotlightItem.ref}</span>
                </div>

                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#111111] leading-[1.15] group-hover:text-[#B8860B] transition-colors duration-300">
                  {getItemField(spotlightItem, 'title', language)}
                </h3>

                {spotlightItem.author && (
                  <p className="text-sm sm:text-base font-serif italic text-[#555555]">
                    {spotlightItem.author} {spotlightItem.year ? `(${spotlightItem.year})` : ''}
                  </p>
                )}

                {getItemField(spotlightItem, 'description', language) && (
                  <p className="text-xs sm:text-sm font-serif font-light text-[#444444] leading-relaxed line-clamp-3 pt-2">
                    {getItemField(spotlightItem, 'description', language)}
                  </p>
                )}
              </div>

              {spotlightItem.provenance && (
                <div className="border-l border-[#111111] pl-4 py-1 space-y-1">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#111111] uppercase font-bold block">{t('topstukken.provenanceBadge')}</span>
                  <p className="text-xs font-serif italic text-[#222222]">"{spotlightItem.provenance}"</p>
                </div>
              )}

              <div className="pt-6 border-t border-[#D8CEB8]/60 flex items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#777777] block">{t('topstukken.priceValuation')}</span>
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#111111]">{getLocalizedPrice(spotlightItem.price, language)}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestInquiry(spotlightItem);
                  }}
                  className="inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#111111] border-b border-[#111111] pb-1 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
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
            className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pt-12 items-start"
          >
            {gridItems.map((item, idx) => {
              const itemTitle = getItemField(item, 'title', language);
              const mainImage = item.images && item.images.length > 0 ? item.images[0]?.url : '/images/scarron-spines-white-bg.jpg';
              // Asymmetric magazine column layout logic (5 cols for first, 7 cols for second)
              const colSpan = idx % 2 === 0 ? "md:col-span-5" : "md:col-span-7";
              const aspect = idx % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/3]";

              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  onClick={() => onOpenItemDetail(item)}
                  className={`${colSpan} space-y-4 group cursor-pointer`}
                >
                  {/* Image Showcase (High-Fashion Editorial Frameless) */}
                  <div className={`${aspect} bg-[#FAF7F2] overflow-hidden`}>
                    <img
                      src={mainImage}
                      alt={itemTitle}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.25em] text-[#666666] uppercase font-bold">
                      <span>{getLocalizedCategory(item.category, language)}</span>
                      <span>REF. {item.ref}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] leading-snug group-hover:opacity-70 transition-opacity duration-300">
                      {itemTitle}
                    </h3>

                    {item.author && (
                      <p className="text-xs text-[#555555] font-serif italic">
                        {item.author} {item.year ? `(${item.year})` : ''}
                      </p>
                    )}

                    <div className="pt-3 flex items-center justify-between border-t border-[#D8CEB8]/60">
                      <span className="text-lg font-serif font-bold text-[#111111]">
                        {getLocalizedPrice(item.price, language) || t('topstukken.priceOnRequest')}
                      </span>

                      <span className="text-[11px] font-mono tracking-[0.2em] text-[#111111] uppercase border-b border-[#111111] pb-0.5 group-hover:opacity-60 transition-opacity">
                        {t('topstukken.viewDetails')}
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
