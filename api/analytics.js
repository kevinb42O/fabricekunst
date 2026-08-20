import { createHmac, randomUUID } from 'node:crypto';
import { getServerSupabase, sendJson } from './_lib/adminAuth.js';

const MAX_BATCH_SIZE = 20;
const MAX_BODY_BYTES = 32 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INQUIRY_ID_PATTERN = /^inq-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_DIMENSION_PATTERN = /^[a-z0-9][a-z0-9._~-]{0,119}$/i;

const EVENT_NAMES = new Set([
  'page_view',
  'utm_visit',
  'catalog_search',
  'catalog_filter_applied',
  'item_viewed',
  'item_card_clicked',
  'cta_clicked',
  'inquiry_opened',
  'form_started',
  'form_validation_error',
  'inquiry_submitted',
  'collector_list_started',
  'collector_list_validation_error',
  'collector_list_submitted',
  'email_clicked',
  'phone_clicked',
  'whatsapp_clicked',
  'scroll_depth',
  'rage_click',
]);

const LOCAL_DEVELOPMENT_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]);

const integerInRange = (value, minimum, maximum) => (
  Number.isInteger(value) && value >= minimum && value <= maximum ? value : null
);

const compactString = (value, maximum = 120) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum || !SAFE_DIMENSION_PATTERN.test(normalized)) return null;
  return normalized.toLowerCase();
};

const optionalDimension = (value, maximum = 120) => {
  if (value === undefined || value === null || value === '') return null;
  return compactString(value, maximum);
};

const isPlainObject = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseBody = (req) => {
  if (isPlainObject(req.body)) return req.body;
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
  if (typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const parseAllowedOrigins = () => {
  const configured = (process.env.ANALYTICS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return new Set(configured);
};

/**
 * The public collector is intentionally same-origin. Origin validation blocks
 * browser-based cross-site abuse; the database-backed per-IP limit below is
 * still required because a non-browser client can forge headers.
 */
const hasAllowedOrigin = (req) => {
  const origin = typeof req.headers.origin === 'string'
    ? req.headers.origin.replace(/\/$/, '')
    : '';
  const configuredOrigins = parseAllowedOrigins();

  // Browsers attach Origin to fetch/sendBeacon POSTs. Permit its absence only
  // in an explicitly local development runtime, never on a deployed preview
  // or production URL where a forged request could otherwise bypass this
  // browser-level boundary.
  if (!origin) return process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
  if (configuredOrigins.size > 0) return configuredOrigins.has(origin);
  if (LOCAL_DEVELOPMENT_ORIGINS.has(origin)) return true;

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
};

const clientIp = (req) => {
  const vercelForwarded = req.headers['x-vercel-forwarded-for'];
  if (typeof vercelForwarded === 'string' && vercelForwarded.trim()) return vercelForwarded.split(',')[0].trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  if (typeof req.headers['x-real-ip'] === 'string' && req.headers['x-real-ip'].trim()) return req.headers['x-real-ip'].trim();
  return 'unavailable';
};

const rateLimitBucket = (req) => {
  const secret = process.env.ANALYTICS_RATE_LIMIT_SALT;
  if (!secret || secret.length < 32) return null;

  const minute = Math.floor(Date.now() / 60_000);
  return createHmac('sha256', secret)
    .update(`${minute}:${clientIp(req)}`)
    .digest('hex');
};

const configuredRateLimit = () => {
  const parsed = Number.parseInt(process.env.ANALYTICS_RATE_LIMIT_PER_MINUTE || '60', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 10), 240) : 60;
};

const maximumEventAgeMs = () => {
  const parsed = Number.parseInt(process.env.ANALYTICS_MAX_EVENT_AGE_SECONDS || '900', 10);
  const seconds = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 60), 3600) : 900;
  return seconds * 1000;
};

const sanitizePagePath = (value) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 500) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('?') || value.includes('#')) return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;

  try {
    const url = new URL(value, 'https://analytics.invalid');
    if (url.origin !== 'https://analytics.invalid' || url.pathname !== value) return null;
    if (url.pathname.startsWith('/admin')) return null;
    return url.pathname;
  } catch {
    return null;
  }
};

