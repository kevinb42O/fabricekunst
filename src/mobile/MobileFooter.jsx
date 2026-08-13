import React from 'react';
import { Mail, Phone } from 'lucide-react';
import FacebookIcon from '../components/FacebookIcon';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../utils/locales';

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
          <a
            href="https://www.facebook.com/profile.php?id=61592459230449"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-3 font-serif text-sm transition-colors active:text-[#8E7035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E7035]"
          >
            <FacebookIcon className="h-4 w-4 shrink-0 text-[#8E7035]" />
            {t('footer.facebook')}
          </a>
        </div>

        <nav aria-label={t('footer.quickLinks')} className="mt-7 grid grid-cols-3 border-y border-[#E8DFCF] py-2">
          <a href={localizePath('/topstukken', language)} onClick={(event) => { event.preventDefault(); onNavigate('topstukken'); }} className="flex min-h-11 items-center text-left font-sans text-[10px] font-bold uppercase tracking-[0.12em]">{labels.selected}</a>
          <a href={localizePath('/collectie', language)} onClick={(event) => { event.preventDefault(); onNavigate('catalogus'); }} className="flex min-h-11 items-center justify-center text-center font-sans text-[10px] font-bold uppercase tracking-[0.12em]">{labels.collection}</a>
          <a href={localizePath('/herkomst', language)} onClick={(event) => { event.preventDefault(); onNavigate('herkomst'); }} className="flex min-h-11 items-center justify-end text-right font-sans text-[10px] font-bold uppercase tracking-[0.12em]">{labels.provenance}</a>
        </nav>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 font-serif text-[11px] text-[#6B6258]">
          <span>© {new Date().getFullYear()} Atelier Rembrandt</span>
          <div className="flex items-center gap-4">
            <a href={localizePath('/privacy', language)} onClick={(event) => { event.preventDefault(); onNavigate('privacy'); }} className="flex min-h-11 items-center">{t('footer.privacy')}</a>
            <a href={localizePath('/voorwaarden', language)} onClick={(event) => { event.preventDefault(); onNavigate('voorwaarden'); }} className="flex min-h-11 items-center">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
