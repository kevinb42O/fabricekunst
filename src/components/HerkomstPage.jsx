import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Compass, Feather, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_PROVENANCE_DATA } from '../utils/storage';
import FaqSection from './FaqSection';

const getLocalizedField = (obj, field, lang = 'nl') => {
  if (!obj) return '';
  if (lang === 'nl') return obj[field] || '';
  const langKey = `${field}_${lang}`;
  if (obj[langKey] && typeof obj[langKey] === 'string' && obj[langKey].trim() !== '') {
    return obj[langKey];
  }
  return obj[field] || '';
};

const getLocalizedArray = (obj, field, lang = 'nl') => {
  if (!obj) return [];
  if (lang === 'nl') return obj[field] || [];
  const langKey = `${field}_${lang}`;
  if (Array.isArray(obj[langKey]) && obj[langKey].length > 0) {
    return obj[langKey];
  }
  return obj[field] || [];
};

export default function HerkomstPage({ provenanceData, faqItems = [], onNavigateHome, onRequestConsultation }) {
  const { t, language } = useLanguage();
  const heroRef = useRef(null);

  const data = provenanceData || DEFAULT_PROVENANCE_DATA;
  const hero = data.hero || DEFAULT_PROVENANCE_DATA.hero;
  const protocol = data.protocol || DEFAULT_PROVENANCE_DATA.protocol;
  const story = data.story || DEFAULT_PROVENANCE_DATA.story;
  const cta = data.cta || DEFAULT_PROVENANCE_DATA.cta;
  const verificationSteps = protocol.steps || DEFAULT_PROVENANCE_DATA.protocol.steps;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const heroBadge = getLocalizedField(hero, 'badge', language) || t('provenance.heroBadge');
  const heroTitle = getLocalizedField(hero, 'title', language) || t('provenance.heroTitle');
  const heroTitle1 = getLocalizedField(hero, 'title1', language) || (heroTitle && heroTitle.includes('&') ? heroTitle.split('&')[0]?.trim() : heroTitle);
  const heroTitle2 = getLocalizedField(hero, 'title2', language) || (heroTitle && heroTitle.includes('&') ? `& ${heroTitle.split('&')[1]?.trim()}` : '');
  const heroSubtitle = getLocalizedField(hero, 'subtitle', language) || t('provenance.heroSubtitle');

  const protocolBadge = getLocalizedField(protocol, 'badge', language) || "Gecertificeerd Verificatieprotocol";
  const protocolTitle = getLocalizedField(protocol, 'title', language) || "Het Protocol van Authenticiteit & Verificatie";
  const protocolSubtitle = getLocalizedField(protocol, 'subtitle', language) || "Voordat een antiquarisch meesterwerk in onze gecureerde collectie wordt opgenomen, doorloopt het ons vierstappen-onderzoeksprotocol.";

  const storyBadge = getLocalizedField(story, 'badge', language) || "Ex-Libris & Eigendomssporen";
  const storyTitle = getLocalizedField(story, 'title', language) || "Aantoonbare Historie van Franse Topverzamelaars";
  const storyQuote = getLocalizedField(story, 'quote', language);
  const storyQuoteAuthor = getLocalizedField(story, 'quoteAuthor', language) || "Atelier Rembrandt";
  const storyNarrative = getLocalizedField(story, 'narrative', language);
  const storyImageCaption = getLocalizedField(story, 'imageCaption', language) || "Ex-Libris Vacheron-Poinsot op handgemaakt gemarmerd schutblad (1829).";
  const storyBullets = getLocalizedArray(story, 'bullets', language);

  const ctaBadge = getLocalizedField(cta, 'badge', language) || "Particuliere Expertise & Consultatie";
  const ctaTitle = getLocalizedField(cta, 'title', language) || "Wilt u de Herkomst van uw Eigen Collectie Laten Verifiëren?";
  const ctaSubtitle = getLocalizedField(cta, 'subtitle', language) || "Atelier Rembrandt adviseert verzamelaars en erfgenamen bij de waardebepaling, conservering en authenticiteitsverificatie van historische privé-bibliotheken.";
  const ctaButtonText = getLocalizedField(cta, 'buttonText', language) || "Privé Consultatie Aanvragen";

  return (
    <div className="editorial-readable bg-white min-h-screen text-[#111111] overflow-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION WITH HERO PHOTO SHOWCASE                      */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={heroRef}
        className="relative w-full h-screen min-h-[680px] flex flex-col justify-center overflow-hidden bg-white pt-20 sm:pt-24 pb-12 sm:pb-20 select-none"
      >
        {/* Photography Background Showcase */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          {/* Parallax Image */}
          <motion.div style={{ y: bgY }} className="w-full h-full absolute inset-0">
            <img
              src={hero.bgImage || "/images/hero/hero-voltaire-exlibris.jpg"}
              alt="Atelier Rembrandt Herkomst & Expertise"
              className="absolute top-0 right-0 w-full lg:w-[65%] h-full object-cover filter contrast-[1.02] brightness-[0.97] opacity-35 lg:opacity-60"
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
        {/* Hero Content */}
        <div className="relative z-20 page-shell-wide my-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl lg:max-w-3xl space-y-6"
          >


            {/* Subtitle / Badge */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center space-x-3 text-xs font-serif font-medium tracking-[0.25em] text-[#8E7035] uppercase pt-2"
            >
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-[1.5px] bg-[#B8860B] inline-block" 
              />
              <span>{heroBadge}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="heritage-hero-title text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#4A1521] tracking-tight leading-[1.06]"
            >
              <span className="block">{heroTitle1}</span>
              {heroTitle2 && (
                <span className="heritage-hero-subtitle text-[#8E7035] italic font-normal block mt-2 text-3xl sm:text-5xl lg:text-6xl font-serif">
                  {heroTitle2}
                </span>
              )}
            </motion.h1>

            {/* Lead Paragraph */}
            <motion.p 
              variants={itemVariants}
              className="heritage-lead-copy text-base sm:text-lg lg:text-xl text-[#333333] font-serif font-light leading-relaxed max-w-xl"
            >
              {heroSubtitle}
            </motion.p>


          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT SECTION                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full bg-white">
        
        <div className="relative z-10">
          
          {/* ------------------------------------------------------------- */}
          {/* 2. HET 4-STAPPEN PROTOCOL VAN AUTHENTICITEIT                  */}
          {/* ------------------------------------------------------------- */}
          <section className="py-16 sm:py-24 lg:py-32 select-none">
            <div className="page-shell-wide space-y-10 sm:space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#B8860B] block">
                  {protocolBadge}
                </span>
                
                <h2 className="display-section-wide text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-[#111111] tracking-tight leading-tight">
                  {protocolTitle}
                </h2>
                
                <p className="text-[#333333] font-serif font-light text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                  {protocolSubtitle}
                </p>
              </div>

              {/* 4-Column Grid with Alternating Curved Connecting Arrows */}
              <div className="relative py-6 sm:py-8">
                
                {/* SVG Arrowhead Marker Definition */}
                <svg className="w-0 h-0 absolute pointer-events-none">
                  <defs>
                    <marker
                      id="gold-curved-arrow"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B8860B" />
                    </marker>
                  </defs>
                </svg>

                {/* Alternating Curved Connecting Arrows on Desktop */}
                {/* Arrow 1: Between Step 01 & Step 02 (ARCH TOP) */}
                <div className="hidden lg:block absolute -top-5 left-[20%] w-[13%] h-14 z-20 pointer-events-none">
                  <svg viewBox="0 0 120 45" className="w-full h-full text-[#B8860B] overflow-visible">
                    <path 
                      d="M 5 38 Q 60 -5 115 35" 
                      fill="none" 
                      stroke="#B8860B" 
                      strokeWidth="2" 
                      strokeDasharray="5 4" 
                      markerEnd="url(#gold-curved-arrow)" 
                    />
                  </svg>
                </div>

                {/* Arrow 2: Between Step 02 & Step 03 (ARCH BOTTOM) */}
                <div className="hidden lg:block absolute -bottom-5 left-[44%] w-[13%] h-14 z-20 pointer-events-none">
                  <svg viewBox="0 0 120 45" className="w-full h-full text-[#B8860B] overflow-visible">
                    <path 
                      d="M 5 7 Q 60 48 115 10" 
                      fill="none" 
                      stroke="#B8860B" 
                      strokeWidth="2" 
                      strokeDasharray="5 4" 
                      markerEnd="url(#gold-curved-arrow)" 
                    />
                  </svg>
                </div>

                {/* Arrow 3: Between Step 03 & Step 04 (ARCH TOP) */}
                <div className="hidden lg:block absolute -top-5 left-[68%] w-[13%] h-14 z-20 pointer-events-none">
                  <svg viewBox="0 0 120 45" className="w-full h-full text-[#B8860B] overflow-visible">
                    <path 
                      d="M 5 38 Q 60 -5 115 35" 
                      fill="none" 
                      stroke="#B8860B" 
                      strokeWidth="2" 
                      strokeDasharray="5 4" 
                      markerEnd="url(#gold-curved-arrow)" 
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 relative z-10">
                  {verificationSteps.map((v, i) => {
                    const stepTitle = getLocalizedField(v, 'title', language) || v.title;
                    const stepDesc = getLocalizedField(v, 'description', language) || v.description;

                    return (
                      <motion.div
                        key={v.step || i}
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white p-5 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-[#D8CEB8] shadow-card hover:shadow-2xl hover:-translate-y-1.5 hover:border-[#B8860B] transition-transform transition-colors transition-shadow duration-300 flex flex-col justify-between group"
                      >
                        <div className="space-y-5">
                          <div className="flex items-center justify-between pb-4 border-b border-[#D8CEB8]/70">
                            <span className="text-3xl font-serif font-bold text-[#B8860B] tracking-tight">
                              {v.step || `0${i + 1}`}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#666666]">
                              Fase 0{i + 1}
                            </span>
                          </div>

                          <h3 className="text-xl font-serif font-bold text-[#111111] group-hover:text-[#B8860B] transition-colors leading-snug">
                            {stepTitle}
                          </h3>

                          <p className="text-xs sm:text-sm text-[#444444] font-serif font-light leading-relaxed">
                            {stepDesc}
                          </p>
                        </div>

                        <div className="w-10 h-0.5 bg-[#B8860B]/30 group-hover:w-full group-hover:bg-[#B8860B] transition-all duration-500 mt-8" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 3. VISUELE BLIKVANGER & UITGELICHT TOPSTUK SHOWCASE           */}
          {/* ------------------------------------------------------------- */}
          <section className="py-16 sm:py-24 lg:py-32">
            <div className="page-shell-wide space-y-16">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                
                {/* Left Photography Showcase */}
                <div className="lg:col-span-7">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1.0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative h-[280px] sm:h-[420px] lg:h-[500px] w-full overflow-hidden rounded-xl border border-[#D8CEB8] shadow-2xl group bg-white"
                  >
                    <img
                      src={story.image || "/images/voltaire-marbled-endpaper-exlibris.jpg"}
                      alt="Ex-Libris Vacheron-Poinsot en gemarmerd papier"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter contrast-[1.04]"
                    />
                    
                    {/* Subtle vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

                    <div className="absolute bottom-6 left-6 right-6 p-4 sm:p-6 bg-white/95 backdrop-blur-md rounded-lg border border-[#D8CEB8] shadow-lg">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#B8860B] block mb-1">
                        Authenticiteitsvoorbeeld
                      </span>
                      <p className="text-xs sm:text-sm font-serif italic text-[#222222]">
                        {storyImageCaption}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Right Editorial Storytelling */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#B8860B] block">
                      {storyBadge}
                    </span>
                    
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#111111] tracking-tight leading-tight">
                      {storyTitle}
                    </h2>
                  </div>

                  {/* Quote Block */}
                  {storyQuote && (
                    <div className="border-l-2 border-[#B8860B] pl-6 py-2 bg-white p-6 rounded-r-xl border-y border-r border-[#D8CEB8]/70 shadow-xs">
                      <Feather className="w-5 h-5 text-[#B8860B] mb-2" />
                      <p className="text-sm sm:text-base font-serif italic text-[#222222] leading-relaxed">
                        "{storyQuote}"
                      </p>
                      <span className="block text-[10px] font-mono uppercase font-bold text-[#8E7035] tracking-widest mt-3">
                        — {storyQuoteAuthor}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-[#444444] font-serif font-light leading-relaxed">
                    {storyNarrative}
                  </p>

                  {Array.isArray(storyBullets) && storyBullets.length > 0 && (
                    <div className="pt-2 flex flex-col space-y-3 text-xs font-mono text-[#333333]">
                      {storyBullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 4. AFSLUITING & PRIVÉ CONSULTATIE CTA                         */}
          {/* ------------------------------------------------------------- */}
          <section className="py-16 sm:py-24 lg:py-32">
            <div className="page-shell-wide">
              
              <div className="bg-[#1C1A17] text-[#FAF7F2] rounded-2xl p-6 sm:p-10 lg:p-14 border border-[#B8860B]/50 shadow-2xl flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center justify-between gap-6 sm:gap-10">
                <div className="space-y-4 text-center lg:text-left max-w-2xl">
                  <span className="text-xs font-mono text-[#D4AF37] uppercase font-bold tracking-[0.2em] block">
                    {ctaBadge}
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                    {ctaTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-[#C5BBAA] font-serif font-light leading-relaxed">
                    {ctaSubtitle}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04, backgroundColor: '#D4AF37', color: '#0F0E0C' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRequestConsultation}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#B8860B] text-[#111111] font-serif font-semibold text-sm sm:text-base rounded-md tracking-wider uppercase transition-colors duration-300 shrink-0 cursor-pointer shadow-xl flex items-center space-x-3 min-h-[48px] w-full sm:w-auto justify-center"
                >
                  <span>{ctaButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

            </div>
          </section>

          {/* Interactive FAQ Section */}
          <FaqSection items={faqItems} onRequestConsultation={onRequestConsultation} />

        </div>
      </div>

    </div>
  );
}