const sanitizeReferrerOrigin = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2_000) return null;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.origin.length <= 255 ? url.origin : null;
  } catch {
    return null;
  }
};

const sanitizeAttribution = (value) => {
  if (value === undefined || value === null) return { source: null, medium: null, campaign: null };
  if (!isPlainObject(value)) return null;

  const source = optionalDimension(value.source);
  const medium = optionalDimension(value.medium);
  const campaign = optionalDimension(value.campaign, 160);

  const suppliedValues = [value.source, value.medium, value.campaign]
    .filter((entry) => entry !== undefined && entry !== null && entry !== '');
  if (suppliedValues.length && (!source && value.source || !medium && value.medium || !campaign && value.campaign)) {
    return null;
  }

  return { source, medium, campaign };
};

const sanitiseItemId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,159}$/i.test(value)) return null;
  return value.toLowerCase();
};

const putDimension = (result, name, value, maximum = 120) => {
  if (value === undefined || value === null || value === '') return true;
  const normalized = compactString(value, maximum);
  if (!normalized) return false;
  result[name] = normalized;
  return true;
};

const putItemId = (result, value) => {
  if (value === undefined || value === null || value === '') return true;
  const itemId = sanitiseItemId(value);
  if (!itemId) return false;
  result.itemId = itemId;
  return true;
};

/**
 * Persist only a small, documented allow-list. In particular, this strips
 * search text, form values, click coordinates, CSS selectors, URLs, and any
 * future accidental payload keys before they reach the database.
 */
const sanitizeProperties = (eventName, input) => {
  const data = input === undefined || input === null ? {} : input;
  if (!isPlainObject(data)) return null;
  const result = {};

  switch (eventName) {
    case 'page_view':
      if (!putDimension(result, 'pageType', data.pageType, 48)) return null;
      if (data.locale !== undefined && data.locale !== null && data.locale !== '') {
        const locale = compactString(data.locale, 8);
        if (!locale || !['nl', 'en', 'fr'].includes(locale)) return null;
        result.locale = locale;
      }
      break;
    case 'utm_visit':
      // Attribution is stored in dedicated columns. No duplicate payload is needed.
      break;
    case 'catalog_search': {
      const queryLength = integerInRange(data.queryLength, 0, 200);
      const resultCount = integerInRange(data.resultCount, 0, 10_000);
      if (queryLength === null || resultCount === null) return null;
      result.queryLength = queryLength;
      result.resultCount = resultCount;
      break;
    }
    case 'catalog_filter_applied': {
      const filterCount = integerInRange(data.filterCount, 0, 20);
      const resultCount = integerInRange(data.resultCount, 0, 10_000);
      if (filterCount === null || resultCount === null || typeof data.hasSearch !== 'boolean') return null;
      result.filterCount = filterCount;
      result.resultCount = resultCount;
      result.hasSearch = data.hasSearch;
      for (const key of ['group', 'type', 'status', 'century', 'category', 'sort']) {
        if (!putDimension(result, key, data[key])) return null;
      }
      break;
    }
    case 'item_viewed':
    case 'item_card_clicked':
      if (!putItemId(result, data.itemId)) return null;
      for (const key of ['itemType', 'collectionGroup', 'status', 'category', 'century', 'placement']) {
        if (!putDimension(result, key, data[key])) return null;
      }
      break;
    case 'cta_clicked':
      if (!putDimension(result, 'placement', data.placement)) return null;
      if (!putDimension(result, 'target', data.target)) return null;
      if (!putItemId(result, data.itemId)) return null;
      break;
    case 'inquiry_opened':
      if (!putDimension(result, 'context', data.context)) return null;
      if (!putDimension(result, 'requestType', data.requestType)) return null;
      if (!putItemId(result, data.itemId)) return null;
      break;
    case 'form_started':
      if (!putDimension(result, 'form', data.form)) return null;
      if (!putDimension(result, 'context', data.context)) return null;
      if (!putItemId(result, data.itemId)) return null;
      break;
    case 'form_validation_error':
      if (!putDimension(result, 'form', data.form)) return null;
      if (!putDimension(result, 'field', data.field, 48)) return null;
      break;
    case 'inquiry_submitted':
      if (typeof data.inquiryId !== 'string' || !INQUIRY_ID_PATTERN.test(data.inquiryId)) return null;
      result.inquiryId = data.inquiryId.toLowerCase();
      break;
    case 'collector_list_started':
      if (!putDimension(result, 'placement', data.placement)) return null;
      if (!putDimension(result, 'locale', data.locale, 8)) return null;
      break;
    case 'collector_list_validation_error':
      if (!putDimension(result, 'placement', data.placement)) return null;
      if (!putDimension(result, 'field', data.field, 48)) return null;
      break;
    case 'collector_list_submitted':
      if (!putDimension(result, 'placement', data.placement)) return null;
      if (!putDimension(result, 'locale', data.locale, 8)) return null;
      if (typeof data.confirmationRequired !== 'boolean') return null;
      result.confirmationRequired = data.confirmationRequired;
      break;
    case 'email_clicked':
    case 'phone_clicked':
    case 'whatsapp_clicked':
      if (!putDimension(result, 'placement', data.placement)) return null;
      break;
    case 'scroll_depth':
      if (![25, 50, 75, 100].includes(data.depth)) return null;
      result.depth = data.depth;
      break;
    case 'rage_click':
      if (data.targetType !== undefined && data.targetType !== null && data.targetType !== '') {
        const targetType = compactString(data.targetType, 24);
        if (!targetType || !['button', 'link', 'input', 'other'].includes(targetType)) return null;
        result.targetType = targetType;
      }
      break;
    default:
      return null;
  }

  return result;
};

