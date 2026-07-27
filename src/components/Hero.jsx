import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HERO_SLIDES = [
  {
    id: 'scarron-1713',
    title: 'Les Œuvres de Monsieur Scarron',
    year: 'Amsterdam 1713',
    subtitleKey: 'hero.slides.s1_sub',
    subtitle: 'Originele kopergravures & gemarmerde schutbladen in goudgestempeld leder.',
    image: '/images/hero/hero-scarron-candlelight.jpg',
    objectPosition: 'center 35%',
    tag: 'I'
  },
  {
    id: 'voltaire-theatre',
    title: 'Théâtre de Voltaire',
    year: 'Parijs 1829',
    subtitleKey: 'hero.slides.s2_sub',
    subtitle: 'Met zeldzame kopergravure en antieke messing leesbril.',
    image: '/images/hero/hero-voltaire-glasses.jpg',
    objectPosition: 'center center',
    tag: 'II'
  },
  {
    id: 'scarron-engraving',
    title: '18e-Eeuwse Kopergravures',
    year: 'Amsterdam 1713',
    subtitleKey: 'hero.slides.s3_sub',
    subtitle: 'Gedetailleerde koperetsing door meester-graveurs uit de Verlichting.',
    image: '/images/hero/hero-scarron-engraving.jpg',
    objectPosition: 'center top',
    tag: 'III'
  },
  {
    id: 'provenance-exlibris',
    title: 'Ex-Libris & Provenance',
    year: 'Historische Collectie',
    subtitleKey: 'hero.slides.s4_sub',
    subtitle: 'Verifieerbare adellijke herkomst met origineel Vacheron-Poinsot stempel.',
    image: '/images/hero/hero-voltaire-exlibris.jpg',
    objectPosition: 'center center',
    tag: 'IV'
  }
];

