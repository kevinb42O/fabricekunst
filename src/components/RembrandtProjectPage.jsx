import React, { useMemo, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  Expand,
  X,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  FlaskConical,
  LockKeyhole,
  Microscope,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  latestProjectUpdate,
  localizedProjectValue,
  publishedRembrandtProject,
} from "../utils/rembrandtProject";
import { localizePath } from "../utils/locales";
import { REMBRANDT_PROJECT_ROUTE } from "../utils/rembrandtProject";
import { trackEvent } from "../hooks/useAnalytics";
import PaintingSubmissionForm from "./PaintingSubmissionForm";
import "../styles/rembrandt-project.css";

const UI = {
  nl: {
    nav: { about: "Over het project", investigations: "Onderzoeken", process: "Proces", submit: "Dien een werk in" },
    latest: "Nieuwste update",
    timeline: "Publieke onderzoekstijdlijn",
    timelineIntro: "Alleen zorgvuldig gecontroleerde stappen worden hier gepubliceerd.",
    current: "Programmastatus",
    next: "Volgende stap",
    findings: "Wat deze stap ons leert",
    explore: "Bekijk de onderzoeken",
    submit: "Dien uw schilderij in",
    viewCase: "Open het onderzoeksdossier",
    closeCase: "Sluit het onderzoeksdossier",
    privateSubmission: "Vertrouwelijke inzending",
    caseNumber: "Dossier",
    status: {
      discovery: "Ontdekking", "initial-assessment": "Eerste beoordeling", "technical-research": "Technisch onderzoek",
      "expert-review": "Expertbeoordeling", paused: "Tijdelijk gepauzeerd", completed: "Onderzoek afgerond",
    },
    evidence: {
      documented: "Gedocumenteerd", observation: "Voorlopige observatie", hypothesis: "Onderzoekshypothese",
      "external-review": "Externe beoordeling", "next-step": "Volgende onderzoeksstap",
    },
    researchDate: "Onderzoeksdatum",
    lastUpdated: "Laatst bijgewerkt",
    empty: "Voor dit dossier zijn nog geen publieke updates beschikbaar.",
    unavailable: "Deze onderzoekspagina is momenteel niet beschikbaar.",
    backHome: "Terug naar de startpagina",
    loading: "Project laden…",
    privatePreview: "Privévoorbeeld — deze pagina is nog niet openbaar.",
    independent: "Onafhankelijk onderzoek",
    independentText: "Veelbelovende dossiers kunnen worden onderzocht met onafhankelijke restauratoren, kunsthistorici, archiefonderzoekers, beeldvormingsspecialisten en laboratoria. De uitkomst staat nooit vooraf vast.",
  },
  en: {
    nav: { about: "About the project", investigations: "Investigations", process: "Process", submit: "Submit a work" },
    latest: "Latest update",
    timeline: "Public research timeline",
    timelineIntro: "Only carefully reviewed steps are published here.",
    current: "Programme status",
    next: "Next step",
    findings: "What this step tells us",
    explore: "Explore the investigations",
    submit: "Submit your painting",
    viewCase: "Open the research case",
    closeCase: "Close the research case",
    privateSubmission: "Confidential submission",
    caseNumber: "Case",
    status: {
      discovery: "Discovery", "initial-assessment": "Initial assessment", "technical-research": "Technical research",
      "expert-review": "Expert review", paused: "Temporarily paused", completed: "Research completed",
    },
    evidence: {
      documented: "Documented", observation: "Preliminary observation", hypothesis: "Research hypothesis",
      "external-review": "External review", "next-step": "Next research step",
    },
    researchDate: "Research date",
    lastUpdated: "Last updated",
    empty: "No public updates are available for this case yet.",
    unavailable: "This research page is currently unavailable.",
    backHome: "Back to the homepage",
    loading: "Loading project…",
    privatePreview: "Private preview — this page is not public yet.",
    independent: "An independent research process",
    independentText: "Promising cases may involve independent conservators, art historians, archival researchers, imaging specialists and laboratories. The outcome is never predetermined.",
  },
  fr: {
    nav: { about: "À propos", investigations: "Recherches", process: "Processus", submit: "Soumettre une œuvre" },
    latest: "Dernière mise à jour",
    timeline: "Chronologie publique de la recherche",
    timelineIntro: "Seules les étapes soigneusement vérifiées sont publiées ici.",
    current: "Statut du programme",
    next: "Prochaine étape",
    findings: "Ce que cette étape nous apprend",
    explore: "Découvrir les recherches",
    submit: "Soumettez votre tableau",
    viewCase: "Ouvrir le dossier de recherche",
    closeCase: "Fermer le dossier de recherche",
    privateSubmission: "Soumission confidentielle",
    caseNumber: "Dossier",
    status: {
      discovery: "Découverte", "initial-assessment": "Première évaluation", "technical-research": "Recherche technique",
      "expert-review": "Évaluation des experts", paused: "Temporairement suspendu", completed: "Recherche terminée",
    },
    evidence: {
      documented: "Documenté", observation: "Observation préliminaire", hypothesis: "Hypothèse de recherche",
      "external-review": "Évaluation externe", "next-step": "Prochaine étape de recherche",
    },
    researchDate: "Date de recherche",
    lastUpdated: "Dernière mise à jour",
    empty: "Aucune mise à jour publique n’est encore disponible pour ce dossier.",
    unavailable: "Cette page de recherche est actuellement indisponible.",
    backHome: "Retour à l’accueil",
    loading: "Chargement du projet…",
    privatePreview: "Aperçu privé — cette page n’est pas encore publique.",
    independent: "Un processus de recherche indépendant",
    independentText: "Les dossiers prometteurs peuvent faire appel à des restaurateurs, historiens de l’art, archivistes, spécialistes de l’imagerie et laboratoires indépendants. Le résultat n’est jamais déterminé à l’avance.",
  },
};

