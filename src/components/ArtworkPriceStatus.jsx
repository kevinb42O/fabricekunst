import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedPrice, getLocalizedStatus } from '../utils/translationService';

export default function ArtworkPriceStatus({ item, priceClassName = 'text-sm font-serif font-bold text-[#111111]', showAvailable = false, className = '' }) {
  const { language, t } = useLanguage();
  const sold = item.status === 'Verkocht';
  const unavailable = sold || item.status === 'Gereserveerd';
  const strikePrice = sold && /\d/.test(String(item.price || ''));

  return (
    <span className={`artwork-price-status inline-flex max-w-full flex-wrap items-baseline gap-x-3 gap-y-1 ${className}`}>
      <span className={`${priceClassName} ${sold ? 'artwork-price--sold' : ''} ${strikePrice ? 'artwork-price--struck' : ''}`}>
        {getLocalizedPrice(item.price, language) || t('topstukken.priceOnRequest')}
      </span>
      {' '}
      {(unavailable || (showAvailable && item.status === 'Beschikbaar')) && (
        <span className={`font-mono text-xs font-semibold uppercase tracking-[0.08em] ${sold ? 'artwork-status--unavailable' : unavailable ? 'artwork-status--reserved' : 'text-emerald-800'}`}>
          {getLocalizedStatus(item.status, language)}
        </span>
      )}
    </span>
  );
}
