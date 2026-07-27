import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Award, Compass, ShieldCheck, Feather, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PROVENANCE_VISUALS = [
  {
    id: 'bookcase',
    title: 'De Antiquariaats-Bibliotheek',
    subtitle: 'Historische boekenkast met sfeerverlichting en zeldzame banden',
    image: '/images/voltaire-lit-bookcase-desk.jpg',
    quote: '"Een antiek boek is meer dan papier en goudstempels op shagreen; het is een tijdscapsule van ideeën met de menselijke ziel van haar vroegere bezitters."'
  },
  {
    id: 'theatre',
    title: 'Théâtre de Voltaire & Buste',
    subtitle: 'Originele uitgave uit 1829 met marmeren buste en antieke messing leesbril',
    image: '/images/voltaire-theatre-bust-reading-glasses.jpg',
    quote: '"De combinatie van historische documenten en adellijke herkomst vormt de absolute top van bibliofilie."'
  },
  {
    id: 'exlibris',
    title: 'Ex-Libris Vacheron-Poinsot',
    subtitle: 'Handgemaakt marmeren schutblad met authentiek heraldiek eigendomsstempel',
    image: '/images/voltaire-marbled-endpaper-exlibris.jpg',
    quote: '"Eigendomssporen vertellen het ononderbroken verhaal van 19e-eeuwse Franse kunstverzamelaars."'
  }
];

