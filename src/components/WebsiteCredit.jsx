import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function WebsiteCredit({ inline = false }) {
  const { t } = useLanguage();

  return (
    <div className={inline ? 'flex shrink-0 justify-center' : 'mt-6 flex justify-center border-t border-[#E8DFCF] pt-4 lg:mt-7 lg:justify-end'}>
      <a
        href="https://www.webaanzee.be/"
        target="_blank"
        rel="noopener noreferrer"
        className={`group inline-flex min-h-11 items-center justify-center rounded-sm py-2 text-[#6B6258] transition-colors hover:text-[#332D27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8E7035] ${inline ? 'flex-col gap-2' : 'flex-wrap gap-x-3 gap-y-2'}`}
      >
        <span className="font-serif text-xs">{t('footer.websiteCredit')}</span>
        <img
          src="/images/webaanzee-wordmark.webp"
          alt="Webaanzee"
          width="140"
          height="17"
          loading="lazy"
          decoding="async"
          className="h-auto w-[140px]"
        />
        {!inline && <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#8E7035]" />}
      </a>
    </div>
  );
}
