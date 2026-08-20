import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Clock3,
  ExternalLink,
  Eye,
  FileQuestion,
  Info,
  Link2,
  LoaderCircle,
  Mail,
  MonitorSmartphone,
  MousePointer2,
  RefreshCw,
  Send,
  Share2,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import UpgradeModal from './UpgradeModal';
import { authenticatedAdminFetch } from '../../utils/adminApi';

const ANALYTICS_ENDPOINT = '/api/admin-analytics';
const DEFAULT_RANGE = '7d';
const ANALYTICS_RANGE_STORAGE_KEY = 'admin_analytics_range';
const reportCache = new Map();

const RANGE_OPTIONS = [
  { id: '24h', label: '24 uur' },
  { id: '7d', label: '7 dagen' },
  { id: '30d', label: '30 dagen' },
  { id: '3m', label: '3 maanden', isProFeature: true },
  { id: '12m', label: '12 maanden', isProFeature: true },
  { id: 'ytd', label: 'Dit jaar', isProFeature: true },
  { id: 'all', label: 'Alles', isProFeature: true },
];

const UTM_CHANNELS = [
  { id: 'facebook', label: 'Facebook', source: 'facebook', medium: 'social', icon: Share2 },
  { id: 'instagram', label: 'Instagram', source: 'instagram', medium: 'social', icon: Share2 },
  { id: 'stories', label: 'Instagram Stories', source: 'instagram', medium: 'stories', icon: MousePointer2 },
  { id: 'whatsapp', label: 'WhatsApp', source: 'whatsapp', medium: 'chat', icon: Send },
  { id: 'email', label: 'E-mailnieuwsbrief', source: 'email', medium: 'newsletter', icon: Mail },
];

const UTM_DESTINATIONS = [
  { value: '/', label: 'Homepagina' },
  { value: '/collectie', label: 'Catalogus' },
  { value: '/#contact', label: 'Contact' },
];

const EMPTY_METRIC = Object.freeze({ value: 0, previous: null });

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return asNumber(value);
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const asString = (value, fallback = '') => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
};

const readMetric = (source) => {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return {
      value: asNumber(source.value ?? source.current ?? source.count ?? source.sessions),
      previous: asOptionalNumber(source.previous ?? source.previousValue ?? source.comparator),
    };
  }

  return { value: asNumber(source), previous: null };
};

const rangeLabel = (rangeId) => RANGE_OPTIONS.find((range) => range.id === rangeId)?.label || '7 dagen';
const formatNumber = (value) => new Intl.NumberFormat('nl-BE').format(asNumber(value));
const formatPercent = (value) => `${new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 1 }).format(asNumber(value))}%`;

