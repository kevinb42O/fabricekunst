import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Award, Bookmark, ZoomIn } from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedPrice } from '../utils/translationService';

export default function VoltaireSection({ item, onInquirySuccess, onOpenItemDetail, onRequestInquiry }) {
  const { t, language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1.0, 0.97]);

  const images = item?.images && item.images.length > 0 ? item.images : [
    { url: "/images/voltaire-theatre-bust-reading-glasses.jpg", caption: "Théâtre de Voltaire met antieke leesbril en marmeren buste" },
    { url: "/images/voltaire-presentation-overlay.jpg", caption: "Presentatie met geopend deel, portretgravure en ex-libris VacheronPoinsot" },
    { url: "/images/voltaire-marbled-endpaper-exlibris.jpg", caption: "Close-up van het handgemaakte marmeren schutblad en ex-libris label" },
    { url: "/images/voltaire-lit-bookcase-desk.jpg", caption: "De Voltaire-reeks in een sfeervol verlichte antikariaats-boekenkast" },
    { url: "/images/voltaire-52-books-birds-eye.jpg", caption: "Totaaloverzicht van de complete 52-delige reeks liggend in vier keurige rijen" }
  ];

  const itemTitle = item ? getItemField(item, 'title', language) : t('voltaire.title');
  const itemSubtitle = item ? getItemField(item, 'subtitle', language) : t('voltaire.subtitle');
  const itemPrice = item ? getLocalizedPrice(item.price, language) : t('voltaire.priceOnRequest');
  const itemDescription = item ? getItemField(item, 'description', language) : t('voltaire.narrativeP1');
  const itemHistoricalContext = item ? getItemField(item, 'historicalContext', language) : null;
  const itemProvenance = item ? getItemField(item, 'provenance', language) : t('voltaire.provenanceQuote');
  const itemProvenanceDetails = item ? getItemField(item, 'provenanceDetails', language) : null;
  const itemBinding = item ? getItemField(item, 'binding', language) : null;

  const voltaireItem = item || {
    id: 'voltaire-1829-52delig',
    title: itemTitle,
    ref: 'FB-1829-VOL',
    author: 'Voltaire',
    year: '1829–1833',
    price: itemPrice,
    images
  };

  const handleRequestInquiry = () => {
    if (onRequestInquiry) onRequestInquiry(voltaireItem);
  };

  return (
    <section 
      ref={sectionRef} 
      id="topstukken" 
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
              <Bookmark className="w-4 h-4 text-[#B8860B]" />
              <span>{t('voltaire.badge')}</span>
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

        {/* GIANT HIGH-RES FEATURE IMAGE SHOWCASE WITH SCROLL PARALLAX */}
        <div className="space-y-4">
          <motion.div 
            style={{ y: imageY, scale: imageScale }}
            className="relative rounded-lg overflow-hidden bg-white border-2 border-[#D8CEB8] shadow-card aspect-[16/9] group pointer-events-none"
          >
            <div onClick={() => setZoomModalOpen(true)} className="absolute inset-0 cursor-zoom-in pointer-events-auto">
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
              <span className="text-sm font-serif font-semibold text-white flex items-center space-x-2">
                <span>{images[activeImage]?.caption || itemTitle}</span>
                <span className="text-xs font-mono text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">{t('voltaire.clickEnlarge')}</span>
              </span>
              <span className="text-xs font-mono text-[#D4AF37] font-bold px-3 py-1 rounded bg-[#111111] flex items-center space-x-1.5 shadow-sm">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{t('voltaire.photoOf', { current: activeImage + 1, total: images.length })}</span>
              </span>
            </div>
            </div>
          </motion.div>

          {/* Widescreen Thumbnail Strip */}
          <div className="grid grid-cols-5 gap-3 sm:gap-4">
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

        {/* Image Zoom Lightbox */}
        {zoomModalOpen && (
          <ImageZoomModal
            images={images.map(img => typeof img === 'string' ? { url: img, caption: itemTitle } : img)}
            initialIndex={activeImage}
            title={itemTitle}
            onClose={() => setZoomModalOpen(false)}
          />
        )}

        {/* NARRATIVE & SPECIFICATIONS GRID IN PAGE FLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Detailed Storytelling Narrative */}
          <div className="lg:col-span-7 space-y-6 text-[#333333] font-serif leading-relaxed text-base sm:text-lg">
            <h3 className="text-2xl font-bold text-[#111111] leading-tight">
              {itemTitle}
            </h3>
            <p>
              {itemDescription}
            </p>
            {itemHistoricalContext && (
              <p>{itemHistoricalContext}</p>
            )}

            {/* Provenance Box */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "#B8860B" }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-md bg-white border-2 border-[#D8CEB8] shadow-sm space-y-3 font-sans transition-colors"
            >
              <div className="flex items-center space-x-2 text-[#B8860B] font-bold text-xs uppercase tracking-wider">
                <Award className="w-5 h-5 text-[#B8860B]" />
                <span>{t('voltaire.provenanceBadge')}</span>
              </div>
              <p className="text-sm text-[#111111] italic font-serif leading-relaxed">
                "{itemProvenance}"
              </p>
              {itemProvenanceDetails && (
                <p className="text-xs text-[#555555]">
                  {itemProvenanceDetails}
            </motion.div>
          </div>

          {/* Specifications Sidebar Table */}
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
                <span className="font-bold text-[#111111] font-serif text-sm">{item?.author || 'Voltaire'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">Jaar / Periode</span>
                <span className="font-bold text-[#111111] font-serif text-sm">{item?.year || '1829–1833'}</span>
              </div>

              {item?.publisher && (
                <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                  <span className="text-[#666666] font-mono uppercase">Uitgever</span>
                  <span className="font-bold text-[#111111] font-serif text-sm">{item.publisher}</span>
                </div>
              )}

              {item?.binding && (
                <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                  <span className="text-[#666666] font-mono uppercase">Binding</span>
                  <span className="font-bold text-[#111111] font-serif text-sm">{item.binding}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.volumeCount')}</span>
                <span className="font-bold text-[#111111] font-serif text-sm">52 Delen (Compleet)</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.publisher')}</span>
                <span className="font-bold text-[#111111]">Lecointe / Didot, Parijs</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.year')}</span>
                <span className="font-bold text-[#111111]">1829–1833 (19e Eeuw)</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.binding')}</span>
                <span className="font-bold text-[#111111]">Rood Chagrin Halfleer</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#FAF7F2]">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.format')}</span>
                <span className="font-bold text-[#111111]">In-8° (21,5 x 13,5 cm)</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-[#666666] font-mono uppercase">{t('voltaire.refCode')}</span>
                <span className="font-bold font-mono text-[#B8860B]">FB-1829-VOL</span>
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

