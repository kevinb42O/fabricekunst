import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Award, ChevronDown, ChevronUp, ZoomIn, ShieldCheck, SlidersHorizontal, ArrowUpDown, RotateCcw } from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';
import ItemDetailModal from './ItemDetailModal';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedCentury, getLocalizedCategory, getLocalizedPrice } from '../utils/translationService';

export default function AsymmetricGallery({ items, filteredItems: overrideFilteredItems, onOpenItemDetail, onRequestInquiry, hideHeader = false, hideControls = false }) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCentury, setSelectedCentury] = useState('Alle');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [sortBy, setSortBy] = useState('standaard');
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [zoomModalData, setZoomModalData] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);


  const handleOpenDetail = (item) => {
    if (onOpenItemDetail) {
      onOpenItemDetail(item);
    } else {
      setDetailModalItem(item);
    }
  };

  const centuries = ['Alle', '17e Eeuw', '18e Eeuw', '19e Eeuw'];
  const categories = ['Alle', 'Literatuur & Filosofie', 'Literatuur & Satire', 'Wetenschap & Illustraties', 'Kartografie & Reizen'];

  const hasActiveFilters = searchQuery !== '' || selectedCentury !== 'Alle' || selectedCategory !== 'Alle' || sortBy !== 'standaard';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCentury('Alle');
    setSelectedCategory('Alle');
    setSortBy('standaard');
  };

  const calculatedFilteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCentury = selectedCentury === 'Alle' || item.century === selectedCentury;
      const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;

      return matchesSearch && matchesCentury && matchesCategory;
    });

    if (sortBy === 'jaar-asc') {
      result = [...result].sort((a, b) => parseInt(a.year || '0') - parseInt(b.year || '0'));
    } else if (sortBy === 'jaar-desc') {
      result = [...result].sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));
    } else if (sortBy === 'auteur-asc') {
      result = [...result].sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    } else if (sortBy === 'titel-asc') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'prijs-asc') {
      const parsePrice = (priceStr) => {
        if (!priceStr || typeof priceStr !== 'string') return null;
        const digits = priceStr.replace(/[^0-9]/g, '');
        return digits ? Number(digits) : null;
      };
      result = [...result].sort((a, b) => {
        const pA = parsePrice(a.price);
        const pB = parsePrice(b.price);
        if (pA === null && pB === null) return 0;
        if (pA === null) return 1;
        if (pB === null) return -1;
        return pA - pB;
      });
    } else if (sortBy === 'prijs-desc') {
      const parsePrice = (priceStr) => {
        if (!priceStr || typeof priceStr !== 'string') return null;
        const digits = priceStr.replace(/[^0-9]/g, '');
        return digits ? Number(digits) : null;
      };
      result = [...result].sort((a, b) => {
        const pA = parsePrice(a.price);
        const pB = parsePrice(b.price);
        if (pA === null && pB === null) return 0;
        if (pA === null) return 1;
        if (pB === null) return -1;
        return pB - pA;
      });
    }

    return result;
  }, [items, searchQuery, selectedCentury, selectedCategory, sortBy]);

  const displayItems = overrideFilteredItems || calculatedFilteredItems;

  return (
    <section id="catalogus" className={`bg-white relative overflow-x-hidden ${hideHeader ? 'pt-0 pb-16 sm:pb-24' : 'py-24 border-b border-[#D8CEB8]'}`}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="page-shell-wide space-y-12"
      >
        
        {/* Section Header */}
        {!hideHeader && (
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full bg-white border border-[#B8860B]/30 shadow-sm font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>Volledige Collectie Overzicht</span>
            </div>
            
            <h2 className="text-4xl sm:text-6xl font-serif font-bold text-[#111111] tracking-tight">
              De Gecureerde <span className="text-[#B8860B] italic font-normal">Catalogus</span>
            </h2>
            
            <p className="text-[#333333] font-serif font-light text-base sm:text-lg leading-relaxed">
              Verken alle zeldzame meesterwerken in onze privé-collectie. Klik op een werk of afbeeldfoto voor een haarscherpe vergroting en detailzoom.
            </p>
          </div>
        )}

        {/* OVERLAPPING SEARCH & SORT FILTER CARD (If not hidden) */}
        {!hideControls && (
        <motion.div 
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ borderColor: 'rgba(184, 134, 11, 0.6)' }}
          className={`bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-10 border border-[#D8CEB8] shadow-[0_25px_60px_-15px_rgba(28,26,23,0.12),0_8px_24px_-8px_rgba(184,134,11,0.08)] space-y-4 sm:space-y-6 transition-all duration-300 relative z-30 ${
            hideHeader ? '-mt-24 sm:-mt-28 lg:-mt-36' : ''
          }`}
        >
          {/* Header row with reset option */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#D8CEB8]/70">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8]">
                <SlidersHorizontal className="w-4 h-4 text-[#B8860B]" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#111111] block">
                  Collectie Doorzoeken &amp; Sorteren
                </span>
                <span className="text-[11px] font-serif text-[#666666] italic">
                  Filter op tijdperk, categorie of sorteer op kenmerk
                </span>
              </div>
            </div>

            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={resetFilters}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#111111] text-[#B8860B] hover:text-white border border-[#D8CEB8] text-xs font-mono font-semibold transition-all duration-300 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Wis Filters</span>
              </motion.button>
            )}
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8860B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op auteur, titel, kopergravure of herkomst (bijv. Voltaire, Scarron, Ex-Libris)..."
              className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 text-sm font-medium shadow-inner transition-all duration-300"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#B8860B] hover:text-[#111111] hover:underline font-bold cursor-pointer bg-white px-2 py-1 rounded border border-[#D8CEB8]"
              >
                Wis
              </button>
            )}
          </div>

          {/* Filter & Sort Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
            
            {/* Century filter */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111] block mb-2 font-mono">
                {t('catalog.centuryFilter')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {centuries.map(c => (
                  <motion.button
                    key={c}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedCentury(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      selectedCentury === c
                        ? 'bg-[#1C1A17] text-[#FAF7F2] border border-[#B8860B]/80 shadow-xs'
                        : 'bg-[#FAF7F2] text-[#333333] hover:text-black border border-[#D8CEB8]'
                    }`}
                  >
                    {c === 'Alle' ? t('catalog.all') : getLocalizedCentury(c, language)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111] block mb-2 font-mono">
                {t('catalog.categoryFilter')}
              </span>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs font-semibold focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 cursor-pointer appearance-none pr-8"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-white text-[#111111]">
                      {cat === 'Alle' ? t('catalog.all') : getLocalizedCategory(cat, language)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#B8860B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111] block mb-2 font-mono flex items-center justify-between">
                <span>{t('catalog.sortLabel')}</span>
                <ArrowUpDown className="w-3 h-3 text-[#B8860B]" />
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] text-xs font-semibold focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 cursor-pointer appearance-none pr-8"
                >
                  <option value="standaard" className="bg-white text-[#111111]">{t('catalog.sortStandard')}</option>
                  <option value="jaar-asc" className="bg-white text-[#111111]">{t('catalog.sortYearAsc')}</option>
                  <option value="jaar-desc" className="bg-white text-[#111111]">{t('catalog.sortYearDesc')}</option>
                  <option value="auteur-asc" className="bg-white text-[#111111]">{t('catalog.sortAuthorAsc')}</option>
                  <option value="titel-asc" className="bg-white text-[#111111]">{t('catalog.sortTitleAsc')}</option>
                  <option value="prijs-asc" className="bg-white text-[#111111]">{t('catalog.sortPriceAsc')}</option>
                  <option value="prijs-desc" className="bg-white text-[#111111]">{t('catalog.sortPriceDesc')}</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#B8860B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Results status bar */}
          <div className="flex items-center justify-between text-xs font-mono text-[#666666] pt-3 border-t border-[#D8CEB8]/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#B8860B] animate-pulse" />
              <span>
                <strong className="text-[#111111] font-bold">{displayItems.length}</strong> {displayItems.length === 1 ? 'meesterwerk getoond' : 'meesterwerken getoond'}
              </span>
            </div>
            {hasActiveFilters && (
              <span className="text-[11px] text-[#B8860B] italic font-serif">
                Actieve filters toegepast
              </span>
            )}
          </div>

        </motion.div>
        )}

        {/* FULL-WIDTH SECTION LISTING WITH ANIMATEPRESENCE */}
        <div className="space-y-12">
          {displayItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1.0 }}
              className="text-center py-16 bg-white rounded-lg border-2 border-[#D8CEB8] space-y-3"
            >
              <BookOpen className="w-10 h-10 text-[#B8860B] mx-auto opacity-60" />
              <h3 className="text-xl font-serif font-bold text-[#111111]">Geen Stukken Gevonden</h3>
              <p className="text-xs text-[#666666] font-serif max-w-sm mx-auto">
                Er zijn geen werken die voldoen aan je huidige zoek- of filtercriteria. Probeer je filters te wissen.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, index) => {
                const isExpanded = expandedItemId === item.id;
                const isEven = index % 2 === 0;
                const slideX = isEven ? -80 : 80;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: slideX, y: 20 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ 
                      duration: 0.85, 
                      ease: [0.16, 1, 0.3, 1],
                      x: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.75 }
                    }}
                    whileHover={{ y: -2 }}
                    onClick={() => handleOpenDetail(item)}
                    className="py-10 border-b border-[#D8CEB8]/60 transition-colors cursor-pointer group"
                  >
                    {/* Frameless Editorial Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                      
                      {/* Visual (Frameless) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomModalData({ images: item.images, initialIndex: 0, title: item.title });
                        }}
                        className="lg:col-span-5 aspect-[4/3] overflow-hidden bg-[#FAF7F2] group/img relative cursor-zoom-in text-left focus:outline-none"
                      >
                        <img
                          src={item.images[0]?.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/img:scale-[1.03] transition-transform duration-1000 ease-out"
                        />
                      </button>

                      {/* Summary Details */}
                      <div className="lg:col-span-7 space-y-4 text-left">
                        <div className="flex items-center space-x-3 text-[10px] font-mono tracking-[0.2em] uppercase text-[#8E7035]">
                          <span>REF. {item.ref}</span>
                          <span>•</span>
                          <span>{getLocalizedCentury(item.century, language)}</span>
                          <span>•</span>
                          <span>{getLocalizedCategory(item.category, language)}</span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#111111] group-hover:text-[#B8860B] transition-colors duration-300 leading-snug">
                          {getItemField(item, 'title', language)}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#555555] font-serif italic">
                          {item.author} ({item.year}) — {item.publisher}
                        </p>

                        <p className="text-xs sm:text-sm text-[#444444] leading-relaxed font-serif font-light line-clamp-3">
                          {getItemField(item, 'description', language)}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4 pt-4 border-t border-[#D8CEB8]/50">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#777777] block">{t('item_detail.valuationPrice')}</span>
                            <span className="text-xl font-serif font-bold text-[#111111]">{getLocalizedPrice(item.price, language)}</span>
                          </div>

                          <div className="flex items-center space-x-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(item);
                              }}
                              className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#111111] border-b border-[#111111] pb-1 hover:text-[#B8860B] hover:border-[#B8860B] transition-colors duration-300 cursor-pointer"
                            >
                              <span>{t('topstukken.viewDetails')}</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestInquiry(item);
                              }}
                              disabled={item.status === 'Verkocht'}
                              className={`text-xs font-mono font-bold uppercase tracking-[0.18em] pb-1 border-b cursor-pointer transition-colors duration-300 ${
                                item.status === 'Verkocht'
                                  ? 'text-[#888888] border-[#888888] cursor-not-allowed'
                                  : 'text-[#111111] border-[#111111] hover:text-[#B8860B] hover:border-[#B8860B]'
                              }`}
                            >
                              <span>{item.status === 'Verkocht' ? t('catalog.sold') : t('topstukken.buyInquire')}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

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

      {/* Image Zoom Lightbox Modal */}
      {zoomModalData && (
        <ImageZoomModal
          images={zoomModalData.images}
          initialIndex={zoomModalData.initialIndex}
          title={zoomModalData.title}
          onClose={() => setZoomModalData(null)}
        />
      )}
    </section>
  );
}
