import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { defaultProvenance } from '../data/defaultProvenance';
import { LUXURY_EASE } from '../utils/motion';
import { localized, migrateProvenance } from '../utils/provenance';
import ComparisonSlider from './ComparisonSlider';

const copy = (value, language) => localized(value, language) || localized(value, 'nl');

function SectionHeading({ section, language, tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <header className="max-w-3xl">
      {copy(section.eyebrow, language) && <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? 'text-[#d7bd76]' : 'text-[#8E7035]'}`}>{copy(section.eyebrow, language)}</p>}
      <h2 className={`mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl ${dark ? 'text-white' : 'text-[#4A1521]'}`}>{copy(section.title, language)}</h2>
      {copy(section.intro, language) && <p className={`mt-4 max-w-2xl font-serif text-base leading-7 ${dark ? 'text-white/70' : 'text-[#51483F]'}`}>{copy(section.intro, language)}</p>}
    </header>
  );
}

function AssetImage({ asset, language, className = '', sizes = '100vw' }) {
  if (!asset?.url) return <div className={`flex items-center justify-center bg-[#eee8dd] text-[#8E7035] ${className}`}><ImageIcon aria-hidden="true" /></div>;
  return <img src={asset.url} srcSet={asset.srcSet || undefined} sizes={sizes} alt={copy(asset.alt, language)} loading="lazy" className={className} />;
}

function ImageTile({ asset, language, onOpen, className = '', sizes }) {
  if (!asset?.url) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(asset.id)}
      className={`group relative block overflow-hidden bg-[#201913] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8E7035] ${className}`}
      aria-label={copy(asset.alt, language)}
    >
      <AssetImage asset={asset} language={language} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]" sizes={sizes} />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 pb-3 pt-12 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="block font-serif text-sm text-white">{copy(asset.title, language)}</span>
      </span>
    </button>
  );
}

