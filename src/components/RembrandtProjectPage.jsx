import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
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

function Investigation({ investigation, updates, language, labels }) {
  const gallery = [
    ...(investigation.coverImage ? [{ id: `${investigation.id}-cover`, url: investigation.coverImage, alt: investigation.coverAlt }] : []),
    ...(investigation.gallery || []),
  ];
  return (
    <article id={`investigation-${investigation.slug}`} className={`lost-investigation ${investigation.featured ? "is-featured" : ""}`}>
      <div className="lost-investigation__image">
        {investigation.coverImage && <img src={investigation.coverImage} alt={localizedProjectValue(investigation.coverAlt, language)} loading="lazy" decoding="async" />}
        <span>{labels.privateSubmission}</span>
      </div>
      <div className="lost-investigation__copy">
        <div className="lost-investigation__meta"><span>{labels.caseNumber} {investigation.reference}</span><b>{localizedProjectValue(investigation.statusLabel, language, labels.status[investigation.status])}</b></div>
        <h3>{localizedProjectValue(investigation.title, language)}</h3>
        <h4>{localizedProjectValue(investigation.subtitle, language)}</h4>
        <p>{localizedProjectValue(investigation.summary, language)}</p>
        <details className="lost-investigation__details">
          <summary><span className="when-closed">{labels.viewCase}</span><span className="when-open">{labels.closeCase}</span><ChevronDown aria-hidden="true" /></summary>
          <div className="lost-investigation__detail-body">
            {paragraphs(investigation.description, language).map((text) => <p key={text}>{text}</p>)}
            {gallery.length > 0 && <div className="lost-investigation__gallery">{gallery.map((image) => <ProjectImage key={image.id || image.url} image={image} language={language} />)}</div>}
            <section className="lost-investigation__timeline" aria-labelledby={`${investigation.id}-timeline`}>
              <div className="rembrandt-project__section-heading is-compact">
                <p>{labels.latest}</p><h3 id={`${investigation.id}-timeline`}>{labels.timeline}</h3><span>{labels.timelineIntro}</span>
              </div>
              {updates.length ? updates.map((update, index) => <ProjectUpdate key={update.id} update={update} index={index} language={language} labels={labels} />) : <p className="rembrandt-phase__empty">{labels.empty}</p>}
            </section>
          </div>
        </details>
      </div>
    </article>
  );
}

export default function RembrandtProjectPage({ projectData, loading = false, privatePreview = false, previewError = "", onNavigate = () => {} }) {
  const { language } = useLanguage();
  const labels = UI[language] || UI.nl;
  const reduceMotion = useReducedMotion();
  const project = useMemo(() => publishedRembrandtProject(projectData), [projectData]);
  const settings = project.settings;
  const latest = latestProjectUpdate(project);
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-70px" }, transition: { duration: 0.5 } };

  if (loading) return <div className="rembrandt-project rembrandt-project__state" aria-live="polite"><span className="rembrandt-project__state-loader" /><p>{labels.loading}</p></div>;
  if (previewError || !projectData || !project.isEnabled) return <div className="rembrandt-project rembrandt-project__state"><p>{previewError || labels.unavailable}</p><button type="button" onClick={() => onNavigate("home")}>{labels.backHome}</button></div>;

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
            {latest && <a href={`#update-${latest.slug}`}>{labels.latest}<ArrowRight aria-hidden="true" /></a>}
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
                <Investigation key={investigation.id} investigation={investigation} updates={project.updates.filter((update) => update.investigationId === investigation.id)} language={language} labels={labels} />
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
            <motion.div {...reveal} className="lost-rembrandt__submit-intro">
              <p>{labels.nav.submit}</p><h2>{localizedProjectValue(settings.submissionTitle, language)}</h2><span>{localizedProjectValue(settings.submissionIntro, language)}</span>
              <div><LockKeyhole aria-hidden="true" /><strong>{localizedProjectValue(settings.confidentialityTitle, language)}</strong><p>{localizedProjectValue(settings.confidentialityText, language)}</p></div>
            </motion.div>
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
