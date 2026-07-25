import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 'scarron-1713',
    title: 'Les Œuvres de Monsieur Scarron',
    year: 'Amsterdam 1713',
    subtitle: 'Originele kopergravures & gemarmerde schutbladen in goudgestempeld leder.',
    image: '/images/hero/hero-scarron-candlelight.jpg',
    objectPosition: 'center 35%',
    tag: 'I'
  },
  {
    id: 'voltaire-theatre',
    title: 'Théâtre de Voltaire',
    year: 'Parijs 1829',
    subtitle: 'Met zeldzame kopergravure en antieke messing leesbril.',
    image: '/images/hero/hero-voltaire-glasses.jpg',
    objectPosition: 'center center',
    tag: 'II'
  },
  {
    id: 'scarron-engraving',
    title: '18e-Eeuwse Kopergravures',
    year: 'Amsterdam 1713',
    subtitle: 'Gedetailleerde koperetsing door meester-graveurs uit de Verlichting.',
    image: '/images/hero/hero-scarron-engraving.jpg',
    objectPosition: 'center top',
    tag: 'III'
  },
  {
    id: 'provenance-exlibris',
    title: 'Ex-Libris & Provenance',
    year: 'Historische Collectie',
    subtitle: 'Verifieerbare adellijke herkomst met origineel Vacheron-Poinsot stempel.',
    image: '/images/hero/hero-voltaire-exlibris.jpg',
    objectPosition: 'center center',
    tag: 'IV'
  }
];

export default function Hero({ onExploreCatalog, onRequestConsultation }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const heroRef = useRef(null);

  // Mouse Parallax movement states (subtle micro-movement)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const springX = useSpring(mousePos.x, { stiffness: 40, damping: 25 });
  const springY = useSpring(mousePos.y, { stiffness: 40, damping: 25 });

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x: x * 8, y: y * 8 });
  };

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
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 11000);
    return () => clearInterval(interval);
  }, []);

  const activeSlide = HERO_SLIDES[currentSlideIndex];

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
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[90vh] lg:min-h-screen flex flex-col justify-center overflow-hidden bg-[#FAF7F2] pt-24 pb-12 select-none"
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <motion.img
                src={activeSlide.image}
                alt={activeSlide.title}
                style={{
                  x: springX,
                  y: springY,
                  objectPosition: activeSlide.objectPosition || 'center center'
                }}
                className="absolute top-0 right-0 w-full lg:w-[68%] h-full object-cover filter contrast-[1.02] brightness-[1.0]"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Crisp text protection overlay on left side (FIXED to hero section) */}
        <div
          className="absolute inset-y-0 left-0 w-full h-full z-10 pointer-events-none"
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
          className="max-w-2xl lg:max-w-3xl space-y-6 sm:space-y-8"
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
            <span>Boekenkunst • Provenance • Privé-Collectie</span>
          </motion.div>

          {/* Masterpiece Editorial Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.12]"
          >
            <span className="block">Zeldzame Boeken</span>
            <span className="text-[#B8860B] italic font-normal block mt-2 text-3xl sm:text-4xl lg:text-5xl font-serif">
              &amp; Historische Meesterwerken
            </span>
          </motion.h1>

          {/* Subtitle Paragraph */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg lg:text-xl text-[#333333] font-serif font-light leading-relaxed max-w-xl"
          >
            Een gecureerde digitale galerij van unieke historische kunstobjecten, 18e-eeuwse kopergravures en authentieke shagreen banden met een bewezen herkomst.
          </motion.p>

          {/* Clean Gallery Action Buttons with Micro-Animations */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.025, backgroundColor: "#B8860B", color: "#111111", borderColor: "#B8860B" }}
              whileTap={{ scale: 0.98 }}
              onClick={onExploreCatalog}
              className="px-8 py-4 bg-[#1C1A17] text-[#FAF7F2] font-sans font-semibold text-xs tracking-[0.2em] uppercase transition-colors duration-300 shadow-sm rounded-sm border border-[#B8860B]/40 cursor-pointer flex items-center justify-center space-x-2 group"
            >
              <span>Doorblader De Collectie</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.025, backgroundColor: "#1C1A17", color: "#FAF7F2", borderColor: "#1C1A17" }}
              whileTap={{ scale: 0.98 }}
              onClick={onRequestConsultation}
              className="px-8 py-4 bg-[#FAF7F2]/90 backdrop-blur-sm border border-[#111111] text-[#111111] font-sans font-semibold text-xs tracking-[0.2em] uppercase transition-colors duration-300 rounded-sm shadow-xs cursor-pointer flex items-center justify-center space-x-2"
            >
              <Compass className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Privé-Consultatie Aanvragen</span>
            </motion.button>
          </motion.div>

          {/* Interactive Slide Dots Indicator */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center space-x-3 pt-4"
          >
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                aria-label={`Ga naar slide ${idx + 1}`}
                className="relative py-2 focus:outline-none cursor-pointer"
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
              0{currentSlideIndex + 1} / 0{HERO_SLIDES.length}
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
