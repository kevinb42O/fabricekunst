import React, { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COPY = {
  nl: { collection: 'Collecties', search: 'Zoek in de collecties', filters: 'Filter en sorteer', sort: 'Sorteren', refine: 'Verfijn de collecties', apply: 'Toon resultaten', clear: 'Wis alles', clearSearch: 'Zoekopdracht wissen', close: 'Filters sluiten', active: 'actief' },
  en: { collection: 'Collections', search: 'Search the collections', filters: 'Filter and sort', sort: 'Sort', refine: 'Refine the collections', apply: 'Show results', clear: 'Clear all', clearSearch: 'Clear search', close: 'Close filters', active: 'active' },
  fr: { collection: 'Collections', search: 'Rechercher dans les collections', filters: 'Filtrer et trier', sort: 'Trier', refine: 'Affiner les collections', apply: 'Afficher les résultats', clear: 'Tout effacer', clearSearch: 'Effacer la recherche', close: 'Fermer les filtres', active: 'actifs' }
};

export default function MobileCatalogControls({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  activeFilters,
  resetFilters,
  hasActiveFilters,
  sections,
  isOpen,
  setIsOpen
}) {
  const { language, t } = useLanguage();
  const labels = COPY[language] || COPY.en;
  const sheetId = useId();
  const closeButtonRef = useRef(null);
  const triggerButtonRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(focusFrame);
      triggerButtonRef.current?.focus();
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="lg:hidden">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#D8CEB8]/70 pb-4">
        <div>
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8E7035]">
            {t('catalog.heroTagline')}
          </span>
          <div className="mt-1 font-serif text-[2rem] font-bold leading-none text-[#111111]">
            {labels.collection}
          </div>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex min-h-11 items-center gap-2 px-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B5A41]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {labels.clear}
          </button>
        )}
      </div>

      <label htmlFor="mobile-catalog-search" className="sr-only">
        {t('nav.search')}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7035]" />
        <input
          id="mobile-catalog-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={labels.search}
          className="min-h-12 w-full rounded-none border border-[#D8CEB8] bg-[#FAF7F2] py-3 pl-11 pr-12 font-sans text-sm text-[#111111] placeholder:text-[#776D62] focus:border-[#8E7035] focus:bg-white focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label={labels.clearSearch}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#5B5147]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3">
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls={sheetId}
          className="flex min-h-12 w-full items-center justify-between border border-[#1C1A17] bg-white px-4 font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-[#1C1A17]"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#8E7035]" />
            {labels.filters}
          </span>
          {activeFilters.length > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1C1A17] px-1 text-[10px] text-white">
              {activeFilters.length}
            </span>
          )}
        </button>

      </div>

      {activeFilters.length > 0 && (
        <div className="mobile-filter-chips mt-4 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.clear}
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-[#D8CEB8] bg-[#FAF7F2] px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3E352D]"
            >
              <span>{filter.label}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={sheetRef}
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-label={labels.filters}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/45"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col rounded-t-[1.5rem] bg-[#FFFEFC] shadow-[0_-20px_60px_rgba(46,35,24,0.18)]"
            >
              <div className="flex items-center justify-between border-b border-[#D8CEB8] px-5 py-4">
                <div>
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8E7035]">
                    {activeFilters.length > 0 ? `${activeFilters.length} ${labels.active}` : labels.refine}
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#111111]">{labels.filters}</h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={labels.close}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8CEB8] bg-white text-[#111111]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6">
                {sections.filter(Boolean).map((section) => (
                  <fieldset key={section.key}>
                    <legend className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E7035]">
                      {section.title}
                    </legend>
                    <div className="space-y-1">
                      {section.options.map((option) => {
                        const selected = section.value === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={option.disabled}
                            onClick={() => section.onSelect(option.value)}
                            aria-pressed={selected}
                            className={`flex min-h-12 w-full items-center justify-between border-b px-1 text-left font-serif text-base transition-colors ${
                              selected
                                ? 'border-[#8E7035] font-semibold text-[#111111]'
                                : 'border-[#E8DFCF] text-[#51483F]'
                            } disabled:opacity-35`}
                          >
                            <span>{option.label}</span>
                            {selected && <Check className="h-4 w-4 text-[#8E7035]" />}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}

                <fieldset>
                  <legend className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E7035]">
                    {labels.sort}
                  </legend>
                  <div className="space-y-1">
                    {[
                      ['standaard', t('catalog.sortStandard')],
                      ['jaar-asc', t('catalog.sortYearAsc')],
                      ['jaar-desc', t('catalog.sortYearDesc')],
                      ['auteur-asc', t('catalog.sortAuthorAsc')],
                      ['titel-asc', t('catalog.sortTitleAsc')],
                      ['prijs-asc', t('catalog.sortPriceAsc')],
                      ['prijs-desc', t('catalog.sortPriceDesc')]
                    ].map(([value, label]) => {
                      const selected = sortBy === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSortBy(value)}
                          aria-pressed={selected}
                          className={`flex min-h-12 w-full items-center justify-between border-b px-1 text-left font-serif text-base ${selected ? 'border-[#8E7035] font-semibold text-[#111111]' : 'border-[#E8DFCF] text-[#51483F]'}`}
                        >
                          <span>{label}</span>
                          {selected && <Check className="h-4 w-4 text-[#8E7035]" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="grid grid-cols-[0.8fr_1.2fr] gap-3 border-t border-[#D8CEB8] bg-[#FAF7F2] px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-12 border border-[#BDAE91] bg-white px-3 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A4037]"
                >
                  {labels.clear}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-12 bg-[#1C1A17] px-3 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                >
                  {labels.apply}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