const dateFormatter = (language, value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "nl" ? "nl-BE" : language, {
    day: "numeric", month: "long", year: "numeric",
  }).format(date);
};

const paragraphs = (value, language) =>
  String(localizedProjectValue(value, language, ""))
    .split(/\n\s*\n/)
    .filter(Boolean);

function ProjectImage({ image, language, eager = false }) {
  if (!image?.url) return null;
  const caption = localizedProjectValue(image.caption, language, "");
  return (
    <figure className="rembrandt-project__figure">
      <img src={image.url} alt={localizedProjectValue(image.alt, language, "")} loading={eager ? "eager" : "lazy"} decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function ProjectUpdate({ update, index, language, labels }) {
  const findings = localizedProjectValue(update.keyFindings, language, []);
  return (
    <article id={`update-${update.slug}`} className="rembrandt-update">
      <div className="rembrandt-update__rail" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div>
      <div className="rembrandt-update__content">
        <header>
          <div className="rembrandt-update__meta">
            <span className={`rembrandt-evidence rembrandt-evidence--${update.evidenceType}`}>
              {labels.evidence[update.evidenceType] || labels.evidence.observation}
            </span>
            {update.eventDate && <time dateTime={update.eventDate}><CalendarDays aria-hidden="true" />{dateFormatter(language, update.eventDate)}</time>}
          </div>
          <h4>{localizedProjectValue(update.title, language)}</h4>
          <p className="rembrandt-update__summary">{localizedProjectValue(update.summary, language)}</p>
        </header>
        {update.coverImage && <ProjectImage language={language} image={{ url: update.coverImage, alt: update.coverAlt, caption: update.coverCaption }} />}
        {update.gallery?.length > 0 && <div className="dossier-update-gallery">{update.gallery.filter((image) => image.url).map((image) => <DetailImage key={image.id || image.url} image={image} language={language} copy={DOSSIER_UI[language] || DOSSIER_UI.nl} />)}</div>}
        <div className="rembrandt-update__body">{paragraphs(update.body, language).map((text) => <p key={text}>{text}</p>)}</div>
        {Array.isArray(findings) && findings.length > 0 && (
          <section className="rembrandt-findings" aria-labelledby={`${update.id}-findings`}>
            <h5 id={`${update.id}-findings`}><CheckCircle2 aria-hidden="true" />{labels.findings}</h5>
            <ul>{findings.filter(Boolean).map((finding) => <li key={finding}>{finding}</li>)}</ul>
          </section>
        )}
        {localizedProjectValue(update.nextStep, language, "") && (
          <div className="rembrandt-next-step"><ArrowRight aria-hidden="true" /><div><strong>{labels.next}</strong><p>{localizedProjectValue(update.nextStep, language)}</p></div></div>
        )}
      </div>
    </article>
  );
}

const DOSSIER_UI = {
  nl: { back: "Alle onderzoeken", story: "Het dossier", images: "Het werk van dichtbij", chronology: "Het onderzoek, stap voor stap", contents: "In dit dossier", status: "Stand van het onderzoek", other: "Verder ontdekken", enlarge: "Bekijk op groot formaat", close: "Afbeelding sluiten", imageNote: "Beeldmateriaal uit het onderzoeksdossier", pending: "Het dossier is geopend. Nieuwe bevindingen verschijnen hier zodra ze zijn gecontroleerd en vrijgegeven.", updates: "publieke updates", view: "Ontdek het dossier" },
  en: { back: "All investigations", story: "The case", images: "A closer look", chronology: "The research, step by step", contents: "In this case", status: "Research status", other: "Continue exploring", enlarge: "View full size", close: "Close image", imageNote: "Images from the research case", pending: "The case is open. New findings will appear here once reviewed and approved for publication.", updates: "public updates", view: "Explore the case" },
  fr: { back: "Toutes les recherches", story: "Le dossier", images: "L’œuvre de près", chronology: "La recherche, étape par étape", contents: "Dans ce dossier", status: "État de la recherche", other: "Poursuivre la découverte", enlarge: "Voir en grand", close: "Fermer l’image", imageNote: "Images du dossier de recherche", pending: "Le dossier est ouvert. Les nouvelles observations seront publiées ici après vérification et validation.", updates: "mises à jour publiques", view: "Découvrir le dossier" },
};

const casePath = (investigation, language, privatePreview) => localizePath(`${REMBRANDT_PROJECT_ROUTE}${privatePreview ? "/preview" : ""}/${investigation.slug}`, language);

function Investigation({ investigation, language, labels, privatePreview }) {
  const copy = DOSSIER_UI[language] || DOSSIER_UI.nl;
  return (
    <a href={casePath(investigation, language, privatePreview)} id={`investigation-${investigation.slug}`} className={`lost-investigation ${investigation.featured ? "is-featured" : ""}`}>
      <div className="lost-investigation__image">
        {investigation.coverImage && <img src={investigation.coverImage} alt={localizedProjectValue(investigation.coverAlt, language)} loading="lazy" decoding="async" />}
        <span>{labels.caseNumber} {investigation.reference}</span>
      </div>
      <div className="lost-investigation__copy">
        <div className="lost-investigation__meta"><span>{localizedProjectValue(investigation.title, language)}</span><b>{labels.status[investigation.status]}</b></div>
        <h3>{localizedProjectValue(investigation.subtitle, language) || localizedProjectValue(investigation.title, language)}</h3>
        <p>{localizedProjectValue(investigation.summary, language)}</p>
        <div className="lost-investigation__link">{copy.view}<ArrowRight aria-hidden="true" /></div>
      </div>
    </a>
  );
}

function DetailImage({ image, language, copy }) {
  const dialog = useRef(null);
  return <figure className="dossier-image">
    <button type="button" onClick={() => dialog.current?.showModal()} aria-label={`${copy.enlarge}: ${localizedProjectValue(image.alt, language, "")}`}>
      <img src={image.url} alt={localizedProjectValue(image.alt, language, "")} loading="lazy" />
      <span><Expand aria-hidden="true" />{copy.enlarge}</span>
    </button>
    <figcaption>{localizedProjectValue(image.caption, language, copy.imageNote)}</figcaption>
    <dialog ref={dialog} className="dossier-lightbox" onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }}>
      <button type="button" autoFocus onClick={() => dialog.current.close()} aria-label={copy.close}><X /></button>
      <img src={image.url} alt={localizedProjectValue(image.alt, language, "")} />
      <p>{localizedProjectValue(image.caption, language, "")}</p>
    </dialog>
  </figure>;
}

