import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';

const TIMEZONE = 'Europe/Brussels';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_COLUMNS = [
  'id',
  'event_name',
  'occurred_at',
  'received_at',
  'visit_id',
  'page_path',
  'referrer_origin',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'item_id',
  'properties',
  'device_type',
  'browser_family',
].join(',');
const LEGACY_VIEW_COLUMNS = [
  'id',
  'page_url',
  'session_id',
  'created_at',
].join(',');

const EVENT_LABELS = {
  page_view: 'Pagina bekeken',
  utm_visit: 'Campagnebezoek geregistreerd',
  catalog_search: 'Collectie doorzocht',
  catalog_filter_applied: 'Collectiefilter toegepast',
  item_viewed: 'Object bekeken',
  item_card_clicked: 'Objectkaart geopend',
  cta_clicked: 'Contactactie gekozen',
  inquiry_opened: 'Aanvraag geopend',
  form_started: 'Aanvraagformulier gestart',
  form_validation_error: 'Formulierveld gecontroleerd',
  inquiry_submitted: 'Aanvraag verzonden',
  email_clicked: 'E-mailactie gekozen',
  phone_clicked: 'Telefoonactie gekozen',
  whatsapp_clicked: 'WhatsApp-actie gekozen',
  scroll_depth: 'Leesdiepte bereikt',
  rage_click: 'Herhaald klikken vastgesteld',
};

const DEVICE_LABELS = {
  desktop: 'Desktop',
  mobile: 'Mobiel',
  tablet: 'Tablet',
  unknown: 'Onbekend',
};

const RANGE_LABELS = {
  '24h': 'Afgelopen 24 uur',
  '7d': 'Afgelopen 7 dagen',
  '30d': 'Afgelopen 30 dagen',
  '3m': 'Afgelopen 3 maanden',
  '12m': 'Afgelopen 12 maanden',
  ytd: 'Dit jaar',
  all: 'Sinds de start van de meting',
};

const MAX_PAGE_SIZE = 1_000;

const reportEventLimit = () => {
  const parsed = Number.parseInt(process.env.ANALYTICS_REPORT_MAX_EVENTS || '25000', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1_000), 100_000) : 25_000;
};

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const getDateParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { year: values.year, month: values.month, day: values.day };
};

const localDateKey = (value) => {
  const { year, month, day } = getDateParts(new Date(value));
  return `${year}-${month}-${day}`;
};

const localDateLabel = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
};

const localYear = (date) => Number(new Intl.DateTimeFormat('en', {
  timeZone: TIMEZONE,
  year: 'numeric',
}).format(date));

const subtractMonths = (date, months) => {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const finalDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(originalDay, finalDay));
  return result;
};

const toIso = (date) => date.toISOString();

const buildRange = (key, now, earliest) => {
  const end = new Date(now);
  let start;

  switch (key) {
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3m':
      start = subtractMonths(end, 3);
      break;
    case '12m':
      start = subtractMonths(end, 12);
      break;
    case 'ytd':
      start = new Date(Date.UTC(localYear(end), 0, 1));
      break;
    case 'all':
      start = earliest ? new Date(earliest) : new Date(end);
      return {
        key,
        label: RANGE_LABELS[key],
        start: toIso(start),
        end: toIso(end),
        previousStart: null,
        previousEnd: null,
      };
    default:
      return null;
  }

  const duration = end.getTime() - start.getTime();
  return {
    key,
    label: RANGE_LABELS[key],
    start: toIso(start),
    end: toIso(end),
    previousStart: toIso(new Date(start.getTime() - duration)),
    previousEnd: toIso(start),
  };
};

