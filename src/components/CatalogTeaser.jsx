import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Award, BookOpen } from 'lucide-react';
import ItemDetailModal from './ItemDetailModal';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedCentury, getLocalizedCategory, getLocalizedPrice } from '../utils/translationService';
import PriceAssurance from './PriceAssurance';

export default function CatalogTeaser({ items, onOpenFullCatalog, onOpenItemDetail, onRequestInquiry }) {
  const { t, language } = useLanguage();
  const [detailModalItem, setDetailModalItem] = useState(null);

  const handleOpenDetail = (item) => {
    if (onOpenItemDetail) {
      onOpenItemDetail(item);
    } else {
      setDetailModalItem(item);
    }
  };

  // Show up to 3 curated teaser items
  const featured = items.filter(i => i.featured);
  const nonFeatured = items.filter(i => !i.featured);
  const teaserItems = [...featured, ...nonFeatured].slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="catalogus-preview" className="py-24 bg-white overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="page-shell-wide space-y-12"
      >
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D8CEB8] pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>{t('catalog.heroTagline')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-[#111111] tracking-tight">
              {t('catalog.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#555555] font-serif italic max-w-xl">
              {t('catalog.subtitle')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenFullCatalog}
            className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-white hover:text-[#111111] font-semibold text-xs uppercase tracking-widest shadow-xs transition-colors duration-300 shrink-0 border border-[#B8860B]/40 hover:border-[#B8860B] cursor-pointer min-h-[48px] w-full sm:w-auto text-center"
          >
            <span>{t('catalog.viewItem')} ({items.length})</span>
          </motion.button>
        </div>

        {/* Curated 3-Column Teaser Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8"
        >
          {teaserItems.map((item) => (
            <motion.div
              key={item.id}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              onClick={() => handleOpenDetail(item)}
              className="bg-white rounded-lg border-2 border-[#D8CEB8] shadow-card overflow-hidden flex flex-col justify-between group hover:border-[#111111] transition-colors duration-300 cursor-pointer"
            >
              {/* Image Preview */}
              <div className="aspect-[4/3] bg-neutral-50 overflow-hidden relative border-b border-[#D8CEB8]">
                <img
                  src={item.images[0]?.url}
                  alt={getItemField(item, 'title', language)}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3 bg-[#111111] text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm">
                  {item.ref}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#B8860B] text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm border border-[#D8CEB8]">
                  {getLocalizedCentury(item.century, language)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#8E7035] uppercase tracking-wider font-mono block mb-1">
                    {getLocalizedCategory(item.category, language)}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#111111] line-clamp-2 leading-snug group-hover:text-[#B8860B] transition-colors">
                    {getItemField(item, 'title', language)}
                  </h3>
                  <p className="text-xs text-[#555555] font-serif italic mt-1">
                    {item.author} ({item.year})
                  </p>
                </div>

                <div className="pt-4 border-t border-[#FAF7F2] flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#888888] block font-mono">{t('item_detail.labels.price')}</span>
                    <span className="text-base font-serif font-bold text-[#B8860B]">{getLocalizedPrice(item.price, language)}</span>
                    <PriceAssurance compact className="max-w-[16rem]" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(item);
                    }}
                    className="px-4 py-2 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] border border-[#B8860B]/40 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 cursor-pointer flex items-center space-x-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{t('topstukken.viewItem')}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer CTA Bar */}
        <motion.div 
          whileHover={{ borderColor: "#B8860B" }}
          className="bg-white rounded-lg p-5 sm:p-6 lg:p-8 border border-[#D8CEB8] shadow-sm flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center justify-between gap-4 sm:gap-6 transition-colors duration-300"
        >
          <div className="space-y-1">
            <h4 className="text-lg font-serif font-bold text-[#111111]">
              {t('catalog.title')}
            </h4>
            <p className="text-xs text-[#666666] font-serif">
              {t('catalog.subtitle')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenFullCatalog}
            className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-mono font-semibold text-xs uppercase tracking-wider transition-colors duration-300 shrink-0 border border-[#B8860B]/40 cursor-pointer flex items-center space-x-2 group min-h-[48px] w-full sm:w-auto justify-center"
          >
            <span>{t('hero.exploreBtn')}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>

      </motion.div>

      {/* Full Museum Detail Dossier Modal */}
      {detailModalItem && (
        <ItemDetailModal
          item={detailModalItem}
          onClose={() => setDetailModalItem(null)}
          onRequestInquiry={(item) => {
            setDetailModalItem(null);
            onRequestInquiry(item);
          }}
        />
      )}

    </section>
  );
}