const userAgentClassification = (userAgent) => {
  const ua = typeof userAgent === 'string' ? userAgent : '';
  const normalized = ua.toLowerCase();
  const isBot = /bot|crawler|spider|slurp|headless|lighthouse|facebookexternalhit|preview/i.test(normalized);
  if (isBot) return { isBot: true, deviceType: 'unknown', browserFamily: 'Other' };

  const deviceType = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)
    ? 'tablet'
    : /(mobi|iphone|ipod|android|iemobile|blackberry|opera mini)/i.test(ua)
      ? 'mobile'
      : 'desktop';
  const browserFamily = /edg\//i.test(ua)
    ? 'Edge'
    : /firefox\//i.test(ua)
      ? 'Firefox'
      : /chrome\//i.test(ua) || /crios\//i.test(ua)
        ? 'Chrome'
        : /safari\//i.test(ua)
          ? 'Safari'
          : 'Other';

  return { isBot: false, deviceType, browserFamily };
};

const verifyInquiry = async (supabase, inquiryId) => {
  const createdAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('inquiries')
    .select('id')
    .eq('id', inquiryId)
    .gte('created_at', createdAfter)
    .maybeSingle();

  if (error) throw new Error(`Unable to validate inquiry conversion: ${error.message}`);
  return Boolean(data?.id);
};

