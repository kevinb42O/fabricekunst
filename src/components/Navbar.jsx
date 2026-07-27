import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ onNavigate, activeTab, onRequestConsultation }) {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update background styling state
      setScrolled(currentScrollY > 20);

      // Always show navbar near top of page (< 140px)
      if (currentScrollY < 140) {
        setVisible(true);
      } else {
        const delta = currentScrollY - lastScrollY;
        // Require a distinct scroll down (> 22px) to trigger gentle hide
        if (delta > 22) {
          setVisible(false);
        } else if (delta < -12) {
          // Scroll up (> 12px) to reveal
          setVisible(true);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <motion.nav 
      initial={{ y: "0%" }}
      animate={{ 
        y: (visible || mobileMenuOpen) ? "0%" : "-100%"
      }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-[#D8CEB8]/80 shadow-xs' 
          : 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#D8CEB8]/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[72px] sm:min-h-[80px] py-2.5">
          
          {/* Brand Image Header - Perfectly Balanced & Centered */}
          <motion.button 
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onNavigate('home')} 
            className="flex flex-col items-center justify-center group text-center focus:outline-none cursor-pointer my-auto"
          >
            <img 
              src="/images/Atelier Rembrandt.png" 
              alt="Atelier Rembrandt" 
              className="h-9 sm:h-11 md:h-12 w-auto object-contain filter contrast-[1.05] shrink-0"
            />
            <span className="text-[9.5px] sm:text-[10.5px] md:text-[11px] tracking-[0.38em] text-[#8E7035] uppercase font-serif font-semibold block leading-none mt-1.5 pl-[0.38em] text-center w-full">
              {t('nav.brandSubtitle')}
            </span>
          </motion.button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-xs font-serif font-medium tracking-[0.14em] uppercase transition-colors relative py-1 focus:outline-none cursor-pointer ${
                  activeTab === link.id ? 'text-[#8E7557]' : 'text-[#231A14]/80 hover:text-[#8E7557]'
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <motion.span 
                    layoutId="activeTabUnderline"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#8E7557] rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Ultra-Sleek Language Switcher */}
          <div className="hidden md:flex items-center space-x-2.5">
            {languages.map((lang, idx) => (
              <React.Fragment key={lang.code}>
                {idx > 0 && <span className="text-[#D8CEB8] text-xs font-serif select-none">•</span>}
                <button
                  onClick={() => setLanguage(lang.code)}
                  className={`text-[11px] font-mono tracking-widest transition-colors cursor-pointer ${
                    language === lang.code
                      ? 'text-[#231A14] font-bold border-b border-[#8E7557] pb-0.5'
                      : 'text-[#8C827A] hover:text-[#231A14]'
                  }`}
                >
                  {lang.label}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm text-[#231A14] hover:text-[#8E7557] focus:outline-none"
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
            className="md:hidden fixed inset-0 top-[72px] bg-black/30 backdrop-blur-sm z-30"
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden bg-[#FAF7F2] border-b border-[#D8CEB8] px-5 pt-4 pb-8 space-y-4 shadow-lg relative z-40"
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
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                {language === 'nl' ? 'Taal / Language' : language === 'fr' ? 'Langue / Language' : 'Language'}
              </span>
              <div className="flex items-center space-x-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                    }}
                    className={`flex-1 py-2.5 rounded-md border text-center text-xs font-mono font-bold tracking-wider transition-all min-h-[44px] flex items-center justify-center cursor-pointer ${
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