const formatDate = (value, timeZone, options = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    return new Intl.DateTimeFormat('nl-BE', {
      day: 'numeric',
      month: 'short',
      ...options,
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short', ...options }).format(date);
  }
};

const formatTimestamp = (value, timeZone) => formatDate(value, timeZone, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const GRANULARITY_META = Object.freeze({
  hour: { unit: 'uur', adjective: 'Uurlijkse', column: 'Uur', tickInterval: 'preserveStartEnd' },
  day: { unit: 'dag', adjective: 'Dagelijkse', column: 'Datum', tickInterval: 'preserveEnd' },
  month: { unit: 'maand', adjective: 'Maandelijkse', column: 'Maand', tickInterval: 'preserveEnd' },
});

const normaliseGranularity = (value) => (Object.hasOwn(GRANULARITY_META, value) ? value : 'day');
const granularityMeta = (value) => GRANULARITY_META[normaliseGranularity(value)];
const tooltipBucketLabel = (label, payload) => asString(payload?.[0]?.payload?.tooltipLabel, asString(label, '—'));

const normaliseBreakdown = (items, nameKeys) => asArray(items).map((item, index) => {
  const explicitName = nameKeys.map((key) => item?.[key]).find((value) => typeof value === 'string' && value.trim());
  const name = explicitName || (item?.source === 'direct' ? 'Direct / niet getagd' : asString(item?.source, 'Onbekend'));
  return {
    id: asString(item?.id, `${name}-${index}`),
    name,
    source: asString(item?.source, ''),
    medium: asString(item?.medium, ''),
    campaign: asString(item?.campaign, ''),
    path: asString(item?.path, ''),
    label: asString(item?.label, name),
    sessions: asNumber(item?.sessions ?? item?.value ?? item?.count),
    pageViews: asNumber(item?.pageViews ?? item?.views),
    inquiries: asNumber(item?.inquiries ?? item?.submittedInquiries),
    inquiryRate: asOptionalNumber(item?.inquiryRate ?? item?.conversionRate),
    share: asOptionalNumber(item?.share),
  };
});

const normaliseLegacy = (legacy, timezone) => {
  if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) {
    return {
      available: false,
      included: false,
      label: '',
      range: { start: null, end: null, label: '', granularity: 'day' },
      summary: { uniqueIds: 0, pageViews: 0 },
      series: [],
    };
  }

  const summary = legacy.summary && typeof legacy.summary === 'object' ? legacy.summary : {};
  const series = asArray(legacy.series).map((item, index) => ({
    id: asString(item?.id, `${item?.date || item?.bucket || item?.label || 'legacy-period'}-${index}`),
    date: item?.date || item?.bucket || item?.label || '',
    label: asString(item?.label, '') || formatDate(item?.date || item?.bucket, timezone),
    tooltipLabel: asString(item?.tooltipLabel, '') || asString(item?.label, '') || formatDate(item?.date || item?.bucket, timezone),
    uniqueIds: asNumber(item?.uniqueIds ?? item?.uniqueVisitors ?? item?.visitors ?? item?.sessions),
    pageViews: asNumber(item?.pageViews ?? item?.views),
  }));
  const uniqueIds = readMetric(summary.uniqueIds ?? summary.uniqueVisitors ?? summary.visitors ?? summary.sessions).value;
  const pageViews = readMetric(summary.pageViews ?? summary.views).value;
  const hasAggregate = series.some((item) => item.uniqueIds > 0 || item.pageViews > 0) || uniqueIds > 0 || pageViews > 0;

  return {
    available: typeof legacy.available === 'boolean' ? legacy.available : hasAggregate,
    included: typeof legacy.included === 'boolean' ? legacy.included : hasAggregate,
    label: asString(legacy.label, ''),
    range: {
      start: legacy.range?.start || null,
      end: legacy.range?.end || null,
      label: asString(legacy.range?.label, ''),
      granularity: normaliseGranularity(legacy.range?.granularity ?? legacy.granularity),
    },
    summary: { uniqueIds, pageViews },
    series,
  };
};

const normaliseReport = (payload, requestedRange) => {
  const source = payload?.data && typeof payload.data === 'object' ? payload.data : (payload || {});
  const summary = source.summary || {};
  const breakdowns = source.breakdowns || {};
  const live = source.live || {};
  const liveActivity = asArray(live.activity);
  const reportedActivityCount = Math.max(0, Math.floor(asNumber(live.activityCount ?? live.actionsCount ?? live.count ?? liveActivity.length)));
  const reportedShownCount = live.shownCount === null || live.shownCount === undefined
    ? liveActivity.length
    : Math.max(0, Math.floor(asNumber(live.shownCount)));
  const activityCount = Math.max(reportedActivityCount, liveActivity.length);
  const shownCount = reportedShownCount === liveActivity.length ? reportedShownCount : liveActivity.length;
  const meta = source.meta || {};
  const timezone = asString(source.timezone, 'Europe/Brussels');

  return {
    generatedAt: source.generatedAt || source.generated_at || null,
    timezone,
    range: {
      key: asString(source.range?.key, requestedRange),
      label: asString(source.range?.label, rangeLabel(requestedRange)),
      start: source.range?.start || null,
      end: source.range?.end || null,
      previousStart: source.range?.previousStart || null,
      previousEnd: source.range?.previousEnd || null,
      granularity: normaliseGranularity(source.range?.granularity),
    },
    meta: {
      trackingState: asString(meta.trackingState || source.trackingState, 'ready'),
      trackingStartedAt: meta.trackingStartedAt || source.trackingStartedAt || null,
      partial: Boolean(meta.partial || source.partial),
      message: asString(meta.message || source.message, ''),
    },
    summary: {
      sessions: readMetric(summary.sessions),
      pageViews: readMetric(summary.pageViews),
      inquiries: readMetric(summary.inquiries ?? summary.submittedInquiries),
      inquiryRate: readMetric(summary.inquiryRate ?? summary.conversionRate),
    },
    series: asArray(source.series).map((item, index) => ({
      id: asString(item?.id, `${item?.date || item?.label || 'period'}-${index}`),
      date: item?.date || item?.bucket || item?.label || '',
      label: asString(item?.label, '') || formatDate(item?.date || item?.bucket, timezone),
      tooltipLabel: asString(item?.tooltipLabel, '') || asString(item?.label, '') || formatDate(item?.date || item?.bucket, timezone),
      sessions: asNumber(item?.sessions),
      pageViews: asNumber(item?.pageViews ?? item?.views),
      inquiries: asNumber(item?.inquiries ?? item?.submittedInquiries),
    })),
    breakdowns: {
      sources: normaliseBreakdown(breakdowns.sources, ['name', 'source', 'label']),
      campaigns: normaliseBreakdown(breakdowns.campaigns, ['campaign', 'name', 'label']),
      pages: normaliseBreakdown(breakdowns.pages, ['label', 'path', 'name']),
      devices: normaliseBreakdown(breakdowns.devices, ['name', 'device', 'label']),
    },
    funnel: asArray(source.funnel ?? breakdowns.funnel).map((item, index) => ({
      id: asString(item?.key || item?.id, `funnel-${index}`),
      label: asString(item?.label || item?.name, `Stap ${index + 1}`),
      sessions: asNumber(item?.sessions ?? item?.count),
      share: asOptionalNumber(item?.share ?? item?.rate),
      definition: asString(item?.definition, ''),
    })),
    scrollDepth: asArray(source.scrollDepth ?? breakdowns.scrollDepth).map((item, index) => ({
      id: asString(item?.id, `scroll-${index}`),
      threshold: asNumber(item?.threshold ?? item?.depth),
      sessions: asNumber(item?.sessions ?? item?.count),
      share: asOptionalNumber(item?.share ?? item?.rate),
    })),
    legacy: normaliseLegacy(source.legacy, timezone),
    live: {
      windowHours: Math.max(1, Math.round(asNumber(live.windowHours) || 24)),
      activityCount,
      shownCount,
      hasMore: live.hasMore === true && activityCount > shownCount,
      activity: liveActivity.map((item, index) => ({
        id: asString(item?.id, `activity-${index}`),
        occurredAt: item?.occurredAt || item?.createdAt || item?.timestamp || null,
        type: asString(item?.type, 'event'),
        label: asString(item?.label, 'Sessieactiviteit'),
        detail: asString(item?.detail, ''),
        sessionId: asString(item?.sessionId, ''),
      })),
    },
  };
};

const normaliseSession = (payload, sessionId) => {
  const source = payload?.data && typeof payload.data === 'object' ? payload.data : (payload || {});
  const session = source.session;
  if (!session || typeof session !== 'object') return null;

  return {
    id: asString(session.id, sessionId),
    startedAt: session.startedAt || session.start || null,
    device: asString(session.device, 'Niet beschikbaar'),
    source: asString(session.source, 'Niet beschikbaar'),
    timeline: asArray(session.timeline).map((item, index) => ({
      id: asString(item?.id, `session-event-${index}`),
      occurredAt: item?.occurredAt || item?.createdAt || item?.timestamp || null,
      label: asString(item?.label, 'Sessieactiviteit'),
      detail: asString(item?.detail, ''),
    })),
  };
};

const getInitialRange = () => {
  if (typeof window === 'undefined') return DEFAULT_RANGE;
  const stored = window.sessionStorage.getItem(ANALYTICS_RANGE_STORAGE_KEY);
  return RANGE_OPTIONS.some((range) => range.id === stored) ? stored : DEFAULT_RANGE;
};

class AnalyticsRequestError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'AnalyticsRequestError';
    this.status = status;
  }
}