export default function AboutProvenance({ onRequestConsultation }) {
  const { t } = useLanguage();
  const [activeVisualIndex, setActiveVisualIndex] = useState(0);
  const activeVisual = PROVENANCE_VISUALS[activeVisualIndex];

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const glowY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <section 
      ref={sectionRef} 
      id="herkomst" 
      className="relative bg-[#0F0E0C] text-[#FAF7F2] py-24 sm:py-32 overflow-hidden border-b border-[#2A2620]"
    >
      {/* Smooth top gradient transition */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#FAF7F2] via-[#0F0E0C]/80 to-transparent pointer-events-none z-10" />

      {/* Ambient background glow with scroll motion */}
      <motion.div 
        style={{ y: glowY }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#B8860B]/12 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        style={{ y: glowY }}
        className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[120px] pointer-events-none" 
      />
      
      {/* Decorative hairline grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#D4AF37 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16"
      >
        
        {/* SECOND HERO HEADER BAR */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#2A2620] pb-8 gap-6">
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-3 text-[#D4AF37] text-xs font-mono font-bold tracking-[0.3em] uppercase"
            >
              <span className="w-8 h-px bg-[#D4AF37]" />
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>{t('provenance.heroBadge')}</span>
            </motion.div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.1]">
              {t('provenance.heroTitle')}
            </h2>
          </div>


          <p className="text-[#C5BBAA] font-serif font-light text-base sm:text-lg max-w-xl leading-relaxed lg:pb-1">
            Elk stuk in de collectie van Atelier Rembrandt wordt geselecteerd op basis van drie onberispelijke criteria: historische zeldzaamheid, esthetische staat van de band, en een aantoonbare herkomst.
          </p>
        </div>

        {/* SECOND HERO MAIN CONTENT STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Visual Showcase Stage */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Stage Photography Container with Scroll Parallax */}
            <motion.div 
              style={{ y: imageY }}
              className="relative h-[440px] sm:h-[520px] w-full overflow-hidden shadow-2xl group rounded-sm border border-[#2A2620]"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeVisual.id}
                  initial={{ opacity: 0.4, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1.0 }}
                  exit={{ opacity: 0.3 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  src={activeVisual.image}
                  alt={activeVisual.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-[0.92] contrast-[1.05]"
                />
              </AnimatePresence>
              
              {/* Vignetting */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C] via-transparent to-black/30" />

              {/* Integrated Editorial Quote Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-[#0F0E0C] via-[#0F0E0C]/90 to-transparent">
                <div className="flex items-start space-x-4 border-l-2 border-[#D4AF37] pl-4 sm:pl-6">
                  <Feather className="w-5 h-5 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base text-[#E8DFD1] italic font-serif leading-relaxed">
                      {activeVisual.quote}
                    </p>
                    <span className="block text-[11px] text-[#D4AF37] font-bold uppercase tracking-widest font-mono mt-2">
                      — Atelier Rembrandt
                    </span>
                  </div>
                </div>
              </div>

              {/* Tag indicator */}
              <div className="absolute top-6 left-6 bg-[#0F0E0C]/85 backdrop-blur-md px-3.5 py-1.5 border border-[#D4AF37]/30 text-xs font-mono text-[#D4AF37]">
                0{activeVisualIndex + 1} / 03
              </div>
            </motion.div>

            {/* Seamless Visual Switcher Tabs */}
            <div className="grid grid-cols-3 gap-3">
              {PROVENANCE_VISUALS.map((vis, idx) => (
                <button
                  key={vis.id}
                  onClick={() => setActiveVisualIndex(idx)}
                  className={`text-left p-3.5 transition-all duration-300 border-t-2 relative flex flex-col justify-between cursor-pointer ${
                    idx === activeVisualIndex
                      ? 'border-[#D4AF37] bg-white/5 text-white'
                      : 'border-[#2A2620] bg-transparent text-[#999999] hover:text-[#E8DFD1] hover:border-[#666666]'
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#D4AF37] font-bold tracking-widest block uppercase mb-1">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-serif font-medium line-clamp-1 block">
                    {vis.title}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Narrative & Provenance Pillars */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Pillar 01 */}
            <motion.div 
              whileHover={{ x: 8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 relative border-l-2 border-[#D4AF37]/80 pl-6 py-1 hover:border-[#D4AF37] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-[#D4AF37] font-bold tracking-wider uppercase">
                  Pijler 01
                </span>
                <span className="h-px w-6 bg-[#2A2620]" />
                <div className="flex items-center space-x-1.5 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certificering</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide group-hover:text-[#D4AF37] transition-colors">
                Gegarandeerde Echtheid
              </h3>

              <p className="text-sm text-[#C5BBAA] font-serif font-light leading-relaxed">
                Bij elk topstuk wordt een gedetailleerd certificaat van herkomst geleverd, inclusief fysieke analyse van papierkwaliteit, watermerken, bindingstechniek en historische drukgegevens.
              </p>
            </motion.div>

            {/* Pillar 02 */}
            <motion.div 
              whileHover={{ x: 8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 relative border-l-2 border-[#D4AF37]/80 pl-6 py-1 hover:border-[#D4AF37] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-[#D4AF37] font-bold tracking-wider uppercase">
                  Pijler 02
                </span>
                <span className="h-px w-6 bg-[#2A2620]" />
                <div className="flex items-center space-x-1.5 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Adellijke Herkomst</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide group-hover:text-[#D4AF37] transition-colors">
                Ex-Libris &amp; Eigendomssporen
              </h3>

              <p className="text-sm text-[#C5BBAA] font-serif font-light leading-relaxed">
                Zeldzame stukken zoals onze 52-delige Voltaire-reeks bevatten het befaamde Vacheron-Poinsot heraldiek ex-libris, waarmee de herkomst onafgebroken teruggaat tot 19e-eeuwse Franse topverzamelaars.
              </p>
            </motion.div>

            {/* Pillar 03 */}
            <motion.div 
              whileHover={{ x: 8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 relative border-l-2 border-[#D4AF37]/80 pl-6 py-1 hover:border-[#D4AF37] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-[#D4AF37] font-bold tracking-wider uppercase">
                  Pijler 03
                </span>
                <span className="h-px w-6 bg-[#2A2620]" />
                <div className="flex items-center space-x-1.5 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
                  <Feather className="w-4 h-4" />
                  <span>Persoonlijke Begeleiding</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide group-hover:text-[#D4AF37] transition-colors">
                Discreet Advies voor Verzamelaars
              </h3>

              <p className="text-sm text-[#C5BBAA] font-serif font-light leading-relaxed">
                Of u nu een particuliere bibliofiel bent of een institutionele verzameling uitbouwt: Atelier Rembrandt biedt persoonlijk advies bij aankoop, conservering en waardebepaling.
              </p>
            </motion.div>

            {/* GRAND HERO CTA BUTTON */}
            <div className="pt-6">
              <motion.button
                whileHover={{ scale: 1.025, backgroundColor: "#D4AF37", color: "#0F0E0C" }}
                whileTap={{ scale: 0.97 }}
                onClick={onRequestConsultation}
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-[#1C1A17] text-[#FAF7F2] font-serif text-sm sm:text-base font-semibold tracking-wide border border-[#D4AF37]/60 hover:border-[#D4AF37] shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <span>Plan een Privé-Bezichtiging met Atelier Rembrandt</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-[#0F0E0C] group-hover:translate-x-1 transition-all duration-300" />
              </motion.button>
            </div>

          </div>

        </div>

      </motion.div>

    </section>
  );
}
