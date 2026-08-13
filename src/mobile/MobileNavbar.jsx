import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MENU_COPY = {
  nl: { menu: 'Menu openen', close: 'Menu sluiten', language: 'Taal', contact: 'Plan een privébezichtiging' },
  en: { menu: 'Open menu', close: 'Close menu', language: 'Language', contact: 'Schedule a private viewing' },
  fr: { menu: 'Ouvrir le menu', close: 'Fermer le menu', language: 'Langue', contact: 'Planifier une présentation privée' }
};

export default function MobileNavbar({ onNavigate, activeTab, onRequestConsultation }) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const drawerId = useId();
  const menuButtonRef = useRef(null);
  const firstLinkRef = useRef(null);
  const labels = MENU_COPY[language] || MENU_COPY.en;

  const navLinks = [
    { id: 'topstukken', label: t('nav.topstukken') },
    { id: 'catalogus', label: t('nav.collectie') },
    { id: 'herkomst', label: t('nav.herkomst') }
  ];

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => firstLinkRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;
      const drawer = document.getElementById(drawerId);
      const focusable = drawer?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerId, isOpen]);

  const closeMenu = ({ restoreFocus = false } = {}) => {
    setIsOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const handleNavigation = (id) => {
    closeMenu();
    if (id === 'contact') {
      onRequestConsultation?.();
      return;
    }
    onNavigate(id);
  };

  return (
    <>
      <header className="mobile-site-header fixed inset-x-0 top-0 z-[70] border-b border-[#E8DFCF]/80 bg-[#FFFEFC]/95 text-[#111111] backdrop-blur-xl">
        <div className="mobile-safe-top" />
        <div className="relative flex h-16 items-center justify-center px-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex min-h-11 items-center justify-center rounded-sm px-3 focus:outline-none"
            aria-label={t('nav.backHome') || 'Homepage'}
          >
            <img
              src="/images/Atelier Rembrandt.png"
              alt="Atelier Rembrandt"
              className="h-8 w-auto object-contain contrast-[1.05]"
            />
          </button>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#D8CEB8]/90 bg-white text-[#111111] transition-colors active:bg-[#F1ECE3]"
            aria-label={isOpen ? labels.close : labels.menu}
            aria-expanded={isOpen}
            aria-controls={drawerId}
          >
            {isOpen ? <X className="h-5 w-5" strokeWidth={1.7} /> : <Menu className="h-5 w-5" strokeWidth={1.7} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label={labels.menu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-menu-drawer fixed inset-x-0 bottom-0 z-[65] flex flex-col bg-[#FFFEFC]"
          >
            <nav aria-label={labels.menu} className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
              <div className="space-y-1">
                {navLinks.map((link, index) => {
                  const isActive = activeTab === link.id || (link.id === 'catalogus' && activeTab === 'collectie');
                  return (
                    <button
                      key={link.id}
                      ref={index === 0 ? firstLinkRef : undefined}
                      type="button"
                      onClick={() => handleNavigation(link.id)}
                      className={`flex min-h-[56px] w-full items-center justify-between border-b px-1 text-left font-serif text-[1.65rem] leading-none transition-colors ${
                        isActive
                          ? 'border-[#8E7035] text-[#4A1521]'
                          : 'border-[#E8DFCF]/70 text-[#1C1A17] active:text-[#8E7035]'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-4 w-4 text-[#8E7035]" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-[#D8CEB8]/80 bg-[#FAF7F2] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-5">
              <button
                type="button"
                onClick={() => handleNavigation('contact')}
                className="mb-5 flex min-h-12 w-full items-center justify-between bg-[#1C1A17] px-5 text-left font-serif text-sm font-semibold uppercase tracking-[0.13em] text-white active:bg-[#8E7035]"
              >
                <span>{labels.contact}</span>
                <ArrowUpRight className="h-4 w-4 text-[#D4AF37]" />
              </button>

              <div className="flex items-center justify-between gap-4">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6258]">
                  {labels.language}
                </span>
                <div className="flex gap-2" role="group" aria-label={labels.language}>
                  {['nl', 'en', 'fr'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLanguage(code)}
                      aria-pressed={language === code}
                      className={`h-11 min-w-11 rounded-full border font-sans text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        language === code
                          ? 'border-[#1C1A17] bg-[#1C1A17] text-[#D4AF37]'
                          : 'border-[#D8CEB8] bg-white text-[#4D453D] active:bg-[#EBE2D0]'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
