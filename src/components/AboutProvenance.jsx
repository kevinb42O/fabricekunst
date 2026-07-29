import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Award, Compass, ShieldCheck, Feather, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PROVENANCE_VISUALS = [
  {
    id: 'white-gloves',
    title: 'Inspectie met Witte Handschoenen',
    subtitle: 'Museumwaardige conservering & gecureerde selectie van zeldzame meesterwerken',
    image: '/images/white-gloves-conservator.jpg',
    quote: '"Wij kopen geen volumes. Wij selecteren meesterwerken. Slechts een fractie van wat wij bekijken, verdient een plaats in onze collectie."'
  },
  {
    id: 'bookcase',
    title: 'De Antiquariaats-Bibliotheek',
    subtitle: 'Historische boekenkast met sfeerverlichting en zeldzame banden',
    image: '/images/voltaire-lit-bookcase-desk.jpg',
    quote: '"Hier koop je geen boek. Hier koop je geschiedenis."'
  },
  {
    id: 'exlibris',
    title: 'Ex-Libris & Provenance',
    subtitle: 'Handgemaakt marmeren schutblad met authentiek heraldiek eigendomsstempel',
    image: '/images/voltaire-marbled-endpaper-exlibris.jpg',
    quote: '"Niet alles wat oud is, is uitzonderlijk. Daarom selecteren wij uitsluitend het beste."'
  }
];

export default function AboutProvenance({ onRequestConsultation }) {
  const { t } = useLanguage();
  const [activeVisualIndex, setActiveVisualIndex] = useState(0);

  const provenanceVisuals = [
    {
      id: 'white-gloves',
      title: 'Inspectie met Witte Handschoenen',
      subtitle: 'Museumwaardige conservering & gecureerde selectie',
      image: '/images/white-gloves-conservator.jpg',
      quote: '"Wij kopen geen volumes. Wij selecteren meesterwerken. Slechts een fractie van wat wij bekijken, verdient een plaats in onze collectie."'
    },
    {
      id: 'bookcase',
      title: 'De Antiquariaats-Bibliotheek',
      subtitle: 'Historische boekenkast met sfeerverlichting',
      image: '/images/voltaire-lit-bookcase-desk.jpg',
      quote: '"Hier koop je geen boek. Hier koop je geschiedenis."'
    },
    {
      id: 'exlibris',
      title: 'Ex-Libris & Provenance',
      subtitle: 'Handgemaakt marmeren schutblad met eigendomsstempel',
      image: '/images/voltaire-marbled-endpaper-exlibris.jpg',
      quote: '"Niet alles wat oud is, is uitzonderlijk. Daarom selecteren wij uitsluitend het beste."'
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
      className="relative bg-transparent text-[#111111] py-28 sm:py-40 lg:py-48 overflow-hidden"
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#D8CEB8] pb-10 gap-8">
          <div className="space-y-4 max-w-3xl">
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#666666] uppercase font-bold block">
              {t('provenance.heroBadge')}
            </span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.08]">
              {t('provenance.heroTitle')}
            </h2>
          </div>

          <p className="text-[#444444] font-serif font-light text-base sm:text-lg max-w-xl leading-relaxed">
            {t('provenance.sectionDesc')}
          </p>
        </div>

        {/* MAIN EDITORIAL FEATURE STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Frameless Master Photography (White Gloves Conservator) */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-[#FAF7F2]">
              <img
                src="/images/white-gloves-conservator.jpg"
                alt="Conservering met witte handschoenen"
                className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.02]"
              />
            </div>
          </div>

          {/* Editorial Content & Provenance Pillars */}
          <div className="lg:col-span-5 space-y-8">

            <div className="space-y-6 pt-4 border-t border-[#D8CEB8]/60">
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#666666] uppercase font-bold block">
                  01 • {t('provenance.pillar1_title_home')}
                </span>
                <p className="text-xs sm:text-sm text-[#444444] font-serif font-light leading-relaxed">
                  {t('provenance.pillar1_desc_home')}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#666666] uppercase font-bold block">
                  02 • {t('provenance.pillar2_title_home')}
                </span>
                <p className="text-xs sm:text-sm text-[#444444] font-serif font-light leading-relaxed">
                  {t('provenance.pillar2_desc_home')}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#666666] uppercase font-bold block">
                  03 • {t('provenance.pillar3_title_home')}
                </span>
                <p className="text-xs sm:text-sm text-[#444444] font-serif font-light leading-relaxed">
                  {t('provenance.pillar3_desc_home')}
                </p>
              </div>
            </div>

            {/* Subtiele Haarlijn Knop */}
            <div className="pt-4">
              <button
                onClick={onRequestConsultation}
                className="inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#111111] border-b border-[#111111] pb-1 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
              >
                <span>{t('provenance.btnHome')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </motion.div>

    </section>
  );
}
