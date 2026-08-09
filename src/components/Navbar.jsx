import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';

export default function Navbar({ onNavigate, activeTab, onRequestConsultation }) {
  const [scrolled, setScrolled] = useState(false);
  const [isNavInteractive, setIsNavInteractive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll on mobile when menu drawer is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { id: 'topstukken', label: t('nav.topstukken') },
    { id: 'catalogus', label: t('nav.collectie') },
    { id: 'herkomst', label: t('nav.herkomst') },
    { id: 'contact', label: t('nav.contact') || 'Contact' }
  ];

  const languages = [
    { code: 'nl', label: 'NL' },
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' }
  ];

  const handleNavClick = (linkId) => {
    if (linkId === 'contact') {
      if (onRequestConsultation) {
        onRequestConsultation();
      } else {
        onNavigate('contact');
      }
    } else {
      onNavigate(linkId);
    }
  };

  const showNavbarBackground = scrolled || isNavInteractive || mobileMenuOpen;

  return (
    <motion.nav 
      initial={{ y: "0%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 0.8, ease: LUXURY_EASE }}
      onMouseEnter={() => setIsNavInteractive(true)}
      onMouseLeave={() => setIsNavInteractive(false)}
      onFocusCapture={() => setIsNavInteractive(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsNavInteractive(false);
        }
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        showNavbarBackground
          ? 'bg-white/95 backdrop-blur-md border-b border-[#D8CEB8]/60 text-[#111111] shadow-xs' 
          : 'bg-transparent border-none text-[#111111]'
      }`}
    >
      <div className="nav-shell relative">
        <div className="flex lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-between gap-4 lg:gap-8 xl:gap-12 min-h-[76px] sm:min-h-[88px] py-3">
          
          {/* LEFT ZONE: Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-10 2xl:gap-12 min-w-0">
            {navLinks.slice(0, 3).map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-xs sm:text-sm font-serif font-medium tracking-[0.14em] uppercase transition-colors relative py-1 focus:outline-none cursor-pointer ${
                  activeTab === link.id ? 'text-[#111111] font-semibold' : 'text-[#111111]/75 hover:text-[#111111]'
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <motion.span 
                    layoutId="activeTabUnderline"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#111111]" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* CENTER ZONE: Brand Logo - DEAD CENTER (Louis Vuitton Architecture) */}
          <div className="flex-1 lg:flex-initial flex justify-center text-center">
            <motion.button 
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onNavigate('home')} 
              className="flex flex-col items-center justify-center group text-center focus:outline-none cursor-pointer my-auto"
            >
              <img 
                src="/images/Atelier Rembrandt.png" 
                alt="Atelier Rembrandt" 
                className="h-8 sm:h-10 md:h-11 w-auto object-contain filter contrast-[1.05] shrink-0"
              />
              <span className="text-xs sm:text-xs tracking-[0.24em] text-[#8E7035] uppercase font-serif font-medium block leading-none mt-1.5 pl-[0.24em] text-center w-full">
                {t('nav.brandSubtitle')}
              </span>
            </motion.button>
          </div>

          {/* RIGHT ZONE: Contact Link & Ultra-Sleek Language Switcher */}
          <div className="hidden lg:flex items-center justify-end gap-6 xl:gap-10 2xl:gap-12 min-w-0">
            <button
              onClick={() => handleNavClick('contact')}
              className={`text-xs sm:text-sm font-serif font-medium tracking-[0.14em] uppercase transition-colors relative py-1 focus:outline-none cursor-pointer ${
                activeTab === 'contact' ? 'text-[#111111] font-semibold' : 'text-[#111111]/75 hover:text-[#111111]'
              }`}
            >
              {t('nav.contact') || 'Contact'}
            </button>

            <span className="text-[#D8CEB8] text-xs font-serif select-none">•</span>

            <div className="flex items-center space-x-2.5">
              {languages.map((lang, idx) => (
                <React.Fragment key={lang.code}>
                  {idx > 0 && <span className="text-[#D8CEB8] text-xs font-serif select-none">•</span>}
                  <button
                    onClick={() => setLanguage(lang.code)}
                    className={`text-xs font-serif tracking-wider transition-colors cursor-pointer ${
                      language === lang.code
                        ? 'text-[#111111] font-semibold border-b border-[#111111] pb-0.5'
                        : 'text-[#666666] hover:text-[#111111]'
                    }`}
                  >
                    {lang.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm focus:outline-none text-[#111111]`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 top-[72px] bg-black/30 backdrop-blur-sm z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: LUXURY_EASE }}
            className="lg:hidden bg-white border-b border-[#D8CEB8] px-5 pt-4 pb-8 space-y-4 shadow-lg relative z-40"
          >
            {/* Navigation links */}
            <div className="space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    handleNavClick(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 min-h-[48px] text-sm font-serif tracking-wider uppercase transition-colors rounded-lg ${
                    activeTab === link.id 
                      ? 'text-[#8E7557] font-semibold bg-[#EBE2D0]/40' 
                      : 'text-[#231A14] hover:text-[#8E7557] active:bg-[#EBE2D0]'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#D8CEB8]/60 my-2" />

            {/* Language Switcher in Mobile Drawer */}
            <div className="px-4 py-2">
              <span className="text-xs font-serif font-medium uppercase tracking-wider text-[#8C827A] block mb-2">
                {language === 'nl' ? 'Taal / Language' : language === 'fr' ? 'Langue / Language' : 'Language'}
              </span>
              <div className="flex items-center space-x-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                    }}
                    className={`flex-1 py-2.5 rounded-md border text-center text-xs font-serif font-semibold tracking-wider transition-all min-h-[44px] flex items-center justify-center cursor-pointer ${
                      language === lang.code
                        ? 'bg-[#1C1A17] text-[#D4AF37] border-[#B8860B] shadow-sm'
                        : 'bg-white text-[#231A14] border-[#D8CEB8] hover:border-[#1C1A17]'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
