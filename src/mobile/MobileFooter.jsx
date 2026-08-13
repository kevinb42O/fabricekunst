import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COPY = {
  nl: { selected: 'Selectie', collection: 'Collectie', provenance: 'Herkomst' },
  en: { selected: 'Selected works', collection: 'Collection', provenance: 'Provenance' },
  fr: { selected: 'Œuvres', collection: 'Collection', provenance: 'Provenance' }
};

export default function MobileFooter({ onNavigate }) {
  const { language, t } = useLanguage();
  const labels = COPY[language] || COPY.en;

  return (
    <footer id="contact" className="border-t border-[#D8CEB8] bg-white px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-10 text-[#332D27] min-[390px]:px-5 min-[600px]:px-8 lg:hidden">
      <div className="mx-auto max-w-3xl">
        <img src="/images/Atelier Rembrandt.png" alt="Atelier Rembrandt" loading="lazy" decoding="async" className="h-9 w-auto object-contain" />

        <div className="mt-7 grid gap-2">
          <a href="mailto:contact@atelierrembrandt.com" className="flex min-h-11 items-center gap-3 font-serif text-sm">
            <Mail className="h-4 w-4 text-[#8E7035]" aria-hidden="true" />
            contact@atelierrembrandt.com
          </a>
          <a href="tel:+32484384530" className="flex min-h-11 items-center gap-3 font-serif text-sm">
            <Phone className="h-4 w-4 text-[#8E7035]" aria-hidden="true" />
            0484 38 45 30
          </a>
        </div>

        <nav aria-label={t('footer.quickLinks')} className="mt-7 grid grid-cols-3 border-y border-[#E8DFCF] py-2">
          <button type="button" onClick={() => onNavigate('topstukken')} className="min-h-11 text-left font-sans text-[10px] font-bold uppercase tracking-[0.12em]">{labels.selected}</button>
          <button type="button" onClick={() => onNavigate('catalogus')} className="min-h-11 text-center font-sans text-[10px] font-bold uppercase tracking-[0.12em]">{labels.collection}</button>
          <button type="button" onClick={() => onNavigate('herkomst')} className="min-h-11 text-right font-sans text-[10px] font-bold uppercase tracking-[0.12em]">{labels.provenance}</button>
        </nav>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 font-serif text-[11px] text-[#6B6258]">
          <span>© {new Date().getFullYear()} Atelier Rembrandt</span>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => onNavigate('privacy')} className="min-h-11">{t('footer.privacy')}</button>
            <button type="button" onClick={() => onNavigate('voorwaarden')} className="min-h-11">{t('footer.terms')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
