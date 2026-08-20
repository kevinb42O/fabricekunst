import React from 'react';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField } from '../utils/translationService';
import { trackEvent } from '../hooks/useAnalytics';

const WHATSAPP_NUMBER = '32484384530';
const CONTACT_EMAIL = 'contact@atelierrembrandt.com';

const MESSAGE_COPY = {
  nl: (title, ref, url) => `Beste, ik ontvang graag meer informatie over “${title}”${ref ? ` (ref. ${ref})` : ''}. ${url}`,
  en: (title, ref, url) => `Hello, I would like more information about “${title}”${ref ? ` (ref. ${ref})` : ''}. ${url}`,
  fr: (title, ref, url) => `Bonjour, je souhaiterais recevoir plus d’informations sur « ${title} »${ref ? ` (réf. ${ref})` : ''}. ${url}`
};

export default function ArtworkContactActions({ item, onPurchase, compact = false }) {
  const { t, language } = useLanguage();
  const sold = String(item?.status || '').toLowerCase().includes('verkocht') || String(item?.status || '').toLowerCase().includes('sold') || String(item?.status || '').toLowerCase().includes('vendu');
  const title = getItemField(item, 'title', language) || item?.title || '';
  const url = typeof window === 'undefined' ? '' : window.location.href;
  const message = (MESSAGE_COPY[language] || MESSAGE_COPY.en)(title, item?.ref, url);
  const subject = `${t('commerce.askArtwork')}: ${title}${item?.ref ? ` (${item.ref})` : ''}`;

  const trackContact = (eventName, target) => {
    trackEvent(eventName, { placement: 'artwork_contact' });
    trackEvent('cta_clicked', { placement: 'artwork_contact', target, itemId: item?.id });
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackContact('whatsapp_clicked', 'whatsapp')}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#BEB29F] bg-white px-3 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#241F1A] transition-colors duration-200 hover:border-[#8E7035] hover:bg-[#F7F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E7035] focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-4 w-4 text-[#8E7035]" strokeWidth={1.8} aria-hidden="true" />
          {t('commerce.whatsapp')}
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
          onClick={() => trackContact('email_clicked', 'email')}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#BEB29F] bg-white px-3 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#241F1A] transition-colors duration-200 hover:border-[#8E7035] hover:bg-[#F7F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E7035] focus-visible:ring-offset-2"
        >
          <Mail className="h-4 w-4 text-[#8E7035]" strokeWidth={1.8} aria-hidden="true" />
          {t('commerce.email')}
        </a>
      </div>

      <button
        type="button"
        onClick={() => onPurchase?.(item)}
        disabled={sold}
        className="flex min-h-12 w-full items-center justify-between bg-[#1C1A17] px-5 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-[#4A1521] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E7035] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#E8E3DA] disabled:text-[#6F675E]"
      >
        <span>{sold ? t('commerce.sold') : t('commerce.purchase')}</span>
        <ArrowRight className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
      </button>
    </div>
  );
}
