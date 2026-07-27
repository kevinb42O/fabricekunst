import React, { useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Award, Search, ChevronDown, SlidersHorizontal, ArrowUpDown, RotateCcw, BookOpen, Palette } from 'lucide-react';
import AsymmetricGallery from './AsymmetricGallery';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedCentury, getLocalizedCategory } from '../utils/translationService';

export default function CatalogPage({ items, onNavigateHome, onOpenItemDetail, onRequestInquiry }) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedType, setSelectedType] = useState('Alle'); // 'Alle' | 'book' | 'painting'
  const [selectedCentury, setSelectedCentury] = useState('Alle');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [sortBy, setSortBy] = useState('standaard');

  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0px', '-40px']);

  const centuries = ['Alle', '17e Eeuw', '18e Eeuw', '19e Eeuw'];
  const categories = ['Alle', 'Literatuur & Filosofie', 'Literatuur & Satire', 'Wetenschap & Illustraties', 'Oude Meesters', 'Kartografie & Reizen'];

  const hasActiveFilters = searchQuery !== '' || selectedType !== 'Alle' || selectedCentury !== 'Alle' || selectedCategory !== 'Alle' || sortBy !== 'standaard';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('Alle');
    setSelectedCentury('Alle');
    setSelectedCategory('Alle');
    setSortBy('standaard');
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'Alle' || (item.itemType || 'book') === selectedType;
      const matchesCentury = selectedCentury === 'Alle' || item.century === selectedCentury;
      const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;

      return matchesSearch && matchesType && matchesCentury && matchesCategory;
    });

    if (sortBy === 'jaar-asc') {
      result = [...result].sort((a, b) => parseInt(a.year || '0') - parseInt(b.year || '0'));
    } else if (sortBy === 'jaar-desc') {
      result = [...result].sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));
    } else if (sortBy === 'auteur-asc') {
      result = [...result].sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    } else if (sortBy === 'titel-asc') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [items, searchQuery, selectedCentury, selectedCategory, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#111111]">
      
      {/* ------------------------------------------------------------- */}
      {/* MONUMENTAL HERO SECTION WITH INTEGRATED SEARCH/SORT PANEL     */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={heroRef}
        className="relative w-full bg-[#FAF7F2] pt-28 select-none"
      >
        
        {/* Photography Background Showcase (Extends down to exactly 50% of the Search Card height) */}
        <div className="absolute top-0 inset-x-0 bottom-[140px] sm:bottom-[150px] lg:bottom-[160px] z-0 overflow-hidden pointer-events-none">
          {/* Parallax Image */}
          <motion.div 
            style={{ y: bgY }}
            className="w-full h-full absolute inset-0"
          >
            <img
              src="/images/hero/hero-voltaire-glasses.jpg"
              alt="Atelier Rembrandt Collectie Overview"
              className="absolute top-0 right-0 w-full lg:w-[68%] h-full object-cover filter contrast-[1.02] brightness-[0.98]"
            />
          </motion.div>

          {/* Solid cream overlay gradient extending seamlessly for readability (FIXED) */}
          <div
            className="absolute inset-y-0 left-0 w-full h-full z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, #FAF7F2 0%, #FAF7F2 45%, rgba(250, 247, 242, 0.78) 58%, transparent 75%)'
            }}
          />

          {/* Seamless bottom fade transition at 50% height of search bar (FIXED) */}
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/80 via-50% to-transparent z-10 pointer-events-none" />
        </div>

        {/* Hero Text Content */}
        <motion.div 
          style={{ y: contentY }}
          className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-10 sm:mb-14"
        >
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl lg:max-w-3xl space-y-6"
          >
            
            {/* Top Navigation Breadcrumb Bar */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between border-b border-[#D8CEB8]/70 pb-4 mb-2"
            >
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.18em] text-[#111111] hover:text-[#B8860B] transition-colors group font-mono cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#B8860B] group-hover:-translate-x-1 transition-transform" />
                <span>{t('nav.backHome')}</span>
              </button>
            </motion.div>


            {/* Authentic Subtitle & Divider */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center space-x-3 text-xs font-serif font-medium tracking-[0.25em] text-[#8E7035] uppercase pt-2"
            >
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-[1.5px] bg-[#B8860B] inline-block" 
              />
              <span>{t('catalog.heroTagline')}</span>
            </motion.div>

            {/* Grand Headline Layout */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.12]"
            >
              <span className="block">{t('catalog.title')}</span>
            </motion.h1>

            {/* Subtitle Paragraph */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-[#333333] font-serif font-light leading-relaxed max-w-xl"
            >
              {t('catalog.subtitle')}
            </motion.p>

            {/* Provenance & Quality Badges */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap items-center gap-6 pt-3 text-xs font-mono text-[#555555]"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                <span>{t('item_detail.provenanceGuaranteed')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#B8860B]" />
                <span>{t('topstukken.badge')}</span>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* INTEGRATED SEARCH & SORT PANEL (EXACTLY 50% HEIGHT IN HERO)  */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ borderColor: 'rgba(184, 134, 11, 0.65)' }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 sm:p-10 border border-[#D8CEB8] shadow-[0_25px_60px_-15px_rgba(28,26,23,0.14),0_8px_24px_-8px_rgba(184,134,11,0.08)] space-y-6 transition-all duration-300"
          >
            {/* Header row with reset option */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#D8CEB8]/70">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-md bg-[#FAF7F2] border border-[#D8CEB8]">
                  <SlidersHorizontal className="w-4 h-4 text-[#B8860B]" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#111111] block">
                    {t('nav.search')} &amp; {t('catalog.sortLabel')}
                  </span>
                  <span className="text-[11px] font-serif text-[#666666] italic">
                    {t('catalog.subtitle')}
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
                  <span>{t('catalog.resetFilters')}</span>
                </motion.button>
              )}
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8860B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('catalog.searchPlaceholder')}
                className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 text-sm font-medium shadow-inner transition-all duration-300"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#B8860B] hover:text-[#111111] hover:underline font-bold cursor-pointer bg-white px-2 py-1 rounded border border-[#D8CEB8]"
                >
                  {t('catalog.clearSearch')}
                </button>
              )}
            </div>

            {/* Object Type Switcher Bar */}
            <div className="flex items-center space-x-2 pt-1 border-b border-[#D8CEB8]/50 pb-4 font-mono text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666] shrink-0 mr-1">
                {t('catalog.typeFilter')}:
              </span>
              <button
                type="button"
                onClick={() => setSelectedType('Alle')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedType === 'Alle'
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'bg-[#FAF7F2] text-[#555555] hover:text-[#111111] border border-[#D8CEB8]'
                }`}
              >
                {t('catalog.all')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('book')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  selectedType === 'book'
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'bg-[#FAF7F2] text-[#555555] hover:text-[#111111] border border-[#D8CEB8]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t('catalog.books')}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('painting')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  selectedType === 'painting'
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'bg-[#FAF7F2] text-[#555555] hover:text-[#111111] border border-[#D8CEB8]'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t('catalog.paintings')}</span>
              </button>
            </div>

            {/* Filter & Sort Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
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
                  {t('catalog.itemsFound', { count: filteredItems.length })}
                </span>
              </div>
              {hasActiveFilters && (
                <span className="text-[11px] text-[#B8860B] italic font-serif">
                  {t('catalog.resetFilters')}
                </span>
              )}
            </div>

          </motion.div>

        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* CATALOG GRID ITEMS DISPLAY SECTION                             */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-12 pb-24">
        <AsymmetricGallery
          items={items}
          filteredItems={filteredItems}
          onOpenItemDetail={onOpenItemDetail}
          onRequestInquiry={onRequestInquiry}
          hideHeader={true}
          hideControls={true}
        />
      </div>

    </div>
  );
}
