import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Award, Bookmark } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedPrice } from '../utils/translationService';

export default function ScarronSection({ item, onInquirySuccess, onOpenItemDetail, onRequestInquiry }) {
  const { t, language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1.0, 0.97]);

  const images = [
    { url: "/images/scarron-candlelight-hero.jpg", caption: "Sfeervolle compositie van de drie delen bij kaarslicht, ganzenveer en antieke globe" },
    { url: "/images/scarron-engraving-titlepage.jpg", caption: "Frontispice kopergravures en geïllustreerde titelpagina (Amsterdam, 1713)" },
    { url: "/images/scarron-spines-white-bg.jpg", caption: "Overzicht van de authentieke kalfslederen ruggen met goudgestempelde versieringen" }
  ];

  const itemTitle = item ? getItemField(item, 'title', language) : t('scarron.title');
  const itemSubtitle = item ? getItemField(item, 'subtitle', language) : t('scarron.subtitle');
  const itemPrice = item ? getLocalizedPrice(item.price, language) : t('voltaire.priceOnRequest');
  const itemDescription = item ? getItemField(item, 'description', language) : t('scarron.description');
  const itemBinding = item ? getItemField(item, 'binding', language) : t('scarron.detailBinding');
  const itemProvenance = item ? getItemField(item, 'provenance', language) : null;

  const scarronItem = item || {
    id: 'scarron-1713-oeuvres',
    title: itemTitle,
    ref: 'FB-1713-SCA',
    author: 'Paul Scarron',
    year: '1713',
    price: itemPrice,
    images
  };

  const handleRequestInquiry = () => {
    if (onRequestInquiry) onRequestInquiry(scarronItem);
  };

  return (
    <section 
      ref={sectionRef} 
      id="scarron-1713" 
      className="py-24 bg-white overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16"
      >
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#111111] pb-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] mb-2 font-mono"
            >
              <Award className="w-4 h-4 text-[#B8860B]" />
              <span>{t('scarron.badge')}</span>
            </motion.div>
            
            <h2 className="text-4xl sm:text-6xl font-serif font-bold text-[#111111] tracking-tight">
              {itemTitle}
            </h2>
            <p className="text-lg text-[#555555] font-serif italic mt-1">
              {itemSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
            <span className="text-xl sm:text-2xl font-serif font-bold text-[#B8860B] whitespace-nowrap">
              {itemPrice}
            </span>
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: "#B8860B", color: "#111111" }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRequestInquiry}
              className="px-6 py-3.5 rounded-sm bg-[#1C1A17] text-[#FAF7F2] font-semibold text-xs uppercase tracking-[0.18em] border border-[#B8860B]/40 hover:border-[#B8860B] transition-colors duration-300 shadow-sm cursor-pointer font-mono whitespace-nowrap shrink-0"
            >
              <span>{t('voltaire.inquireBtn')}</span>
            </motion.button>
          </div>
        </div>

        {/* HIGH-RES IMAGE SHOWCASE WITH SCROLL PARALLAX */}
        <div className="space-y-4">
          <motion.div 
            style={{ y: imageY, scale: imageScale }}
            className="relative rounded-lg overflow-hidden bg-white border-2 border-[#D8CEB8] shadow-card aspect-[16/9] group pointer-events-none"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0.3, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1.0 }}
                exit={{ opacity: 0.3 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                src={typeof images[activeImage] === 'string' ? images[activeImage] : (images[activeImage]?.url || images[activeImage])}
                alt={images[activeImage]?.caption || itemTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </AnimatePresence>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 flex items-center justify-between z-10">
              <span className="text-sm font-serif font-semibold text-white">
                {images[activeImage]?.caption || itemTitle}
              </span>
              <span className="text-xs font-mono text-[#D4AF37] font-bold px-3 py-1 rounded bg-[#111111] shadow-sm">
                {t('voltaire.photoOf', { current: activeImage + 1, total: images.length })}
              </span>
            </div>
          </motion.div>

          {/* Widescreen Thumbnail Strip */}
          <div className="grid grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveImage(idx)}
                className={`relative rounded-md overflow-hidden border-2 aspect-video transition-all cursor-pointer ${
                  activeImage === idx ? 'border-[#111111] ring-2 ring-[#B8860B]/60 shadow-md' : 'border-[#D8CEB8] opacity-70 hover:opacity-100'
                }`}
              >
                <img src={typeof img === 'string' ? img : img.url} alt="" className="w-full h-full object-cover" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* NARRATIVE & SPECIFICATIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Narrative */}
          <div className="lg:col-span-7 space-y-6 text-[#333333] font-serif leading-relaxed text-base sm:text-lg">
            <h3 className="text-2xl font-bold text-[#111111] leading-tight">
              {itemTitle}
            </h3>
            <p>
              {itemDescription}
            </p>

            <motion.div 
              whileHover={{ y: -4, borderColor: "#B8860B" }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-md bg-white border-2 border-[#D8CEB8] shadow-sm space-y-3 font-sans transition-colors"
            >
              <div className="flex items-center space-x-2 text-[#B8860B] font-bold text-xs uppercase tracking-wider">
                <Bookmark className="w-5 h-5 text-[#B8860B]" />
                <span>Exemplaar met Zeldzame Kopergravures</span>
              </div>
              <p className="text-sm text-[#111111] italic font-serif leading-relaxed">
                {itemBinding}
              </p>
              {itemProvenance && (
                <p className="text-xs text-[#555555]">{itemProvenance}</p>
              )}
            </motion.div>
          </div>

          {/* Specifications Sidebar */}
          <motion.div 
            whileHover={{ y: -4, borderColor: "#B8860B" }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-5 bg-white rounded-lg p-6 border-2 border-[#D8CEB8] shadow-card space-y-4 font-sans text-xs transition-colors"
          >
            <h4 className="text-base font-serif font-bold text-[#111111] border-b border-[#D8CEB8] pb-3">
              {t('voltaire.specTitle')}
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.author')}</span>
                <span className="font-bold text-[#111111] font-serif text-sm">{item?.author || 'Paul Scarron'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">Jaar / Periode</span>
                <span className="font-bold text-[#111111] font-serif text-sm">{item?.year || '1713'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.volumeCount')}</span>
                <span className="font-bold text-[#111111] font-serif text-sm">10 Delen (Compleet)</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">Plaats &amp; Jaar</span>
                <span className="font-bold text-[#111111]">Amsterdam, 1713</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.binding')}</span>
                <span className="font-bold text-[#111111]">Goudgestempeld Volleder</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">Illustraties</span>
                <span className="font-bold text-[#111111]">Originele Kopergravures</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.refCode')}</span>
                <span className="font-bold font-mono text-[#B8860B]">FB-1713-SCA</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              {onOpenItemDetail && item && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenItemDetail(item)}
                  className="w-full py-3.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs uppercase tracking-wider border border-[#B8860B]/40 hover:border-[#B8860B] transition-colors duration-300 text-center block cursor-pointer font-mono"
                >
                  <span>{t('voltaire.viewCatalogCard')}</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRequestInquiry}
                className="w-full py-3 rounded-sm bg-[#FAF7F2] text-[#111111] hover:bg-[#111111] hover:text-white font-semibold text-xs uppercase tracking-wider border border-[#D8CEB8] transition-colors duration-300 text-center block cursor-pointer font-mono"
              >
                <span>{t('voltaire.requestPrivateViewing')}</span>
              </motion.button>
            </div>
          </motion.div>

        </div>

      </motion.div>
    </section>
  );
}

