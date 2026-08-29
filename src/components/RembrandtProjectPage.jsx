import React, { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
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
import "../styles/rembrandt-project.css";

const UI = {
  nl: {
    latest: "Nieuwste update",
    timeline: "Het onderzoek, stap voor stap",
    timelineIntro:
      "Elke stap wordt pas toegevoegd nadat de beschikbare informatie zorgvuldig is gecontroleerd.",
    current: "Huidige fase",
    progress: "Voortgang van het onderzoeksprogramma",
    next: "Eerstvolgende stap",
    findings: "Wat deze stap ons leert",
    follow: "Volg het onderzoek",
    readLatest: "Lees de nieuwste update",
    status: {
      discovery: "Ontdekking",
      "technical-research": "Technisch onderzoek",
      "expert-review": "Expertbeoordeling",
      paused: "Tijdelijk gepauzeerd",
      completed: "Onderzoek afgerond",
    },
    evidence: {
      documented: "Gedocumenteerd",
      observation: "Voorlopige observatie",
      hypothesis: "Onderzoekshypothese",
      "external-review": "Externe beoordeling",
      "next-step": "Volgende onderzoeksstap",
    },
    methodology: "Onderzoekslijnen",
    methods: [
      "Materiaal & pigment",
      "Beeldvorming",
      "Herkomst",
      "Conditie",
      "Kunsthistorische context",
    ],
    lastUpdated: "Laatst bijgewerkt",
    phaseOf: (current, total) => `Fase ${current} van ${total}`,
    researchDate: "Onderzoeksdatum",
    publishedDate: "Gepubliceerd",
    emptyPhase: "Voor deze fase zijn nog geen publieke updates beschikbaar.",
    unavailable: "Deze onderzoekspagina is momenteel niet beschikbaar.",
    backHome: "Terug naar de startpagina",
    loading: "Project laden…",
    privatePreview: "Privévoorbeeld — deze pagina is nog niet openbaar.",
  },
  en: {
    latest: "Latest update",
    timeline: "The investigation, step by step",
    timelineIntro:
      "Each step is added only after the available information has been carefully reviewed.",
    current: "Current phase",
    progress: "Research programme progress",
    next: "Next step",
    findings: "What this step tells us",
    follow: "Follow the investigation",
    readLatest: "Read the latest update",
    status: {
      discovery: "Discovery",
      "technical-research": "Technical research",
      "expert-review": "Expert review",
      paused: "Temporarily paused",
      completed: "Research completed",
    },
    evidence: {
      documented: "Documented",
      observation: "Preliminary observation",
      hypothesis: "Research hypothesis",
      "external-review": "External review",
      "next-step": "Next research step",
    },
    methodology: "Research strands",
    methods: [
      "Materials & pigments",
      "Imaging",
      "Provenance",
      "Condition",
      "Art-historical context",
    ],
    lastUpdated: "Last updated",
    phaseOf: (current, total) => `Phase ${current} of ${total}`,
    researchDate: "Research date",
    publishedDate: "Published",
    emptyPhase: "No public updates are available for this phase yet.",
    unavailable: "This research page is currently unavailable.",
    backHome: "Back to the homepage",
    loading: "Loading project…",
    privatePreview: "Private preview — this page is not public yet.",
  },
  fr: {
    latest: "Dernière mise à jour",
    timeline: "La recherche, étape par étape",
    timelineIntro:
      "Chaque étape n’est ajoutée qu’après un examen attentif des informations disponibles.",
    current: "Phase actuelle",
    progress: "Progression du programme de recherche",
    next: "Prochaine étape",
    findings: "Ce que cette étape nous apprend",
    follow: "Suivre la recherche",
    readLatest: "Lire la dernière mise à jour",
    status: {
      discovery: "Découverte",
      "technical-research": "Recherche technique",
      "expert-review": "Évaluation des experts",
      paused: "Temporairement suspendu",
      completed: "Recherche terminée",
    },
    evidence: {
      documented: "Documenté",
      observation: "Observation préliminaire",
      hypothesis: "Hypothèse de recherche",
      "external-review": "Évaluation externe",
      "next-step": "Prochaine étape de recherche",
    },
    methodology: "Axes de recherche",
    methods: [
      "Matériaux & pigments",
      "Imagerie",
      "Provenance",
      "État",
      "Contexte historique",
    ],
    lastUpdated: "Dernière mise à jour",
    phaseOf: (current, total) => `Phase ${current} sur ${total}`,
    researchDate: "Date de recherche",
    publishedDate: "Publié",
    emptyPhase:
      "Aucune mise à jour publique n’est encore disponible pour cette phase.",
    unavailable: "Cette page de recherche est actuellement indisponible.",
    backHome: "Retour à l’accueil",
    loading: "Chargement du projet…",
    privatePreview: "Aperçu privé — cette page n’est pas encore publique.",
  },
};

const dateFormatter = (language, value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "nl" ? "nl-BE" : language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

function ProjectImage({ image, language }) {
  if (!image?.url) return null;
  return (
    <figure className="rembrandt-project__figure">
      <img
        src={image.url}
        alt={localizedProjectValue(image.alt, language, "")}
        loading="lazy"
        decoding="async"
      />
      {localizedProjectValue(image.caption, language, "") && (
        <figcaption>
          {localizedProjectValue(image.caption, language)}
        </figcaption>
      )}
    </figure>
  );
}

function ProjectUpdate({ update, index, language, labels }) {
  const findings = localizedProjectValue(update.keyFindings, language, []);
  const paragraphs = String(localizedProjectValue(update.body, language, ""))
    .split(/\n\s*\n/)
    .filter(Boolean);
  return (
    <article id={`update-${update.slug}`} className="rembrandt-update">
      <div className="rembrandt-update__rail" aria-hidden="true">
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="rembrandt-update__content">
        <header>
          <div className="rembrandt-update__meta">
            <span
              className={`rembrandt-evidence rembrandt-evidence--${update.evidenceType}`}
            >
              {labels.evidence[update.evidenceType] ||
                labels.evidence.observation}
            </span>
            {update.eventDate && (
              <time
                dateTime={update.eventDate}
                aria-label={`${labels.researchDate}: ${dateFormatter(language, update.eventDate)}`}
              >
                <CalendarDays aria-hidden="true" />
                {dateFormatter(language, update.eventDate)}
              </time>
            )}
          </div>
          <h3>{localizedProjectValue(update.title, language)}</h3>
          <p className="rembrandt-update__summary">
            {localizedProjectValue(update.summary, language)}
          </p>
        </header>

        {update.coverImage && (
          <ProjectImage
            language={language}
            image={{
              url: update.coverImage,
              alt: update.coverAlt,
              caption: update.coverCaption,
            }}
          />
        )}
        <div className="rembrandt-update__body">
          {paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex}>{paragraph}</p>
          ))}
        </div>

        {Array.isArray(findings) && findings.length > 0 && (
          <section
            className="rembrandt-findings"
            aria-labelledby={`${update.id}-findings`}
          >
            <h4 id={`${update.id}-findings`}>
              <CheckCircle2 aria-hidden="true" />
              {labels.findings}
            </h4>
            <ul>
              {findings.filter(Boolean).map((finding, findingIndex) => (
                <li key={findingIndex}>{finding}</li>
              ))}
            </ul>
          </section>
        )}

        {localizedProjectValue(update.nextStep, language, "") && (
          <div className="rembrandt-next-step">
            <ArrowRight aria-hidden="true" />
            <div>
              <strong>{labels.next}</strong>
              <p>{localizedProjectValue(update.nextStep, language)}</p>
            </div>
          </div>
        )}

        {Array.isArray(update.gallery) &&
          update.gallery.some((image) => image?.url) && (
            <div
              className={`rembrandt-gallery ${update.gallery.filter((image) => image?.url).length === 1 ? "rembrandt-gallery--single" : ""}`}
            >
              {update.gallery
                .filter((image) => image?.url)
                .map((image, imageIndex) => (
                  <ProjectImage
                    key={image.id || imageIndex}
                    image={image}
                    language={language}
                  />
                ))}
            </div>
          )}
      </div>
    </article>
  );
}

