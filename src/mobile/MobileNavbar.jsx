import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Mail, Menu, Phone, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../utils/locales';
import { flushAnalytics, trackEvent } from '../hooks/useAnalytics';

const MENU_COPY = {
  nl: { menu: 'Menu openen', close: 'Menu sluiten', language: 'Taal', current: 'Huidig', contact: 'Plan een privébezichtiging' },
  en: { menu: 'Open menu', close: 'Close menu', language: 'Language', current: 'Current', contact: 'Schedule a private viewing' },
  fr: { menu: 'Ouvrir le menu', close: 'Fermer le menu', language: 'Langue', current: 'Actuel', contact: 'Planifier une présentation privée' }
};

export default function MobileNavbar({ onNavigate, activeTab, onRequestConsultation, showRembrandtProject = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const drawerId = useId();
  const menuButtonRef = useRef(null);
  const firstLinkRef = useRef(null);
  const labels = MENU_COPY[language] || MENU_COPY.en;
  const shouldReduceMotion = useReducedMotion();
  const trackContactClick = (eventName) => {
    if (trackEvent(eventName, { placement: 'mobile_navigation' })) {
      flushAnalytics({ useBeacon: true });
    }
  };

  const navLinks = [
    { id: 'home', label: t('nav.home'), href: localizePath('/', language) },
    { id: 'topstukken', label: t('nav.topstukken'), href: localizePath('/topstukken', language) },
    { id: 'catalogus', label: t('nav.collectie'), href: localizePath('/collectie', language) },
    { id: 'herkomst', label: t('nav.herkomst'), href: localizePath('/herkomst', language) },
    { id: 'rembrandt-project', label: t('nav.rembrandtProject'), href: localizePath('/rembrandt-project', language) }
  ].filter((link) => link.id !== 'rembrandt-project' || showRembrandtProject);

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
          <a
            href={localizePath('/', language)}
            onClick={(event) => {
              event.preventDefault();
              onNavigate('home');
            }}
            className="flex min-h-11 items-center justify-center rounded-sm px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035]"
            aria-label={t('nav.backHome') || 'Homepage'}
          >
            <img
              src="/images/Atelier Rembrandt.png"
              alt="Atelier Rembrandt"
              className="h-8 w-auto object-contain contrast-[1.05]"
            />
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#D8CEB8]/90 bg-white text-[#111111] transition-colors active:bg-[#F1ECE3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035]"
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
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="mobile-menu-drawer fixed inset-x-0 bottom-0 z-[65] overflow-y-auto bg-[#FFFEFC]"
          >
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
              <nav aria-label={labels.menu} className="shrink-0 px-5 pb-5 pt-5 min-[600px]:px-8 min-[600px]:pb-7 min-[600px]:pt-7">
                <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#766E64]">
                  {t('footer.quickLinks')}
                </p>
                <div>
                  {navLinks.map((link, index) => {
                    const isActive = activeTab === link.id || (link.id === 'catalogus' && activeTab === 'collectie');
                    return (
                      <motion.a
                        key={link.id}
                        ref={index === 0 ? firstLinkRef : undefined}
                        href={link.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          handleNavigation(link.id);
                        }}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.2, delay: shouldReduceMotion ? 0 : index * 0.035 }}
                        className={`flex min-h-[62px] w-full items-center justify-between border-b px-1 text-left font-serif text-[clamp(1.65rem,6vw,2.35rem)] leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#8E7035] min-[600px]:min-h-[72px] ${
                          isActive
                            ? 'border-[#8E7035] text-[#4A1521]'
                            : 'border-[#E8DFCF]/70 text-[#1C1A17] active:text-[#8E7035]'
                        }`}
                      >
                        <span>{link.label}</span>
                        {isActive ? (
                          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-[#8E7035]">
                            {labels.current}
                          </span>
                        ) : (
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8E7035]" strokeWidth={1.7} aria-hidden="true" />
                        )}
                      </motion.a>
                    );
                  })}
                </div>
              </nav>

              <section
                aria-labelledby={`${drawerId}-contact-title`}
                className="flex flex-1 items-center border-y border-[#D8CEB8]/80 bg-[#FAF7F2] px-5 py-7 min-[600px]:px-8 min-[600px]:py-9"
              >
                <div className="w-full">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8E7035]">
                    {t('footer.contactHeader')}
                  </p>
                  <h2 id={`${drawerId}-contact-title`} className="mt-2 max-w-xl font-serif text-[1.45rem] leading-tight text-[#1C1A17] min-[600px]:text-[1.75rem]">
                    {t('footer.addressText')}
                  </h2>

                  <div className="mt-5 grid gap-1 min-[600px]:grid-cols-2 min-[600px]:gap-3">
                    <a
                      href="mailto:contact@atelierrembrandt.com"
                      onClick={() => trackContactClick('email_clicked')}
                      className="flex min-h-12 min-w-0 items-center gap-3 border-y border-[#D8CEB8]/70 font-serif text-[13px] text-[#332D27] transition-colors active:text-[#8E7035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035] min-[600px]:border"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-[#8E7035]" strokeWidth={1.7} aria-hidden="true" />
                      <span className="truncate">contact@atelierrembrandt.com</span>
                    </a>
                    <a
                      href="tel:+32484384530"
                      onClick={() => trackContactClick('phone_clicked')}
                      className="flex min-h-12 items-center gap-3 border-b border-[#D8CEB8]/70 font-serif text-[13px] text-[#332D27] transition-colors active:text-[#8E7035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035] min-[600px]:border"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-[#8E7035]" strokeWidth={1.7} aria-hidden="true" />
                      <span>0484 38 45 30</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigation('contact')}
                    className="mt-5 flex min-h-12 w-full items-center justify-between bg-[#1C1A17] px-5 text-left font-serif text-xs font-semibold uppercase tracking-[0.13em] text-white transition-colors active:bg-[#8E7035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035] min-[390px]:text-sm"
                  >
                    <span>{labels.contact}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[#D4AF37]" strokeWidth={1.7} aria-hidden="true" />
                  </button>
                </div>
              </section>

              <div className="shrink-0 bg-[#FAF7F2] px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 min-[600px]:px-8">
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
                        className={`h-11 min-w-11 rounded-full border font-sans text-[11px] font-bold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035] ${
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

                <div className="mt-3 flex items-center gap-4 border-t border-[#D8CEB8]/70 pt-2 font-serif text-[11px] text-[#6B6258]">
                  <a
                    href={localizePath('/privacy', language)}
                    onClick={(event) => {
                      event.preventDefault();
                      handleNavigation('privacy');
                    }}
                    className="flex min-h-11 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035]"
                  >
                    {t('footer.privacy')}
                  </a>
                  <span aria-hidden="true" className="text-[#B6AA93]">·</span>
                  <a
                    href={localizePath('/voorwaarden', language)}
                    onClick={(event) => {
                      event.preventDefault();
                      handleNavigation('voorwaarden');
                    }}
                    className="flex min-h-11 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035]"
                  >
                    {t('footer.terms')}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