const fetchApiJson = async (params, signal) => {
  let response;
  try {
    response = await authenticatedAdminFetch(`${ANALYTICS_ENDPOINT}?${new URLSearchParams(params).toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new AnalyticsRequestError(error?.message || 'De beheerderssessie kan niet worden gecontroleerd.', 401);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status === 401 || response.status === 403
      ? 'Uw beheerderssessie is verlopen of heeft geen toegang tot de analyses.'
      : response.status === 404 && params.sessionId
        ? 'Deze sessiedetails zijn niet langer beschikbaar.'
      : asString(body?.error, 'De analysegegevens konden niet worden opgehaald.');
    throw new AnalyticsRequestError(message, response.status);
  }
  return body;
};

const metricDelta = (metric, isRate = false) => {
  if (metric.previous === null || metric.previous === undefined) return null;
  const difference = metric.value - metric.previous;
  if (difference === 0) return { tone: 'neutral', text: 'Gelijk aan vorige periode' };
  if (isRate) {
    return {
      tone: difference > 0 ? 'positive' : 'negative',
      text: `${difference > 0 ? '+' : ''}${new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 1 }).format(difference)} p.p. t.o.v. vorige periode`,
    };
  }
  return {
    tone: difference > 0 ? 'positive' : 'negative',
    text: `${difference > 0 ? '+' : ''}${formatNumber(difference)} t.o.v. vorige periode`,
  };
};

function MetricCard({ icon: Icon, label, metric = EMPTY_METRIC, description, isRate = false, tone = 'default' }) {
  const delta = metricDelta(metric, isRate);
  return (
    <article className={`analytics-metric analytics-metric--${tone}`}>
      <div className="analytics-metric__header"><span className="analytics-metric__icon" aria-hidden="true"><Icon /></span><span>{label}</span></div>
      <strong>{isRate ? formatPercent(metric.value) : formatNumber(metric.value)}</strong>
      <p>{description}</p>
      {delta ? (
        <span className={`analytics-delta analytics-delta--${delta.tone}`}>
          {delta.tone === 'positive' ? <ArrowUpRight aria-hidden="true" /> : delta.tone === 'negative' ? <ArrowDownRight aria-hidden="true" /> : null}
          {delta.text}
        </span>
      ) : <span className="analytics-delta analytics-delta--neutral">Nog geen vergelijkingsperiode</span>}
    </article>
  );
}

function Panel({ title, description, icon: Icon, action = null, children, className = '' }) {
  return (
    <section className={`analytics-panel ${className}`.trim()}>
      <header className="analytics-panel__header">
        <div>
          <h2>{Icon ? <Icon aria-hidden="true" /> : null}{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function EmptyState({ title = 'Nog geen gegevens', children }) {
  return (
    <div className="analytics-empty-state">
      <FileQuestion aria-hidden="true" />
      <div><strong>{title}</strong><p>{children || 'Er zijn geen resultaten voor de geselecteerde periode.'}</p></div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="analytics-loading" aria-live="polite" aria-busy="true">
      <span className="analytics-visually-hidden">Analysegegevens worden geladen.</span>
      <div className="analytics-skeleton analytics-skeleton--heading" />
      <div className="analytics-skeleton-grid">{[0, 1, 2, 3].map((item) => <div className="analytics-skeleton analytics-skeleton--metric" key={item} />)}</div>
      <div className="analytics-skeleton analytics-skeleton--chart" />
    </div>
  );
}

function DataTable({ caption, columns, rows, emptyMessage = 'Geen resultaten voor deze periode.' }) {
  if (!rows.length) return <EmptyState>{emptyMessage}</EmptyState>;
  return (
    <div className="analytics-table-wrap">
      <table className="analytics-table">
        <caption>{caption}</caption>
        <thead><tr>{columns.map((column) => <th scope="col" key={column.label} className={column.align ? `is-${column.align}` : ''}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id || `${caption}-${index}`}>{columns.map((column) => <td key={column.label} className={column.align ? `is-${column.align}` : ''}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function TrendPanel({ report }) {
  const data = report.series;
  const hasData = data.some((item) => item.sessions > 0 || item.pageViews > 0 || item.inquiries > 0);
  const { unit, adjective, column, tickInterval } = granularityMeta(report.range.granularity);
  const partialHourNote = unit === 'uur' ? ' Het eerste en laatste uur kunnen gedeeltelijk zijn.' : '';
  return (
    <Panel title="Sessies over tijd" description={`Deze grafiek toont het aantal sessies per ${unit} in de gekozen periode.${partialHourNote} Open ‘Toon tabelwaarden’ voor paginaweergaven en verstuurde aanvragen per ${unit}.`} icon={BarChart3}>
      {hasData ? (
        <>
          <div className="analytics-chart" role="img" aria-label={`Grafiek met sessies per ${unit} voor ${report.range.label}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs><linearGradient id="analyticsSessionsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e40af" stopOpacity={0.24} /><stop offset="100%" stopColor="#1e40af" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 12 }} minTickGap={unit === 'uur' ? 8 : 24} interval={tickInterval} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 12 }} />
                <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }} contentStyle={{ border: '1px solid #d1d5db', borderRadius: 8, color: '#171717' }} labelFormatter={tooltipBucketLabel} formatter={(value) => [formatNumber(value), 'Sessies']} />
                <Area type="linear" dataKey="sessions" stroke="#1e40af" strokeWidth={2.5} fill="url(#analyticsSessionsFill)" activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <details className="analytics-chart-data">
            <summary>Toon tabelwaarden per {unit}</summary>
            <DataTable caption={`${adjective} analyse voor ${report.range.label}`} rows={data} columns={[
              { label: column, render: (row) => row.tooltipLabel },
              { label: 'Sessies', align: 'end', render: (row) => formatNumber(row.sessions) },
              { label: 'Paginaweergaven', align: 'end', render: (row) => formatNumber(row.pageViews) },
              { label: 'Aanvragen', align: 'end', render: (row) => formatNumber(row.inquiries) },
            ]} />
          </details>
        </>
      ) : <EmptyState title="Nog geen sessies in deze periode">Kies een ruimere periode of deel een trackinglink om nieuwe geaggregeerde sessies te zien.</EmptyState>}
    </Panel>
  );
}

