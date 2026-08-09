import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';

export default function Footer({ onNavigate }) {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="relative z-30 bg-white text-[#444444] pt-10 sm:pt-16 pb-8 sm:pb-12 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.9, ease: LUXURY_EASE }}
        className="page-shell-wide"
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
              <span className="text-xs tracking-[0.24em] text-[#8E7035] uppercase font-serif font-medium leading-none pl-[0.24em]">
                {t('nav.brandSubtitle')}
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-[#555555] font-light max-w-md leading-relaxed font-serif">
              {t('hero.description')}
            </p>

            <div className="flex items-center space-x-2 text-xs text-[#B8860B]">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-semibold">{t('footer.addressText')}</span>
            </div>
          </div>

          {/* Col 2: Navigation & Juridisch */}
          <div className="space-y-3">
            <h4 className="text-xs font-serif font-semibold uppercase tracking-[0.16em] text-[#111111]">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-xs sm:text-sm font-serif">
              <li>
                <button onClick={() => onNavigate('topstukken')} className="text-[#333333] hover:text-[#B8860B] transition-colors cursor-pointer">
                  {t('nav.topstukken')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalogus')} className="text-[#333333] hover:text-[#B8860B] transition-colors cursor-pointer">
                  {t('nav.collectie')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('herkomst')} className="text-[#333333] hover:text-[#B8860B] transition-colors cursor-pointer">
                  {t('nav.herkomst')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const el = document.getElementById('faq');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="text-[#333333] hover:text-[#B8860B] transition-colors cursor-pointer"
                >
                  {t('faq.badge') || 'Veelgestelde Vragen'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-serif font-semibold uppercase tracking-[0.16em] text-[#111111]">{t('footer.contactHeader')}</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-serif">
              <li className="flex items-center space-x-2 text-[#333333]">
                <MapPin className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                <span>{t('footer.addressText')}</span>
              </li>
              <li className="flex items-center space-x-2 text-[#333333]">
                <Mail className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                <a href="mailto:contact@atelierrembrandt.com" className="hover:text-[#B8860B] transition-colors font-medium">
                  contact@atelierrembrandt.com
                </a>
              </li>
              <li className="flex items-center space-x-2 text-[#333333]">
                <Phone className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                <a href="tel:+32484384530" className="hover:text-[#B8860B] transition-colors font-medium">
                  0484 38 45 30
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 flex flex-col items-center justify-center text-center sm:flex-row sm:justify-between text-xs text-[#666666] space-y-3 sm:space-y-0 font-serif">
          <div className="flex flex-col sm:flex-row items-center space-y-1.5 sm:space-y-0 sm:space-x-3">
            <p>© {new Date().getFullYear()} Atelier Rembrandt (Andor Comm V.). {t('footer.rights')}</p>
            <img src="/images/andor.jpeg" alt="Andor Comm V." className="h-5 w-auto object-contain opacity-75 filter contrast-105" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-serif">
            <button 
              onClick={() => onNavigate('privacy')} 
              className="hover:text-[#B8860B] transition-colors cursor-pointer underline underline-offset-4 decoration-[#D8CEB8]"
            >
              {t('footer.privacy')}
            </button>
            <span className="text-[#D8CEB8]">•</span>
            <button 
              onClick={() => onNavigate('voorwaarden')} 
              className="hover:text-[#B8860B] transition-colors cursor-pointer underline underline-offset-4 decoration-[#D8CEB8]"
            >
              {t('footer.terms')}
            </button>
          </div>
        </div>

      </motion.div>
    </footer>
  );
}