function InvestigationPage({ investigation, project, language, labels, privatePreview }) {
  const copy = DOSSIER_UI[language] || DOSSIER_UI.nl;
  const updates = project.updates.filter((update) => update.investigationId === investigation.id);
  const gallery = (investigation.gallery || []).filter((image) => image.url);
  const overview = localizePath(`${REMBRANDT_PROJECT_ROUTE}${privatePreview ? "/preview" : ""}`, language);
  const related = project.investigations.filter((entry) => entry.id !== investigation.id);
  return <main className={`rembrandt-project dossier-page dossier-page--${investigation.sortOrder}`}>
    {privatePreview && <div className="rembrandt-project__private-preview"><ShieldCheck aria-hidden="true" />{labels.privatePreview}</div>}
    <header className="dossier-hero">
      <div className="dossier-hero__top rembrandt-project__shell"><a href={`${overview}#current-investigations`}><ArrowLeft aria-hidden="true" />{copy.back}</a><span>Lost Rembrandt / {investigation.reference}</span></div>
      <div className="dossier-hero__layout rembrandt-project__shell">
        <div className="dossier-hero__copy">
          <p className="dossier-eyebrow">{localizedProjectValue(investigation.title, language)}<span />{investigation.reference}</p>
          <h1>{localizedProjectValue(investigation.subtitle, language) || localizedProjectValue(investigation.title, language)}</h1>
          <p className="dossier-hero__summary">{localizedProjectValue(investigation.summary, language)}</p>
          <a className="dossier-hero__start" href="#dossier-story">{copy.view}<ArrowDown aria-hidden="true" /></a>
          <div className="dossier-hero__status"><span>{copy.status}</span><strong><i />{localizedProjectValue(investigation.statusLabel, language, labels.status[investigation.status])}</strong></div>
        </div>
        <figure className="dossier-hero__art">{investigation.coverImage && <img src={investigation.coverImage} alt={localizedProjectValue(investigation.coverAlt, language)} fetchPriority="high" />}<figcaption><span>{labels.privateSubmission}</span><span>{investigation.reference}</span></figcaption></figure>
      </div>
    </header>
    <nav className="dossier-nav" aria-label={copy.contents}><div className="rembrandt-project__shell"><a href="#dossier-story"><span>01</span>{copy.story}</a>{gallery.length > 0 && <a href="#dossier-images"><span>02</span>{copy.images}</a>}<a href="#dossier-timeline"><span>{gallery.length ? "03" : "02"}</span>{labels.nav.investigations}</a><span className="dossier-nav__ref">{investigation.reference}</span></div></nav>
    <section id="dossier-story" className="dossier-story rembrandt-project__shell">
      <div><p className="dossier-eyebrow">01 / {copy.story}</p><h2>{localizedProjectValue(investigation.subtitle, language)}</h2></div>
      <div className="dossier-story__body">{paragraphs(investigation.description, language).map((text) => <p key={text}>{text}</p>)}<aside><ShieldCheck aria-hidden="true" /><p>{localizedProjectValue(project.settings.disclaimer, language)}</p></aside></div>
    </section>
    {gallery.length > 0 && <section id="dossier-images" className="dossier-gallery"><div className="rembrandt-project__shell"><div className="dossier-section-heading"><p className="dossier-eyebrow">02 / {copy.imageNote}</p><h2>{copy.images}</h2></div><div className={`dossier-gallery__grid ${gallery.length === 1 ? "is-single" : ""}`}>{gallery.map((image) => <DetailImage key={image.id || image.url} image={image} language={language} copy={copy} />)}</div></div></section>}
    <section id="dossier-timeline" className="dossier-research rembrandt-project__shell">
      <div className="dossier-section-heading"><p className="dossier-eyebrow">{gallery.length ? "03" : "02"} / {labels.timeline}</p><h2>{copy.chronology}</h2><p>{labels.timelineIntro}</p></div>
      {updates.length > 0 ? <div className="dossier-research__layout"><aside className="dossier-index"><span>{copy.contents}</span>{updates.map((update, index) => <a key={update.id} href={`#update-${update.slug}`}><span>{String(index + 1).padStart(2, "0")}</span>{localizedProjectValue(update.title, language)}</a>)}</aside><div>{updates.map((update, index) => <ProjectUpdate key={update.id} update={update} index={index} language={language} labels={labels} />)}</div></div> : <div className="dossier-pending"><Microscope aria-hidden="true" /><div><h3>{localizedProjectValue(investigation.statusLabel, language, labels.status[investigation.status])}</h3><p>{copy.pending}</p></div></div>}
    </section>
    {related.length > 0 && <section className="dossier-related"><div className="rembrandt-project__shell"><p className="dossier-eyebrow">Lost Rembrandt</p><h2>{copy.other}</h2><div>{related.map((entry) => <Investigation key={entry.id} investigation={entry} language={language} labels={labels} privatePreview={privatePreview} />)}</div></div></section>}
  </main>;
}

