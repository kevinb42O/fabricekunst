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

  const provenanceVisuals = [
    {
      id: 'bookcase',
      title: t('provenance.visuals.v1_title'),
      subtitle: t('provenance.visuals.v1_sub'),
      image: '/images/voltaire-lit-bookcase-desk.jpg',
      quote: t('provenance.visuals.v1_quote')
    },
    {
      id: 'theatre',
      title: t('provenance.visuals.v2_title'),
      subtitle: t('provenance.visuals.v2_sub'),
      image: '/images/voltaire-theatre-bust-reading-glasses.jpg',
      quote: t('provenance.visuals.v2_quote')
    },
    {
      id: 'exlibris',
      title: t('provenance.visuals.v3_title'),
      subtitle: t('provenance.visuals.v3_sub'),
      image: '/images/voltaire-marbled-endpaper-exlibris.jpg',
      quote: t('provenance.visuals.v3_quote')
    }
  ];

  const activeVisual = provenanceVisuals[activeVisualIndex] || provenanceVisuals[0];

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
      className="relative bg-transparent text-[#111111] py-24 sm:py-32 overflow-hidden"
    >
      {/* Ambient background glow with scroll motion */}
      <motion.div 
        style={{ y: glowY }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#B8860B]/4 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        style={{ y: glowY }}
        className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-[#B8860B]/3 rounded-full blur-[120px] pointer-events-none" 
      />
      
      {/* Decorative hairline grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.2] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#B8860B 1px, transparent 1px)`,
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#D8CEB8] pb-8 gap-6">
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-3 text-[#B8860B] text-xs font-mono font-bold tracking-[0.3em] uppercase"
            >
              <span className="w-8 h-px bg-[#B8860B]" />
              <Award className="w-4 h-4 text-[#B8860B]" />
              <span>{t('provenance.heroBadge')}</span>
            </motion.div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.1]">
              {t('provenance.heroTitle')}
            </h2>
          </div>


          <p className="text-[#333333] font-serif font-light text-base sm:text-lg max-w-xl leading-relaxed lg:pb-1">
            {t('provenance.sectionDesc')}
          </p>
        </div>

        {/* SECOND HERO MAIN CONTENT STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Visual Showcase Stage */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Stage Photography Container with Scroll Parallax */}
            <motion.div 
              style={{ y: imageY }}
              className="relative h-[440px] sm:h-[520px] w-full overflow-hidden shadow-2xl group rounded-sm border border-[#D8CEB8]"
            >
              <div className="absolute inset-0 w-full h-full">
                {provenanceVisuals.map((vis, idx) => (
                  <div
                    key={vis.id}
                    className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out transform-gpu"
                    style={{
                      opacity: idx === activeVisualIndex ? 1 : 0,
                      pointerEvents: idx === activeVisualIndex ? 'auto' : 'none',
                      zIndex: idx === activeVisualIndex ? 1 : 0,
                    }}
                  >
                    <img
                      src={vis.image}
                      alt={vis.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-[0.92] contrast-[1.05] transform-gpu"
                    />
                  </div>
                ))}
              </div>
              
              {/* Vignetting */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              {/* Integrated Editorial Quote Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                <div className="flex items-start space-x-4 border-l-2 border-[#B8860B] pl-4 sm:pl-6">
                  <Feather className="w-5 h-5 text-[#B8860B] shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base text-[#FAF7F2] italic font-serif leading-relaxed">
                      {activeVisual.quote}
                    </p>
                    <span className="block text-[11px] text-[#B8860B] font-bold uppercase tracking-widest font-mono mt-2">
                      — Atelier Rembrandt
                    </span>
                  </div>
                </div>
              </div>

              {/* Tag indicator */}
              <div className="absolute top-6 left-6 bg-[#1C1A17]/90 backdrop-blur-md px-3.5 py-1.5 border border-[#B8860B]/30 text-xs font-mono text-[#B8860B]">
                0{activeVisualIndex + 1} / 03
              </div>
            </motion.div>

            {/* Seamless Visual Switcher Tabs */}
            <div className="grid grid-cols-3 gap-3">
              {provenanceVisuals.map((vis, idx) => (
                <button
                  key={vis.id}
                  onClick={() => setActiveVisualIndex(idx)}
                  className={`text-left p-3.5 transition-all duration-300 border-t-2 relative flex flex-col justify-between cursor-pointer ${
                    idx === activeVisualIndex
                      ? 'border-[#B8860B] bg-[#1C1A17]/5 text-[#111111]'
                      : 'border-[#D8CEB8] bg-transparent text-[#666666] hover:text-[#111111] hover:border-[#B8860B]'
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#B8860B] font-bold tracking-widest block uppercase mb-1">
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
              className="space-y-3 relative border-l-2 border-[#B8860B]/40 pl-6 py-1 hover:border-[#B8860B] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-[#B8860B] font-bold tracking-wider uppercase">
                  {t('provenance.pijler')} 01
                </span>
                <span className="h-px w-6 bg-[#D8CEB8]" />
                <div className="flex items-center space-x-1.5 text-[#B8860B] text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('provenance.pillar1_sub')}</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] tracking-wide group-hover:text-[#B8860B] transition-colors">
                {t('provenance.pillar1_title_home')}
              </h3>

              <p className="text-sm text-[#444444] font-serif font-light leading-relaxed">
                {t('provenance.pillar1_desc_home')}
              </p>
            </motion.div>

            {/* Pillar 02 */}
            <motion.div 
              whileHover={{ x: 8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 relative border-l-2 border-[#B8860B]/40 pl-6 py-1 hover:border-[#B8860B] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-[#B8860B] font-bold tracking-wider uppercase">
                  {t('provenance.pijler')} 02
                </span>
                <span className="h-px w-6 bg-[#D8CEB8]" />
                <div className="flex items-center space-x-1.5 text-[#B8860B] text-xs font-semibold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>{t('provenance.pillar2_sub')}</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] tracking-wide group-hover:text-[#B8860B] transition-colors">
                {t('provenance.pillar2_title_home')}
              </h3>

              <p className="text-sm text-[#444444] font-serif font-light leading-relaxed">
                {t('provenance.pillar2_desc_home')}
              </p>
            </motion.div>

            {/* Pillar 03 */}
            <motion.div 
              whileHover={{ x: 8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 relative border-l-2 border-[#B8860B]/40 pl-6 py-1 hover:border-[#B8860B] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-[#B8860B] font-bold tracking-wider uppercase">
                  {t('provenance.pijler')} 03
                </span>
                <span className="h-px w-6 bg-[#D8CEB8]" />
                <div className="flex items-center space-x-1.5 text-[#B8860B] text-xs font-semibold uppercase tracking-wider">
                  <Feather className="w-4 h-4" />
                  <span>{t('provenance.pillar3_sub')}</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] tracking-wide group-hover:text-[#B8860B] transition-colors">
                {t('provenance.pillar3_title_home')}
              </h3>

              <p className="text-sm text-[#444444] font-serif font-light leading-relaxed">
                {t('provenance.pillar3_desc_home')}
              </p>
            </motion.div>

            {/* GRAND HERO CTA BUTTON */}
            <div className="pt-6">
              <motion.button
                whileHover={{ scale: 1.025, backgroundColor: "#B8860B", color: "#111111" }}
                whileTap={{ scale: 0.97 }}
                onClick={onRequestConsultation}
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-[#1C1A17] text-[#FAF7F2] font-serif text-sm sm:text-base font-semibold tracking-wide border border-[#B8860B]/60 hover:border-[#B8860B] shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <span>{t('provenance.btnHome')}</span>
                <ArrowRight className="w-4 h-4 text-[#B8860B] group-hover:text-[#111111] group-hover:translate-x-1 transition-all duration-300" />
              </motion.button>
            </div>

          </div>

        </div>

      </motion.div>

    </section>
  );
}
