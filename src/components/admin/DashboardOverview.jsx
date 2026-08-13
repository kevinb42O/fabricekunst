import React from 'react';
import { ArrowRight, BookOpen, ExternalLink, Inbox, Plus, Star, Users } from 'lucide-react';
import { getCollectionGroupForItem } from '../../data/catalogTaxonomy';

const formatDate = (value) => {
  if (!value) return 'Geen datum';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short' }).format(date);
};

export default function DashboardOverview({
  items = [],
  inquiries = [],
  onNavigateTab = () => {},
  onCreateNewItem = () => {},
  onOpenLiveSite = () => {}
}) {
  const booksCount = items.filter((item) => getCollectionGroupForItem(item) === 'books').length;
  const artCount = items.filter((item) => getCollectionGroupForItem(item) === 'art').length;
  const featuredCount = items.filter((item) => item.featured).length;
  const newInquiries = inquiries.filter((item) => item.status === 'Nieuw');
  const uniqueCustomers = new Set(inquiries.map((item) => item.email || item.name).filter(Boolean)).size;
  const byMostRecent = (a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
  const recentInquiries = [...inquiries].sort(byMostRecent).slice(0, 4);
  const recentItems = [...items].slice(-5).reverse();

  const metrics = [
    { label: 'Objecten', value: items.length, detail: `${booksCount} boeken · ${artCount} kunstwerken`, icon: BookOpen, tab: 'items' },
    { label: 'Topstukken', value: featuredCount, detail: 'zichtbaar op de homepage', icon: Star, tab: 'items' },
    { label: 'Nieuwe aanvragen', value: newInquiries.length, detail: `${inquiries.length} aanvragen in totaal`, icon: Inbox, tab: 'inquiries' },
    { label: 'Klanten', value: uniqueCustomers, detail: 'unieke contacten', icon: Users, tab: 'customers' }
  ];

  return (
    <div className="admin-overview">
      <section className="admin-page-heading" aria-labelledby="dashboard-title">
        <div>
          <p className="admin-eyebrow">Collectiebeheer</p>
          <h1 id="dashboard-title">Goedemiddag, Fabrice.</h1>
          <p>Een rustig overzicht van de collectie en de openstaande opvolging.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-button admin-button--secondary" onClick={onOpenLiveSite}>
            <ExternalLink aria-hidden="true" />
            Website bekijken
          </button>
          <button type="button" className="admin-button admin-button--primary" onClick={onCreateNewItem}>
            <Plus aria-hidden="true" />
            Nieuw object
          </button>
        </div>
      </section>

      <section className="admin-metrics" aria-label="Kerncijfers">
        {metrics.map(({ label, value, detail, icon: Icon, tab }) => (
          <button type="button" key={label} className="admin-metric" onClick={() => onNavigateTab(tab)}>
            <span className="admin-metric__icon"><Icon aria-hidden="true" /></span>
            <span className="admin-metric__label">{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </button>
        ))}
      </section>

      <div className="admin-overview-grid">
        <section className="admin-panel" aria-labelledby="inquiries-title">
          <div className="admin-panel__header">
            <div>
              <h2 id="inquiries-title">Recente aanvragen</h2>
              <p>{newInquiries.length ? `${newInquiries.length} vragen om opvolging` : 'Alles is bijgewerkt'}</p>
            </div>
            <button type="button" className="admin-text-button" onClick={() => onNavigateTab('inquiries')}>Alle aanvragen <ArrowRight aria-hidden="true" /></button>
          </div>
          <div className="admin-list">
            {recentInquiries.length === 0 ? (
              <div className="admin-empty-state"><Inbox aria-hidden="true" /><p>Nog geen aanvragen ontvangen.</p></div>
            ) : recentInquiries.map((inquiry, index) => (
              <button type="button" className="admin-list-row" key={inquiry.id || `${inquiry.email}-${index}`} onClick={() => onNavigateTab('inquiries')}>
                <span className="admin-avatar">{(inquiry.name || inquiry.email || '?').trim().charAt(0).toUpperCase()}</span>
                <span className="admin-list-row__main">
                  <strong>{inquiry.name || 'Onbekende bezoeker'}</strong>
                  <small>{inquiry.subject || inquiry.itemTitle || inquiry.email || 'Algemene aanvraag'}</small>
                </span>
                <span className="admin-list-row__meta">
                  <time>{formatDate(inquiry.createdAt || inquiry.date)}</time>
                  {inquiry.status === 'Nieuw' && <span className="admin-status-dot">Nieuw</span>}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="items-title">
          <div className="admin-panel__header">
            <div>
              <h2 id="items-title">Laatst toegevoegd</h2>
              <p>De nieuwste objecten in de collectie</p>
            </div>
            <button type="button" className="admin-text-button" onClick={() => onNavigateTab('items')}>Collectie <ArrowRight aria-hidden="true" /></button>
          </div>
          <div className="admin-list">
            {recentItems.length === 0 ? (
              <div className="admin-empty-state"><BookOpen aria-hidden="true" /><p>De collectie is nog leeg.</p></div>
            ) : recentItems.map((item, index) => {
              const image = item.images?.[0]?.url || item.image || '';
              return (
                <button type="button" className="admin-list-row" key={item.id || `${item.title}-${index}`} onClick={() => onNavigateTab('items')}>
                  <span className="admin-object-thumb">{image ? <img src={image} alt="" /> : <BookOpen aria-hidden="true" />}</span>
                  <span className="admin-list-row__main">
                    <strong>{item.title || 'Naamloos object'}</strong>
                    <small>{item.author || item.artist || item.category || 'Niet gecategoriseerd'}</small>
                  </span>
                  <span className="admin-list-row__meta"><span>{item.ref || item.year || '—'}</span></span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