function VisualLedger({ assets, language, onOpen }) {
  if (!assets.length) return null;
  const labels = {
    nl: { eyebrow: 'KIJKDAGBOEK', title: 'Sporen worden zichtbaar voordat ze woorden krijgen.', copy: 'Van opstelling tot detail: een selectie uit het onderzoek zoals het zich in het atelier ontvouwt.' },
    en: { eyebrow: 'VISUAL LEDGER', title: 'Evidence becomes visible before it is put into words.', copy: 'From setup to detail: a selection of the research as it unfolds in the atelier.' },
    fr: { eyebrow: 'CARNET VISUEL', title: 'Les indices apparaissent avant de devenir des mots.', copy: 'De l’installation au détail : une sélection du travail tel qu’il se déploie à l’atelier.' },
  };
  const label = labels[language] || labels.nl;
  const images = assets.slice(0, 5);

  return (
    <section className="relative border-b border-[#ded4c3] bg-[#17130f] px-5 py-8 text-white sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.65fr)] lg:items-end">
        <div className="max-w-sm pb-1 lg:pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7bd76]">{label.eyebrow}</p>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">{label.title}</h2>
          <p className="mt-4 font-serif leading-7 text-white/70">{label.copy}</p>
          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-white/50">{language === 'nl' ? 'Klik voor volledige opname' : language === 'fr' ? 'Cliquez pour agrandir' : 'Click to inspect in full'}</p>
        </div>
        <div className="grid h-[27rem] grid-cols-2 grid-rows-2 gap-2 sm:h-[34rem] lg:h-[31rem]">
          <ImageTile asset={images[0]} language={language} onOpen={onOpen} className="row-span-2" sizes="(min-width: 1024px) 31vw, 50vw" />
          <ImageTile asset={images[1]} language={language} onOpen={onOpen} sizes="(min-width: 1024px) 20vw, 50vw" />
          <div className="grid grid-cols-2 gap-2">
            <ImageTile asset={images[2]} language={language} onOpen={onOpen} sizes="(min-width: 1024px) 10vw, 25vw" />
            <ImageTile asset={images[3] || images[4]} language={language} onOpen={onOpen} sizes="(min-width: 1024px) 10vw, 25vw" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceReferences({ sourceIds = [], sources = [], language }) {
  const sourceMap = new Map(sources.map(source => [source.id, source]));
  const linked = sourceIds.map(id => sourceMap.get(id)).filter(Boolean);
  if (!linked.length) return null;
  const heading = language === 'nl' ? 'Bronnen' : 'Sources';
  return <div className="mt-5 border-t border-[#e4dccf] pt-4"><h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7035]">{heading}</h4><ul className="mt-2 space-y-1 text-sm text-[#51483F]">{linked.map(source => <li key={source.id}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-[#b99b62] underline-offset-4 hover:text-[#4A1521]">{copy(source.title, language)}</a> : copy(source.title, language)}</li>)}</ul></div>;
}

function ResearchTimeline({ events = [], sources = [], language }) {
  if (!events.length) return null;
  const sourceMap = new Map(sources.map(source => [source.id, source]));
  const heading = language === 'nl' ? 'Onderzoekstijdlijn' : language === 'fr' ? 'Chronologie de la recherche' : 'Research timeline';
  return <div className="mt-6 border-t border-[#e4dccf] pt-5"><h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7035]">{heading}</h4><ol className="mt-4 space-y-4 border-l border-[#cfc3b0] pl-5">{events.map(event => { const source = sourceMap.get(event.sourceId); return <li key={event.id}><time className="font-mono text-xs font-bold text-[#8E7035]">{copy(event.date, language)}</time><p className="mt-1 text-sm leading-6 text-[#51483F]">{copy(event.description, language)}</p>{source && <p className="mt-1 text-xs text-[#695a49]">{source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{copy(source.title, language)}</a> : copy(source.title, language)}</p>}</li>; })}</ol></div>;
}

export default function HerkomstPage({ provenanceData, faqItems = [], onRequestConsultation }) {
  const { language } = useLanguage();
  const [lightboxId, setLightboxId] = useState(null);
  const heroRef = useRef(null);
  const data = useMemo(() => migrateProvenance(provenanceData, defaultProvenance()), [provenanceData]);
  const assets = useMemo(() => new Map((data.assets || []).map(asset => [asset.id, asset])), [data.assets]);
  const section = id => data.sections.find(item => item.id === id && item.enabled);
  const image = id => assets.get(id);
  const visibleGallery = (data.gallery?.assetIds || []).map(image).filter(asset => asset?.url);
  const featureAssets = [...new Map([
    ...data.methods.flatMap(method => method.assetIds || []).map(image),
    ...visibleGallery,
  ].filter(asset => asset?.url).map(asset => [asset.id, asset])).values()];
  const activeFaq = data.faq?.length ? data.faq : faqItems.map((item, index) => ({ id: `legacy-${index}`, enabled: true, question: { nl: item.question || item.question_nl || '' }, answer: { nl: item.answer || item.answer_nl || '' } }));
  const lightboxAsset = lightboxId ? image(lightboxId) : null;

  useEffect(() => {
    if (!lightboxId) return undefined;
    const onKeyDown = event => { if (event.key === 'Escape') setLightboxId(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxId]);

  const scrollTo = id => {
    const target = document.getElementById(id) || document.getElementById('workflow') || document.getElementById('methods');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const heroImage = image(data.hero.assetId);
  const currentHeroUrl = heroImage?.url || '/images/provenience-light-cream-hero.jpg';
  const contactAsset = featureAssets.at(-1) || visibleGallery.at(-1) || heroImage;

  // Parallax translation matching homepage Hero.jsx
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0px', '-35px']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.2]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.14,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.95, ease: LUXURY_EASE }
    }
  };

  return (
    <main className="overflow-hidden bg-[#fbfaf7] text-[#17130F]">
      {/* ------------------------------------------------------------- */}
      {/* FULL-BLEED LUXURY EDITORIAL HERO (MATCHING HOMEPAGE HERO)    */}
      {/* ------------------------------------------------------------- */}
      <section
        ref={heroRef}
        className="relative w-full h-[100dvh] min-h-[680px] flex flex-col justify-center overflow-hidden bg-[#FBF9F5] select-none pt-20 sm:pt-24 pb-12 sm:pb-20"
      >
        {/* Ambient Photography with Parallax */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <motion.div style={{ y: bgY }} className="absolute inset-0 w-full h-full">
            <img
              src={currentHeroUrl}
              srcSet={heroImage?.srcSet || undefined}
              sizes="100vw"
              alt={copy(heroImage?.alt, language) || copy(data.hero.title, language)}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable="false"
              className="w-full h-full object-cover object-center md:object-right filter brightness-[1.01] contrast-[1.02] transform-gpu"
            />
          </motion.div>

          {/* Editorial Horizontal Gradient Overlay (Desktop Text Protection) */}
          <div
            className="absolute inset-0 z-10 pointer-events-none hidden md:block"
            style={{
              background:
                'linear-gradient(to right, #FBF9F5 0%, #FBF9F5 38%, rgba(251, 249, 245, 0.88) 52%, rgba(251, 249, 245, 0.35) 72%, transparent 95%)'
            }}
          />

          {/* Responsive Mobile Overlay (Ensures complete legibility on vertical viewport) */}
          <div
            className="absolute inset-0 z-10 pointer-events-none md:hidden"
            style={{
              background:
                'linear-gradient(to bottom, rgba(251, 249, 245, 0.97) 0%, rgba(251, 249, 245, 0.88) 55%, rgba(251, 249, 245, 0.98) 100%)'
            }}
          />

          {/* Silky-smooth bottom edge transition fade into the first content section */}
          <div
            className="absolute inset-x-0 bottom-0 h-28 z-10 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, #fbfaf7 0%, rgba(251, 250, 247, 0.85) 45%, transparent 100%)'
            }}
          />
        </div>

        {/* Hero Editorial Copy Shell */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-20 page-shell-wide my-auto text-[#111111]"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="hero-copy-shell max-w-xl lg:max-w-2xl space-y-6 text-left"
          >
            {/* Category Eyebrow Tag (Antique Gold Accent) */}
            <div className="overflow-hidden">
              <motion.div
                variants={itemVariants}
                className="flex items-center space-x-3 text-xs sm:text-sm font-serif tracking-[0.2em] text-[#8E7035] uppercase font-semibold"
              >
                <span className="w-8 h-px bg-[#8E7035]" />
                <span>{copy(data.hero.eyebrow, language)}</span>
              </motion.div>
            </div>

            {/* Masterpiece Editorial Headline (Royal Bordeaux Red & Fluid Typography) */}
            <div className="overflow-hidden">
              <motion.h1
                variants={itemVariants}
                className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-[-0.03em] leading-[1.08] text-[#4A1521]"
              >
                {copy(data.hero.title, language)}
              </motion.h1>
            </div>

            {/* Subtitle Description Paragraph (Warm Bronze) */}
            <div className="overflow-hidden">
              <motion.p
                variants={itemVariants}
                className="hero-lead-copy text-sm sm:text-base lg:text-lg text-[#554326] font-serif font-light leading-relaxed max-w-xl"
              >
                {copy(data.hero.description, language)}
              </motion.p>
            </div>

            {/* Action Buttons (Primary Protocol Navigation + Consultation) */}
            <div className="overflow-hidden">
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-4"
              >
                <button
                  type="button"
                  onClick={() => scrollTo('workflow')}
                  className="group inline-flex min-h-12 items-center gap-3 bg-[#1C1A17] px-6 py-3.5 text-xs sm:text-sm font-serif font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#4A1521] hover:shadow-lg cursor-pointer"
                >
                  <span>{copy(data.hero.primaryLabel, language)}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={onRequestConsultation}
                  className="inline-flex min-h-12 items-center gap-3 border border-[#8E7035] bg-white/70 backdrop-blur-xs px-6 py-3.5 text-xs sm:text-sm font-serif font-semibold uppercase tracking-[0.14em] text-[#4A1521] transition-all duration-300 hover:bg-white hover:border-[#4A1521] cursor-pointer"
                >
                  <span>{copy(data.hero.secondaryLabel, language)}</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <VisualLedger assets={featureAssets} language={language} onOpen={setLightboxId} />

      {section('workflow') && <section id="workflow" className="scroll-mt-24 sm:scroll-mt-28 border-b border-[#ded4c3] bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><div className="mx-auto max-w-7xl"><SectionHeading section={section('workflow')} language={language} /><ol className="mt-12 grid gap-x-8 border-t border-[#cfc3b0] lg:grid-cols-2">{data.steps.filter(step => step.enabled).map((step, index) => <li key={step.id} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-[#cfc3b0] py-7 sm:grid-cols-[5rem_1fr] sm:gap-6"><span className="font-serif text-3xl leading-none text-[#b89a61] sm:text-4xl">{String(index + 1).padStart(2, '0')}</span><div><h3 className="font-serif text-xl font-bold text-[#17130F]">{copy(step.title, language)}</h3><p className="mt-2 max-w-xl font-serif leading-7 text-[#5E554B]">{copy(step.description, language)}</p></div></li>)}</ol></div></section>}

      {section('methods') && (
        <section id="methods" className="scroll-mt-24 sm:scroll-mt-28 bg-[#f7f3ec] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading section={section('methods')} language={language} />
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {data.methods.filter(method => method.enabled).map(method => {
                const methodAssets = method.assetIds.map(image).filter(asset => asset?.url);
                const [primaryAsset, ...detailAssets] = methodAssets;
                return (
                  <article key={method.id} className="group overflow-hidden border border-[#d8ceb8] bg-white shadow-[0_18px_45px_rgba(65,45,24,0.06)]">
                    {primaryAsset && (
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#201913]">
                        <ImageTile asset={primaryAsset} language={language} onOpen={setLightboxId} className="h-full w-full" sizes="(min-width: 1024px) 40vw, 100vw" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 to-transparent px-5 pb-4 pt-14">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">{language === 'nl' ? 'Onderzoeksmethode' : language === 'fr' ? 'Méthode d’expertise' : 'Examination method'}</span>
                          <span className="text-xs text-white/70">{language === 'nl' ? 'Vergroot' : language === 'fr' ? 'Agrandir' : 'Inspect'}</span>
                        </div>
                      </div>
                    )}
                    <div className="p-6 sm:p-8">
                      <h3 className="font-serif text-2xl font-bold text-[#4A1521]">{copy(method.title, language)}</h3>
                      <p className="mt-3 font-serif text-lg italic leading-7 text-[#695a49]">{copy(method.question, language)}</p>
                      <p className="mt-4 font-serif leading-7 text-[#51483F]">{copy(method.description, language)}</p>
                      <div className="mt-6 grid gap-5 border-t border-[#e4dccf] pt-5 sm:grid-cols-2">
                        <div><h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7035]">{language === 'nl' ? 'Wat we zien' : language === 'fr' ? 'Ce que nous observons' : 'What we observe'}</h4><p className="mt-2 text-sm leading-6 text-[#51483F]">{copy(method.findings, language)}</p></div>
                        <div><h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7035]">{language === 'nl' ? 'In context' : language === 'fr' ? 'Mise en contexte' : 'In context'}</h4><p className="mt-2 text-sm leading-6 text-[#51483F]">{copy(method.limitations, language)}</p></div>
                      </div>
                      {detailAssets.length > 0 && <div className="mt-6 grid grid-cols-3 gap-2">{detailAssets.slice(0, 3).map(asset => <ImageTile key={asset.id} asset={asset} language={language} onOpen={setLightboxId} className="aspect-square" sizes="180px" />)}</div>}
                      <SourceReferences sourceIds={method.sourceIds} sources={data.sources} language={language}/>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {section('examples') && (
        <section id="examples" className="scroll-mt-24 sm:scroll-mt-28 border-y border-[#ded4c3] bg-[#eee7da] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading section={section('examples')} language={language} />
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {data.examples.filter(item => item.enabled).map(example => {
                const exampleAssets = example.assetIds.map(image).filter(asset => asset?.url);
                const [primaryAsset, ...detailAssets] = exampleAssets;
                return (
                  <article key={example.id} className="overflow-hidden bg-white shadow-[0_18px_45px_rgba(65,45,24,0.07)]">
                    {primaryAsset && <div className="relative aspect-[4/3] bg-[#201913]"><ImageTile asset={primaryAsset} language={language} onOpen={setLightboxId} className="h-full w-full" sizes="(min-width: 1024px) 40vw, 100vw" /><p className="pointer-events-none absolute bottom-4 left-5 border-l border-[#d7bd76] pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">{language === 'nl' ? 'Praktijkdossier' : language === 'fr' ? 'Dossier d’étude' : 'Case study'}</p></div>}
                    <div className="p-6 sm:p-8">
                      <h3 className="font-serif text-2xl font-bold text-[#4A1521]">{copy(example.title, language)}</h3>
                      <p className="mt-3 font-serif text-lg italic leading-7 text-[#695a49]">{copy(example.question, language)}</p>
                      <p className="mt-4 leading-7 text-[#51483F]">{copy(example.description, language)}</p>
                      {detailAssets.length > 0 && <div className="mt-6 grid h-28 grid-cols-3 gap-2 sm:h-32">{detailAssets.slice(0, 3).map(asset => <ImageTile key={asset.id} asset={asset} language={language} onOpen={setLightboxId} className="h-full" sizes="180px" />)}</div>}
                      <dl className="mt-6 grid gap-5 border-t border-[#e4dccf] pt-5 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7035]">{language === 'nl' ? 'Gedocumenteerd resultaat' : language === 'fr' ? 'Constat documenté' : 'Documented finding'}</dt><dd className="mt-2 text-sm leading-6 text-[#51483F]">{copy(example.findings, language)}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7035]">{language === 'nl' ? 'Historische context' : language === 'fr' ? 'Contexte historique' : 'Historical context'}</dt><dd className="mt-2 text-sm leading-6 text-[#51483F]">{copy(example.uncertainties, language)}</dd></div></dl>
                      <ResearchTimeline events={example.timeline} sources={data.sources} language={language}/><SourceReferences sourceIds={example.sourceIds} sources={data.sources} language={language}/>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {section('gallery') && (
        <section id="gallery" className="scroll-mt-24 sm:scroll-mt-28 bg-[#17130f] px-5 py-16 text-white sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading section={section('gallery')} language={language} tone="dark" />

            {/* Interactive Before/After Comparisons (UV vs. Daylight) */}
            {data.comparisons?.filter(comp => comp.enabled).map(comp => {
              const left = image(comp.leftId);
              const right = image(comp.rightId);
              if (!left?.url || !right?.url) return null;
              return (
                <div key={comp.id} className="mt-12">
                  <ComparisonSlider
                    comparison={comp}
                    leftAsset={left}
                    rightAsset={right}
                    language={language}
                    onOpenLightbox={(id) => setLightboxId(id)}
                  />
                </div>
              );
            })}

            {/* Media Gallery Grid */}
            <div className="mt-16 border-t border-white/20 pt-12">
              <div className="max-w-2xl">
                <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                  {language === 'fr'
                    ? 'Photothèque & Détails d’atelier'
                    : language === 'en'
                    ? 'Media Archive & Atelier Details'
                    : 'Beeldarchief & Atelierdetails'}
                </h3>
                <p className="mt-2 text-sm font-serif leading-6 text-white/65">
                  {language === 'fr'
                    ? 'Cliquez sur une image pour l’agrandir et consulter les observations diagnostiques.'
                    : language === 'en'
                    ? 'Click any image to inspect full dimensions and diagnostic metadata.'
                    : 'Klik op een opname voor een vergroting en de methodische beschrijving.'}
                </p>
              </div>
              <div className="mt-8 grid auto-rows-[10rem] grid-cols-2 gap-2 sm:auto-rows-[13rem] sm:grid-cols-3 lg:auto-rows-[12rem] lg:grid-cols-4">
                {visibleGallery.map((asset, index) => {
                  const feature = index === 0 || index === 5 || index === 9;
                  return (
                    <div key={asset.id} className={feature ? 'col-span-2 row-span-2' : ''}>
                      <ImageTile asset={asset} language={language} onOpen={setLightboxId} className="h-full w-full" sizes={feature ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {section('dossier') && <section id="dossier" className="scroll-mt-24 sm:scroll-mt-28 border-y border-[#ded4c3] bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><div className="mx-auto max-w-7xl"><SectionHeading section={section('dossier')} language={language} /><p className="mt-8 max-w-3xl font-serif text-lg leading-8 text-[#51483F]">{copy(data.dossier.description, language)}</p><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.dossier.items.filter(item => item.enabled).map(item => <div key={item.id} className="border-l-2 border-[#B8860B] pl-5"><h3 className="font-serif text-xl font-bold text-[#4A1521]">{copy(item.title, language)}</h3><p className="mt-2 leading-7 text-[#5E554B]">{copy(item.description, language)}</p></div>)}</div></div></section>}

      {section('faq') && <section id="faq" className="scroll-mt-24 sm:scroll-mt-28 px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><div className="mx-auto max-w-4xl"><SectionHeading section={section('faq')} language={language} /><div className="mt-10 divide-y divide-[#d8ceb8] border-y border-[#d8ceb8]">{activeFaq.filter(item => item.enabled !== false).map(item => <details key={item.id} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-serif text-lg font-semibold text-[#4A1521] marker:hidden">{copy(item.question, language)}</summary><p className="mt-3 max-w-3xl leading-7 text-[#51483F]">{copy(item.answer, language)}</p></details>)}</div></div></section>}

      {section('contact') && (
        <section id="contact" className="scroll-mt-24 sm:scroll-mt-28 bg-[#fbfaf7] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid overflow-hidden border border-[#d8ceb8] bg-white shadow-[0_24px_70px_rgba(65,45,24,0.10)] lg:grid-cols-[1.08fr_.92fr]">
              <div className="relative min-h-[22rem] bg-[#201913] sm:min-h-[29rem]">
                {contactAsset ? (
                  <ImageTile asset={contactAsset} language={language} onOpen={setLightboxId} className="absolute inset-0 h-full w-full" sizes="(min-width: 1024px) 50vw, 100vw" />
                ) : (
                  <div className="absolute inset-0 bg-[#201913]" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent px-6 pb-6 pt-24 sm:px-9 sm:pb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e2c985]">{language === 'nl' ? 'Een werk laten onderzoeken' : language === 'fr' ? 'Faire examiner une œuvre' : 'Submit a work for research'}</p>
                </div>
              </div>
              <div className="flex flex-col justify-center bg-[#1c1a17] px-6 py-12 text-white sm:px-9 sm:py-16 lg:px-12">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7bd76]">{copy(section('contact').eyebrow, language)}</p>
                <p className="mt-4 max-w-md font-serif text-lg leading-7 text-white/70">{copy(section('contact').title, language)}</p>
                <h2 className="mt-5 max-w-lg font-serif text-3xl font-bold leading-tight sm:text-4xl">{copy(data.cta.title, language)}</h2>
                <p className="mt-5 max-w-md font-serif text-lg leading-8 text-white/75">{copy(data.cta.description, language)}</p>
                <div className="mt-8 border-t border-white/20 pt-7">
                  <button type="button" onClick={onRequestConsultation} className="group inline-flex min-h-12 items-center justify-center gap-3 bg-[#ead8aa] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#1c1a17] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ead8aa]">
                    {copy(data.cta.buttonLabel, language)}<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {lightboxAsset && <div role="dialog" aria-modal="true" aria-label={copy(lightboxAsset.title, language)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setLightboxId(null)}><button type="button" aria-label={language === 'nl' ? 'Sluiten' : 'Close'} onClick={() => setLightboxId(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><X className="h-6 w-6" /></button><figure className="max-h-[90vh] max-w-6xl" onClick={event => event.stopPropagation()}><AssetImage asset={lightboxAsset} language={language} className="max-h-[74vh] w-auto max-w-full object-contain" sizes="90vw" /><figcaption className="mx-auto mt-3 max-w-3xl text-center text-white/80"><strong className="block font-serif text-base text-white">{copy(lightboxAsset.title, language)}</strong>{copy(lightboxAsset.caption, language) && <span className="mt-1 block font-serif text-sm">{copy(lightboxAsset.caption, language)}</span>}{copy(lightboxAsset.objectLabel, language) && <span className="mt-1 block text-xs">{copy(lightboxAsset.objectLabel, language)}</span>}{copy(lightboxAsset.credit, language) && <span className="mt-1 block text-xs text-white/60">{copy(lightboxAsset.credit, language)}</span>}</figcaption></figure></div>}
    </main>
  );
}
