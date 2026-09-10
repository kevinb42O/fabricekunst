import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';
import { localizePath } from '../utils/locales';
import { defaultProvenance } from '../data/defaultProvenance';
import { localized, migrateProvenance } from '../utils/provenance';

export default function AboutProvenance({ provenanceData }) {
  const { t, language } = useLanguage();
  const published = migrateProvenance(provenanceData, defaultProvenance());
  const homepageTeaser = published.homepageTeaser;
  if (!homepageTeaser.enabled) return null;
  const teaserAsset = published.assets.find(asset => asset.id === homepageTeaser.assetId && asset.url);

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
              {localized(homepageTeaser.title, language) || t('provenance.heroTitle')}
            </h2>
          </div>

          <p className="text-[#444444] font-serif font-light text-base sm:text-lg max-w-xl leading-relaxed">
            {localized(homepageTeaser.description, language) || t('provenance.sectionDesc')}
          </p>
        </div>

        {/* MAIN EDITORIAL FEATURE STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Frameless Master Photography (White Gloves Conservator) */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-neutral-50">
              {teaserAsset?.url ? <img
                  src={teaserAsset.url}
                  srcSet={teaserAsset.srcSet || undefined}
                  alt={localized(teaserAsset.alt, language)}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.02]"
                /> : <div aria-label="R2-afbeelding wordt geladen" className="h-full w-full bg-[#eee8dd]" />}
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
              <a
                href={localizePath('/herkomst', language)}
                className="inline-flex min-h-12 items-center justify-center space-x-2 border-b border-[#1C1A17] text-xs sm:text-sm font-serif font-semibold uppercase tracking-[0.16em] text-[#111111] hover:text-[#4A1521] transition-colors duration-300"
              >
                <span>{localized(homepageTeaser.buttonLabel, language) || t('nav.herkomst')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </motion.div>

    </section>
  );
}
