import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';

export default function Hero({ heroImage, onExploreCatalog }) {
  const { t } = useLanguage();
  const heroRef = useRef(null);
  const currentHeroImage = heroImage || '/images/provenience-light-cream-hero.jpg';

  // Parallax translation
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0px', '-35px']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.2]);

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.14,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.95, ease: LUXURY_EASE }
    }
  };

  return (
    <section 
      ref={heroRef}
      className="relative w-full h-[100dvh] min-h-[680px] flex flex-col justify-center overflow-hidden bg-white pt-20 sm:pt-24 pb-12 sm:pb-20 select-none"
    >
      {/* ------------------------------------------------------------- */}
      {/* LIGHT PROVENIENCE STUDIO PHOTOGRAPHY (SUNLIT CREAM WALL)      */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: bgY }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={currentHeroImage}
            alt="Atelier Rembrandt Provenience Collecties"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable="false"
            className="w-full h-full object-cover object-right md:object-center filter brightness-[1.01] contrast-[1.02] transform-gpu"
          />
        </motion.div>

        {/* Crisp text protection overlay on left side */}
        <div
          className="absolute inset-y-0 left-0 w-full h-full z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 38%, rgba(255, 255, 255, 0.65) 52%, transparent 70%)'
          }}
        />

        {/* Silky-smooth bottom edge transition fade */}
        <div 
          className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 40%, transparent 100%)'
          }}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* PERFECT LIGHT CREAM NEGATIVE SPACE TYPOGRAPHY (BORDEAUX RED)  */}
      {/* ------------------------------------------------------------- */}
      <motion.div 
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-20 page-shell-wide my-auto text-[#111111]"
      >
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hero-copy-shell max-w-xl lg:max-w-2xl space-y-6 text-left"
        >
          
          {/* Category Tag (Antique Gold Accent) */}
          <div className="overflow-hidden">
            <motion.div 
              variants={itemVariants}
              className="flex items-center space-x-3 text-xs sm:text-sm font-serif tracking-[0.2em] text-[#8E7035] uppercase font-semibold"
            >
              <span className="w-8 h-px bg-[#8E7035]" />
              <span>{t('hero.tagline')}</span>
            </motion.div>
          </div>

          {/* Masterpiece Editorial Headline (Royal Bordeaux Red & Fluid Clamp Typography) */}
          <div className="overflow-hidden">
            <motion.h1 
              variants={itemVariants}
              className="text-fluid-hero font-serif font-bold text-[#4A1521]"
            >
              <span className="block">{t('hero.headline1')}</span>
              <span className="text-[#8E7035] italic font-normal block mt-2 text-fluid-hero-sub font-serif">
                {t('hero.headline2')}
              </span>
            </motion.h1>
          </div>

          {/* Subtitle Description Paragraph (Warm Bronze) */}
          <div className="overflow-hidden">
            <motion.p 
              variants={itemVariants}
              className="hero-lead-copy text-sm sm:text-base text-[#554326] font-serif font-light leading-relaxed max-w-lg"
            >
              {t('hero.description')}
            </motion.p>
          </div>

          {/* Action Links (Bordeaux Red & Antique Gold) */}
          <div className="overflow-hidden">
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 pt-4"
            >
              <button
                onClick={onExploreCatalog}
                className="text-xs sm:text-sm font-serif tracking-[0.16em] text-[#4A1521] font-semibold uppercase border-b border-[#4A1521] pb-1 hover:text-[#8E7035] hover:border-[#8E7035] transition-colors duration-300 cursor-pointer"
              >
                <span>{t('hero.exploreBtn')}</span>
              </button>

            </motion.div>
          </div>

        </motion.div>
      </motion.div>
    </section>
  );
}
