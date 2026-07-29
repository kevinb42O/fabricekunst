import React from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer({ onOpenAdmin, onNavigate }) {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="relative z-30 bg-white text-[#444444] border-t border-[#D8CEB8] pt-10 sm:pt-16 pb-8 sm:pb-12 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-[#D8CEB8]">
          
          {/* Col 1: Brand & Philosophy */}
          <div className="sm:col-span-2 md:col-span-2 space-y-4">
            <div className="flex flex-col items-start space-y-1.5">
              <img 
                src="/images/Atelier Rembrandt.png" 
                alt="Atelier Rembrandt" 
                className="h-10 sm:h-12 md:h-13 w-auto object-contain filter contrast-[1.05]"
              />
              <span className="text-[9.5px] sm:text-[10.5px] md:text-[11px] tracking-[0.38em] text-[#8E7035] uppercase font-serif font-semibold leading-none pl-[0.38em]">
                {t('nav.brandSubtitle')}
              </span>
            </div>
            
            <p className="text-xs text-[#555555] font-light max-w-md leading-relaxed font-serif">
              {t('hero.description')}
            </p>

            <div className="flex items-center space-x-2 text-xs text-[#B8860B]">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold">{t('footer.addressText')}</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] font-serif">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <button onClick={() => onNavigate('topstukken')} className="text-[#333333] hover:text-[#B8860B] transition-colors">
                  {t('nav.topstukken')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalogus')} className="text-[#333333] hover:text-[#B8860B] transition-colors">
                  {t('nav.collectie')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('herkomst')} className="text-[#333333] hover:text-[#B8860B] transition-colors">
                  {t('nav.herkomst')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const el = document.getElementById('faq');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="text-[#333333] hover:text-[#B8860B] transition-colors"
                >
                  {t('faq.badge') || 'Veelgestelde Vragen'}
                </button>
              </li>
              <li>
                <motion.button 
                  whileHover={{ scale: 1.05, x: 2 }}
                  onClick={onOpenAdmin} 
                  className="text-[#B8860B] hover:underline transition-colors flex items-center space-x-1 font-bold cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>{t('footer.adminLink')}</span>
                </motion.button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] font-serif">{t('footer.contactHeader')}</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li className="flex items-center space-x-2 text-[#333333]">
                <MapPin className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                <span>{t('footer.addressText')}</span>
              </li>
              <li className="flex items-center space-x-2 text-[#333333]">
                <Mail className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                <a href="mailto:contact@atelierrembrandt.com" className="hover:text-[#B8860B] transition-colors font-semibold">
                  contact@atelierrembrandt.com
                </a>
              </li>
              <li className="flex items-center space-x-2 text-[#333333]">
                <Phone className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                <a href="tel:+32484384530" className="hover:text-[#B8860B] transition-colors font-semibold">
                  0484 38 45 30
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 flex flex-col items-center justify-center text-center sm:flex-row sm:justify-between text-[11px] text-[#666666] space-y-3 sm:space-y-0 font-serif">
          <p>© {new Date().getFullYear()} Atelier Rembrandt. {t('footer.rights')}</p>
          <div className="flex items-center space-x-4">
            <span>{t('item_detail.provenanceGuaranteed')}</span>
          </div>
        </div>

      </motion.div>
    </footer>
  );
}