const fetchEvents = async (supabase, start, end) => {
  const rows = [];
  const maximum = reportEventLimit();
  const ceiling = maximum + 1;
  let offset = 0;

  while (rows.length < ceiling) {
    const size = Math.min(MAX_PAGE_SIZE, ceiling - rows.length);
    const { data, error } = await supabase
      .from('analytics_events_v2')
      .select(EVENT_COLUMNS)
      .gte('received_at', start)
      .lt('received_at', end)
      .order('received_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + size - 1);

    if (error) throw new Error(`Analytics report query failed: ${error.message}`);
    const page = data || [];
    rows.push(...page);

    if (page.length < size) break;
    offset += page.length;
  }

  const partial = rows.length > maximum;
  if (partial) rows.length = maximum;
  return { rows, partial };
};

const isMissingLegacyTableError = (error) => (
  ['42P01', 'PGRST205'].includes(error?.code)
  || /(?:page_views|relation|schema cache).*(?:does not exist|could not find)/i.test(error?.message || '')
);

// Legacy telemetry remains locked to browser roles. This adapter is deliberately
// server-only and returns only aggregate-safe inputs: timestamp, opaque legacy
// session key (never returned), and a path that is sanitised before reporting.
const fetchLegacyPageViews = async (supabase, start, end) => {
  const rows = [];
  const maximum = reportEventLimit();
  const ceiling = maximum + 1;
  let offset = 0;

  while (rows.length < ceiling) {
    const size = Math.min(MAX_PAGE_SIZE, ceiling - rows.length);
    const { data, error } = await supabase
      .from('page_views')
      .select(LEGACY_VIEW_COLUMNS)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + size - 1);

    if (error) {
      if (isMissingLegacyTableError(error)) return { rows: [], partial: false, unavailable: true };
      throw new Error(`Historical analytics report query failed: ${error.message}`);
    }

    const page = data || [];
    rows.push(...page);
    if (page.length < size) break;
    offset += page.length;
  }

  const partial = rows.length > maximum;
  if (partial) rows.length = maximum;
  return { rows, partial, unavailable: false };
};

const fetchFirstLegacyPageView = async (supabase) => {
  const { data, error } = await supabase
    .from('page_views')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingLegacyTableError(error)) return null;
    throw new Error(`Historical analytics initialization query failed: ${error.message}`);
  }
  return data || null;
};

const propertyObject = (event) => (isPlainObject(event.properties) ? event.properties : {});

const isCollectionRoute = (path) => /^\/(?:(?:en|fr)\/)?collectie(?:\/|$)/.test(path || '');

const isItemRoute = (path) => {
  if (!isCollectionRoute(path)) return false;
  const parts = path.split('/').filter(Boolean);
  const index = parts.indexOf('collectie');
  return index >= 0 && parts.length > index + 1;
};

const referrerHostname = (origin) => {
  if (!origin) return null;
  try {
    return new URL(origin).hostname.replace(/^www\./i, '').toLowerCase() || null;
  } catch {
    return null;
  }
};

const sourceForSession = (events) => {
  const attributed = events.find((event) => event.utm_source || event.referrer_origin) || events[0];
  if (!attributed) return { name: 'Direct', source: 'direct', medium: null, campaign: null };

  if (attributed.utm_source) {
    return {
      name: attributed.utm_source,
      source: attributed.utm_source,
      medium: attributed.utm_medium || null,
      campaign: attributed.utm_campaign || null,
    };
  }

  const host = referrerHostname(attributed.referrer_origin);
  return host
    ? { name: host, source: host, medium: 'referral', campaign: null }
    : { name: 'Direct', source: 'direct', medium: null, campaign: null };
};

const incrementBreakdown = (map, key, initial) => {
  if (!map.has(key)) map.set(key, initial());
  return map.get(key);
};

const safePathLabel = (path) => {
  if (isItemRoute(path)) return 'Objectpagina';
  if (path === '/') return 'Home';
  if (isCollectionRoute(path)) return 'Collectie';
  if (path === '/contact') return 'Contact';
  return path || 'Onbekend';
};

const safeLegacyPath = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '/';

  try {
    const parsed = new URL(value.trim(), 'https://legacy-analytics.invalid');
    const path = parsed.pathname || '/';
    return path.startsWith('/') ? path.slice(0, 500) || '/' : '/';
  } catch {
    const path = value.trim().split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/');
    return path.startsWith('/') ? path.slice(0, 500) || '/' : '/';
  }
};

const funnelStagesForSession = (events) => {
  const ordered = [...events].sort((left, right) => (
    new Date(left.occurred_at).getTime() - new Date(right.occurred_at).getTime() || left.id - right.id
  ));
  const after = (timestamp, predicate) => ordered.find((event) => (
    new Date(event.occurred_at).getTime() >= timestamp && predicate(event)
  ));

  const site = ordered.find((event) => event.event_name === 'page_view');
  if (!site) return new Set();

  const collection = after(new Date(site.occurred_at).getTime(), (event) => (
    isCollectionRoute(event.page_path)
    || propertyObject(event).pageType === 'catalog'
    || ['catalog_search', 'catalog_filter_applied'].includes(event.event_name)
  ));
  // A direct /collectie/:slug landing is an object-intent session even when it
  // never produced a separate catalogue-list event. Contact-only journeys are
  // likewise meaningful; do not make valid leads disappear behind a catalogue
  // prerequisite they did not need to pass.
  const item = after(new Date(site.occurred_at).getTime(), (event) => (
    event.event_name === 'item_viewed' || isItemRoute(event.page_path)
  ));
  const inquiry = after(new Date(site.occurred_at).getTime(), (event) => event.event_name === 'inquiry_opened');
  const form = after(new Date(site.occurred_at).getTime(), (event) => event.event_name === 'form_started');
  const submitted = after(new Date(site.occurred_at).getTime(), (event) => event.event_name === 'inquiry_submitted');

  const stages = new Set(['site_visit']);
  if (collection) stages.add('collection_view');
  if (item) stages.add('item_view');
  if (inquiry) stages.add('inquiry_open');
  if (form) stages.add('form_started');
  if (submitted) stages.add('inquiry_submitted');
  return stages;
};

