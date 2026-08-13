import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { LUXURY_EASE } from '../utils/motion';

export const BUSINESS = {
  legalName: 'Andor CommV',
  tradeName: 'Atelier Rembrandt',
  address: 'Kemmelbergstraat 8, 8400 Oostende, België',
  enterpriseNumber: '0749.548.593',
  vatNumber: 'BE 0749.548.593',
  email: 'contact@atelierrembrandt.com',
  phoneDisplay: '+32 (0)484 38 45 30',
  phoneHref: '+32484384530',
  website: 'www.atelierrembrandt.com',
};

const UPDATED = '13 augustus 2026';

export function LegalLink({ href, children }) {
  const external = href?.startsWith('http');
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="legal-link"
    >
      {children}
      {external && <ArrowUpRight aria-hidden="true" className="ml-1 inline h-3 w-3" />}
    </a>
  );
}

export function BusinessIdentity() {
  return (
    <dl className="legal-identity">
      <div><dt>Handelsnaam</dt><dd>{BUSINESS.tradeName}</dd></div>
      <div><dt>Onderneming</dt><dd>{BUSINESS.legalName}</dd></div>
      <div><dt>Maatschappelijke zetel</dt><dd>{BUSINESS.address}</dd></div>
      <div><dt>Ondernemingsnummer</dt><dd>{BUSINESS.enterpriseNumber}</dd></div>
      <div><dt>Btw-nummer</dt><dd>{BUSINESS.vatNumber}</dd></div>
      <div><dt>E-mail</dt><dd><LegalLink href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</LegalLink></dd></div>
      <div><dt>Telefoon</dt><dd><LegalLink href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phoneDisplay}</LegalLink></dd></div>
    </dl>
  );
}

export default function LegalDocument({
  documentNumber,
  eyebrow,
  title,
  summary,
  sections,
  onNavigateHome,
  onRequestConsultation,
  contactTitle,
  contactText,
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main lang="nl" className="legal-page min-h-screen pb-24 pt-24 text-[#171713] sm:pt-32">
      <div className="legal-shell">
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          onClick={onNavigateHome}
          className="legal-back"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Terug naar de galerie</span>
        </motion.button>

        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: LUXURY_EASE }}
          className="legal-masthead"
        >
          <div className="legal-kicker">
            <span>Juridisch document {documentNumber}</span>
            <span aria-hidden="true">/</span>
            <span>{eyebrow}</span>
          </div>
          <h1>{title}</h1>
          <p className="legal-summary">{summary}</p>
          <dl className="legal-meta">
            <div><dt>Verantwoordelijke</dt><dd>{BUSINESS.legalName} · {BUSINESS.tradeName}</dd></div>
            <div><dt>Toepassingsgebied</dt><dd>{BUSINESS.website}</dd></div>
            <div><dt>Laatste herziening</dt><dd>{UPDATED}</dd></div>
          </dl>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.12, ease: LUXURY_EASE }}
          className="legal-grid"
        >
          <aside className="legal-index" aria-label="Inhoudsopgave">
            <p className="legal-index-title">Inhoud</p>
            <ol>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="legal-article">
            {sections.map((section, index) => (
              <section id={section.id} key={section.id} className="legal-section scroll-mt-28">
                <p className="legal-section-number">{String(index + 1).padStart(2, '0')}</p>
                <div>
                  <h2>{section.title}</h2>
                  <div className="legal-prose">{section.content}</div>
                </div>
              </section>
            ))}
          </article>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="legal-contact"
        >
          <div>
            <p className="legal-contact-label">Persoonlijk contact</p>
            <h2>{contactTitle}</h2>
            <p>{contactText}</p>
          </div>
          <div className="legal-contact-actions">
            <button onClick={onRequestConsultation} className="legal-primary-action">Contact opnemen</button>
            <button onClick={onNavigateHome} className="legal-secondary-action">Naar de galerie</button>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}