export default function RembrandtProjectPage({ projectData, loading = false, privatePreview = false, previewError = "", investigationSlug = "", onNavigate = () => {} }) {
  const { language } = useLanguage();
  const labels = UI[language] || UI.nl;
  const reduceMotion = useReducedMotion();
  const project = useMemo(() => publishedRembrandtProject(projectData), [projectData]);
  const settings = project.settings;
  const latest = latestProjectUpdate(project);
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-70px" }, transition: { duration: 0.5 } };

  useEffect(() => {
    if (loading || !projectData) return;
    const frame = window.requestAnimationFrame(() => {
      const anchor = window.location.hash.slice(1);
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, projectData, investigationSlug]);

  if (loading) return <div className="rembrandt-project rembrandt-project__state" aria-live="polite"><span className="rembrandt-project__state-loader" /><p>{labels.loading}</p></div>;
  if (previewError || !projectData || !project.isEnabled) return <div className="rembrandt-project rembrandt-project__state"><p>{previewError || labels.unavailable}</p><button type="button" onClick={() => onNavigate("home")}>{labels.backHome}</button></div>;

  if (investigationSlug) {
    const investigation = project.investigations.find((entry) => entry.slug === investigationSlug);
    if (!investigation) return <main className="rembrandt-project rembrandt-project__state"><p>{labels.unavailable}</p><a href={localizePath(`${REMBRANDT_PROJECT_ROUTE}${privatePreview ? "/preview" : ""}`, language)}>{(DOSSIER_UI[language] || DOSSIER_UI.nl).back}</a></main>;
    return <InvestigationPage investigation={investigation} project={project} language={language} labels={labels} privatePreview={privatePreview} />;
  }

  return (
    <main className="rembrandt-project">
      {privatePreview && <div className="rembrandt-project__private-preview" role="status"><ShieldCheck aria-hidden="true" /><span>{labels.privatePreview}</span></div>}
      <header className={`rembrandt-project__hero ${settings.heroImage ? "has-image" : ""}`}>
        {settings.heroImage && <img className="rembrandt-project__hero-image" src={settings.heroImage} alt={localizedProjectValue(settings.heroAlt, language)} fetchpriority="high" />}
        <div className="rembrandt-project__hero-wash" aria-hidden="true" />
        <div className="rembrandt-project__shell rembrandt-project__hero-grid">
          <motion.div {...reveal} className="rembrandt-project__hero-copy">
            <p className="rembrandt-project__eyebrow"><span />{localizedProjectValue(settings.eyebrow, language)}</p>
            <h1>{localizedProjectValue(settings.title, language)}</h1>
            <p className="rembrandt-project__lead">{localizedProjectValue(settings.intro, language)}</p>
            <div className="rembrandt-project__hero-actions">
              <a href="#current-investigations" onClick={() => !privatePreview && trackEvent("cta_clicked", { placement: "lost_rembrandt_hero", target: "investigations" })}>{labels.explore}<ArrowDown aria-hidden="true" /></a>
              <a className="is-secondary" href="#submit-a-painting">{labels.submit}<ArrowRight aria-hidden="true" /></a>
            </div>
          </motion.div>
          <motion.aside {...reveal} className="lost-rembrandt__hero-note">
            <Search aria-hidden="true" />
            <span>{labels.current}</span>
            <strong>{labels.status[settings.projectStatus] || labels.status["technical-research"]}</strong>
            <p>{localizedProjectValue(settings.currentStatus, language)}</p>
            {latest && <a href={`${casePath(project.investigations.find((entry) => entry.id === latest.investigationId) || project.investigations[0], language, privatePreview)}#update-${latest.slug}`}>{labels.latest}<ArrowRight aria-hidden="true" /></a>}
          </motion.aside>
        </div>
      </header>

      <nav className="lost-rembrandt__nav" aria-label={localizedProjectValue(settings.title, language)}>
        <div className="rembrandt-project__shell">
          <a href="#about-the-project">{labels.nav.about}</a><a href="#current-investigations">{labels.nav.investigations}</a><a href="#research-process">{labels.nav.process}</a><a href="#submit-a-painting">{labels.nav.submit}</a>
        </div>
      </nav>

      <div className="rembrandt-project__content">
        <section className="rembrandt-project__intro rembrandt-project__shell">
          <motion.div {...reveal} className="rembrandt-project__intro-copy"><p>{localizedProjectValue(settings.summary, language)}</p></motion.div>
          <motion.aside {...reveal} className="rembrandt-project__disclaimer"><ShieldCheck aria-hidden="true" /><p>{localizedProjectValue(settings.disclaimer, language)}</p></motion.aside>
        </section>

        <section id="about-the-project" className="lost-rembrandt__about rembrandt-project__shell">
          <motion.div {...reveal} className="rembrandt-project__section-heading">
            <p>{labels.nav.about}</p><h2>{localizedProjectValue(settings.aboutTitle, language)}</h2><span>{localizedProjectValue(settings.aboutIntro, language)}</span>
          </motion.div>
          <div className="lost-rembrandt__about-grid">
            {project.aboutSections.map((section, index) => (
              <motion.article {...reveal} key={section.id}>
                <span>{String(index + 1).padStart(2, "0")}</span><h3>{localizedProjectValue(section.title, language)}</h3>
                {paragraphs(section.body, language).map((text) => <p key={text}>{text}</p>)}
              </motion.article>
            ))}
          </div>
        </section>

        <section id="current-investigations" className="lost-rembrandt__investigations">
          <div className="rembrandt-project__shell">
            <motion.div {...reveal} className="rembrandt-project__section-heading is-light">
              <p>{labels.nav.investigations}</p><h2>{localizedProjectValue(settings.investigationsTitle, language)}</h2><span>{localizedProjectValue(settings.investigationsIntro, language)}</span>
            </motion.div>
            <div className="lost-investigation__list">
              {project.investigations.map((investigation) => (
                <Investigation key={investigation.id} investigation={investigation} language={language} labels={labels} privatePreview={privatePreview} />
              ))}
            </div>
          </div>
        </section>

        <section id="research-process" className="lost-rembrandt__process rembrandt-project__shell">
          <motion.div {...reveal} className="rembrandt-project__section-heading">
            <p>{labels.nav.process}</p><h2>{localizedProjectValue(settings.processTitle, language)}</h2><span>{localizedProjectValue(settings.processIntro, language)}</span>
          </motion.div>
          <div className="lost-process__layout">
            <div className="lost-process__steps">
              {project.researchSteps.map((step, index) => (
                <details key={step.id} className="lost-process__step" open={index === 0}>
                  <summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{localizedProjectValue(step.title, language)}</strong><ChevronDown aria-hidden="true" /></summary>
                  <div>{paragraphs(step.body, language).map((text) => <p key={text}>{text}</p>)}</div>
                </details>
              ))}
            </div>
            <aside className="lost-process__visual">
              {settings.researchImage && (
                <img
                  src={settings.researchImage}
                  alt={localizedProjectValue(settings.researchImageAlt, language)}
                  loading="lazy"
                />
              )}
              <div><Microscope aria-hidden="true" /><p>{labels.independent}</p><strong>{labels.independentText}</strong></div>
              <ul><li><FlaskConical aria-hidden="true" />{localizedProjectValue(settings.methodologyTitle, language)}</li><li><Eye aria-hidden="true" />{localizedProjectValue(settings.methodologyText, language)}</li></ul>
            </aside>
          </div>
        </section>

        <section id="submit-a-painting" className="lost-rembrandt__submit-section">
          <div className="rembrandt-project__shell lost-rembrandt__submit-layout">
            <div className="lost-rembrandt__submit-sticky">
              <div className="lost-rembrandt__submit-intro">
                <motion.div {...reveal} className="lost-rembrandt__submit-intro-content">
                  <p>{labels.nav.submit}</p><h2>{localizedProjectValue(settings.submissionTitle, language)}</h2><span>{localizedProjectValue(settings.submissionIntro, language)}</span>
                  <div><LockKeyhole aria-hidden="true" /><strong>{localizedProjectValue(settings.confidentialityTitle, language)}</strong><p>{localizedProjectValue(settings.confidentialityText, language)}</p></div>
                </motion.div>
              </div>
            </div>
            <PaintingSubmissionForm language={language} settings={settings} />
          </div>
        </section>

        <section className="rembrandt-project__closing rembrandt-project__shell">
          <p>{localizedProjectValue(settings.eyebrow, language)}</p><h2>{localizedProjectValue(settings.closingTitle, language)}</h2><span>{localizedProjectValue(settings.closingText, language)}</span>
          {project.updatedAt && <small>{labels.lastUpdated}: {dateFormatter(language, project.updatedAt)}</small>}
        </section>
      </div>
    </main>
  );
}
