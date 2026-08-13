import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Feather } from 'lucide-react';
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
  const localized = obj[`${field}_${lang}`];
  if (Array.isArray(localized)) return localized;
  return obj[field] || [];
};

const splitEditorialTitle = (title = '') => {
  const separatorIndex = title.indexOf('&');
  if (separatorIndex <= 0) {
    return { primary: title, secondary: '' };
  }
  return {
    primary: title.slice(0, separatorIndex).trim(),
    secondary: `& ${title.slice(separatorIndex + 1).trim()}`
  };
};

export default function HerkomstPage({ provenanceData, faqItems = [], onRequestConsultation }) {
  const { language } = useLanguage();
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

  const heroBadge = getLocalizedField(hero, 'badge', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.hero, 'badge', language);
  const heroTitle = getLocalizedField(hero, 'title', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.hero, 'title', language);
  const { primary: heroTitle1, secondary: heroTitle2 } = splitEditorialTitle(heroTitle);
  const heroSubtitle = getLocalizedField(hero, 'subtitle', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.hero, 'subtitle', language);

  const protocolBadge = getLocalizedField(protocol, 'badge', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.protocol, 'badge', language);
  const protocolTitle = getLocalizedField(protocol, 'title', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.protocol, 'title', language);
  const protocolSubtitle = getLocalizedField(protocol, 'subtitle', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.protocol, 'subtitle', language);

  const storyBadge = getLocalizedField(story, 'badge', language) || "Ex-Libris & Eigendomssporen";
  const storyTitle = getLocalizedField(story, 'title', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.story, 'title', language);
  const storyQuote = getLocalizedField(story, 'quote', language);
  const storyQuoteAuthor = getLocalizedField(story, 'quoteAuthor', language) || 'Atelier Rembrandt';
  const storyNarrative = getLocalizedField(story, 'narrative', language) || getLocalizedField(DEFAULT_PROVENANCE_DATA.story, 'narrative', language);
  const storyImageCaption = getLocalizedField(story, 'imageCaption', language) || "Ex-Libris Vacheron-Poinsot op handgemaakt gemarmerd schutblad (1829).";
  const storyBullets = getLocalizedArray(story, 'bullets', language);

  const ctaBadge = getLocalizedField(cta, 'badge', language) || "Particuliere Expertise & Consultatie";
  const ctaTitle = getLocalizedField(cta, 'title', language) || "Wilt u de Herkomst van uw Eigen Collectie Laten Verifiëren?";
  const ctaSubtitle = getLocalizedField(cta, 'subtitle', language) || "Atelier Rembrandt adviseert verzamelaars en erfgenamen bij de waardebepaling, conservering en authenticiteitsverificatie van historische privé-bibliotheken.";
  const ctaButtonText = getLocalizedField(cta, 'buttonText', language) || "Privé Consultatie Aanvragen";

  return (
    <div className="editorial-readable bg-white min-h-screen text-[#111111] overflow-hidden">
      <h1 className="sr-only">{heroTitle}</h1>

      {/* Mobile presentation: photography and copy never compete for contrast. */}
      <section className="lg:hidden bg-white pt-16">
        <div className="relative h-[43svh] min-h-[300px] max-h-[440px] overflow-hidden bg-[#e9e3d9]">
          <img
            src={hero.bgImage || "/images/hero/hero-voltaire-exlibris.jpg"}
            alt="Atelier Rembrandt Herkomst & Expertise"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
        </div>

        <div className="mobile-page-gutter -mt-2 pb-14">
          <div className="flex items-center gap-3 text-[11px] font-serif font-semibold tracking-[0.2em] text-[#8E7035] uppercase">
            <span className="h-px w-8 bg-[#B8860B]" aria-hidden="true" />
            <span>{heroBadge}</span>
          </div>
          <div className="mt-5 text-[clamp(2.5rem,12vw,4.5rem)] font-serif font-bold text-[#4A1521] tracking-[-0.035em] leading-[0.98]">
            <span className="block">{heroTitle1}</span>
            {heroTitle2 && (
              <span className="mt-2 block text-[0.7em] font-normal italic text-[#8E7035]">{heroTitle2}</span>
            )}
          </div>
          <p className="mt-6 max-w-xl text-[1.05rem] leading-7 text-[#3d342d] font-serif">
            {heroSubtitle}
          </p>
        </div>
      </section>
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION WITH HERO PHOTO SHOWCASE                      */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={heroRef}
        className="relative w-full h-screen min-h-[680px] hidden lg:flex flex-col justify-center overflow-hidden bg-white pt-20 sm:pt-24 pb-12 sm:pb-20 select-none"
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
            <motion.div
              variants={itemVariants}
              className="heritage-hero-title text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#4A1521] tracking-tight leading-[1.06]"
            >
              <span className="block">{heroTitle1}</span>
              {heroTitle2 && (
                <span className="heritage-hero-subtitle text-[#8E7035] italic font-normal block mt-2 text-3xl sm:text-5xl lg:text-6xl font-serif">
                  {heroTitle2}
                </span>
              )}
            </motion.div>

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
          
          {/* Compact editorial research register */}
          <section className="border-y border-[#DED4C3] bg-[#F8F5EF] py-14 sm:py-16 lg:py-20">
            <div className="page-shell-wide mx-auto max-w-[100rem]">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-20">
                <header className="lg:col-span-4 lg:pr-4">
                  <div className="flex items-center gap-3 text-[11px] font-serif font-semibold uppercase tracking-[0.2em] text-[#795B16]">
                    <span className="h-px w-8 bg-[#795B16]" aria-hidden="true" />
                    <span>{protocolBadge}</span>
                  </div>

                  <h2 className="mt-5 max-w-xl font-serif text-[clamp(2.25rem,3.7vw,4rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#17130F]">
                    {protocolTitle}
                  </h2>

                  <p className="mt-6 max-w-[34rem] font-serif text-base leading-7 text-[#51483F] sm:text-lg sm:leading-8">
                    {protocolSubtitle}
                  </p>
                </header>

                <ol className="grid grid-cols-1 border-t border-[#BDB09C] sm:grid-cols-2 lg:col-span-8">
                  {verificationSteps.map((v, i) => {
                    const stepTitle = getLocalizedField(v, 'title', language) || v.title;
                    const stepDesc = getLocalizedField(v, 'description', language) || v.description;

                    return (
                      <motion.li
                        key={v.step || i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-30px" }}
                        transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className={`grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 border-b border-[#CEC3B2] py-6 sm:min-h-[12.5rem] sm:px-6 sm:py-7 ${
                          i % 2 === 1 ? 'sm:border-l sm:border-[#CEC3B2]' : ''
                        }`}
                      >
                        <span className="font-serif text-lg font-semibold tabular-nums text-[#795B16]">
                          {v.step || `0${i + 1}`}
                        </span>

                        <div>
                          <h3 className="font-serif text-xl font-bold leading-tight text-[#17130F] xl:text-2xl">
                            {stepTitle}
                          </h3>
                          <p className="mt-3 max-w-[31rem] font-serif text-[0.95rem] leading-6 text-[#5E554B] sm:text-base sm:leading-7">
                            {stepDesc}
                          </p>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
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

                  <p className="text-sm text-[#444444] font-serif font-light leading-relaxed">
                    {storyNarrative}
                  </p>

                  {storyQuote && (
                    <blockquote className="border-l border-[#9A7938] pl-5">
                      <Feather className="mb-3 h-4 w-4 text-[#9A7938]" aria-hidden="true" />
                      <p className="font-serif text-base italic leading-7 text-[#29231D]">
                        “{storyQuote}”
                      </p>
                      <cite className="mt-3 block font-serif text-[11px] not-italic uppercase tracking-[0.16em] text-[#795B16]">
                        {storyQuoteAuthor}
                      </cite>
                    </blockquote>
                  )}

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
              
              <div className="border-y border-[#D8CEB8] py-10 sm:py-14 flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center justify-between gap-6 sm:gap-10">
                <div className="space-y-4 text-center lg:text-left max-w-2xl">
                  <span className="text-xs font-serif text-[#8E7035] uppercase font-semibold tracking-[0.16em] block">
                    {ctaBadge}
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-serif font-bold text-[#111111] leading-tight">
                    {ctaTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-[#555555] font-serif leading-relaxed">
                    {ctaSubtitle}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRequestConsultation}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#1C1A17] hover:bg-[#4A1521] text-white font-serif font-semibold text-sm sm:text-base tracking-[0.14em] uppercase transition-colors duration-300 shrink-0 cursor-pointer flex items-center space-x-3 min-h-[48px] w-full sm:w-auto justify-center"
                >
                  <span>{ctaButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

            </div>
          </section>

          <FaqSection items={faqItems} onRequestConsultation={onRequestConsultation} />

        </div>
      </div>

    </div>
  );
}
