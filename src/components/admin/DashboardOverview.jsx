import React from 'react';
import { BookOpen, Mail, Plus, ArrowRight, Users, Star, Inbox } from 'lucide-react';

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
  const recentItems = [...items].reverse().slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in text-[#1C1A18] font-sans">
      
      {/* A. HERO WELCOME SECTION */}
      <div className="pb-5 border-b border-[#EBE7DF]">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#1C1A18] tracking-tight">
          Welkom terug, Fabrice
        </h1>
        <div className="flex flex-wrap gap-2.5 mt-3">
          <button
            onClick={onCreateNewItem}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-[#1C1A18] text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nieuw Stuk</span>
          </button>
          <button
            onClick={() => onNavigateTab('items')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-[#D8CEB8] text-[#1C1A18] text-xs font-bold transition-all flex items-center justify-center space-x-2 hover:border-[#C5A059] cursor-pointer min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>Collectie</span>
          </button>
        </div>
      </div>

      {/* B. METRIC CARDS (4-Column KPI Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* KPI 1: Total Catalog Items */}
        <div
          onClick={() => onNavigateTab('items')}
          className="group cursor-pointer p-4 sm:p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm hover:shadow-md hover:border-[#C5A059] transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-[#8C8478] tracking-wider leading-tight">Catalogus</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FDFBF7] border border-[#EBE7DF] flex items-center justify-center text-[#1C1A18] group-hover:bg-[#1C1A18] group-hover:text-[#C5A059] transition-colors shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1A18] tracking-tight">
              {items.length}
            </div>
            <div className="text-[10px] sm:text-xs text-[#8C8478] mt-0.5">{booksCount}b · {paintingsCount}k</div>
          </div>
        </div>

        {/* KPI 2: Topstukken (Featured Items) */}
        <div
          onClick={() => onNavigateTab('items')}
          className="group cursor-pointer p-4 sm:p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm hover:shadow-md hover:border-[#C5A059] transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-[#8C8478] tracking-wider leading-tight">Topstukken</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FDFBF7] border border-[#EBE7DF] flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-[#1C1A18] transition-colors shrink-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1A18] tracking-tight">
              {featuredCount}
            </div>
            <div className="text-[10px] sm:text-xs text-[#8C8478] mt-0.5">homepage uitgelicht</div>
          </div>
        </div>

        {/* KPI 3: Inquiries / Aanvragen */}
        <div
          onClick={() => onNavigateTab('inquiries')}
          className="group cursor-pointer p-4 sm:p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm hover:shadow-md hover:border-[#C5A059] transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-[#8C8478] tracking-wider leading-tight">Aanvragen</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FDFBF7] border border-[#EBE7DF] flex items-center justify-center text-[#1C1A18] group-hover:bg-[#1C1A18] group-hover:text-[#C5A059] transition-colors relative shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              {newInquiries.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#C5A059] border-2 border-white animate-pulse" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1A18] tracking-tight">{inquiries.length}</div>
            {newInquiries.length > 0 ? (
              <div className="text-[10px] sm:text-xs font-bold text-[#C5A059] mt-0.5">{newInquiries.length} nieuw</div>
            ) : (
              <div className="text-[10px] sm:text-xs text-[#8C8478] mt-0.5">alles verwerkt</div>
            )}
          </div>
        </div>

        {/* KPI 4: Customers / Verzamelaars Index */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="group cursor-pointer p-4 sm:p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm hover:shadow-md hover:border-[#C5A059] transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-[#8C8478] tracking-wider leading-tight">Klanten</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FDFBF7] border border-[#EBE7DF] flex items-center justify-center text-[#1C1A18] group-hover:bg-[#1C1A18] group-hover:text-[#C5A059] transition-colors shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1A18] tracking-tight">{uniqueCustomers}</div>
            <div className="text-[10px] sm:text-xs text-[#8C8478] mt-0.5">kopers & relaties</div>
          </div>
        </div>

      </div>

      {/* C. DATA LISTS & CATALOG MANAGEMENT (Two Column Structured Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Recente Aanvragen */}
        <div className="p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-base font-serif font-bold text-[#1C1A18]">
                  Recente Aanvragen
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('inquiries')}
                className="text-xs font-sans font-bold text-[#C5A059] hover:text-[#1C1A18] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>Bekijk alle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Structured Empty State or Inquiry List */}
            {newInquiries.length === 0 && recentInquiries.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3 bg-[#FDFBF7] rounded-xl border border-dashed border-[#EBE7DF] my-2">
                <div className="w-12 h-12 rounded-full bg-[#EBE7DF]/50 flex items-center justify-center mx-auto text-[#8C8478]">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-sans font-semibold text-[#1C1A18]">
                  Geen nieuwe aanvragen binnengekomen. U bent helemaal bij.
                </h4>
                <button
                  onClick={() => onNavigateTab('inquiries')}
                  className="px-4 py-2 rounded-lg bg-white border border-[#EBE7DF] text-[#1C1A18] hover:border-[#C5A059] text-xs font-sans font-semibold transition-all inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <span>Bekijk gearchiveerde aanvragen</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#EBE7DF]">
                {recentInquiries.map((inq, idx) => (
                  <div 
                    key={inq.id || idx}
                    onClick={() => onNavigateTab('inquiries')}
                    className="py-3.5 px-3 hover:bg-[#FDFBF7] rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-sans font-bold text-[#1C1A18] truncate">
                          {inq.name || 'Anonieme verzamelaar'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                          inq.status === 'Nieuw' 
                            ? 'bg-[#C5A059] text-[#1C1A18]' 
                            : inq.status === 'In behandeling' 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {inq.status || 'Nieuw'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6E675E] truncate mt-1">
                        Betreft: <span className="font-serif italic text-[#1C1A18]">{inq.itemTitle || 'Algemene vraag'}</span>
                      </p>
                    </div>

                    <span className="text-[11px] font-mono text-[#8C8478] shrink-0">
                      {inq.date || 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Laatst Toegevoegde Stukken */}
        <div className="p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-base font-serif font-bold text-[#1C1A18]">
                  Laatst Toegevoegde Stukken
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('items')}
                className="text-xs font-sans font-bold text-[#C5A059] hover:text-[#1C1A18] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>Beheer collectie &rarr;</span>
              </button>
            </div>

            {/* Vertical High-Density Item List with Divider Lines */}
            <div className="divide-y divide-[#EBE7DF]">
              {recentItems.map((item) => {
                const img = item.images?.[0]?.url || item.image || '/images/scarron-spines-white-bg.jpg';
                return (
                  <div 
                    key={item.id}
                    onClick={() => onNavigateTab('items')}
                    className="py-3 px-2 hover:bg-[#FDFBF7] rounded-lg transition-colors cursor-pointer flex items-center space-x-3.5"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-[#EBE7DF]">
                      <img src={img} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Inventory ID, Untruncated Title & Subtitle/Artist */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-[#8C8478] font-bold uppercase tracking-wider">
                          {item.ref || item.id}
                        </span>
                        {item.featured && (
                          <Star className="w-3 h-3 text-[#C5A059] fill-current" />
                        )}
                      </div>
                      <h4 className="text-xs font-sans font-bold text-[#1C1A18] leading-tight mt-0.5">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#6E675E] truncate mt-0.5 font-medium">
                        {item.author || item.century || 'Atelier Rembrandt'}
                      </p>
                    </div>

                    {/* Right-Aligned Price */}
                    <span className="text-xs font-sans font-bold text-[#1C1A18] shrink-0 text-right">
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
