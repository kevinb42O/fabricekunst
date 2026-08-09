import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Award, Compass, ShieldCheck, Feather, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';

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
      className="editorial-readable relative bg-white text-[#111111] py-28 sm:py-40 lg:py-48 overflow-hidden"
    >

      <motion.div 
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.0, ease: LUXURY_EASE }}
        className="page-shell-wide relative z-10 space-y-16"
      >
        
        {/* SECOND HERO HEADER BAR */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#D8CEB8] pb-10 gap-8">
          <div className="space-y-4 max-w-3xl">
            <span className="text-xs sm:text-sm font-serif tracking-[0.2em] text-[#8E7035] uppercase font-semibold block">
              {t('provenance.heroBadge')}
            </span>
            
            <h2 className="display-section-wide text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.08]">
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
            <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-neutral-50">
              <img
                src="/images/white-gloves-conservator.jpg"
                alt="Conservering met witte handschoenen"
                loading="lazy"
                decoding="async"
                draggable="false"
                className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.02]"
              />
            </div>
          </div>

          {/* Editorial Content & Provenance Pillars */}
          <div className="lg:col-span-5 space-y-8">

            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-serif tracking-[0.16em] text-[#8E7035] uppercase font-semibold block">
                  01 • {t('provenance.pillar1_title_home')}
                </span>
                <p className="text-xs sm:text-sm text-[#444444] font-serif font-light leading-relaxed">
                  {t('provenance.pillar1_desc_home')}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-serif tracking-[0.16em] text-[#8E7035] uppercase font-semibold block">
                  02 • {t('provenance.pillar2_title_home')}
                </span>
                <p className="text-xs sm:text-sm text-[#444444] font-serif font-light leading-relaxed">
                  {t('provenance.pillar2_desc_home')}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-serif tracking-[0.16em] text-[#8E7035] uppercase font-semibold block">
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
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-serif font-semibold uppercase tracking-[0.16em] text-[#111111] border-b border-[#111111] pb-1 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
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
