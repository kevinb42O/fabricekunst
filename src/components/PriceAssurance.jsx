import React from 'react';
import { FileCheck2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PriceAssurance({ compact = false, className = '', showDuties = false }) {
  const { t } = useLanguage();

  return (
    <div
      className={`${compact ? 'mt-2 gap-x-3 gap-y-1 text-[9px]' : 'mt-3 gap-x-5 gap-y-2 text-[10px]'} flex flex-wrap font-sans font-semibold uppercase tracking-[0.1em] text-[#62584D] ${className}`}
      aria-label={`${t('commerce.shippingIncluded')}. ${t('commerce.documentationIncluded')}.`}
    >
      <span className="inline-flex items-start gap-1.5 leading-[1.45]">
        <ShieldCheck className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mt-px shrink-0 text-[#8E7035]`} strokeWidth={1.8} aria-hidden="true" />
        <span>{t('commerce.shippingIncluded')}</span>
      </span>
      <span className="inline-flex items-start gap-1.5 leading-[1.45]">
        <FileCheck2 className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mt-px shrink-0 text-[#8E7035]`} strokeWidth={1.8} aria-hidden="true" />
        <span>{t('commerce.documentationIncluded')}</span>
      </span>
      {showDuties && (
        <span className="basis-full font-normal normal-case tracking-normal text-[#71675D]">
          {t('commerce.dutiesExcluded')}
        </span>
      )}
    </div>
  );
}
