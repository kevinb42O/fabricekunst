import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { UPDATE_CATEGORIES, formatUpdateDate } from '../../utils/dashboardUpdates.js';

function UpdateLabels({ update, fresh }) {
  return <>
    <span className={`admin-update-kind admin-update-kind--${update.category}`}>{UPDATE_CATEGORIES[update.category]}</span>
    {fresh && <span className="admin-update-new">Nieuw</span>}
  </>;
}

export function LatestDashboardUpdate({ state, onOpen }) {
  const latest = state.updates[0];
  if (!latest || state.error || state.loading) return null;
  return <section className="admin-latest-update" aria-labelledby="latest-update-title">
    <div>
      <h2 id="latest-update-title">Nieuw voor jou</h2>
      <div className="admin-update-meta"><time dateTime={latest.date}>{formatUpdateDate(latest.date)}</time><UpdateLabels update={latest} fresh={!state.viewed.includes(latest.id)} /></div>
      <p>{latest.title}</p>
    </div>
    <button type="button" className="admin-text-button" onClick={onOpen}>Alle updates bekijken <ArrowRight aria-hidden="true" /></button>
  </section>;
}

export default function DashboardUpdates({ state, onNavigate }) {
  const [filter, setFilter] = useState('all');
  const [showStart, setShowStart] = useState(false);
  const startHeading = useRef(null);
  const arrival = useRef(null);
  const { updates, viewed, loading, error, markViewed } = state;
  const visible = updates.filter(update => filter === 'all' || update.category === filter);
  const projectStart = updates.find(update => update.id === '2026-07-25-projectstart');
  useEffect(() => {
    if (!showStart || loading || error) return;
    startHeading.current?.scrollIntoView({ block: 'center' });
    startHeading.current?.focus({ preventScroll: true });
    setShowStart(false);
  }, [showStart, filter, loading, error]);
  // Remember only entries actually displayed. Filters must not mark hidden
  // improvements as read. Preserve the arrival labels until this visit ends.
  useEffect(() => {
    if (loading || error || !updates.length) return;
    if (arrival.current === null) arrival.current = updates.filter(update => !viewed.includes(update.id)).map(update => update.id);
    markViewed(updates.filter(update => filter === 'all' || update.category === filter).map(update => update.id));
  }, [loading, error, updates, viewed, filter, markViewed]);
  const fresh = arrival.current ?? updates.filter(update => !viewed.includes(update.id)).map(update => update.id);

  return <div className="admin-overview admin-updates">
    <section className="admin-page-heading" aria-labelledby="updates-title"><div>
      <h1 id="updates-title">Nieuw voor jou</h1>
      <p>Hier lees je wat er aan je website en werkruimte is verbeterd.</p>
    </div>{projectStart && !loading && !error && <button type="button" className="admin-button admin-button--secondary" onClick={() => { setFilter('all'); setShowStart(true); }}>Naar de start van het project <ArrowRight aria-hidden="true" /></button>}</section>
    <div className="admin-update-filters" role="group" aria-label="Soort update">
      {[['all', 'Alles'], ...Object.entries(UPDATE_CATEGORIES)].map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} className={`admin-button ${filter === id ? 'admin-button--primary' : 'admin-button--secondary'}`} onClick={() => setFilter(id)}>{label}</button>)}
    </div>
    <p className="admin-update-explainer">Nieuwe pagina’s en grote updates brengen iets nieuws. Bij verbeteringen en oplossingen lees je wat er makkelijker of beter werkt.</p>
    {loading ? <p role="status">Updates laden…</p> : error ? <div role="alert"><p>De updates konden niet worden geladen.</p><button type="button" className="admin-button admin-button--secondary" onClick={() => void state.reload()}>Opnieuw proberen</button></div> : !visible.length ? <p>Er zijn nog geen updates in deze categorie.</p> : <div className="admin-update-list">
      {visible.map(update => <article className="admin-update-entry" key={update.id} aria-labelledby={`update-${update.id}`}>
        <div className="admin-update-meta"><time dateTime={update.date}>{formatUpdateDate(update.date)}</time><UpdateLabels update={update} fresh={fresh.includes(update.id)} /></div>
        <div className="admin-update-copy"><h2 id={`update-${update.id}`} ref={update.id === projectStart?.id ? startHeading : undefined} tabIndex={update.id === projectStart?.id ? -1 : undefined}>{update.title}</h2>{update.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}{update.action && <button type="button" className="admin-text-button" onClick={() => onNavigate(update.action.target)}>{update.action.label} <ArrowRight aria-hidden="true" /></button>}</div>
      </article>)}
    </div>}
    <p className="admin-update-explainer">Het label ‘Nieuw’ wordt op dit toestel onthouden zodra je een update bekijkt. Alle berichten blijven hier terug te lezen.</p>
  </div>;
}