function LegacyTrendPanel({ legacy }) {
  if (!legacy.included) return null;

  const data = legacy.series;
  const hasSeries = data.some((item) => item.uniqueIds > 0 || item.pageViews > 0);
  const rangeLabelText = legacy.range.label ? ` in ${legacy.range.label.toLowerCase()}` : '';
  const { unit, column, tickInterval } = granularityMeta(legacy.range.granularity);
  const partialHourNote = unit === 'uur' ? ' Het eerste en laatste uur kunnen gedeeltelijk zijn.' : '';

  return (
    <Panel
      title="Historische bezoekers over tijd"
      description={`Geaggregeerde unieke IDs en paginaweergaven per ${unit}${rangeLabelText}.${partialHourNote} Deze v1-IDs waren persistent en zijn niet vergelijkbaar met de tijdelijke v2-sessies hieronder.`}
      icon={Eye}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', marginBottom: '18px', color: '#404040', fontSize: '13px' }}>
        <span><strong style={{ color: '#0070F3', fontSize: '20px' }}>{formatNumber(legacy.summary.uniqueIds)}</strong> historische unieke IDs</span>
        <span><strong style={{ color: '#0070F3', fontSize: '20px' }}>{formatNumber(legacy.summary.pageViews)}</strong> historische paginaweergaven</span>
      </div>
      {hasSeries ? (
        <>
          <div className="analytics-chart" role="img" aria-label={`Grafiek met historische v1 unieke IDs per ${unit}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs><linearGradient id="analyticsLegacyVisitorsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0070F3" stopOpacity={0.2} /><stop offset="95%" stopColor="#0070F3" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="label" axisLine={{ stroke: '#eaeaea' }} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} minTickGap={unit === 'uur' ? 8 : 24} interval={tickInterval} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dx={-10} />
                <Tooltip cursor={{ stroke: '#ccc', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ backgroundColor: '#fff', borderColor: '#eaeaea', borderRadius: '6px', color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} labelFormatter={tooltipBucketLabel} formatter={(value) => [formatNumber(value), 'Historische unieke IDs']} />
                <Area type="linear" dataKey="uniqueIds" stroke="#0070F3" strokeWidth={2} fillOpacity={1} fill="url(#analyticsLegacyVisitorsFill)" activeDot={{ r: 4, fill: '#0070F3', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <details className="analytics-chart-data">
            <summary>Toon historische tabelwaarden per {unit}</summary>
            <DataTable caption={`Historische v1-analyse per ${unit}`} rows={data} columns={[
              { label: column, render: (row) => row.tooltipLabel },
              { label: 'Unieke IDs', align: 'end', render: (row) => formatNumber(row.uniqueIds) },
              { label: 'Paginaweergaven', align: 'end', render: (row) => formatNumber(row.pageViews) },
            ]} />
          </details>
        </>
      ) : <EmptyState title="Historische v1-totalen zonder tijdreeks">De beveiligde analyse-API heeft voor deze periode nog geen geaggregeerde waarden per {unit} teruggegeven.</EmptyState>}
    </Panel>
  );
}

function ProgressList({ items, kind, totalSessions }) {
  if (!items.length) return <EmptyState>Er is nog onvoldoende geaggregeerde interactiedata voor deze weergave.</EmptyState>;
  const baseline = Math.max(totalSessions || 0, 1);
  return (
    <ol className="analytics-progress-list">
      {items.map((item) => {
        const fallbackShare = Math.round((item.sessions / baseline) * 1000) / 10;
        const share = item.share === null || item.share === undefined ? fallbackShare : item.share;
        const label = kind === 'scroll' ? `Bereikte minstens ${item.threshold}%` : item.label;
        return (
          <li key={item.id}>
            <div className="analytics-progress-list__topline">
              <div>
                <strong>{label}</strong>
                {kind === 'funnel' && item.definition ? <small>{item.definition}</small> : null}
                {kind === 'scroll' ? <small>Unieke sessies die deze drempel op minstens één pagina bereikten.</small> : null}
              </div>
              <span>{formatNumber(item.sessions)} <em>sessies</em></span>
            </div>
            <progress value={Math.max(0, Math.min(share, 100))} max="100" aria-label={`${label}: ${formatPercent(share)} van alle sessies in de periode`} />
            <span className="analytics-progress-list__value">{formatPercent(share)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ActivityPanel({ report, onOpenSession }) {
  const activity = report.live.activity;
  const activityCount = asNumber(report.live.activityCount);
  const shownCount = asNumber(report.live.shownCount);
  const actionLabel = activityCount === 1 ? 'actie' : 'acties';
  const liveBadgeText = `${formatNumber(activityCount)} ${actionLabel} · 24 uur`;
  return (
    <Panel title="Recente activiteit" description="De laatste acties van de afgelopen 24 uur." icon={Activity} className="analytics-panel--activity" action={<span className="analytics-live-count" aria-label={`${formatNumber(activityCount)} ${actionLabel} in de afgelopen 24 uur`}><span aria-hidden="true" />{liveBadgeText}</span>}>
      {activity.length ? (
        <>
          <ol className="analytics-activity-list">
            {activity.map((item) => (
              <li key={item.id}>
                {item.sessionId ? (
                  <button type="button" onClick={(event) => onOpenSession(item, event)} className="analytics-activity-button">
                    <span className="analytics-activity-button__icon" aria-hidden="true"><Clock3 /></span>
                    <span><strong>{item.label}</strong>{item.detail ? <small>{item.detail}</small> : null}</span>
                    <time dateTime={item.occurredAt || undefined}>{formatTimestamp(item.occurredAt, report.timezone)}</time>
                    <ChevronRight aria-hidden="true" /><span className="analytics-visually-hidden">Open geanonimiseerde sessiedetails</span>
                  </button>
                ) : (
                  <div className="analytics-activity-row">
                    <span className="analytics-activity-button__icon" aria-hidden="true"><Clock3 /></span>
                    <span><strong>{item.label}</strong>{item.detail ? <small>{item.detail}</small> : null}</span>
                    <time dateTime={item.occurredAt || undefined}>{formatTimestamp(item.occurredAt, report.timezone)}</time>
                  </div>
                )}
              </li>
            ))}
          </ol>
          {report.live.hasMore ? <p className="analytics-activity-truncation">{formatNumber(shownCount)} nieuwste van {formatNumber(activityCount)} {actionLabel}.</p> : null}
        </>
      ) : <EmptyState title="Nog geen activiteit in de afgelopen 24 uur">Er zijn in deze periode nog geen acties.</EmptyState>}
    </Panel>
  );
}

function UtmLinkBuilder() {
  const [destination, setDestination] = useState('/');
  const [campaign, setCampaign] = useState('organisch');
  const [copyStatus, setCopyStatus] = useState('');
  const timeoutRef = useRef(null);
  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const buildUrl = useCallback((channel) => {
    const origin = typeof window === 'undefined' ? 'https://www.atelierrembrandt.com' : window.location.origin;
    const [pathname, fragment = ''] = destination.split('#');
    const url = new URL(pathname || '/', origin);
    url.searchParams.set('utm_source', channel.source);
    url.searchParams.set('utm_medium', channel.medium);
    url.searchParams.set('utm_campaign', campaign.trim() || 'organisch');
    if (fragment) url.hash = fragment;
    return url.toString();
  }, [campaign, destination]);

  const handleCopy = async (channel) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(buildUrl(channel));
      setCopyStatus(`Trackinglink voor ${channel.label} gekopieerd.`);
    } catch {
      setCopyStatus(`De link voor ${channel.label} kon niet worden gekopieerd. Selecteer de link handmatig.`);
    }
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopyStatus(''), 5000);
  };

  return (
    <Panel title="Trackinglinks maken" description="Gebruik één consistente campagnenaam per post of nieuwsbrief. De contactlink zet UTM-parameters vóór het anker, zodat de bron behouden blijft." icon={Link2}>
      <div className="analytics-utm-fields">
        <div><label htmlFor="analytics-utm-destination">Bestemming</label><select id="analytics-utm-destination" value={destination} onChange={(event) => setDestination(event.target.value)}>{UTM_DESTINATIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <div><label htmlFor="analytics-utm-campaign">Campagnenaam</label><input id="analytics-utm-campaign" value={campaign} onChange={(event) => setCampaign(event.target.value)} placeholder="bijv. herfst-aanwinst" /></div>
      </div>
      <div className="analytics-utm-list">
        {UTM_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const url = buildUrl(channel);
          return (
            <article className="analytics-utm-row" key={channel.id}>
              <span className="analytics-utm-row__icon" aria-hidden="true"><Icon /></span>
              <div><strong>{channel.label}</strong><code title={url}>{url}</code></div>
              <button type="button" onClick={() => handleCopy(channel)} aria-label={`Kopieer trackinglink voor ${channel.label}`}><Clipboard aria-hidden="true" />Kopieer</button>
            </article>
          );
        })}
      </div>
      <p className="analytics-visually-hidden" aria-live="polite" aria-atomic="true">{copyStatus}</p>
    </Panel>
  );
}

function SessionDialog({ activity, detail, loadState, error, timeZone, onClose, dialogRef, closeButtonRef }) {
  if (!activity) return null;
  return (
    <div className="analytics-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="analytics-dialog" role="dialog" aria-modal="true" aria-labelledby="analytics-session-title" tabIndex="-1" ref={dialogRef}>
        <header>
          <div><p className="analytics-eyebrow">Geanonimiseerde sessie</p><h2 id="analytics-session-title">Sessieactiviteit</h2><p>Deze details bevatten geen naam, e-mail, IP-adres of blijvende bezoeker-ID.</p></div>
          <button type="button" className="analytics-icon-button" onClick={onClose} aria-label="Sessiegegevens sluiten" ref={closeButtonRef}><X aria-hidden="true" /></button>
        </header>
        <div className="analytics-dialog__body">
          {loadState === 'loading' ? <div className="analytics-dialog__loading" aria-live="polite"><LoaderCircle aria-hidden="true" /> Sessiegegevens worden geladen…</div> : null}
          {loadState === 'error' ? <div className="analytics-alert analytics-alert--warning" role="status"><AlertCircle aria-hidden="true" /><p>{error}</p></div> : null}
          {loadState === 'ready' && detail ? (
            <>
              <dl className="analytics-session-meta"><div><dt>Begon</dt><dd>{formatTimestamp(detail.startedAt || activity.occurredAt, timeZone)}</dd></div><div><dt>Apparaat</dt><dd>{detail.device}</dd></div><div><dt>Bron</dt><dd>{detail.source}</dd></div></dl>
              {detail.timeline.length ? <ol className="analytics-session-timeline">{detail.timeline.map((item) => <li key={item.id}><time dateTime={item.occurredAt || undefined}>{formatTimestamp(item.occurredAt, timeZone)}</time><div><strong>{item.label}</strong>{item.detail ? <p>{item.detail}</p> : null}</div></li>)}</ol> : <EmptyState title="Geen verdere sessiegegevens">De beveiligde API heeft voor deze sessie geen extra, geredigeerde tijdlijn teruggegeven.</EmptyState>}
            </>
          ) : null}
          {loadState === 'ready' && !detail ? <EmptyState title="Geen sessiedetails beschikbaar">De beveiligde analyse-API heeft geen details voor deze sessie teruggegeven.</EmptyState> : null}
        </div>
      </section>
    </div>
  );
}

export default function AnalyticsManager({ isPro = false, activeTab = 'overview' }) {
  const initialRange = useMemo(getInitialRange, []);
  const cachedInitial = reportCache.get(initialRange)?.report || null;
  const [timeRange, setTimeRange] = useState(initialRange);
  const [report, setReport] = useState(cachedInitial);
  const [loadState, setLoadState] = useState(cachedInitial ? 'ready' : 'loading');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [sessionLoadState, setSessionLoadState] = useState('idle');
  const [sessionError, setSessionError] = useState('');
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  const requestReport = useCallback(async (range, signal) => normaliseReport(await fetchApiJson({ range }, signal), range), []);

  useEffect(() => {
    const controller = new AbortController();
    const cached = reportCache.get(timeRange)?.report || null;
    if (cached) {
      setReport(cached);
      setLoadState('refreshing');
    } else {
      setReport(null);
      setLoadState('loading');
    }
    setError('');
    requestReport(timeRange, controller.signal)
      .then((nextReport) => {
        reportCache.set(timeRange, { report: nextReport, receivedAt: Date.now() });
        setReport(nextReport);
        setLoadState('ready');
      })
      .catch((requestError) => {
        if (requestError?.name === 'AbortError') return;
        setLoadState('error');
        setError(requestError instanceof AnalyticsRequestError ? requestError.message : 'De analysegegevens konden niet worden opgehaald. Probeer opnieuw.');
      });
    return () => controller.abort();
  }, [refreshKey, requestReport, timeRange]);

  useEffect(() => {
    if (activeTab !== 'overview') return undefined;
    const interval = window.setInterval(() => setRefreshKey((key) => key + 1), 60000);
    return () => window.clearInterval(interval);
  }, [activeTab]);

  const closeSession = useCallback(() => {
    setSelectedActivity(null);
    setSessionDetail(null);
    setSessionLoadState('idle');
    setSessionError('');
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!selectedActivity) return undefined;
    const priorFocus = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSession();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = priorOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (priorFocus instanceof HTMLElement && document.contains(priorFocus)) priorFocus.focus();
    };
  }, [closeSession, selectedActivity]);

  useEffect(() => {
    if (!selectedActivity?.sessionId) return undefined;
    const controller = new AbortController();
    setSessionDetail(null);
    setSessionError('');
    setSessionLoadState('loading');
    fetchApiJson({ range: timeRange, sessionId: selectedActivity.sessionId }, controller.signal)
      .then((payload) => {
        setSessionDetail(normaliseSession(payload, selectedActivity.sessionId));
        setSessionLoadState('ready');
      })
      .catch((requestError) => {
        if (requestError?.name === 'AbortError') return;
        setSessionError(requestError instanceof AnalyticsRequestError ? requestError.message : 'De sessiedetails konden niet worden opgehaald.');
        setSessionLoadState('error');
      });
    return () => controller.abort();
  }, [selectedActivity, timeRange]);

  const handleRangeChange = (range) => {
    if (range.isProFeature && !isPro) {
      setUpgradeModalOpen(true);
      return;
    }
    if (typeof window !== 'undefined') window.sessionStorage.setItem(ANALYTICS_RANGE_STORAGE_KEY, range.id);
    setTimeRange(range.id);
  };

  const handleOpenSession = (activity, event) => {
    triggerRef.current = event.currentTarget;
    setSessionDetail(null);
    setSessionError('');
    setSessionLoadState('loading');
    setSelectedActivity(activity);
  };

  const currentTitle = activeTab === 'acquisition' ? 'Verkeer en campagnes' : activeTab === 'behavior' ? 'Interesse en aanvragen' : 'Overzicht';
  const hasSessions = Boolean(report && (report.summary.sessions.value > 0 || report.summary.pageViews.value > 0 || report.summary.inquiries.value > 0 || report.series.some((item) => item.sessions > 0 || item.pageViews > 0 || item.inquiries > 0)));

  return (
    <div className="analytics-dashboard">
      <header className="analytics-dashboard__header">
        <div><p className="analytics-eyebrow">Websiteanalyse</p><h1>{currentTitle}</h1><p>Privacyvriendelijke, geaggregeerde inzichten per tijdelijke sessie — geen personenprofielen.</p></div>
        <div className="analytics-dashboard__header-actions">
          <span className="analytics-updated" aria-live="polite"><Clock3 aria-hidden="true" />{report?.generatedAt ? `Bijgewerkt ${formatTimestamp(report.generatedAt, report.timezone)}` : 'Nog niet bijgewerkt'}</span>
          <button type="button" className="analytics-refresh-button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loadState === 'loading' || loadState === 'refreshing'}><RefreshCw aria-hidden="true" className={loadState === 'refreshing' ? 'is-spinning' : ''} />Vernieuwen</button>
        </div>
      </header>

      <fieldset className="analytics-period-control">
        <legend>Analyseperiode</legend>
        <div role="group" aria-label="Analyseperiode kiezen">
          {RANGE_OPTIONS.map((range) => {
            const locked = range.isProFeature && !isPro;
            return <button type="button" key={range.id} className={timeRange === range.id ? 'is-active' : ''} aria-pressed={timeRange === range.id} aria-label={locked ? `${range.label}, beschikbaar met Pro` : range.label} onClick={() => handleRangeChange(range)}>{range.label}{locked ? <span className="analytics-period-control__lock">Pro</span> : null}</button>;
          })}
        </div>
        {report?.range?.start && report?.range?.end ? <p>{report.range.label} · {formatDate(report.range.start, report.timezone)} – {formatDate(report.range.end, report.timezone)}</p> : null}
      </fieldset>

      {loadState === 'loading' && !report ? <LoadingState /> : null}
      {error ? <div className="analytics-alert analytics-alert--error" role="alert"><AlertCircle aria-hidden="true" /><div><strong>Analyse niet beschikbaar</strong><p>{error}</p></div><button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Opnieuw proberen</button></div> : null}

      {report ? (
        <>
          {report.meta.trackingState === 'legacy' ? <div className="analytics-alert analytics-alert--warning" role="status"><Info aria-hidden="true" /><div><strong>Nieuwe, privacyvriendelijke meting actief</strong><p>{report.meta.message || `Vergelijkbare veilige sessiegegevens zijn beschikbaar vanaf ${formatDate(report.meta.trackingStartedAt, report.timezone)}.`}</p></div></div> : null}
          {report.meta.partial ? <div className="analytics-alert analytics-alert--warning" role="status"><Info aria-hidden="true" /><div><strong>Gedeeltelijke gegevens</strong><p>Een deel van de analyses is tijdelijk niet beschikbaar. Gebruik deze cijfers niet als volledige vergelijking.</p></div></div> : null}
          {!hasSessions && report.meta.trackingState !== 'legacy' ? <div className="analytics-no-data-banner"><CheckCircle2 aria-hidden="true" /><div><strong>Nog geen sessies in {report.range.label.toLowerCase()}</strong><p>Dit is geen foutmelding: er zijn eenvoudig nog geen veilige, geaggregeerde metingen in deze periode.</p></div></div> : null}

          {activeTab === 'overview' ? (
            <div className="analytics-content">
              <LegacyTrendPanel legacy={report.legacy} />
              <section className="analytics-metric-grid" aria-label="Kerncijfers">
                <MetricCard icon={Mail} label="Verstuurde aanvragen" metric={report.summary.inquiries} description="Succesvol ingediende contactaanvragen." tone="outcome" />
                <MetricCard icon={CheckCircle2} label="Aanvraagratio" metric={report.summary.inquiryRate} isRate description="Sessies met minstens één verstuurde aanvraag." tone="outcome" />
                <MetricCard icon={MonitorSmartphone} label="Sessies" metric={report.summary.sessions} description="Tijdelijke sessies; geen unieke personen." />
                <MetricCard icon={ExternalLink} label="Paginaweergaven" metric={report.summary.pageViews} description="Alle geregistreerde paginaweergaven." />
              </section>
              <div className="analytics-overview-grid"><TrendPanel report={report} /><ActivityPanel report={report} onOpenSession={handleOpenSession} /></div>
              <Panel title="Pagina’s met de meeste interesse" description="Gebruik dit om objectpagina’s en landingspagina’s te verbeteren." icon={BarChart3}>
                <DataTable caption="Pagina-interesse" rows={report.breakdowns.pages} emptyMessage="Er zijn nog geen paginaresultaten voor deze periode." columns={[
                  { label: 'Pagina', render: (row) => <span className="analytics-table__primary">{row.label || row.path}</span> },
                  { label: 'Sessies', align: 'end', render: (row) => formatNumber(row.sessions) },
                  { label: 'Weergaven', align: 'end', render: (row) => formatNumber(row.pageViews) },
                  { label: 'Aanvragen', align: 'end', render: (row) => formatNumber(row.inquiries) },
                ]} />
              </Panel>
            </div>
          ) : null}

          {activeTab === 'acquisition' ? (
            <div className="analytics-content">
              <div className="analytics-two-column-grid">
                <Panel title="Campagnes" description="Vergelijk sessies én concrete aanvragen per UTM-campagne." icon={Link2}>
                  <DataTable caption="Campagneprestaties" rows={report.breakdowns.campaigns} emptyMessage="Er zijn nog geen UTM-campagnes in deze periode. Maak hieronder een trackinglink voor de volgende publicatie." columns={[
                    { label: 'Campagne', render: (row) => <span className="analytics-table__primary">{row.name}<small>{[row.source, row.medium].filter(Boolean).join(' · ')}</small></span> },
                    { label: 'Sessies', align: 'end', render: (row) => formatNumber(row.sessions) },
                    { label: 'Aanvragen', align: 'end', render: (row) => formatNumber(row.inquiries) },
                    { label: 'Ratio', align: 'end', render: (row) => row.inquiryRate === null ? '—' : formatPercent(row.inquiryRate) },
                  ]} />
                </Panel>
                <Panel title="Verkeersbronnen" description="Bronnen zijn geanonimiseerd en gegroepeerd; onbekende bronnen blijven apart zichtbaar." icon={Share2}>
                  <DataTable caption="Bronprestaties" rows={report.breakdowns.sources} emptyMessage="Er zijn nog geen brongegevens in deze periode." columns={[
                    { label: 'Bron', render: (row) => <span className="analytics-table__primary">{row.name}</span> },
                    { label: 'Sessies', align: 'end', render: (row) => formatNumber(row.sessions) },
                    { label: 'Aanvragen', align: 'end', render: (row) => formatNumber(row.inquiries) },
                    { label: 'Ratio', align: 'end', render: (row) => row.inquiryRate === null ? '—' : formatPercent(row.inquiryRate) },
                  ]} />
                </Panel>
              </div>
              <Panel title="Apparaten" description="Gebruik dit om prioriteiten voor mobiele en desktopervaringen te bepalen." icon={MonitorSmartphone}>
                {report.breakdowns.devices.length ? <ul className="analytics-segment-list">{report.breakdowns.devices.map((device) => {
                  const share = device.share === null ? ((device.sessions / Math.max(report.summary.sessions.value, 1)) * 100) : device.share;
                  return <li key={device.id}><span>{device.name}</span><strong>{formatNumber(device.sessions)} <em>sessies</em></strong><progress value={Math.max(0, Math.min(share, 100))} max="100" aria-label={`${device.name}: ${formatPercent(share)} van de sessies`} /><small>{formatPercent(share)}</small></li>;
                })}</ul> : <EmptyState>Apparaatgegevens verschijnen zodra de beveiligde analyse-API voldoende sessies kan aggregeren.</EmptyState>}
              </Panel>
              <UtmLinkBuilder />
            </div>
          ) : null}

          {activeTab === 'behavior' ? (
            <div className="analytics-content">
              <div className="analytics-two-column-grid"><Panel title="Journeysignalen" description="Signalen kunnen naast elkaar bestaan: een directe object- of contactlanding hoeft geen voorafgaande stap te hebben." icon={MousePointer2}><ProgressList items={report.funnel} kind="funnel" totalSessions={report.summary.sessions.value} /></Panel><Panel title="Leesdiepte" description="Aandeel sessies dat minstens deze diepte op één pagina bereikte." icon={BarChart3}><ProgressList items={report.scrollDepth} kind="scroll" totalSessions={report.summary.sessions.value} /></Panel></div>
              <Panel title="Pagina’s die interesse wekken" description="Vergelijk paginaweergaven, sessies en ingediende aanvragen zonder bars met gemengde noemers." icon={BarChart3}>
                <DataTable caption="Pagina-interesse en aanvragen" rows={report.breakdowns.pages} emptyMessage="Er zijn nog geen pagina- of aanvraaggegevens voor deze periode." columns={[
                  { label: 'Pagina', render: (row) => <span className="analytics-table__primary">{row.label || row.path}</span> },
                  { label: 'Sessies', align: 'end', render: (row) => formatNumber(row.sessions) },
                  { label: 'Weergaven', align: 'end', render: (row) => formatNumber(row.pageViews) },
                  { label: 'Aanvragen', align: 'end', render: (row) => formatNumber(row.inquiries) },
                  { label: 'Ratio', align: 'end', render: (row) => row.inquiryRate === null ? '—' : formatPercent(row.inquiryRate) },
                ]} />
              </Panel>
            </div>
          ) : null}
        </>
      ) : null}

      <SessionDialog activity={selectedActivity} detail={sessionDetail} loadState={sessionLoadState} error={sessionError} timeZone={report?.timezone || 'Europe/Brussels'} onClose={closeSession} dialogRef={dialogRef} closeButtonRef={closeButtonRef} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} product="pro" />
    </div>
  );
}
