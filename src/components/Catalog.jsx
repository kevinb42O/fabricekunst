import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, ChevronRight, Eye, ShieldCheck } from 'lucide-react';

export default function Catalog({ items, onSelectItem, onRequestInquiry }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCentury, setSelectedCentury] = useState('Alle');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [selectedStatus, setSelectedStatus] = useState('Alle');

  const centuries = ['Alle', '17e Eeuw', '18e Eeuw', '19e Eeuw'];
  const categories = ['Alle', 'Literatuur & Filosofie', 'Literatuur & Satire', 'Wetenschap & Illustraties', 'Kartografie & Reizen'];
  const statuses = ['Alle', 'Beschikbaar', 'Gereserveerd', 'Verkocht'];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCentury = selectedCentury === 'Alle' || item.century === selectedCentury;
      const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'Alle' || item.status === selectedStatus;

      return matchesSearch && matchesCentury && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCentury, selectedCategory, selectedStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Beschikbaar':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Beschikbaar</span>
          </span>
        );
      case 'Gereserveerd':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Gereserveerd</span>
          </span>
        );
      case 'Verkocht':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-charcoal-surface border border-shagreen/50 text-shagreen-light text-[11px] font-semibold tracking-wider uppercase opacity-80">
            <span className="w-1.5 h-1.5 rounded-full bg-shagreen-light" />
            <span>Archief (Verkocht)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section id="catalogus" className="py-24 bg-charcoal relative">
      <div className="page-shell-wide">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-gold text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            <BookOpen className="w-4 h-4" />
            <span>Gecureerd Overzicht</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-parchment tracking-tight mb-4">
            De Exclusieve Collecties
          </h2>
          <p className="text-parchment-muted font-light text-base sm:text-lg">
            Verken de zeldzame boekbanden, kopergravures en verlichtingsgeschriften in onze collectie.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel rounded-2xl p-6 mb-12 border-gold/20 space-y-6">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-parchment-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op titel, auteur, referentiecode of trefwoord (bijv. Voltaire, Scarron, Ex-Libris)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-charcoal-surface border border-gold/20 text-parchment placeholder-parchment-dark focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-parchment-dark hover:text-gold"
              >
                Wis
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-gold/10">
            
            {/* Eeuw Filter */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gold block mb-2">
                Eeuw
              </label>
              <div className="flex flex-wrap gap-2">
                {centuries.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCentury(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCentury === c
                        ? 'bg-gold text-charcoal font-semibold shadow-gold-glow'
                        : 'bg-charcoal-surface text-parchment-muted hover:text-parchment border border-gold/10'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Categorie Filter */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gold block mb-2">
                Categorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-charcoal-surface border border-gold/20 text-parchment text-xs focus:outline-none focus:border-gold"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-charcoal text-parchment">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gold block mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedStatus === st
                        ? 'bg-gold text-charcoal font-semibold shadow-gold-glow'
                        : 'bg-charcoal-surface text-parchment-muted hover:text-parchment border border-gold/10'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-8 px-2 text-xs text-parchment-muted">
          <span>{filteredItems.length} meesterwerken gevonden</span>
          {(searchQuery || selectedCentury !== 'Alle' || selectedCategory !== 'Alle' || selectedStatus !== 'Alle') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCentury('Alle');
                setSelectedCategory('Alle');
                setSelectedStatus('Alle');
              }}
              className="text-gold hover:underline"
            >
              Reset alle filters
            </button>
          )}
        </div>

        {/* Catalog Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl border-gold/20">
            <BookOpen className="w-12 h-12 text-gold/40 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-parchment mb-2">Geen stukken gevonden</h3>
            <p className="text-sm text-parchment-muted max-w-md mx-auto mb-6">
              Er zijn geen antiquarische items die voldoen aan je gekozen zoekcriteria. Probeer je zoekopdracht of filters aan te passen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group border-gold/20"
              >
                {/* Image & Status Badge */}
                <div className="relative aspect-[4/3] bg-charcoal-surface overflow-hidden">
                  <img
                    src={item.images[0]?.url || "/images/scarron-spines-white-bg.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 z-10">
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded bg-charcoal/80 backdrop-blur-md border border-gold/30 text-[10px] font-mono text-gold-light">
                      {item.ref}
                    </span>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-60" />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-[11px] font-semibold text-gold uppercase tracking-wider mb-1.5">
                      <span>{item.century}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>

                    <h3 className="text-xl font-serif font-bold text-parchment group-hover:text-gold-light transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-parchment-dark mt-1 font-serif italic">
                      {item.author} ({item.year})
                    </p>

                    <p className="text-xs text-parchment-muted mt-3 line-clamp-2 leading-relaxed font-light">
                      {item.subtitle || item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gold/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-parchment-dark">Waarde / Prijs:</span>
                      <span className="font-serif font-bold text-parchment text-sm">
                        {item.price}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectItem(item.id)}
                        className="py-2 px-3 rounded-lg bg-charcoal-surface hover:bg-gold/10 border border-gold/30 text-parchment hover:text-gold text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => onRequestInquiry(item)}
                        disabled={item.status === 'Verkocht'}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                          item.status === 'Verkocht'
                            ? 'bg-charcoal text-parchment-dark cursor-not-allowed border border-gold/10'
                            : 'bg-gold text-charcoal hover:bg-gold-light shadow-gold-glow'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{item.status === 'Verkocht' ? 'Verkocht' : 'Aanvragen'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
