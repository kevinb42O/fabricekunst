import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';
import { localizePath } from '../utils/locales';
import { defaultProvenance } from '../data/defaultProvenance';
import { localized, migrateProvenance } from '../utils/provenance';
import ResearchVideo from './ResearchVideo';

export default function AboutProvenance({ provenanceData }) {
  const { t, language } = useLanguage();
  const published = migrateProvenance(provenanceData, defaultProvenance());
  const homepageTeaser = published.homepageTeaser;
  if (!homepageTeaser.enabled) return null;

  return (
    <section 
      id="herkomst" 
      className="editorial-readable relative bg-[#F7F3EC] text-[#111111] py-20 lg:py-24 overflow-hidden"
    >

      <motion.div 
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.0, ease: LUXURY_EASE }}
        className="page-shell-wide relative z-10"
      >
        
        {/* MAIN EDITORIAL FEATURE STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Editorial Content & Provenance Pillars */}
          <div className="lg:col-span-7 space-y-8">

            <div className="space-y-5">
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#111111] tracking-tight leading-[1.08]">
                {localized(homepageTeaser.title, language) || t('provenance.heroTitle')}
              </h2>
              <p className="text-[#444444] font-serif font-light text-base sm:text-lg max-w-xl leading-relaxed">
                {localized(homepageTeaser.description, language) || t('provenance.sectionDesc')}
              </p>
            </div>

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

          <div className="lg:col-span-5">
            <ResearchVideo />
          </div>

        </div>

      </motion.div>

    </section>
  );
}
