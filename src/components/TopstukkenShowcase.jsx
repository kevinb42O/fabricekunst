import React, { useState } from 'react';
import { Eye, BookOpen, Sparkles, CheckCircle2, Bookmark } from 'lucide-react';

export default function TopstukkenShowcase({ onSelectItem }) {
  const [activeVoltaireImage, setActiveVoltaireImage] = useState(0);
  const [activeScarronImage, setActiveScarronImage] = useState(0);

  const voltaireImages = [
    { url: "/images/voltaire-52-books-birds-eye.jpg", title: "Volledige 52-delige Reeks (Vogelvlucht)" },
    { url: "/images/voltaire-presentation-overlay.jpg", title: "Ex-Libris Vacheron-Poinsot & Portret" },
    { url: "/images/voltaire-marbled-endpaper-exlibris.jpg", title: "Macro Marmerpapier & Ex-Libris Detail" },
    { url: "/images/voltaire-lit-bookcase-desk.jpg", title: "Collectie in Verlichte Boekenkast" }
  ];

  const scarronImages = [
    { url: "/images/scarron-candlelight-hero.jpg", title: "Sfeerbeeld bij Kaarslicht & Globe" },
    { url: "/images/scarron-engraving-titlepage.jpg", title: "Frontispice Kopergravure (1713)" },
    { url: "/images/scarron-spines-white-bg.jpg", title: "Lederen Ruggen & Goudstempels" }
  ];

  return (
    <section id="topstukken" className="py-24 bg-white relative border-b border-[#D8CEB8]">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] mb-3 px-4 py-1.5 rounded-full bg-[#FAF7F2] border border-[#B8860B]/30 shadow-sm font-mono">
            <Sparkles className="w-4 h-4 text-[#B8860B]" />
            <span>Exclusieve Uitlichtingen</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#111111] tracking-tight mb-4">
            De Huidige Topstukken van de Collectie
          </h2>
          <p className="text-[#333333] font-serif font-light text-base sm:text-lg">
            Ontdek twee van de meest zeldzame en esthetisch indrukwekkende meesterwerken uit de privéverzameling van Atelier Rembrandt.
          </p>
        </div>

        {/* TOPSTUK 1: VOLTAIRE COMPLETE WERKEN */}
        <div className="mb-20 bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 border-2 border-[#D8CEB8] shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Visual Showcase */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-white border border-[#D8CEB8] aspect-[4/3] shadow-inner group">
              <img 
                src={voltaireImages[activeVoltaireImage].url} 
                alt={voltaireImages[activeVoltaireImage].title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-white font-serif">
                  {voltaireImages[activeVoltaireImage].title}
                </span>
                <span className="text-[10px] font-bold tracking-wider text-white uppercase px-2.5 py-1 rounded bg-[#111111]">
                  52 Delen Compleet
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {voltaireImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveVoltaireImage(idx)}
                  className={`rounded-xl overflow-hidden border-2 aspect-video transition-all duration-300 ${
                    activeVoltaireImage === idx ? 'border-[#111111] scale-105 shadow-sm' : 'border-[#D8CEB8] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Deep Details & Provenance */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] text-xs font-bold tracking-wider uppercase font-mono">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Rood Shagreen Halfleer (1829–1833)</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-serif font-bold text-[#111111] leading-tight">
              Voltaire — Œuvres Complètes
            </h3>

            <p className="text-sm sm:text-base text-[#333333] leading-relaxed font-light font-sans">
              De monumentale en complete 52-delige reeks uitgegeven te Parijs (Lecointe / Didot). Gebonden in rood shagreen halfleer met rijke goudstempels op de ruggen.
            </p>

            {/* Provenance Box */}
            <div className="p-4 rounded-xl bg-white border border-[#D8CEB8] space-y-2 shadow-sm">
              <div className="flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B]" />
                <span>Bewezen Herkomst (Provenance)</span>
              </div>
              <p className="text-xs text-[#333333] italic leading-relaxed font-serif">
                "Ex-libris Vacheron-Poinsot: Origineel ingeplakt kopergegraveerd heraldiek vignet op de binnenzijde van het handgemaakte marmeren schutblad."
              </p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#D8CEB8]">
                <span className="text-[#666666] block text-[10px] uppercase font-bold font-mono">Omvang</span>
                <span className="text-[#111111] font-bold font-serif text-sm">52 Delen (Compleet)</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#D8CEB8]">
                <span className="text-[#666666] block text-[10px] uppercase font-bold font-mono">Drukker / Jaar</span>
                <span className="text-[#111111] font-bold font-serif text-sm">Parijs, 1829–1833</span>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => onSelectItem('voltaire-1829-52delig')}
              className="w-full py-3.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs uppercase tracking-widest border border-[#B8860B]/40 hover:border-[#B8860B] transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>Bekijk Volledige Details & Galerij</span>
            </button>
          </div>

        </div>

        {/* TOPSTUK 2: LES ŒUVRES DE MONSIEUR SCARRON (1713) */}
        <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 border-2 border-[#D8CEB8] shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Text & Specifications */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/30 text-[#8E7035] text-xs font-bold tracking-wider uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>18e-Eeuwse Editie (Amsterdam, 1713)</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-serif font-bold text-[#111111] leading-tight">
              Les Œuvres de Monsieur Scarron
            </h3>

            <p className="text-sm sm:text-base text-[#333333] leading-relaxed font-light font-sans">
              Zeldzame 3-delige vroege editie gedrukt te Amsterdam. Bevat de befaamde frontispice kopergravure en handgemaakte marmeren schutbladen in origineel 18e-eeuws kalfsleer.
            </p>

            {/* Artistic Highlights */}
            <div className="space-y-2.5">
              <div className="flex items-start space-x-3 text-xs text-[#333333] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <span>Haarscherpe kopergravures van het portret van Paul Scarron.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-[#333333] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <span>Originele handgemaakte marmeren schutbladen in uitstekende staat.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-[#333333] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <span>Goudgestempelde ribben en titellabels op de ruggen.</span>
              </div>
            </div>

            {/* Price & Ref */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#D8CEB8] shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#666666] block font-mono">Indicatieve Taxatie</span>
                <span className="text-xl font-serif font-bold text-[#B8860B]">€ 2.850</span>
              </div>
              <span className="text-xs font-mono text-[#111111] font-bold px-3 py-1 rounded bg-[#FAF7F2] border border-[#D8CEB8]">
                Ref: FB-1713-SCA
              </span>
            </div>

            {/* Action */}
            <button
              onClick={() => onSelectItem('scarron-1713-oeuvres')}
              className="w-full py-3.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs uppercase tracking-widest border border-[#B8860B]/40 hover:border-[#B8860B] transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>Bekijk Details & Gravure</span>
            </button>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden bg-white border border-[#D8CEB8] aspect-[4/3] shadow-inner group">
              <img 
                src={scarronImages[activeScarronImage].url} 
                alt={scarronImages[activeScarronImage].title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-white font-serif">
                  {scarronImages[activeScarronImage].title}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-3">
              {scarronImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveScarronImage(idx)}
                  className={`rounded-xl overflow-hidden border-2 aspect-video transition-all duration-300 ${
                    activeScarronImage === idx ? 'border-[#111111] scale-105 shadow-sm' : 'border-[#D8CEB8] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
