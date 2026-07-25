import React from 'react';
import { BookOpen, Mail, Sparkles, Plus, ExternalLink, ArrowRight, Eye, Layers, CheckCircle2, Clock, Users, Star } from 'lucide-react';

export default function DashboardOverview({
  items = [],
  inquiries = [],
  onNavigateTab = () => {},
  onCreateNewItem = () => {},
  onOpenLiveSite = () => {}
}) {
  const booksCount = items.filter(i => (i.itemType || 'book') === 'book').length;
  const paintingsCount = items.filter(i => i.itemType === 'painting').length;
  const featuredCount = items.filter(i => i.featured).length;

  const newInquiries = inquiries.filter(i => i.status === 'Nieuw');
  
  // Unique customers by email or name
  const uniqueCustomers = Array.from(
    new Set(inquiries.map(i => i.email || i.name).filter(Boolean))
  ).length;

  const recentInquiries = [...inquiries].reverse().slice(0, 4);
  const recentItems = [...items].reverse().slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in text-[#111111]">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1A1917] via-[#2A2825] to-[#1A1917] text-white p-6 sm:p-8 shadow-xl border border-[#333333]">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 text-[#D4AF37] text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fabrice Atelier Beheersysteem</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              Welkom terug, Fabrice
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl mt-1.5 leading-relaxed font-sans">
              Beheer uw antiquarische boekencollectie, historische kunstwerken en binnengekomen aanvragen van internationale verzamelaars.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onCreateNewItem}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#a37609] hover:to-[#c49f2c] text-white text-xs font-serif font-bold shadow-lg transition-all flex items-center space-x-2 group hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>+ Nieuw Stuk Invoeren</span>
            </button>

            <button
              onClick={() => onNavigateTab('items')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-serif font-bold transition-all flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              <span>Bekijk Collectie</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Collection */}
        <div 
          onClick={() => onNavigateTab('items')}
          className="group cursor-pointer p-5 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm hover:shadow-md hover:border-[#111111]/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#666666] tracking-wider">Catalogus</span>
            <div className="w-9 h-9 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] flex items-center justify-center text-[#111111] group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#111111]">
              {items.length} <span className="text-xs font-mono font-normal text-[#666666]">objecten</span>
            </div>
            <div className="mt-2 flex items-center space-x-3 text-xs text-[#555555]">
              <span className="inline-flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#B8860B]" />
                <span>{booksCount} Boeken</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#4A6B5D]" />
                <span>{paintingsCount} Kunst</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Featured / Topstukken */}
        <div 
          onClick={() => onNavigateTab('items')}
          className="group cursor-pointer p-5 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm hover:shadow-md hover:border-[#111111]/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#666666] tracking-wider">Topstukken</span>
            <div className="w-9 h-9 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] flex items-center justify-center text-[#B8860B] group-hover:bg-[#B8860B] group-hover:text-white transition-colors">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#111111]">
              {featuredCount} <span className="text-xs font-mono font-normal text-[#666666]">uitgelicht</span>
            </div>
            <p className="mt-2 text-xs text-[#555555]">
              Getoond in de vitrine op de homepage
            </p>
          </div>
        </div>

        {/* Card 3: Inquiries */}
        <div 
          onClick={() => onNavigateTab('inquiries')}
          className="group cursor-pointer p-5 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm hover:shadow-md hover:border-[#111111]/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#666666] tracking-wider">Aanvragen</span>
            <div className="w-9 h-9 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] flex items-center justify-center text-[#111111] group-hover:bg-[#111111] group-hover:text-white transition-colors relative">
              <Mail className="w-4 h-4" />
              {newInquiries.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#B8860B] border-2 border-white animate-pulse" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#111111]">
              {inquiries.length} <span className="text-xs font-mono font-normal text-[#666666]">totaal</span>
            </div>
            <div className="mt-2 flex items-center space-x-2 text-xs">
              {newInquiries.length > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-[#B8860B]/10 text-[#B8860B] font-bold">
                  {newInquiries.length} nieuw / onbehandeld
                </span>
              ) : (
                <span className="text-[#666666]">Alle aanvragen verwerkt</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Customers / Verzamelaars */}
        <div 
          onClick={() => onNavigateTab('customers')}
          className="group cursor-pointer p-5 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm hover:shadow-md hover:border-[#111111]/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#666666] tracking-wider">Verzamelaars</span>
            <div className="w-9 h-9 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] flex items-center justify-center text-[#111111] group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#111111]">
              {uniqueCustomers} <span className="text-xs font-mono font-normal text-[#666666]">contacten</span>
            </div>
            <p className="mt-2 text-xs text-[#555555]">
              Geïnteresseerde kopers & verzamelaars
            </p>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Recent Inquiries & Collection Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Recent Inquiries Widget */}
        <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#B8860B]" />
                <h3 className="text-base font-serif font-bold text-[#111111]">
                  Recente Aanvragen
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('inquiries')}
                className="text-xs font-serif font-bold text-[#B8860B] hover:text-[#111111] flex items-center space-x-1 transition-colors"
              >
                <span>Bekijk alle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentInquiries.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#888888]">
                Nog geen aanvragen geregistreerd.
              </div>
            ) : (
              <div className="space-y-3">
                {recentInquiries.map((inq, idx) => (
                  <div 
                    key={inq.id || idx}
                    onClick={() => onNavigateTab('inquiries')}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE4D8] hover:border-[#B8860B]/50 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-serif font-bold text-[#111111] truncate">
                          {inq.name || 'Anonieme verzamelaar'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          inq.status === 'Nieuw' 
                            ? 'bg-[#B8860B] text-white' 
                            : inq.status === 'In behandeling' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {inq.status || 'Nieuw'}
                        </span>
                      </div>
                      <p className="text-xs text-[#555555] truncate mt-0.5">
                        Betreft: <span className="font-serif italic font-medium">{inq.itemTitle || 'Algemene vraag'}</span>
                      </p>
                    </div>

                    <span className="text-[11px] font-mono text-[#888888] shrink-0">
                      {inq.date || 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Recent Collection Additions */}
        <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 text-[#B8860B]" />
                <h3 className="text-base font-serif font-bold text-[#111111]">
                  Laatst Toegevoegde Stukken
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('items')}
                className="text-xs font-serif font-bold text-[#B8860B] hover:text-[#111111] flex items-center space-x-1 transition-colors"
              >
                <span>Beheer collectie</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentItems.map((item) => {
                const img = item.images?.[0]?.url || item.image || '/images/scarron-spines-white-bg.jpg';
                return (
                  <div 
                    key={item.id}
                    onClick={() => onNavigateTab('items')}
                    className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE4D8] hover:border-[#111111]/40 transition-all cursor-pointer flex items-center space-x-3.5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-stone-200 overflow-hidden shrink-0 border border-[#D8CEB8]">
                      <img src={img} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-[#888888] font-bold">
                          {item.ref || item.id}
                        </span>
                        {item.featured && (
                          <Star className="w-3 h-3 text-[#B8860B] fill-current" />
                        )}
                      </div>
                      <h4 className="text-xs font-serif font-bold text-[#111111] truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#666666] truncate">
                        {item.author || item.century || 'Fabrice Atelier'}
                      </p>
                    </div>

                    <span className="text-xs font-serif font-bold text-[#111111] shrink-0">
                      {item.price || 'Prijs op aanvraag'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
