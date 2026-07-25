import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Navbar({ onNavigate, activeTab, onRequestConsultation }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'topstukken', label: 'Topstukken' },
    { id: 'catalogus', label: 'Collectie' },
    { id: 'herkomst', label: 'Herkomst' }
  ];

  const handleConsultationClick = () => {
    if (onRequestConsultation) {
      onRequestConsultation();
    } else {
      onNavigate('contact');
    }
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-[#D8CEB8] py-2 shadow-sm' 
          : 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#D8CEB8]/60 py-2.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 sm:h-12">
          
          {/* Brand Logo - Slim & Elegant with Motion */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('home')} 
            className="flex items-center space-x-2.5 group text-left focus:outline-none cursor-pointer"
          >
            <motion.div 
              whileHover={{ rotate: 5, borderColor: '#B8860B' }}
              className="w-7 h-7 rounded-sm bg-white border border-[#111111] flex items-center justify-center shadow-xs transition-colors duration-300"
            >
              <span className="font-serif font-bold text-base text-[#111111] group-hover:text-[#B8860B]">F</span>
            </motion.div>
            <div className="flex flex-col justify-center">
              <span className="font-serif font-semibold text-sm sm:text-base text-[#111111] tracking-wide block leading-tight">
                Fabrice Goffin
              </span>
              <span className="text-[8px] tracking-[0.2em] text-[#888888] uppercase font-sans font-medium block leading-none">
                Antiquariaat & Kunst
              </span>
            </div>
          </motion.button>

          {/* Desktop Links with Framer Motion Spring Underline */}
          <div className="hidden md:flex items-center space-x-7">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors relative py-1 focus:outline-none cursor-pointer ${
                  activeTab === link.id ? 'text-[#B8860B]' : 'text-[#222222] hover:text-[#B8860B]'
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <motion.span 
                    layoutId="activeTabUnderline"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Primary Action Button */}
          <div className="hidden md:flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#B8860B', color: '#111111' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleConsultationClick}
              className="px-5 py-2 rounded-sm bg-[#1C1A17] text-[#FAF7F2] font-sans font-semibold text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 border border-[#B8860B]/40 hover:border-[#B8860B] shadow-xs cursor-pointer"
            >
              Privé Consultatie
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-sm text-[#111111] hover:text-[#B8860B] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-white border-b border-[#D8CEB8] px-4 pt-3 pb-5 space-y-2 shadow-md overflow-hidden"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-1.5 rounded-md text-sm font-semibold text-[#111111] hover:bg-[#FAF7F2] hover:text-[#B8860B] transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-[#D8CEB8] flex flex-col space-y-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleConsultationClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 rounded-sm bg-[#1C1A17] hover:bg-[#B8860B] text-[#FAF7F2] hover:text-[#111111] font-semibold text-xs tracking-[0.2em] uppercase border border-[#B8860B]/40 transition-all shadow-xs"
              >
                Privé Consultatie
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