const overviewFor = (events) => {
  const sessionMap = new Map();
  const seriesMap = new Map();
  const pageMap = new Map();

  for (const event of events) {
    if (!sessionMap.has(event.visit_id)) sessionMap.set(event.visit_id, []);
    sessionMap.get(event.visit_id).push(event);

    const date = localDateKey(event.received_at);
    const series = incrementBreakdown(seriesMap, date, () => ({
      date,
      label: localDateLabel(date),
      sessions: new Set(),
      pageViews: 0,
      inquiries: new Set(),
    }));
    series.sessions.add(event.visit_id);
    if (event.event_name === 'page_view') series.pageViews += 1;
    if (event.event_name === 'inquiry_submitted') series.inquiries.add(event.visit_id);
  }

  const sourceMap = new Map();
  const campaignMap = new Map();
  const deviceMap = new Map();
  const funnelCounts = new Map([
    ['site_visit', 0],
    ['collection_view', 0],
    ['item_view', 0],
    ['inquiry_open', 0],
    ['form_started', 0],
    ['inquiry_submitted', 0],
  ]);
  const scrollBySession = new Map();
  let pageViews = 0;
  let inquirySessions = 0;

  for (const [visitId, unsortedEvents] of sessionMap) {
    const sessionEvents = [...unsortedEvents].sort((left, right) => (
      new Date(left.occurred_at).getTime() - new Date(right.occurred_at).getTime() || left.id - right.id
    ));
    const converted = sessionEvents.some((event) => event.event_name === 'inquiry_submitted');
    if (converted) inquirySessions += 1;

    const source = sourceForSession(sessionEvents);
    const sourceRow = incrementBreakdown(sourceMap, source.name, () => ({
      name: source.name,
      sessions: 0,
      inquiries: 0,
    }));
    sourceRow.sessions += 1;
    if (converted) sourceRow.inquiries += 1;

    const campaignKey = [source.source, source.medium || '', source.campaign || ''].join('|');
    const campaignRow = incrementBreakdown(campaignMap, campaignKey, () => ({
      source: source.source,
      medium: source.medium,
      campaign: source.campaign,
      sessions: 0,
      inquiries: 0,
    }));
    campaignRow.sessions += 1;
    if (converted) campaignRow.inquiries += 1;

    const firstEvent = sessionEvents[0];
    const deviceName = DEVICE_LABELS[firstEvent?.device_type] || DEVICE_LABELS.unknown;
    const deviceRow = incrementBreakdown(deviceMap, deviceName, () => ({ name: deviceName, sessions: 0 }));
    deviceRow.sessions += 1;

    const stages = funnelStagesForSession(sessionEvents);
    for (const stage of stages) funnelCounts.set(stage, funnelCounts.get(stage) + 1);

    const pageEvents = sessionEvents.filter((event) => event.event_name === 'page_view');
    for (const event of pageEvents) {
      pageViews += 1;
      const pageRow = incrementBreakdown(pageMap, event.page_path, () => ({
        path: event.page_path,
        label: safePathLabel(event.page_path),
        sessions: new Set(),
        pageViews: 0,
        inquiries: new Set(),
      }));
      pageRow.sessions.add(visitId);
      pageRow.pageViews += 1;
    }

    if (converted) {
      const submittedEvent = [...sessionEvents].reverse().find((event) => event.event_name === 'inquiry_submitted');
      const lastPagePath = pageEvents[pageEvents.length - 1]?.page_path
        || submittedEvent?.page_path;
      if (lastPagePath) {
        const pageRow = incrementBreakdown(pageMap, lastPagePath, () => ({
          path: lastPagePath,
          label: safePathLabel(lastPagePath),
          sessions: new Set(),
          pageViews: 0,
          inquiries: new Set(),
        }));
        pageRow.inquiries.add(visitId);
      }
    }

    let maxScrollDepth = 0;
    for (const event of sessionEvents) {
      if (event.event_name === 'scroll_depth') {
        const depth = propertyObject(event).depth;
        if ([25, 50, 75, 100].includes(depth)) maxScrollDepth = Math.max(maxScrollDepth, depth);
      }
    }
    scrollBySession.set(visitId, maxScrollDepth);
  }

  const sessions = sessionMap.size;
  const toMetric = (row) => ({
    ...row,
    inquiryRate: row.sessions ? Number(((row.inquiries / row.sessions) * 100).toFixed(1)) : 0,
  });
  const sortedSources = [...sourceMap.values()]
    .map(toMetric)
    .sort((left, right) => right.sessions - left.sessions || right.inquiries - left.inquiries)
    .slice(0, 12);
  const sortedCampaigns = [...campaignMap.values()]
    .map(toMetric)
    .sort((left, right) => right.sessions - left.sessions || right.inquiries - left.inquiries)
    .slice(0, 12);
  const sortedPages = [...pageMap.values()]
    .map((row) => ({
      path: row.path,
      label: row.label,
      sessions: row.sessions.size,
      pageViews: row.pageViews,
      inquiries: row.inquiries.size,
    }))
    .sort((left, right) => right.pageViews - left.pageViews || right.sessions - left.sessions)
    .slice(0, 12);
  const devices = [...deviceMap.values()]
    .map((row) => ({
      ...row,
      share: sessions ? Number(((row.sessions / sessions) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.sessions - left.sessions);

  const funnelDefinitions = {
    site_visit: 'Sessie met minstens één geregistreerde paginaweergave.',
    collection_view: 'Sessie waarin de collectie of een directe collectie-/objectroute is bereikt.',
    item_view: 'Sessie waarin een objectdetail is bekeken, ook bij een directe landing.',
    inquiry_open: 'Sessie waarin het aanvraagvenster is geopend, ook vanaf een algemene contactroute.',
    form_started: 'Sessie waarin het aanvraagformulier is gestart.',
    inquiry_submitted: 'Sessie waarin een gevalideerde aanvraag is verzonden.',
  };
  const funnelLabels = {
    site_visit: 'Website bezocht',
    collection_view: 'Collectie bekeken',
    item_view: 'Object bekeken',
    inquiry_open: 'Aanvraag geopend',
    form_started: 'Formulier gestart',
    inquiry_submitted: 'Aanvraag verzonden',
  };
  const funnel = [...funnelCounts.entries()].map(([key, count]) => ({
    key,
    label: funnelLabels[key],
    sessions: count,
    share: funnelCounts.get('site_visit')
      ? Number(((count / funnelCounts.get('site_visit')) * 100).toFixed(1))
      : 0,
    definition: funnelDefinitions[key],
  }));

  const scrollDepth = [25, 50, 75, 100].map((threshold) => {
    const reached = [...scrollBySession.values()].filter((depth) => depth >= threshold).length;
    return {
      threshold,
      sessions: reached,
      share: sessions ? Number(((reached / sessions) * 100).toFixed(1)) : 0,
    };
  });

  const series = [...seriesMap.values()]
    .map((row) => ({
      date: row.date,
      label: row.label,
      sessions: row.sessions.size,
      pageViews: row.pageViews,
      inquiries: row.inquiries.size,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));

  return {
    summary: {
      sessions,
      pageViews,
      inquiries: inquirySessions,
      inquiryRate: sessions ? Number(((inquirySessions / sessions) * 100).toFixed(1)) : 0,
    },
    series,
    breakdowns: {
      sources: sortedSources,
      campaigns: sortedCampaigns,
      pages: sortedPages,
      devices,
      // Country is intentionally not inferred from browser timezone or IP.
      countries: [],
    },
    funnel,
    scrollDepth,
    sessions: sessionMap,
  };
};

const legacyOverviewFor = (views) => {
  const uniqueIds = new Set();
  const seriesMap = new Map();
  const pageMap = new Map();
  let firstSeen = null;
  let lastSeen = null;

  for (const view of views) {
    const occurredAt = view.created_at;
    const occurredAtMs = new Date(occurredAt).getTime();
    if (!Number.isFinite(occurredAtMs)) continue;

    // The legacy identifier may have been persistent. It is only used in this
    // server-side Set and is never included in the API response.
    const opaqueId = typeof view.session_id === 'string' && view.session_id.trim()
      ? `v1:${view.session_id}`
      : `v1-row:${view.id}`;
    uniqueIds.add(opaqueId);
    if (!firstSeen || occurredAtMs < new Date(firstSeen).getTime()) firstSeen = occurredAt;
    if (!lastSeen || occurredAtMs > new Date(lastSeen).getTime()) lastSeen = occurredAt;

    const date = localDateKey(occurredAt);
    const series = incrementBreakdown(seriesMap, date, () => ({
      date,
      label: localDateLabel(date),
      uniqueIds: new Set(),
      pageViews: 0,
    }));
    series.uniqueIds.add(opaqueId);
    series.pageViews += 1;

    const path = safeLegacyPath(view.page_url);
    const page = incrementBreakdown(pageMap, path, () => ({
      path,
      label: safePathLabel(path),
      uniqueIds: new Set(),
      pageViews: 0,
    }));
    page.uniqueIds.add(opaqueId);
    page.pageViews += 1;
  }

  return {
    summary: {
      uniqueIds: uniqueIds.size,
      pageViews: views.length,
    },
    series: [...seriesMap.values()]
      .map((row) => ({
        date: row.date,
        label: row.label,
        uniqueIds: row.uniqueIds.size,
        pageViews: row.pageViews,
      }))
      .sort((left, right) => left.date.localeCompare(right.date)),
    pages: [...pageMap.values()]
      .map((row) => ({
        path: row.path,
        label: row.label,
        uniqueIds: row.uniqueIds.size,
        pageViews: row.pageViews,
      }))
      .sort((left, right) => right.pageViews - left.pageViews || right.uniqueIds - left.uniqueIds)
      .slice(0, 12),
    firstSeen,
    lastSeen,
  };
};

const eventDetail = (event) => {
  const properties = propertyObject(event);
  if (['item_viewed', 'item_card_clicked'].includes(event.event_name) && event.item_id) {
    return `Object: ${event.item_id}`;
  }
  if (event.event_name === 'scroll_depth' && properties.depth) return `${properties.depth}% leesdiepte`;
  if (event.event_name === 'utm_visit' && event.utm_source) return `Bron: ${event.utm_source}`;
  if (event.event_name === 'catalog_search' && Number.isInteger(properties.resultCount)) {
    return `${properties.resultCount} resultaten`;
  }
  if (event.event_name === 'catalog_filter_applied' && Number.isInteger(properties.resultCount)) {
    return `${properties.resultCount} resultaten na filteren`;
  }
  return safePathLabel(event.page_path);
};

const liveFor = (events, now) => {
  const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
  const liveEvents = events
    .filter((event) => new Date(event.received_at).getTime() >= fiveMinutesAgo)
    .sort((left, right) => new Date(right.received_at).getTime() - new Date(left.received_at).getTime());

  return {
    activeSessions: new Set(liveEvents.map((event) => event.visit_id)).size,
    activity: liveEvents.slice(0, 12).map((event) => ({
      id: String(event.id),
      occurredAt: event.occurred_at,
      type: event.event_name,
      label: EVENT_LABELS[event.event_name] || 'Activiteit geregistreerd',
      detail: eventDetail(event),
      sessionId: event.visit_id,
    })),
  };
};

const sessionDetail = async (supabase, sessionId) => {
  if (typeof sessionId !== 'string' || !UUID_PATTERN.test(sessionId)) return null;
  const start = new Date(Date.now() - 35 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('analytics_events_v2')
    .select(EVENT_COLUMNS)
    .eq('visit_id', sessionId)
    .gte('received_at', start)
    .order('occurred_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(100);

  if (error) throw new Error(`Analytics session query failed: ${error.message}`);
  if (!data?.length) return null;

  const first = data[0];
  const source = sourceForSession(data);
  return {
    id: sessionId,
    startedAt: first.occurred_at,
    device: DEVICE_LABELS[first.device_type] || DEVICE_LABELS.unknown,
    source: source.name,
    country: null,
    timeline: data.map((event) => ({
      id: String(event.id),
      occurredAt: event.occurred_at,
      type: event.event_name,
      label: EVENT_LABELS[event.event_name] || 'Activiteit geregistreerd',
      detail: eventDetail(event),
    })),
  };
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const authorization = await requireActiveAdmin(req);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });

  try {
    const { supabase } = authorization;
    const sessionId = typeof req.query?.sessionId === 'string' ? req.query.sessionId : null;
    if (sessionId) {
      const session = await sessionDetail(supabase, sessionId);
      if (!session) return sendJson(res, 404, { error: 'No recent analytics session was found.' });
      return sendJson(res, 200, { generatedAt: new Date().toISOString(), timezone: TIMEZONE, session });
    }

    const rangeKey = typeof req.query?.range === 'string' ? req.query.range : '7d';
    if (!Object.hasOwn(RANGE_LABELS, rangeKey)) {
      return sendJson(res, 400, { error: 'Unsupported analytics range.' });
    }

    const [{ data: firstEvent, error: firstEventError }, firstLegacyView] = await Promise.all([
      supabase
        .from('analytics_events_v2')
        .select('received_at')
        .order('received_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      fetchFirstLegacyPageView(supabase),
    ]);
    if (firstEventError) throw new Error(`Analytics initialization query failed: ${firstEventError.message}`);

    const now = new Date();
    const earliest = [firstEvent?.received_at, firstLegacyView?.created_at]
      .filter(Boolean)
      .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] || null;
    const range = buildRange(rangeKey, now, earliest);
    const [
      { rows: currentRows, partial: currentPartial },
      previousResult,
      { rows: currentLegacyRows, partial: currentLegacyPartial },
      previousLegacyResult,
    ] = await Promise.all([
      fetchEvents(supabase, range.start, range.end),
      range.previousStart && range.previousEnd
        ? fetchEvents(supabase, range.previousStart, range.previousEnd)
        : Promise.resolve({ rows: [], partial: false }),
      fetchLegacyPageViews(supabase, range.start, range.end),
      range.previousStart && range.previousEnd
        ? fetchLegacyPageViews(supabase, range.previousStart, range.previousEnd)
        : Promise.resolve({ rows: [], partial: false, unavailable: false }),
    ]);

    const current = overviewFor(currentRows);
    const previous = overviewFor(previousResult.rows);
    const currentLegacy = legacyOverviewFor(currentLegacyRows);
    const previousLegacy = legacyOverviewFor(previousLegacyResult.rows);
    const legacyAvailable = Boolean(firstLegacyView);
    const legacyIncluded = currentLegacy.summary.pageViews > 0;
    const hasV2Data = currentRows.length > 0;
    const trackingState = legacyIncluded
      ? (hasV2Data ? 'mixed' : 'legacy')
      : (hasV2Data ? 'ready' : 'empty');

    return sendJson(res, 200, {
      generatedAt: now.toISOString(),
      timezone: TIMEZONE,
      range,
      summary: {
        sessions: { value: current.summary.sessions, previous: range.previousStart ? previous.summary.sessions : null },
        pageViews: { value: current.summary.pageViews, previous: range.previousStart ? previous.summary.pageViews : null },
        inquiries: { value: current.summary.inquiries, previous: range.previousStart ? previous.summary.inquiries : null },
        inquiryRate: { value: current.summary.inquiryRate, previous: range.previousStart ? previous.summary.inquiryRate : null },
      },
      series: current.series,
      breakdowns: current.breakdowns,
      funnel: current.funnel,
      scrollDepth: current.scrollDepth,
      live: liveFor(currentRows, now),
      legacy: {
        available: legacyAvailable,
        included: legacyIncluded,
        label: 'Historische v1-data',
        range: {
          label: range.label,
          start: range.start,
          end: range.end,
        },
        summary: {
          uniqueIds: {
            value: currentLegacy.summary.uniqueIds,
            previous: range.previousStart ? previousLegacy.summary.uniqueIds : null,
          },
          pageViews: {
            value: currentLegacy.summary.pageViews,
            previous: range.previousStart ? previousLegacy.summary.pageViews : null,
          },
        },
        series: currentLegacy.series,
        pages: currentLegacy.pages,
        startsAt: currentLegacy.firstSeen || firstLegacyView?.created_at || null,
        endsAt: currentLegacy.lastSeen || null,
        partial: currentLegacyPartial || previousLegacyResult.partial,
      },
      meta: {
        trackingState,
        trackingStartedAt: firstEvent?.received_at || null,
        legacyAvailable,
        legacyIncluded,
        partial: currentPartial || previousResult.partial || currentLegacyPartial || previousLegacyResult.partial,
      },
    });
  } catch (error) {
    console.error('[admin-analytics] Unexpected reporting failure:', error.message);
    return sendJson(res, 503, { error: 'Analytics reporting is temporarily unavailable.' });
  }
}
