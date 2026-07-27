import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ShieldCheck, Mail, PhoneCall } from 'lucide-react';
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

  return (
    <section id="faq" className="py-24 bg-[#FAF7F2] relative border-b border-[#D8CEB8] overflow-hidden">
      
      {/* Decorative ambient background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B8860B]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-[#B8860B] text-xs font-bold uppercase tracking-[0.25em] font-mono px-3.5 py-1.5 rounded-full bg-white border border-[#B8860B]/30 shadow-xs">
            <HelpCircle className="w-4 h-4 text-[#B8860B]" />
            <span>{t('faq.badge')}</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#111111] tracking-tight">
            {t('faq.title')}
          </h2>

          <p className="text-sm sm:text-base text-[#555555] font-serif italic">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-4">
          {displayItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            const question = getItemField(item, 'question', language);
            const answer = getItemField(item, 'answer', language);

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-white border-[#B8860B] shadow-md' 
                    : 'bg-white/80 hover:bg-white border-[#D8CEB8] shadow-2xs'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-serif font-bold text-base sm:text-lg text-[#111111] flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#B8860B] px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#D8CEB8]">
                      0{idx + 1}
                    </span>
                    <span>{question}</span>
                  </span>
                  
                  <div className={`p-2 rounded-full border transition-transform duration-300 shrink-0 ${
                    isOpen ? 'bg-[#1C1A17] text-[#D4AF37] border-[#B8860B] rotate-180' : 'bg-[#FAF7F2] text-[#555555] border-[#D8CEB8]'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm text-[#444444] font-serif leading-relaxed border-t border-[#FAF7F2]">
                        <p className="pl-9 border-l-2 border-[#B8860B]/60 italic">
                          {answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Still have questions CTA */}
        <div className="p-8 rounded-2xl bg-[#1C1A17] text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#332E27] shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-serif font-bold text-white">Staat uw vraag er niet tussen?</h4>
            <p className="text-xs text-stone-300 font-serif">Neem rechtstreeks contact op met ons atelier voor persoonlijk advies.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRequestConsultation}
            className="px-6 py-3 rounded-sm bg-[#B8860B] hover:bg-white text-[#111111] font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center space-x-2 shadow-md"
          >
            <Mail className="w-4 h-4" />
            <span>Stel Uw Vraag</span>
          </motion.button>
        </div>

      </div>
    </section>
  );
}