const normalizeEvent = async ({ event, supabase, classification, now }) => {
  if (!isPlainObject(event) || event.version !== 2 || !EVENT_NAMES.has(event.eventName)) return null;
  if (typeof event.visitId !== 'string' || !UUID_PATTERN.test(event.visitId)) return null;
  if (event.eventId !== undefined && (typeof event.eventId !== 'string' || !UUID_PATTERN.test(event.eventId))) return null;

  const pagePath = sanitizePagePath(event.pagePath);
  const attribution = sanitizeAttribution(event.attribution);
  const properties = sanitizeProperties(event.eventName, event.data);
  if (!pagePath || !attribution || !properties) return null;

  const occurredAt = new Date(event.occurredAt);
  if (!Number.isFinite(occurredAt.getTime())) return null;
  if (occurredAt.getTime() < now - maximumEventAgeMs() || occurredAt.getTime() > now + 60_000) return null;

  if (event.eventName === 'inquiry_submitted') {
    const exists = await verifyInquiry(supabase, properties.inquiryId);
    if (!exists) return null;
  }

  return {
    event_id: event.eventId || randomUUID(),
    event_name: event.eventName,
    occurred_at: occurredAt.toISOString(),
    visit_id: event.visitId.toLowerCase(),
    page_path: pagePath,
    referrer_origin: sanitizeReferrerOrigin(event.referrer),
    utm_source: attribution.source,
    utm_medium: attribution.medium,
    utm_campaign: attribution.campaign,
    item_id: properties.itemId || null,
    properties,
    device_type: classification.deviceType,
    browser_family: classification.browserFamily,
    tracking_version: 2,
  };
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const contentLength = Number.parseInt(req.headers['content-length'] || '0', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return sendJson(res, 413, { error: 'Analytics payload is too large.' });
  }

  if (!hasAllowedOrigin(req)) {
    return sendJson(res, 403, { error: 'Analytics requests must originate from this site.' });
  }

  const supabase = getServerSupabase();
  if (!supabase || !process.env.ANALYTICS_RATE_LIMIT_SALT || process.env.ANALYTICS_RATE_LIMIT_SALT.length < 32) {
    console.error('[analytics] Required server configuration is missing.');
    return sendJson(res, 503, { error: 'Analytics collection is temporarily unavailable.' });
  }

  const body = parseBody(req);
  if (!body || !Array.isArray(body.events) || body.events.length === 0 || body.events.length > MAX_BATCH_SIZE) {
    return sendJson(res, 400, { error: `Provide an events array with 1 to ${MAX_BATCH_SIZE} entries.` });
  }

  const bucketKey = rateLimitBucket(req);
  if (!bucketKey) return sendJson(res, 503, { error: 'Analytics collection is temporarily unavailable.' });

  const { data: allowed, error: rateLimitError } = await supabase.rpc('consume_analytics_rate_limit', {
    p_bucket_key: bucketKey,
    p_limit: configuredRateLimit(),
    p_cost: body.events.length,
  });

  if (rateLimitError) {
    console.error('[analytics] Rate-limit check failed:', rateLimitError.message);
    return sendJson(res, 503, { error: 'Analytics collection is temporarily unavailable.' });
  }
  if (!allowed) {
    res.setHeader('Retry-After', '60');
    return sendJson(res, 429, { error: 'Too many analytics events. Please retry shortly.' });
  }

  const classification = userAgentClassification(req.headers['user-agent']);
  if (classification.isBot) return sendJson(res, 202, { accepted: 0, discarded: body.events.length });

  try {
    const seenEventIds = new Set();
    const normalized = [];
    const now = Date.now();

    for (const event of body.events) {
      const eventId = isPlainObject(event) && typeof event.eventId === 'string' ? event.eventId.toLowerCase() : null;
      if (eventId && seenEventIds.has(eventId)) continue;
      if (eventId) seenEventIds.add(eventId);

      const row = await normalizeEvent({ event, supabase, classification, now });
      if (row) normalized.push(row);
    }

    if (!normalized.length) return sendJson(res, 202, { accepted: 0, discarded: body.events.length });

    const { error: insertError } = await supabase
      .from('analytics_events_v2')
      .upsert(normalized, { onConflict: 'event_id', ignoreDuplicates: true });

    if (insertError) {
      console.error('[analytics] Event insert failed:', insertError.message);
      return sendJson(res, 503, { error: 'Analytics collection is temporarily unavailable.' });
    }

    return sendJson(res, 202, {
      accepted: normalized.length,
      discarded: body.events.length - normalized.length,
    });
  } catch (error) {
    console.error('[analytics] Unexpected collector failure:', error.message);
    return sendJson(res, 503, { error: 'Analytics collection is temporarily unavailable.' });
  }
}
