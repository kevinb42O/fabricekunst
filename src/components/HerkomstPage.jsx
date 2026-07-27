import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Compass, Feather, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_PROVENANCE_DATA } from '../utils/storage';
import FaqSection from './FaqSection';

export default function HerkomstPage({ provenanceData, faqItems = [], onNavigateHome, onRequestConsultation }) {
  const { t } = useLanguage();
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

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#111111] overflow-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION WITH LIGHT BOOKCASE FADE                      */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={heroRef}
        className="relative w-full min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh] flex flex-col justify-center bg-[#FAF7F2] pt-22 sm:pt-28 pb-12 sm:pb-20 select-none"
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

          {/* Crisp text protection overlay on left side (FIXED) */}
          <div
            className="absolute inset-y-0 left-0 w-full h-full z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, #FAF7F2 0%, #FAF7F2 38%, rgba(250, 247, 242, 0.65) 52%, transparent 70%)'
            }}
          />

          {/* Silky-smooth bottom edge transition fade (FIXED) */}
          <div 
            className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, #FAF7F2 0%, rgba(250, 247, 242, 0.7) 40%, transparent 100%)'
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl lg:max-w-3xl space-y-6"
          >
            {/* Breadcrumb Navigation */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between border-b border-[#D8CEB8]/70 pb-4 mb-2"
            >
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.18em] text-[#111111] hover:text-[#B8860B] transition-colors group font-mono cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#B8860B] group-hover:-translate-x-1 transition-transform" />
                <span>{t('nav.backHome')}</span>
              </button>
            </motion.div>

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
              <span>{hero.badge || t('provenance.heroBadge')}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.12]"
            >
              {hero.title || t('provenance.heroTitle')}
            </motion.h1>

            {/* Lead Paragraph */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-[#333333] font-serif font-light leading-relaxed max-w-xl"
            >
              {hero.subtitle || t('provenance.heroSubtitle')}
            </motion.p>

            {/* Provenance Seals */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap items-center gap-6 pt-3 text-xs font-mono text-[#555555]"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                <span>{t('item_detail.provenanceGuaranteed')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#B8860B]" />
                <span>{t('provenance.pillar1_title')}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* CONTINUOUS BACKGROUND SHOWCASE (FROM HERO ALL THE WAY DOWN)   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full">
        
        {/* Continuous Full-Height Background Image with Crisp Contrast */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/scarron-candlelight-hero.jpg"
            alt="Atelier Rembrandt Sfeerachtergrond"
            className="w-full h-full object-cover filter contrast-[1.04] brightness-[0.98] opacity-15 lg:opacity-20"
          />
          {/* Top Fade from Hero */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FAF7F2] to-transparent z-10 pointer-events-none" />
        </div>

        <div className="relative z-10">
          
          {/* ------------------------------------------------------------- */}
          {/* 2. HET 4-STAPPEN PROTOCOL VAN AUTHENTICITEIT                  */}
          {/* ------------------------------------------------------------- */}
          <section className="py-16 sm:py-24 lg:py-32 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#B8860B] block">
                  {protocol.badge || "Gecertificeerd Verificatieprotocol"}
                </span>
                
                <h2 className="text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-[#111111] tracking-tight leading-tight">
                  {protocol.title || "Het Protocol van Authenticiteit & Verificatie"}
                </h2>
                
                <p className="text-[#333333] font-serif font-light text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                  {protocol.subtitle || "Voordat een antiquarisch meesterwerk in onze gecureerde collectie wordt opgenomen, doorloopt het ons vierstappen-onderzoeksprotocol."}
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
                  {verificationSteps.map((v, i) => (
                    <motion.div
                      key={v.step || i}
                      initial={{ opacity: 0, y: 25 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      whileHover={{ y: -6, borderColor: '#B8860B' }}
                      className="bg-white/95 backdrop-blur-md p-5 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-[#D8CEB8] shadow-card hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
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
                          {v.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#444444] font-serif font-light leading-relaxed">
                          {v.description}
                        </p>
                      </div>

                      <div className="w-10 h-0.5 bg-[#B8860B]/30 group-hover:w-full group-hover:bg-[#B8860B] transition-all duration-500 mt-8" />
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 3. VISUELE BLIKVANGER & UITGELICHT TOPSTUK SHOWCASE           */}
          {/* ------------------------------------------------------------- */}
          <section className="py-16 sm:py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                
                {/* Left Photography Showcase */}
                <div className="lg:col-span-7">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1.0 }}
                    viewport={{ once: true }}
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
                        {story.imageCaption || "Ex-Libris Vacheron-Poinsot op handgemaakt gemarmerd schutblad (1829)."}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Right Editorial Storytelling */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#B8860B] block">
                      {story.badge || "Ex-Libris & Eigendomssporen"}
                    </span>
                    
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#111111] tracking-tight leading-tight">
                      {story.title || "Aantoonbare Historie van Franse Topverzamelaars"}
                    </h2>
                  </div>

                  {/* Quote Block */}
                  {story.quote && (
                    <div className="border-l-2 border-[#B8860B] pl-6 py-2 bg-white/90 backdrop-blur-md p-6 rounded-r-xl border-y border-r border-[#D8CEB8]/70 shadow-xs">
                      <Feather className="w-5 h-5 text-[#B8860B] mb-2" />
                      <p className="text-sm sm:text-base font-serif italic text-[#222222] leading-relaxed">
                        "{story.quote}"
                      </p>
                      <span className="block text-[10px] font-mono uppercase font-bold text-[#8E7035] tracking-widest mt-3">
                        — {story.quoteAuthor || "Atelier Rembrandt"}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-[#444444] font-serif font-light leading-relaxed">
                    {story.narrative}
                  </p>

                  {Array.isArray(story.bullets) && story.bullets.length > 0 && (
                    <div className="pt-2 flex flex-col space-y-3 text-xs font-mono text-[#333333]">
                      {story.bullets.map((bullet, idx) => (
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
          {/* 4. AFSLUITING & PRIVÉ CONSULTATIE CTA (STIJLVOLLE EINDCLIMAX)   */}
          {/* ------------------------------------------------------------- */}
          <section className="py-16 sm:py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="bg-[#1C1A17] text-[#FAF7F2] rounded-2xl p-6 sm:p-10 lg:p-14 border border-[#B8860B]/50 shadow-2xl flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center justify-between gap-6 sm:gap-10">
                <div className="space-y-4 text-center lg:text-left max-w-2xl">
                  <span className="text-xs font-mono text-[#D4AF37] uppercase font-bold tracking-[0.2em] block">
                    {cta.badge || "Particuliere Expertise & Consultatie"}
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                    {cta.title || "Wilt u de Herkomst van uw Eigen Collectie Laten Verifiëren?"}
                  </h3>
                  <p className="text-sm sm:text-base text-[#C5BBAA] font-serif font-light leading-relaxed">
                    {cta.subtitle || "Atelier Rembrandt adviseert verzamelaars en erfgenamen bij de waardebepaling, conservering en authenticiteitsverificatie van historische privé-bibliotheken."}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04, backgroundColor: '#D4AF37', color: '#0F0E0C' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRequestConsultation}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#B8860B] text-[#111111] font-serif font-semibold text-sm sm:text-base rounded-md tracking-wider uppercase transition-colors duration-300 shrink-0 cursor-pointer shadow-xl flex items-center space-x-3 min-h-[48px] w-full sm:w-auto justify-center"
                >
                  <span>{cta.buttonText || "Privé Consultatie Aanvragen"}</span>
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

