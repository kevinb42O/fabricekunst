import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MOBILE_COPY = {
  nl: 'Zeldzame boeken, Oude Meesters en historische objecten, geselecteerd op kwaliteit en bewezen herkomst.',
  en: 'Rare books, Old Masters and historic objects, selected for quality and documented provenance.',
  fr: 'Livres rares, Maîtres anciens et objets historiques, sélectionnés pour leur qualité et leur provenance établie.'
};

const MOBILE_ALT = {
  nl: 'Zeldzaam antiquarisch boek uit de collectie van Atelier Rembrandt',
  en: 'Rare antiquarian book from the Atelier Rembrandt collection',
  fr: 'Livre ancien rare de la collection Atelier Rembrandt'
};

export default function MobileHero({ heroImage, mobileHeroImage, onExploreCatalog, onRequestConsultation }) {
  const { language, t } = useLanguage();
  const image = mobileHeroImage || heroImage || '/images/provenience-light-cream-hero.jpg';

  return (
    <section className="mobile-home-hero bg-[#FFFEFC] pt-[calc(4rem+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="mobile-hero-layout">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mobile-hero-image relative h-[32svh] min-h-[182px] max-h-[300px] overflow-hidden bg-[#EDE6DA]"
        >
          <img
            src={image}
            alt={MOBILE_ALT[language] || MOBILE_ALT.en}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable="false"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FFFEFC]/80 to-transparent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mobile-hero-copy px-4 pb-12 pt-5 min-[390px]:px-5 min-[600px]:px-8"
        >
          <div className="mx-auto max-w-[42rem]">
            <h1 className="mobile-hero-title text-balance font-serif font-bold leading-[0.96] tracking-[-0.035em] text-[#4A1521]">
              <span className="block">{t('hero.headline1')}</span>
              <span className="mt-2 block font-normal italic leading-[1.02] tracking-[-0.02em] text-[#8E7035]">
                {t('hero.headline2')}
              </span>
            </h1>

            <p className="mt-4 max-w-[34rem] font-serif text-[15px] leading-6 text-[#4E4337]">
              {MOBILE_COPY[language] || MOBILE_COPY.en}
            </p>

            <div className="mt-6 grid gap-2 min-[600px]:max-w-md">
              <button
                type="button"
                onClick={onExploreCatalog}
                className="flex min-h-12 w-full items-center justify-between bg-[#1C1A17] px-5 font-serif text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors active:bg-[#8E7035]"
              >
                <span>{t('hero.exploreBtn')}</span>
                <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
              </button>

              <button
                type="button"
                onClick={onRequestConsultation}
                className="flex min-h-11 w-fit items-center gap-2 py-1 font-serif text-xs font-semibold uppercase tracking-[0.12em] text-[#4A1521] transition-colors active:text-[#8E7035]"
              >
                <span>{t('hero.consultationBtn')}</span>
                <ArrowRight className="h-4 w-4 text-[#8E7035]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
