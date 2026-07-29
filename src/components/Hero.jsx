import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Hero({ heroImage, onExploreCatalog, onRequestConsultation }) {
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
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section 
      ref={heroRef}
      className="relative w-full h-screen min-h-[680px] flex flex-col justify-center overflow-hidden bg-[#F7F3EB] select-none"
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
            alt="Atelier Rembrandt Provenience Collectie"
            className="w-full h-full object-cover object-right md:object-center filter brightness-[1.01] contrast-[1.02] transform-gpu"
          />
        </motion.div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PERFECT LIGHT CREAM NEGATIVE SPACE TYPOGRAPHY (BORDEAUX RED)  */}
      {/* ------------------------------------------------------------- */}
      <motion.div 
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto text-[#111111]"
      >
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-xl lg:max-w-2xl space-y-6 text-left"
        >
          
          {/* Micro Category Tag (Antique Gold Accent) */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center space-x-3 text-[11px] font-mono tracking-[0.38em] text-[#8E7035] uppercase font-bold"
          >
            <span className="w-8 h-px bg-[#8E7035]" />
            <span>{t('hero.tagline')}</span>
          </motion.div>

          {/* Masterpiece Editorial Headline (Royal Bordeaux Red) */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#4A1521] tracking-tight leading-[1.06]"
          >
            <span className="block">{t('hero.headline1')}</span>
            <span className="text-[#8E7035] italic font-normal block mt-2 text-3xl sm:text-5xl lg:text-6xl font-serif">
              {t('hero.headline2')}
            </span>
          </motion.h1>

          {/* Subtitle Description Paragraph (Warm Bronze) */}
          <motion.p 
            variants={itemVariants}
            className="text-sm sm:text-base text-[#554326] font-serif font-light leading-relaxed max-w-lg"
          >
            {t('hero.description')}
          </motion.p>

          {/* Minimalist Hairline Action Links (Bordeaux Red & Antique Gold) */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 pt-4"
          >
            <button
              onClick={onExploreCatalog}
              className="text-xs font-mono tracking-[0.25em] text-[#4A1521] font-bold uppercase border-b border-[#4A1521] pb-1 hover:text-[#8E7035] hover:border-[#8E7035] transition-colors duration-300 cursor-pointer"
            >
              <span>{t('hero.exploreBtn')}</span>
            </button>

            <button
              onClick={onRequestConsultation}
              className="text-xs font-mono tracking-[0.25em] text-[#8E7035] uppercase hover:text-[#4A1521] border-b border-transparent pb-1 transition-colors duration-300 cursor-pointer"
            >
              <span>{t('hero.consultationBtn')}</span>
            </button>
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  );
}