export default function Hero({ slides = [], onExploreCatalog, onRequestConsultation }) {
  const { t } = useLanguage();
  const activeSlides = (slides && slides.length > 0) ? slides : HERO_SLIDES;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const heroRef = useRef(null);

  // Scroll Parallax Hooks (gentle vertical scroll translate without zooming)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0px', '-50px']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.2]);

  // Auto slide transition
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 11000);
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  const activeSlide = activeSlides[currentSlideIndex] || activeSlides[0] || HERO_SLIDES[0];

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
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-screen flex flex-col justify-center overflow-hidden bg-[#FAF7F2] pt-20 sm:pt-24 pb-8 sm:pb-12 select-none"
    >
      {/* ------------------------------------------------------------- */}
      {/* FULLSCREEN PHOTOGRAPHY SHOWCASE WITH NATURAL POSITIONING      */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        {/* Parallax Image Slider */}
        <motion.div 
          style={{ y: bgY }}
          className="absolute inset-0 w-full h-full"
        >
          <AnimatePresence>
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full transform-gpu"
            >
              <img
                src={activeSlide.image}
                alt={activeSlide.title}
                style={{
                  objectPosition: activeSlide.objectPosition || 'center center'
                }}
                className="absolute top-0 right-0 w-full lg:w-[68%] h-full object-cover filter contrast-[1.02] brightness-[1.0] opacity-40 sm:opacity-60 lg:opacity-100 transform-gpu"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Crisp text protection overlay on left side (FIXED) */}
        {/* Mobile: top-to-bottom fade for readability */}
        <div
          className="absolute inset-y-0 left-0 w-full h-full z-10 pointer-events-none block sm:hidden"
          style={{
            background: 'linear-gradient(to bottom, rgba(250, 247, 242, 0.92) 0%, rgba(250, 247, 242, 0.75) 50%, rgba(250, 247, 242, 0.5) 100%)'
          }}
        />
        {/* Desktop: left-to-right fade for side-by-side layout */}
        <div
          className="absolute inset-y-0 left-0 w-full h-full z-10 pointer-events-none hidden sm:block"
          style={{
            background: 'linear-gradient(to right, #FAF7F2 0%, #FAF7F2 38%, rgba(250, 247, 242, 0.65) 52%, transparent 70%)'
          }}
        />

        {/* Silky-smooth bottom edge transition fade (FIXED to bottom of hero section) */}
        <div 
          className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #FAF7F2 0%, rgba(250, 247, 242, 0.7) 40%, transparent 100%)'
          }}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN HERO CONTENT WITH FRAMER MOTION STAGGER                  */}
      {/* ------------------------------------------------------------- */}
      <motion.div 
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto"
      >
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl lg:max-w-3xl space-y-5 sm:space-y-8"
        >
          
          {/* Authentic Gallery Subtitle */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center space-x-3 text-xs font-serif font-medium tracking-[0.25em] text-[#8E7035] uppercase"
          >
            <motion.span 
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-[1.5px] bg-[#B8860B] inline-block" 
            />
            <span>{t('hero.tagline')}</span>
          </motion.div>

          {/* Masterpiece Editorial Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.12]"
          >
            <span className="block">{t('hero.headline1')}</span>
            <span className="text-[#B8860B] italic font-normal block mt-1.5 sm:mt-2 text-2xl sm:text-4xl lg:text-5xl font-serif">
              {t('hero.headline2')}
            </span>
          </motion.h1>

          {/* Subtitle Paragraph */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg lg:text-xl text-[#333333] font-serif font-light leading-relaxed max-w-xl"
          >
            {t('hero.description')}
          </motion.p>

          {/* Clean Gallery Action Buttons with Micro-Animations */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.025, backgroundColor: "#B8860B", color: "#111111", borderColor: "#B8860B" }}
              whileTap={{ scale: 0.98 }}
              onClick={onExploreCatalog}
              className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#1C1A17] text-[#FAF7F2] font-sans font-semibold text-xs tracking-[0.2em] uppercase transition-colors duration-300 shadow-sm rounded-sm border border-[#B8860B]/40 cursor-pointer flex items-center justify-center space-x-2 group min-h-[48px]"
            >
              <span>{t('hero.exploreBtn')}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.025, backgroundColor: "#1C1A17", color: "#FAF7F2", borderColor: "#1C1A17" }}
              whileTap={{ scale: 0.98 }}
              onClick={onRequestConsultation}
              className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#FAF7F2]/90 backdrop-blur-sm border border-[#111111] text-[#111111] font-sans font-semibold text-xs tracking-[0.2em] uppercase transition-colors duration-300 rounded-sm shadow-xs cursor-pointer flex items-center justify-center space-x-2 min-h-[48px]"
            >
              <Compass className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>{t('hero.consultationBtn')}</span>
            </motion.button>
          </motion.div>


          {/* Interactive Slide Dots Indicator */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center space-x-3 pt-4"
          >
            {activeSlides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                aria-label={`Ga naar slide ${idx + 1}`}
                className="relative py-2 px-1 focus:outline-none cursor-pointer min-h-[40px] min-w-[24px] flex items-center justify-center"
              >
                <motion.div
                  animate={{
                    width: idx === currentSlideIndex ? 32 : 8,
                    backgroundColor: idx === currentSlideIndex ? '#B8860B' : '#D8CEB8'
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-1.5 rounded-full"
                />
              </button>
            ))}
            <span className="text-[11px] font-mono text-[#8E7035] ml-2 font-medium">
              0{currentSlideIndex + 1} / 0{activeSlides.length}
            </span>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Floating Glassmorphism Museum Caption Tag with Idle Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 1, delay: 0.6 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute bottom-12 right-6 lg:right-12 z-20 hidden md:block"
      >
        <div className="flex items-center space-x-3 bg-[#FAF7F2]/90 backdrop-blur-md px-5 py-3 border border-[#D8CEB8] rounded-sm shadow-lg hover:border-[#B8860B]/50 transition-colors">
          <motion.div 
            key={activeSlide.tag}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
            <span className="font-mono text-xs font-bold text-[#B8860B] uppercase tracking-wider">{activeSlide.tag}</span>
          </motion.div>
          
          <span className="w-px h-4 bg-[#D8CEB8]" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4 }}
              className="text-xs font-serif text-[#222222] tracking-wide"
            >
              <span className="font-semibold italic">{activeSlide.title}</span>{' '}
              <span className="not-italic text-[#666666]">({activeSlide.year})</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

    </section>
  );
}
