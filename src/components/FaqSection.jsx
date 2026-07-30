import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField } from '../utils/translationService';
import { DEFAULT_FAQ_ITEMS } from '../utils/storage';
import { LUXURY_EASE } from '../utils/motion';

export default function FaqSection({ items = [], onRequestConsultation = () => {} }) {
  const { t, language } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);

  const displayItems = Array.isArray(items) && items.length > 0 ? items : DEFAULT_FAQ_ITEMS;

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  // Ultra-smooth animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: LUXURY_EASE
      }
    }
  };

  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        duration: 0.8,
        ease: LUXURY_EASE
      }
    }
  };

  return (
    <section id="faq" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 sm:space-y-16">
        
        {/* Header */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={headerVariants}
          className="text-left space-y-4"
        >
          <span className="text-xs sm:text-sm font-serif tracking-[0.2em] text-[#8E7035] uppercase font-semibold block">
            {t('faq.badge')}
          </span>
          
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#111111] tracking-tight leading-[1.1]">
            {t('faq.title')}
          </h2>

          <p className="text-base sm:text-lg text-[#444444] font-serif italic">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* Accordion list with staggered children */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={listContainerVariants}
          className="space-y-0 divide-y divide-[#D8CEB8]/60"
        >
          {displayItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            const question = getItemField(item, 'question', language);
            const answer = getItemField(item, 'answer', language);

            return (
              <motion.div
                key={item.id || idx}
                variants={itemVariants}
                className="py-6 transition-colors"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none py-2"
                >
                  <span className="font-serif font-bold text-lg sm:text-xl text-[#111111] flex items-center gap-3">
                    <span className="text-xs font-serif font-semibold text-[#8E7035]">
                      0{idx + 1}
                    </span>
                    <span>{question}</span>
                  </span>
                  
                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.4, ease: LUXURY_EASE }}
                    className="shrink-0 text-[#111111]"
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
                      transition={{ duration: 0.4, ease: LUXURY_EASE }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pb-2 text-sm sm:text-base text-[#444444] font-serif font-light leading-relaxed pl-8 border-l border-[#B8860B]/60 my-2">
                        <p className="italic">
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
        <div className="pt-8 border-t border-[#D8CEB8] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-xl font-serif font-bold text-[#111111]">{t('faq.cta.title')}</h4>
            <p className="text-xs sm:text-sm text-[#555555] font-serif italic">{t('faq.cta.subtitle')}</p>
          </div>

          <button
            onClick={onRequestConsultation}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-serif font-semibold uppercase tracking-[0.16em] text-[#111111] border-b border-[#111111] pb-1 hover:text-[#B8860B] hover:border-[#B8860B] transition-colors duration-300 cursor-pointer shrink-0"
          >
            <span>{t('faq.cta.btn')}</span>
          </button>
        </div>

      </div>
    </section>
  );
}

