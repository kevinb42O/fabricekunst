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
    <section id="topstukken" className="py-24 bg-transparent relative overflow-hidden">
      
      {/* Ambient Glow Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#B8860B]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 sm:space-y-14">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D8CEB8] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] font-mono px-3.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#B8860B]/30 shadow-xs">
              <Award className="w-4 h-4 text-[#B8860B]" />
              <span>{t('topstukken.badge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-[#111111] tracking-tight">
              {t('topstukken.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#555555] font-serif italic max-w-2xl leading-relaxed">
              {t('topstukken.subtitle')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenFullCatalog}
            className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs uppercase tracking-widest shadow-xs transition-colors duration-300 shrink-0 border border-[#B8860B]/40 hover:border-[#B8860B] cursor-pointer flex items-center space-x-2 min-h-[48px] w-full sm:w-auto justify-center"
          >
            <span>{t('catalog.viewAllCollection')} ({items.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LUXURY BUYER TRUST STRIP (HANDMADE / GALLERY STYLE)          */}
        {/* ------------------------------------------------------------- */}
        <div className="border-y border-[#D8CEB8]/70 py-10 my-4 bg-[#FAF7F2]/40 backdrop-blur-xs relative select-none">
          {/* Subtle design detail: tiny corner ornaments representing traditional blind tooling */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#B8860B]/40" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#B8860B]/40" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#B8860B]/40" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#B8860B]/40" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4 divide-y sm:divide-y-0 lg:divide-x divide-[#D8CEB8]/50">
            {/* Courier */}
            <div className="flex flex-col items-center text-center px-4 space-y-3">
              <Truck className="w-5 h-5 text-[#B8860B] stroke-[1.25]" />
              <div className="space-y-1">
                <h4 className="text-[11px] font-serif font-bold uppercase tracking-[0.18em] text-[#111111]">{t('topstukken.trust.courier_title')}</h4>
                <p className="text-xs text-[#555555] font-serif italic leading-relaxed">{t('topstukken.trust.courier_desc')}</p>
              </div>
            </div>

            {/* Certificate */}
            <div className="flex flex-col items-center text-center px-4 space-y-3 pt-6 sm:pt-0">
              <FileCheck className="w-5 h-5 text-[#B8860B] stroke-[1.25]" />
              <div className="space-y-1">
                <h4 className="text-[11px] font-serif font-bold uppercase tracking-[0.18em] text-[#111111]">{t('topstukken.trust.cert_title')}</h4>
                <p className="text-xs text-[#555555] font-serif italic leading-relaxed">{t('topstukken.trust.cert_desc')}</p>
              </div>
            </div>

            {/* Viewing */}
            <div className="flex flex-col items-center text-center px-4 space-y-3 pt-6 lg:pt-0">
              <ShieldCheck className="w-5 h-5 text-[#B8860B] stroke-[1.25]" />
              <div className="space-y-1">
                <h4 className="text-[11px] font-serif font-bold uppercase tracking-[0.18em] text-[#111111]">{t('topstukken.trust.viewing_title')}</h4>
                <p className="text-xs text-[#555555] font-serif italic leading-relaxed">{t('topstukken.trust.viewing_desc')}</p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col items-center text-center px-4 space-y-3 pt-6 lg:pt-0">
              <PhoneCall className="w-5 h-5 text-[#B8860B] stroke-[1.25]" />
              <div className="space-y-1">
                <h4 className="text-[11px] font-serif font-bold uppercase tracking-[0.18em] text-[#111111]">{t('topstukken.trust.contact_title')}</h4>
                <p className="text-xs text-[#555555] font-serif italic leading-relaxed">{t('topstukken.trust.contact_desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FEATURED SPOTLIGHT ITEM (#1 TOPSTUK ELEGANT LIGHT HERO CARD)  */}
        {/* ------------------------------------------------------------- */}
        {spotlightItem && (
          <motion.div
            key={spotlightItem.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onClick={() => onOpenItemDetail(spotlightItem)}
            className="bg-white text-[#111111] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 border-2 border-[#D8CEB8] shadow-card grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center group cursor-pointer hover:border-[#111111] transition-[border-color] duration-300 transform-gpu"
          >
            {/* Spotlight Image Frame */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-white border border-[#D8CEB8] aspect-[4/3] shadow-sm">
                <img
                  src={spotlightItem.images?.[0]?.url || '/images/scarron-spines-white-bg.jpg'}
                  alt={getItemField(spotlightItem, 'title', language)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <span className="bg-[#1C1A17] text-[#D4AF37] text-xs font-mono font-bold px-3 py-1 rounded-sm shadow-md flex items-center space-x-1 border border-[#B8860B]/40">
                    <Star className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
                    <span>{t('topstukken.spotlightBadge')}</span>
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  {spotlightItem.status === 'Beschikbaar' ? (
                    <span className="bg-emerald-800 text-white text-xs font-mono font-bold px-3 py-1 rounded-sm shadow-md flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                      <span>{getLocalizedStatus('Beschikbaar', language)}</span>
                    </span>
                  ) : (
                    <span className="bg-[#8B2635] text-white text-xs font-mono font-bold px-3 py-1 rounded-sm shadow-md">
                      {getLocalizedStatus(spotlightItem.status, language)}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm text-[#111111] font-mono text-xs font-bold px-3 py-1.5 rounded border border-[#D8CEB8]">
                  {spotlightItem.ref} • {getLocalizedCentury(spotlightItem.century, language)}
                </div>
              </div>
            </div>

            {/* Spotlight Content Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#8E7035] uppercase tracking-widest block">
                  {getLocalizedCategory(spotlightItem.category, language)}
                </span>

                <h3 className="text-2xl sm:text-4xl font-serif font-bold text-[#111111] leading-tight group-hover:text-[#B8860B] transition-colors">
                  {getItemField(spotlightItem, 'title', language)}
                </h3>

                {spotlightItem.author && (
                  <p className="text-sm font-serif italic text-[#555555]">
                    {spotlightItem.author} ({spotlightItem.year})
                  </p>
                )}

                {getItemField(spotlightItem, 'description', language) && (
                  <p className="text-xs sm:text-sm font-sans text-[#444444] leading-relaxed line-clamp-3 pt-2">
                    {getItemField(spotlightItem, 'description', language)}
                  </p>
                )}
              </div>

              {spotlightItem.provenance && (
                <div className="p-4 rounded-xl bg-white border border-[#D8CEB8] space-y-1 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase block">{t('topstukken.provenanceBadge')}</span>
                  <p className="text-xs font-serif italic text-[#111111]">"{spotlightItem.provenance}"</p>
                </div>
              )}

              <div className="pt-4 border-t border-[#D8CEB8]/70 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666666] block font-mono">{t('topstukken.priceValuation')}</span>
                  <span className="text-2xl font-serif font-bold text-[#B8860B]">{getLocalizedPrice(spotlightItem.price, language)}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestInquiry(spotlightItem);
                    }}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs min-h-[44px]"
                  >
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                    <span>{t('topstukken.buyInquire')}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUPPORTING ACQUISITIONS GRID (#2, #3, #4)                     */}
        {/* ------------------------------------------------------------- */}
        {gridItems.length > 0 && (
          <motion.div
            key="homepage-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 transform-gpu"
          >
            {gridItems.map((item) => {
              const itemTitle = getItemField(item, 'title', language);
              const itemDesc = getItemField(item, 'description', language);
              const mainImage = item.images && item.images.length > 0 ? item.images[0]?.url : '/images/scarron-spines-white-bg.jpg';
              const isAvailable = item.status === 'Beschikbaar';
              const localizedStatus = getLocalizedStatus(item.status, language);

              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  onClick={() => onOpenItemDetail(item)}
                  className="bg-white rounded-2xl border-2 border-[#D8CEB8] shadow-card overflow-hidden flex flex-col justify-between group hover:border-[#111111] transition-[border-color] duration-300 cursor-pointer transform-gpu"
                >
                  {/* Image Showcase */}
                  <div className="aspect-[4/3] bg-white overflow-hidden relative border-b border-[#D8CEB8]">
                    <img
                      src={mainImage}
                      alt={itemTitle}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#111111] text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm shadow-md">
                        {item.ref}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      {isAvailable ? (
                        <span className="bg-emerald-800 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm shadow-md flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                          <span>{localizedStatus}</span>
                        </span>
                      ) : (
                        <span className="bg-[#8B2635] text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm shadow-sm">
                          {localizedStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#8E7035] uppercase tracking-wider font-mono">
                          {getLocalizedCategory(item.category, language)}
                        </span>
                        {item.provenance && (
                          <span className="inline-flex items-center text-[10px] font-mono text-[#4A5D4E] bg-[#E8F0E9] px-2 py-0.5 rounded border border-[#C5D8C7]">
                            <ShieldCheck className="w-3 h-3 mr-1 text-[#4A5D4E]" />
                            Provenance
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-serif font-bold text-[#111111] line-clamp-2 leading-snug group-hover:text-[#B8860B] transition-colors">
                        {itemTitle}
                      </h3>

                      {item.author && (
                        <p className="text-xs text-[#555555] font-serif italic">
                          {item.author} {item.year ? `(${item.year})` : ''}
                        </p>
                      )}

                      {itemDesc && (
                        <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed pt-1 font-sans">
                          {itemDesc}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 sm:pt-4 border-t border-[#D8CEB8]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#888888] block font-mono">{t('topstukken.price')}</span>
                        <span className="text-base font-serif font-bold text-[#B8860B]">
                          {getLocalizedPrice(item.price, language) || t('topstukken.priceOnRequest')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestInquiry(item);
                          }}
                          className="px-3.5 py-2 rounded-sm bg-[#B8860B] hover:bg-[#111111] text-[#111111] hover:text-white border border-[#B8860B] text-xs font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer flex items-center space-x-1.5 shadow-xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{t('topstukken.buyInquire')}</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenItemDetail(item);
                          }}
                          className="p-2 rounded-sm bg-white hover:bg-[#FAF7F2] text-[#111111] border border-[#D8CEB8] transition-colors cursor-pointer"
                          title={t('topstukken.viewDetails')}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#555555]" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Bottom Guarantee Banner */}
        <motion.div 
          whileHover={{ borderColor: "#B8860B" }}
          className="p-5 sm:p-8 lg:p-10 rounded-2xl bg-[#1C1A17] text-white flex flex-col items-center text-center md:flex-row md:text-left md:items-center justify-between gap-5 sm:gap-6 border border-[#332E27] shadow-xl"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 text-[#D4AF37] text-xs font-mono font-bold uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>{t('topstukken.guarantee.badge')}</span>
            </div>
            <h4 className="text-2xl font-serif font-bold text-white">
              {t('topstukken.guarantee.title')}
            </h4>
            <p className="text-sm text-[#A0988E] max-w-xl font-light">
              {t('topstukken.guarantee.desc')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenFullCatalog}
            className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-sm bg-[#B8860B] hover:bg-[#D4AF37] text-[#111111] font-bold text-xs uppercase tracking-widest shadow-md transition-colors cursor-pointer shrink-0 flex items-center space-x-2 min-h-[48px] w-full sm:w-auto justify-center"
          >
            <span>{t('catalog.viewAllCollection')} ({items.length})</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
}