export default function RembrandtProjectPage({
  projectData,
  loading = false,
  privatePreview = false,
  previewError = '',
  onNavigate = () => {},
}) {
  const { language } = useLanguage();
  const labels = UI[language] || UI.nl;
  const reduceMotion = useReducedMotion();
  const currentPhaseLink = useRef(null);
  const project = useMemo(
    () => publishedRembrandtProject(projectData),
    [projectData],
  );
  const settings = project.settings;
  const latest = latestProjectUpdate(project);
  const currentPhaseIndex = project.phases.findIndex(
    (phase) => phase.id === settings.currentPhaseId,
  );
  const progress =
    currentPhaseIndex < 0 || !project.phases.length
      ? 0
      : Math.round(((currentPhaseIndex + 1) / project.phases.length) * 100);
  const currentPhase = project.phases.find(
    (phase) => phase.id === settings.currentPhaseId,
  );

  useEffect(() => {
    const link = currentPhaseLink.current;
    const rail = link?.parentElement;
    if (!link || !rail || window.matchMedia("(min-width: 1024px)").matches)
      return;
    rail.scrollTo({
      left: Math.max(
        0,
        link.offsetLeft - (rail.clientWidth - link.clientWidth) / 2,
      ),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [settings.currentPhaseId, reduceMotion]);

  if (loading)
    return (
      <div
        className="rembrandt-project rembrandt-project__state"
        aria-live="polite"
      >
        <span className="rembrandt-project__state-loader" />
        <p>{labels.loading}</p>
      </div>
    );
  if (previewError || !projectData || !project.isEnabled)
    return (
      <div className="rembrandt-project rembrandt-project__state">
        <p>{previewError || labels.unavailable}</p>
        <button type="button" onClick={() => onNavigate("home")}>
          {labels.backHome}
        </button>
      </div>
    );
  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.45 },
      };

  return (
    <div className="rembrandt-project">
      {privatePreview && (
        <div className="rembrandt-project__private-preview" role="status">
          <ShieldCheck aria-hidden="true" />
          <span>{labels.privatePreview}</span>
        </div>
      )}
      <header
        className={`rembrandt-project__hero ${settings.heroImage ? "has-image" : ""}`}
      >
        {settings.heroImage && (
          <img
            className="rembrandt-project__hero-image"
            src={settings.heroImage}
            alt={localizedProjectValue(settings.heroAlt, language)}
            fetchPriority="high"
          />
        )}
        <div className="rembrandt-project__hero-wash" aria-hidden="true" />
        <div className="rembrandt-project__shell rembrandt-project__hero-grid">
          <motion.div {...reveal} className="rembrandt-project__hero-copy">
            <p className="rembrandt-project__eyebrow">
              <span />
              {localizedProjectValue(settings.eyebrow, language)}
            </p>
            <h1>{localizedProjectValue(settings.title, language)}</h1>
            <p className="rembrandt-project__lead">
              {localizedProjectValue(settings.intro, language)}
            </p>
            <div className="rembrandt-project__hero-actions">
              <a
                href="#project-timeline"
                onClick={() => {
                  if (!privatePreview) {
                    trackEvent("cta_clicked", {
                      placement: "rembrandt_project_hero",
                      target: "project_timeline",
                    });
                  }
                }}
              >
                {labels.follow}
                <ArrowDown aria-hidden="true" />
              </a>
              {latest && (
                <a className="is-secondary" href={`#update-${latest.slug}`}>
                  {labels.readLatest}
                  <ArrowRight aria-hidden="true" />
                </a>
              )}
            </div>
          </motion.div>
          <motion.aside
            {...reveal}
            className="rembrandt-project__status-card"
            aria-label={labels.current}
          >
            <div className="rembrandt-project__status-heading">
              <Search aria-hidden="true" />
              <span>{labels.current}</span>
            </div>
            <strong>
              {labels.status[settings.projectStatus] ||
                labels.status["technical-research"]}
            </strong>
            <p>{localizedProjectValue(settings.currentStatus, language)}</p>
            <div className="rembrandt-project__progress-label">
              <span>{labels.progress}</span>
              <b>
                {labels.phaseOf(currentPhaseIndex + 1, project.phases.length)}
              </b>
            </div>
            <div
              className="rembrandt-project__progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            {currentPhase && (
              <small>
                {localizedProjectValue(currentPhase.label, language)}
              </small>
            )}
            {localizedProjectValue(settings.nextStep, language, "") && (
              <div className="rembrandt-project__status-next">
                <b>{labels.next}</b>
                <span>
                  {localizedProjectValue(settings.nextStep, language)}
                </span>
              </div>
            )}
          </motion.aside>
        </div>
      </header>

      <div className="rembrandt-project__content">
        <section className="rembrandt-project__intro rembrandt-project__shell">
          <motion.div {...reveal} className="rembrandt-project__intro-copy">
            <p>{localizedProjectValue(settings.summary, language)}</p>
          </motion.div>
          <motion.aside {...reveal} className="rembrandt-project__disclaimer">
            <ShieldCheck aria-hidden="true" />
            <p>{localizedProjectValue(settings.disclaimer, language)}</p>
          </motion.aside>
        </section>

        {latest && (
          <section className="rembrandt-project__latest-section">
            <motion.a
              {...reveal}
              href={`#update-${latest.slug}`}
              className="rembrandt-project__latest rembrandt-project__shell"
            >
              <span>{labels.latest}</span>
              <div>
                <time
                  dateTime={latest.publishedAt || latest.eventDate}
                  aria-label={`${labels.publishedDate}: ${dateFormatter(language, latest.publishedAt || latest.eventDate)}`}
                >
                  <span>{labels.publishedDate}: </span>
                  {dateFormatter(
                    language,
                    latest.publishedAt || latest.eventDate,
                  )}
                </time>
                <h2>{localizedProjectValue(latest.title, language)}</h2>
                <p>{localizedProjectValue(latest.summary, language)}</p>
              </div>
              <ArrowRight aria-hidden="true" />
            </motion.a>
          </section>
        )}

        <section
          id="project-timeline"
          className="rembrandt-project__timeline-section rembrandt-project__shell"
        >
          <div className="rembrandt-project__section-heading">
            <p>{labels.follow}</p>
            <h2>{labels.timeline}</h2>
            <span>{labels.timelineIntro}</span>
          </div>
          <div className="rembrandt-project__timeline-layout">
            <nav
              className="rembrandt-project__phase-nav"
              aria-label={labels.current}
            >
              {project.phases.map((phase) => (
                <a
                  key={phase.id}
                  ref={
                    phase.id === settings.currentPhaseId
                      ? currentPhaseLink
                      : null
                  }
                  className={
                    phase.id === settings.currentPhaseId ? "is-current" : ""
                  }
                  href={`#phase-${phase.id}`}
                >
                  {String(phase.sortOrder).padStart(2, "0")}
                  <span>{localizedProjectValue(phase.label, language)}</span>
                </a>
              ))}
            </nav>
            <div className="rembrandt-project__updates">
              {project.phases.map((phase) => {
                const phaseUpdates = project.updates.filter(
                  (update) => update.phaseId === phase.id,
                );
                return (
                  <section
                    id={`phase-${phase.id}`}
                    key={phase.id}
                    className="rembrandt-phase"
                  >
                    <h2>{localizedProjectValue(phase.label, language)}</h2>
                    {!phaseUpdates.length && (
                      <p className="rembrandt-phase__empty">
                        {labels.emptyPhase}
                      </p>
                    )}
                    {phaseUpdates.map((update) => (
                      <ProjectUpdate
                        key={update.id}
                        update={update}
                        index={project.updates.indexOf(update)}
                        language={language}
                        labels={labels}
                      />
                    ))}
                  </section>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rembrandt-project__methodology">
          <div className="rembrandt-project__shell rembrandt-project__methodology-grid">
            <div>
              <p>{labels.methodology}</p>
              <h2>
                {localizedProjectValue(settings.methodologyTitle, language)}
              </h2>
              <span>
                {localizedProjectValue(settings.methodologyText, language)}
              </span>
            </div>
            <ul>
              {labels.methods.map((method, index) => (
                <li key={method}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {index === 0 ? (
                    <FlaskConical aria-hidden="true" />
                  ) : (
                    <Search aria-hidden="true" />
                  )}
                  <strong>{method}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rembrandt-project__closing rembrandt-project__shell">
          <p>{localizedProjectValue(settings.eyebrow, language)}</p>
          <h2>{localizedProjectValue(settings.closingTitle, language)}</h2>
          <span>{localizedProjectValue(settings.closingText, language)}</span>
          {project.updatedAt && (
            <small>
              {labels.lastUpdated}: {dateFormatter(language, project.updatedAt)}
            </small>
          )}
        </section>
      </div>
    </div>
  );
}
