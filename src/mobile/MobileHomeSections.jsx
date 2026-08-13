import React, { useId, useState } from 'react';
import { ArrowRight, BookOpenCheck, ChevronDown, FileCheck2, ShieldCheck, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getItemField, getLocalizedCategory, getLocalizedPrice, getLocalizedStatus } from '../utils/translationService';
import { getItemSlug } from '../utils/itemSlug';
import { localizePath } from '../utils/locales';

const COPY = {
  nl: {
    selected: 'Uitgelichte werken',
    all: 'Bekijk de volledige collectie',
    why: 'Waarom Atelier Rembrandt',
    whyIntro: 'Zekerheid die u vóór een aankoop kunt controleren.',
    proof1: 'Gedocumenteerde herkomst',
    proof1Body: 'Eigendomssporen en bibliografische gegevens worden per object onderzocht.',
    proof2: 'Conditie helder beschreven',
    proof2Body: 'Materiaal, binding en ouderdomssporen worden transparant vastgelegd.',
    proof3: 'Verzekerde, discrete levering',
    proof3Body: 'Professionele verpakking en transport op maat van het object.',
    provenance: 'Lees over ons onderzoek',
    viewing: 'Een werk persoonlijk bekijken?',
    viewingBody: 'Privébezichtigingen en advies zijn uitsluitend op afspraak.',
    viewingCta: 'Plan een privébezichtiging',
    faq: 'Praktische vragen',
    available: 'Beschikbaar'
  },
  en: {
    selected: 'Selected works',
    all: 'View the complete collection',
    why: 'Why Atelier Rembrandt',
    whyIntro: 'Assurance you can verify before acquiring a work.',
    proof1: 'Documented provenance',
    proof1Body: 'Ownership marks and bibliographical records are researched for every work.',
    proof2: 'Condition clearly described',
    proof2Body: 'Materials, binding and traces of age are recorded transparently.',
    proof3: 'Insured, discreet delivery',
    proof3Body: 'Professional packing and transport tailored to each object.',
    provenance: 'Read about our research',
    viewing: 'View a work in person?',
    viewingBody: 'Private viewings and advice are available strictly by appointment.',
    viewingCta: 'Schedule a private viewing',
    faq: 'Practical questions',
    available: 'Available'
  },
  fr: {
    selected: 'Œuvres sélectionnées',
    all: 'Voir la collection complète',
    why: 'Pourquoi Atelier Rembrandt',
    whyIntro: 'Une certitude que vous pouvez vérifier avant toute acquisition.',
    proof1: 'Provenance documentée',
    proof1Body: 'Les marques de propriété et références bibliographiques sont étudiées pour chaque œuvre.',
    proof2: 'État décrit avec précision',
    proof2Body: 'Matériaux, reliure et traces du temps sont documentés avec transparence.',
    proof3: 'Livraison assurée et discrète',
    proof3Body: 'Emballage professionnel et transport adapté à chaque objet.',
    provenance: 'Découvrir notre méthode',
    viewing: 'Voir une œuvre en personne ?',
    viewingBody: 'Présentations privées et conseils uniquement sur rendez-vous.',
    viewingCta: 'Planifier une présentation privée',
    faq: 'Questions pratiques',
    available: 'Disponible'
  }
};

