import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField } from '../utils/translationService';
import { DEFAULT_FAQ_ITEMS } from '../utils/storage';

export default function FaqSection({ items = [], onRequestConsultation = () => {} }) {
  const { t, language } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);

  const displayItems = Array.isArray(items) && items.length > 0 ? items : DEFAULT_FAQ_ITEMS;

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  // Ultra-smooth animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-transparent relative overflow-hidden">
      
      {/* Decorative ambient background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B8860B]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 sm:space-y-12">
        
        {/* Header */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={headerVariants}
          className="text-center space-y-3 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] font-mono px-3.5 py-1.5 rounded-full bg-white border border-[#B8860B]/30 shadow-xs">
            <HelpCircle className="w-4 h-4 text-[#B8860B]" />
            <span>{t('faq.badge')}</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-[#111111] tracking-tight">
            {t('faq.title')}
          </h2>

          <p className="text-sm sm:text-base text-[#555555] font-serif italic">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* Accordion list with staggered children */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={listContainerVariants}
          className="space-y-4"
        >
          {displayItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            const question = getItemField(item, 'question', language);
            const answer = getItemField(item, 'answer', language);

            return (
              <motion.div
                key={item.id || idx}
                variants={itemVariants}
                className={`rounded-2xl border transition-colors transition-shadow duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-white border-[#B8860B] shadow-md' 
                    : 'bg-white/80 hover:bg-white border-[#D8CEB8] shadow-2xs'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-4 sm:p-6 text-left flex items-center justify-between gap-3 sm:gap-4 cursor-pointer min-h-[56px]"
                >
                  <span className="font-serif font-bold text-sm sm:text-base md:text-lg text-[#111111] flex items-center gap-2 sm:gap-3">
                    <span className="text-xs font-mono font-bold text-[#B8860B] px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#D8CEB8]">
                      0{idx + 1}
                    </span>
                    <span>{question}</span>
                  </span>
                  
                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`p-2 rounded-full border transition-colors duration-300 shrink-0 ${
                      isOpen ? 'bg-[#1C1A17] text-[#D4AF37] border-[#B8860B]' : 'bg-[#FAF7F2] text-[#555555] border-[#D8CEB8]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 text-sm text-[#444444] font-serif leading-relaxed border-t border-[#FAF7F2]">
                        <p className="pl-7 sm:pl-9 border-l-2 border-[#B8860B]/60 italic">
                          {answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Still have questions CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 sm:p-8 rounded-2xl bg-[#1C1A17] text-white flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center justify-between gap-4 sm:gap-6 border border-[#332E27] shadow-xl"
        >
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-serif font-bold text-white">{t('faq.cta.title')}</h4>
            <p className="text-xs text-stone-300 font-serif">{t('faq.cta.subtitle')}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRequestConsultation}
            className="px-5 sm:px-6 py-3 rounded-sm bg-[#B8860B] hover:bg-white text-[#111111] font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center space-x-2 shadow-md min-h-[48px] w-full sm:w-auto justify-center"
          >
            <Mail className="w-4 h-4" />
            <span>{t('faq.cta.btn')}</span>
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
}