export default function MobileHomeSections({
  items = [],
  faqItems = [],
  onOpenFullCatalog,
  onOpenItemDetail,
  onNavigateProvenance,
  onRequestConsultation
}) {
  const { language } = useLanguage();
  const labels = COPY[language] || COPY.en;
  const featured = items.filter((item) => item?.featured);
  const selected = featured.slice(0, 3);
  const questions = Array.isArray(faqItems) ? faqItems : [];
  const [openFaq, setOpenFaq] = useState(null);
  const faqBaseId = useId();

  return (
    <div className="mobile-home-content bg-[#FFFEFC] text-[#111111] lg:hidden">
      {selected.length > 0 && <section id="topstukken" aria-labelledby="mobile-selected-works" className="px-4 py-16 min-[390px]:px-5 min-[600px]:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 id="mobile-selected-works" className="font-serif text-[2.25rem] font-bold leading-none tracking-[-0.025em] text-[#111111]">
            {labels.selected}
          </h2>

          <div className="mt-8 space-y-12 min-[600px]:grid min-[600px]:grid-cols-2 min-[600px]:gap-x-6 min-[600px]:gap-y-10 min-[600px]:space-y-0">
            {selected.map((item, index) => {
              const status = getLocalizedStatus(item.status, language);
              const isAvailable = String(item.status || '').toLowerCase() === 'beschikbaar';
              return (
                <a
                  key={item.id}
                  href={localizePath(`/collectie/${getItemSlug(item)}`, language)}
                  onClick={(event) => {
                    event.preventDefault();
                    onOpenItemDetail(item);
                  }}
                  className={`block w-full min-w-0 overflow-hidden border-b border-[#D8CEB8] pb-10 text-left active:opacity-80 ${index === 0 ? 'min-[600px]:col-span-2' : ''}`}
                >
                  <span className="block aspect-[4/3] w-full overflow-hidden bg-[#F1ECE3]">
                    <img
                      src={item.images?.[0]?.url || '/images/scarron-spines-white-bg.jpg'}
                      alt={getItemField(item, 'title', language)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full max-w-full object-cover"
                    />
                  </span>

                  <span className="mt-5 flex min-w-0 items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E7035]">
                        {getLocalizedCategory(item.category, language)}
                      </span>
                      <span className="mt-2 block break-words font-serif text-[1.65rem] font-bold leading-[1.08] tracking-[-0.02em] text-[#111111]">
                        {getItemField(item, 'title', language)}
                      </span>
                      {(item.author || item.year) && (
                        <span className="mt-2 block font-serif text-sm italic leading-relaxed text-[#655B50]">
                          {[item.author, item.year].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8E7035]" aria-hidden="true" />
                  </span>

                  <span className="mt-5 flex items-center justify-between gap-4 border-t border-[#E8DFCF] pt-4">
                    <strong className="font-serif text-lg text-[#111111]">{getLocalizedPrice(item.price, language)}</strong>
                    {!isAvailable && (
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#6D5A3A]">{status}</span>
                    )}
                  </span>
                </a>
              );
            })}
          </div>

          <a
            href={localizePath('/collectie', language)}
            onClick={(event) => {
              event.preventDefault();
              onOpenFullCatalog();
            }}
            className="mt-10 flex min-h-12 w-full items-center justify-between bg-[#1C1A17] px-5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white active:bg-[#8E7035]"
          >
            <span>{labels.all}</span>
            <ArrowRight className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </a>
        </div>
      </section>}

      <section id="herkomst" aria-labelledby="mobile-why-title" className="border-y border-[#E8DFCF] bg-[#F7F3EC] px-4 py-16 min-[390px]:px-5 min-[600px]:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 id="mobile-why-title" className="font-serif text-[2.15rem] font-bold leading-[1.05] tracking-[-0.025em]">{labels.why}</h2>
          <p className="mt-3 font-serif text-base leading-7 text-[#554B41]">{labels.whyIntro}</p>

          <div className="mt-8 divide-y divide-[#D8CEB8] border-y border-[#D8CEB8]">
            {[
              [ShieldCheck, labels.proof1, labels.proof1Body],
              [FileCheck2, labels.proof2, labels.proof2Body],
              [Truck, labels.proof3, labels.proof3Body]
            ].map(([Icon, title, body]) => (
              <div key={title} className="grid grid-cols-[28px_1fr] gap-4 py-5">
                <Icon className="mt-0.5 h-5 w-5 text-[#8E7035]" strokeWidth={1.6} aria-hidden="true" />
                <div>
                  <h3 className="font-serif text-lg font-bold">{title}</h3>
                  <p className="mt-1 font-serif text-sm leading-6 text-[#5E544A]">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={onNavigateProvenance} className="mt-6 flex min-h-11 items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-[#4A1521]">
            {labels.provenance}
            <ArrowRight className="h-4 w-4 text-[#8E7035]" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section aria-labelledby="mobile-viewing-title" className="bg-[#1C1A17] px-4 py-14 text-white min-[390px]:px-5 min-[600px]:px-8">
        <div className="mx-auto max-w-3xl">
          <BookOpenCheck className="h-6 w-6 text-[#D4AF37]" strokeWidth={1.5} aria-hidden="true" />
          <h2 id="mobile-viewing-title" className="mt-5 font-serif text-[2rem] font-bold leading-[1.05]">{labels.viewing}</h2>
          <p className="mt-3 max-w-xl font-serif text-sm leading-6 text-white/75">{labels.viewingBody}</p>
          <button type="button" onClick={onRequestConsultation} className="mt-7 flex min-h-12 w-full items-center justify-between border border-[#D4AF37]/70 px-5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white active:bg-white/10">
            {labels.viewingCta}
            <ArrowRight className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </button>
        </div>
      </section>

      {questions.length > 0 && <section id="faq" aria-labelledby="mobile-faq-title" className="px-4 py-16 min-[390px]:px-5 min-[600px]:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 id="mobile-faq-title" className="font-serif text-[2.15rem] font-bold leading-none tracking-[-0.025em]">{labels.faq}</h2>
          <div className="mt-7 divide-y divide-[#D8CEB8] border-y border-[#D8CEB8]">
            {questions.map((item, index) => {
              const isOpen = openFaq === index;
              const questionId = `${faqBaseId}-question-${index}`;
              const answerId = `${faqBaseId}-answer-${index}`;
              return (
                <div key={item.id || index}>
                  <button
                    id={questionId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex min-h-16 w-full items-center justify-between gap-5 py-4 text-left"
                  >
                    <span className="font-serif text-base font-bold leading-snug">{getItemField(item, 'question', language)}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#8E7035] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div id={answerId} role="region" aria-labelledby={questionId} className="pb-5 pr-8 font-serif text-sm leading-6 text-[#5E544A]">
                      {getItemField(item, 'answer', language)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>}
    </div>
  );
}
