import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Analytics is deliberately first-party, consent-gated and event-limited. The
// browser never reads or writes analytics tables directly: only the collector
// endpoint is allowed to persist a validated subset of these events.
const COLLECTOR_URL = '/api/analytics';
const ANALYTICS_VERSION = 2;
const CONSENT_STORAGE_KEY = 'atelier_analytics_consent_v2';
const VISIT_STORAGE_KEY = 'atelier_analytics_visit_v2';
const ATTRIBUTION_STORAGE_KEY = 'atelier_analytics_attribution_v2';
const LEGACY_STORAGE_KEYS = ['analytics_visitor_id', 'last_utm'];
const CONSENT_CHANGE_EVENT = 'atelier:analytics-consent-change';
const ROUTE_CHANGE_EVENT = 'atelier:analytics-route-change';
const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const VISIT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_BATCH_SIZE = 20;
const MAX_QUEUE_SIZE = 100;
const FLUSH_DELAY_MS = 900;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 2_000;
const RETRY_MAX_DELAY_MS = 60_000;

const CONSENT_UNKNOWN = 'unknown';
const CONSENT_GRANTED = 'granted';
const CONSENT_DENIED = 'denied';

const EVENT_PROPERTIES = {
  page_view: {
    pageType: 'string',
    locale: 'string'
  },
  utm_visit: {
    source: 'string',
    medium: 'string',
    campaign: 'string'
  },
  catalog_search: {
    queryLength: 'number',
    resultCount: 'number'
  },
  catalog_filter_applied: {
    filterCount: 'number',
    resultCount: 'number',
    hasSearch: 'boolean',
    group: 'string',
    type: 'string',
    status: 'string',
    century: 'string',
    category: 'string',
    sort: 'string'
  },
  item_viewed: {
    itemId: 'string',
    itemType: 'string',
    collectionGroup: 'string',
    status: 'string',
    category: 'string',
    century: 'string',
    placement: 'string'
  },
  item_card_clicked: {
    itemId: 'string',
    itemType: 'string',
    collectionGroup: 'string',
    status: 'string',
    category: 'string',
    century: 'string',
    placement: 'string'
  },
  cta_clicked: {
    placement: 'string',
    target: 'string',
    itemId: 'string'
  },
  inquiry_opened: {
    context: 'string',
    itemId: 'string',
    requestType: 'string'
  },
  form_started: {
    form: 'string',
    context: 'string',
    itemId: 'string'
  },
  form_validation_error: {
    form: 'string',
    field: 'string'
  },
  inquiry_submitted: {
    inquiryId: 'string'
  },
  collector_list_started: {
    placement: 'string',
    locale: 'string'
  },
  collector_list_validation_error: {
    placement: 'string',
    field: 'string'
  },
  collector_list_submitted: {
    placement: 'string',
    locale: 'string',
    confirmationRequired: 'boolean'
  },
  email_clicked: {
    placement: 'string'
  },
  phone_clicked: {
    placement: 'string'
  },
  whatsapp_clicked: {
    placement: 'string'
  },
  scroll_depth: {
    depth: 'number'
  }
};

const EVENT_NUMBER_MAXIMUMS = {
  catalog_search: { queryLength: 200, resultCount: 10_000 },
  catalog_filter_applied: { filterCount: 20, resultCount: 10_000 },
  scroll_depth: { depth: 100 }
};

let eventQueue = [];
let flushTimer = null;
let isFlushing = false;
let historyListenerCount = 0;
let originalPushState = null;
let patchedPushState = null;
let memoryVisit = null;
let retryAttempt = 0;
let nextFlushAt = 0;
let consentGeneration = 0;
const recentEventKeys = new Map();

const CONSENT_COPY = {
  nl: {
    title: 'Uw privacykeuze',
    body: 'Met uw toestemming meten we alleen privacyvriendelijke, first-party gebruiksstatistieken om de website te verbeteren. We gebruiken geen advertentieprofielen en slaan geen formulierinhoud op in analytics.',
    accept: 'Analytics toestaan',
    reject: 'Alleen noodzakelijk',
    privacy: 'Lees het privacybeleid',
    settingsTitle: 'Website-analyse',
    settingsBody: 'U kunt uw keuze voor privacyvriendelijke website-analyse hier op elk moment aanpassen.',
    enabled: 'Analytics is toegestaan.',
    disabled: 'Analytics is uitgeschakeld.',
    allow: 'Analytics toestaan',
    disable: 'Analytics uitschakelen'
  },
  en: {
    title: 'Your privacy choice',
    body: 'With your consent, we collect only privacy-friendly first-party usage statistics to improve the website. We do not use advertising profiles or store form content in analytics.',
    accept: 'Allow analytics',
    reject: 'Necessary only',
    privacy: 'Read the privacy policy',
    settingsTitle: 'Website analytics',
    settingsBody: 'You can change your choice for privacy-friendly website analytics here at any time.',
    enabled: 'Analytics is enabled.',
    disabled: 'Analytics is disabled.',
    allow: 'Allow analytics',
    disable: 'Disable analytics'
  },
  fr: {
    title: 'Votre choix de confidentialité',
    body: 'Avec votre consentement, nous recueillons uniquement des statistiques d’utilisation first-party respectueuses de la vie privée pour améliorer le site. Nous n’utilisons pas de profils publicitaires et ne stockons pas le contenu des formulaires dans les analyses.',
    accept: 'Autoriser les analyses',
    reject: 'Nécessaire uniquement',
    privacy: 'Lire la politique de confidentialité',
    settingsTitle: 'Analyse du site',
    settingsBody: 'Vous pouvez modifier à tout moment votre choix concernant l’analyse du site respectueuse de la vie privée.',
    enabled: 'Les analyses sont activées.',
    disabled: 'Les analyses sont désactivées.',
    allow: 'Autoriser les analyses',
    disable: 'Désactiver les analyses'
  }
};

function canUseBrowserStorage() {
  return typeof window !== 'undefined';
}

function safeStorageGet(storage, key) {
  try {
    return storage?.getItem(key) || null;
  } catch {
    return null;
  }
}

function safeStorageSet(storage, key, value) {
  try {
    storage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing modes. There is no
    // fallback persistence for analytics in that case.
  }
}

function parseStoredJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const values = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) {
      values[index] = Math.floor(Math.random() * 256);
    }
  }
  values[6] = (values[6] & 0x0f) | 0x40;
  values[8] = (values[8] & 0x3f) | 0x80;
  const hex = Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeDimension(value, maxLength = 80) {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const raw = String(value).trim();
  // Campaign dimensions must never turn a pasted email address or URL into a
  // different-looking but still identifying analytics value.
  if (!raw || raw.includes('@') || /:\/\//.test(raw)) return undefined;
  const normalized = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._~-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
  return normalized || undefined;
}

function normalizeCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(Math.round(parsed), 100000));
}

function sanitizeEventData(eventName, eventData = {}) {
  const rules = EVENT_PROPERTIES[eventName];
  if (!rules || !eventData || typeof eventData !== 'object') return {};

  return Object.entries(rules).reduce((safeData, [key, type]) => {
    const value = eventData[key];
    if (type === 'boolean' && typeof value === 'boolean') {
      safeData[key] = value;
    }
    if (type === 'number') {
      const normalized = normalizeCount(value);
      if (normalized !== undefined) {
        const maximum = EVENT_NUMBER_MAXIMUMS[eventName]?.[key];
        safeData[key] = maximum === undefined ? normalized : Math.min(normalized, maximum);
      }
    }
    if (type === 'string') {
      const normalized = normalizeDimension(value);
      if (normalized) safeData[key] = normalized;
    }
    return safeData;
  }, {});
}

function isAdminLocation() {
  if (!canUseBrowserStorage()) return true;
  const path = window.location.pathname.toLowerCase();
  // Match the router's legacy-hash handling: a malformed shared UTM link
  // such as `/#admin?utm_source=…` is still an admin route and must never
  // create public-site telemetry.
  const hash = window.location.hash.toLowerCase().split('?')[0];
  return /(^|\/)admin(?:\/|$)/.test(path) || hash === '#admin';
}

function canonicalPathname(pathname = '') {
  const withoutTrailingSlash = pathname.replace(/\/+$/, '') || '/';
  const withoutLanguagePrefix = withoutTrailingSlash.replace(/^\/(en|fr)(?=\/|$)/i, '') || '/';
  return withoutLanguagePrefix.startsWith('/') ? withoutLanguagePrefix : `/${withoutLanguagePrefix}`;
}

function getLocale() {
  if (!canUseBrowserStorage()) return 'nl';
  const pathLanguage = window.location.pathname.match(/^\/(en|fr)(?=\/|$)/i)?.[1]?.toLowerCase();
  return pathLanguage || document.documentElement.lang?.slice(0, 2)?.toLowerCase() || 'nl';
}

function getPageType(pagePath) {
  if (pagePath === '/collectie' || pagePath === '/catalogus') return 'catalog';
  if (pagePath.startsWith('/collectie/') || pagePath.startsWith('/item/')) return 'item_detail';
  if (pagePath === '/herkomst') return 'provenance';
  if (pagePath === '/privacy') return 'privacy';
  if (pagePath === '/voorwaarden' || pagePath === '/algemene-voorwaarden') return 'terms';
  if (pagePath === '/topstukken') return 'featured';
  return 'home';
}

function getLogicalLocation() {
  if (!canUseBrowserStorage()) return null;
  if (isAdminLocation()) return null;

  const pagePath = canonicalPathname(window.location.pathname);
  let pageType = getPageType(pagePath);
  const routeHash = window.location.hash.toLowerCase().split('?')[0];

  // Older shared links can still use route hashes. A contact anchor remains
  // part of the current page rather than generating a second page view.
  if (pagePath === '/') {
    if (routeHash === '#collectie' || routeHash === '#catalogus') pageType = 'catalog';
    if (routeHash === '#herkomst') pageType = 'provenance';
    if (routeHash === '#privacy') pageType = 'privacy';
    if (routeHash === '#voorwaarden' || routeHash === '#algemene-voorwaarden') pageType = 'terms';
    if (routeHash === '#topstukken') pageType = 'featured';
  }

  return {
    pagePath,
    pageType,
    key: `${pagePath}:${pageType}`
  };
}

function getExternalReferrerOrigin() {
  if (!canUseBrowserStorage() || !document.referrer) return undefined;
  try {
    const referrer = new URL(document.referrer);
    if (!['http:', 'https:'].includes(referrer.protocol) || referrer.origin === window.location.origin) return undefined;
    return referrer.origin;
  } catch {
    return undefined;
  }
}

export function getAnalyticsConsent() {
  if (!canUseBrowserStorage()) return CONSENT_UNKNOWN;
  const record = parseStoredJson(safeStorageGet(window.localStorage, CONSENT_STORAGE_KEY));
  if (!record || ![CONSENT_GRANTED, CONSENT_DENIED].includes(record.status) || !Number.isFinite(record.updatedAt)) {
    return CONSENT_UNKNOWN;
  }

  if (Date.now() - record.updatedAt > CONSENT_MAX_AGE_MS) {
    safeStorageRemove(window.localStorage, CONSENT_STORAGE_KEY);
    // Consent expiry is a withdrawal until the visitor chooses again. Clear
    // volatile events and the visit identifier immediately, even before a
    // mounted consent component re-renders.
    clearAnalyticsState();
    return CONSENT_UNKNOWN;
  }

  return record.status;
}

function clearAnalyticsState() {
  consentGeneration += 1;
  eventQueue = [];
  memoryVisit = null;
  retryAttempt = 0;
  nextFlushAt = 0;
  recentEventKeys.clear();
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!canUseBrowserStorage()) return;
  safeStorageRemove(window.sessionStorage, VISIT_STORAGE_KEY);
  safeStorageRemove(window.sessionStorage, ATTRIBUTION_STORAGE_KEY);
}

function removeLegacyAnalyticsState() {
  if (!canUseBrowserStorage()) return;
  LEGACY_STORAGE_KEYS.forEach((key) => {
    safeStorageRemove(window.localStorage, key);
    safeStorageRemove(window.sessionStorage, key);
  });
}

export function setAnalyticsConsent(nextConsent) {
  if (!canUseBrowserStorage() || ![CONSENT_GRANTED, CONSENT_DENIED].includes(nextConsent)) return;
  const previousConsent = getAnalyticsConsent();

  safeStorageSet(window.localStorage, CONSENT_STORAGE_KEY, JSON.stringify({
    status: nextConsent,
    updatedAt: Date.now()
  }));

  // A newly granted choice after denial/expiry starts a new temporary visit;
  // refusing consent always drops all volatile analytics state.
  if (nextConsent !== CONSENT_GRANTED || previousConsent !== CONSENT_GRANTED) clearAnalyticsState();

  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, {
    detail: { consent: nextConsent }
  }));
}

export function useAnalyticsConsent() {
  const [consent, setConsentState] = useState(getAnalyticsConsent);

  useEffect(() => {
    let expiryTimer = null;
    const clearExpiryTimer = () => {
      if (expiryTimer) {
        window.clearTimeout(expiryTimer);
        expiryTimer = null;
      }
    };
    const scheduleExpiryCheck = () => {
      clearExpiryTimer();
      const record = parseStoredJson(safeStorageGet(window.localStorage, CONSENT_STORAGE_KEY));
      if (!record || !Number.isFinite(record.updatedAt)) return;
      const expiresInMs = record.updatedAt + CONSENT_MAX_AGE_MS - Date.now();
      expiryTimer = window.setTimeout(syncConsent, Math.max(0, expiresInMs) + 20);
    };
    const syncConsent = () => {
      const nextConsent = getAnalyticsConsent();
      if (nextConsent !== CONSENT_GRANTED) clearAnalyticsState();
      setConsentState(nextConsent);
      scheduleExpiryCheck();
    };
    const syncStorage = (event) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
        // Storage events arrive from another tab. Always start fresh there so
        // a remote opt-out can never later flush this tab's old queue.
        clearAnalyticsState();
        syncConsent();
      }
    };

    scheduleExpiryCheck();
    window.addEventListener(CONSENT_CHANGE_EVENT, syncConsent);
    window.addEventListener('storage', syncStorage);
    return () => {
      clearExpiryTimer();
      window.removeEventListener(CONSENT_CHANGE_EVENT, syncConsent);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  return useMemo(() => ({
    consent,
    hasConsent: consent === CONSENT_GRANTED,
    setConsent: setAnalyticsConsent
  }), [consent]);
}

function getVisitId() {
  if (!canUseBrowserStorage() || getAnalyticsConsent() !== CONSENT_GRANTED) return null;

  const now = Date.now();
  const storedVisit = parseStoredJson(safeStorageGet(window.sessionStorage, VISIT_STORAGE_KEY));
  const activeVisit = storedVisit || memoryVisit;
  if (activeVisit && isUuid(activeVisit.id) && Number.isFinite(activeVisit.lastActivityAt) && now - activeVisit.lastActivityAt < VISIT_IDLE_TIMEOUT_MS) {
    const refreshedVisit = {
      ...activeVisit,
      lastActivityAt: now
    };
    memoryVisit = refreshedVisit;
    safeStorageSet(window.sessionStorage, VISIT_STORAGE_KEY, JSON.stringify(refreshedVisit));
    return refreshedVisit.id;
  }

  const visit = {
    id: createUuid(),
    startedAt: now,
    lastActivityAt: now
  };
  memoryVisit = visit;
  safeStorageSet(window.sessionStorage, VISIT_STORAGE_KEY, JSON.stringify(visit));
  safeStorageRemove(window.sessionStorage, ATTRIBUTION_STORAGE_KEY);
  return visit.id;
}

function parseUtmParams() {
  if (!canUseBrowserStorage()) return null;
  const urlParams = new URLSearchParams(window.location.search);

  // Accept old malformed /#contact?utm_source=... links while ensuring all
  // new links use ?utm_source=...#contact. The standard query always wins.
  const legacyHashQuery = window.location.hash.includes('?')
    ? new URLSearchParams(window.location.hash.slice(window.location.hash.indexOf('?') + 1))
    : null;
  const getParam = (name) => urlParams.get(name) || legacyHashQuery?.get(name) || null;
  const source = normalizeDimension(getParam('utm_source'));

  if (!source) return null;
  return {
    source,
    medium: normalizeDimension(getParam('utm_medium')) || 'unknown',
    campaign: normalizeDimension(getParam('utm_campaign')) || 'unknown'
  };
}

function getAttribution(visitId) {
  if (!canUseBrowserStorage() || !visitId) return { attribution: null, isNew: false };
  const incoming = parseUtmParams();
  const stored = parseStoredJson(safeStorageGet(window.sessionStorage, ATTRIBUTION_STORAGE_KEY));
  const storedAttribution = stored?.visitId === visitId ? stored.attribution : null;

  if (!incoming) return { attribution: storedAttribution || null, isNew: false };

  const changed = !storedAttribution
    || storedAttribution.source !== incoming.source
    || storedAttribution.medium !== incoming.medium
    || storedAttribution.campaign !== incoming.campaign;

  if (changed) {
    safeStorageSet(window.sessionStorage, ATTRIBUTION_STORAGE_KEY, JSON.stringify({
      visitId,
      attribution: incoming
    }));
  }

  return {
    attribution: incoming,
    isNew: changed
  };
}

function purgeRecentEventKeys(now = Date.now()) {
  recentEventKeys.forEach((expiresAt, key) => {
    if (now >= expiresAt) recentEventKeys.delete(key);
  });
}

function shouldQueueEvent(eventName, pagePath, data, visitId, dedupeWindowMs) {
  const now = Date.now();
  purgeRecentEventKeys(now);
  const key = `${visitId}:${eventName}:${pagePath}:${JSON.stringify(data)}`;
  const expiresAt = recentEventKeys.get(key);
  if (expiresAt && now < expiresAt) return false;
  recentEventKeys.set(key, now + dedupeWindowMs);
  return true;
}

function scheduleFlush(delayMs = FLUSH_DELAY_MS) {
  if (flushTimer || !eventQueue.length) return;
  const remainingBackoffMs = Math.max(0, nextFlushAt - Date.now());
  const safeDelayMs = Number.isFinite(delayMs) ? Math.max(0, delayMs) : FLUSH_DELAY_MS;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushAnalytics();
  }, Math.max(safeDelayMs, remainingBackoffMs));
}

function enqueueEvent(event) {
  eventQueue.push(event);
  if (eventQueue.length > MAX_QUEUE_SIZE) eventQueue = eventQueue.slice(-MAX_QUEUE_SIZE);
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flushAnalytics();
  } else {
    scheduleFlush();
  }
}

function makeEvent(eventName, eventData, options = {}) {
  if (!canUseBrowserStorage() || getAnalyticsConsent() !== CONSENT_GRANTED || isAdminLocation()) return null;
  if (!Object.prototype.hasOwnProperty.call(EVENT_PROPERTIES, eventName)) return null;

  const location = getLogicalLocation();
  if (!location) return null;
  const visitId = options.visitId || getVisitId();
  if (!visitId) return null;
  const attributionResult = options.attributionResult || getAttribution(visitId);
  const data = sanitizeEventData(eventName, eventData);
  const requestedDedupeWindowMs = Number(options.dedupeWindowMs ?? 750);
  const dedupeWindowMs = Number.isFinite(requestedDedupeWindowMs)
    ? Math.max(0, Math.min(Math.round(requestedDedupeWindowMs), VISIT_IDLE_TIMEOUT_MS))
    : 750;

  if (!shouldQueueEvent(eventName, location.pagePath, data, visitId, dedupeWindowMs)) return null;

  return {
    event: {
      eventId: createUuid(),
      eventName,
      occurredAt: new Date().toISOString(),
      pagePath: location.pagePath,
      visitId,
      // Deliberately retain only an external origin; paths, query strings and
      // fragments can reveal sensitive navigation context.
      referrer: getExternalReferrerOrigin(),
      attribution: attributionResult.attribution || undefined,
      data,
      version: ANALYTICS_VERSION
    },
    attributionResult
  };
}

function queueAttributionEvent(visitId, attributionResult) {
  if (!attributionResult?.isNew || !attributionResult.attribution) return;
  const attributionEvent = makeEvent('utm_visit', attributionResult.attribution, {
    visitId,
    attributionResult,
    dedupeWindowMs: VISIT_IDLE_TIMEOUT_MS
  });
  if (attributionEvent) enqueueEvent(attributionEvent.event);
}

/**
 * Queue a privacy-safe event. Event data is whitelisted in this module; do not
 * pass form content, query text, raw URLs, browser identifiers, or click data.
 */
export function trackEvent(eventName, eventData = {}, options = {}) {
  const visitId = options.visitId || getVisitId();
  if (!visitId) return false;

  const attributionResult = getAttribution(visitId);
  if (eventName !== 'utm_visit') queueAttributionEvent(visitId, attributionResult);
  const result = makeEvent(eventName, eventData, {
    ...options,
    visitId,
    attributionResult
  });
  if (!result) return false;
  enqueueEvent(result.event);
  return true;
}

export function getItemAnalyticsProperties(item, placement) {
  return {
    itemId: item?.id,
    itemType: item?.itemType,
    collectionGroup: item?.collectionGroupValue || item?.collectionGroup,
    status: item?.status,
    category: item?.categorySlug || item?.category,
    century: item?.century,
    placement
  };
}

export function trackItemViewed(item, placement = 'item_detail') {
  return trackEvent('item_viewed', getItemAnalyticsProperties(item, placement), {
    dedupeWindowMs: 1500
  });
}

export function trackItemCardClicked(item, placement = 'catalog_grid') {
  return trackEvent('item_card_clicked', getItemAnalyticsProperties(item, placement), {
    dedupeWindowMs: 500
  });
}

function getRetryDelayMs(retryAfter, attempt) {
  const retryAfterSeconds = Number.parseInt(retryAfter || '', 10);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1000, RETRY_MAX_DELAY_MS);
  }
  return Math.min(RETRY_BASE_DELAY_MS * (2 ** Math.max(0, attempt - 1)), RETRY_MAX_DELAY_MS);
}

async function flushBatch(batch, useBeacon = false) {
  const body = JSON.stringify({ events: batch });

  if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const payload = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(COLLECTOR_URL, payload)) return { delivered: true, status: 202 };
  }

  const response = await fetch(COLLECTOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: useBeacon,
    credentials: 'same-origin'
  });

  return {
    delivered: response.ok,
    status: response.status,
    retryAfter: response.headers.get('Retry-After')
  };
}

export async function flushAnalytics({ useBeacon = false } = {}) {
  if (isFlushing || !eventQueue.length || getAnalyticsConsent() !== CONSENT_GRANTED) return;
  const remainingBackoffMs = nextFlushAt - Date.now();
  if (remainingBackoffMs > 0) {
    scheduleFlush(remainingBackoffMs);
    return;
  }
  isFlushing = true;
  const flushGeneration = consentGeneration;
  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);

  try {
    const outcome = await flushBatch(batch, useBeacon);
    if (outcome.delivered) {
      retryAttempt = 0;
      nextFlushAt = 0;
    } else if ((outcome.status === 429 || outcome.status >= 500)
      && getAnalyticsConsent() === CONSENT_GRANTED
      && consentGeneration === flushGeneration) {
      retryAttempt += 1;
      if (retryAttempt <= MAX_RETRY_ATTEMPTS) {
        nextFlushAt = Date.now() + getRetryDelayMs(outcome.retryAfter, retryAttempt);
        eventQueue = [...batch, ...eventQueue].slice(0, MAX_QUEUE_SIZE);
      } else {
        retryAttempt = 0;
        nextFlushAt = 0;
      }
    } else {
      // Validation, authorization and other permanent client-side failures
      // cannot be repaired by replaying a volatile analytics batch.
      retryAttempt = 0;
      nextFlushAt = 0;
    }
  } catch {
    if (getAnalyticsConsent() === CONSENT_GRANTED && consentGeneration === flushGeneration) {
      retryAttempt += 1;
      if (retryAttempt <= MAX_RETRY_ATTEMPTS) {
        nextFlushAt = Date.now() + getRetryDelayMs(null, retryAttempt);
        eventQueue = [...batch, ...eventQueue].slice(0, MAX_QUEUE_SIZE);
      } else {
        retryAttempt = 0;
        nextFlushAt = 0;
      }
    }
  } finally {
    isFlushing = false;
    if (eventQueue.length) scheduleFlush();
  }
}

function installRouteDispatcher() {
  if (!canUseBrowserStorage()) return () => {};
  historyListenerCount += 1;

  if (historyListenerCount === 1) {
    originalPushState = window.history.pushState;
    patchedPushState = function patchedAnalyticsPushState(...args) {
      const before = getLogicalLocation()?.key;
      const result = originalPushState.apply(window.history, args);
      const after = getLogicalLocation()?.key;
      if (before !== after) window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      return result;
    };
    window.history.pushState = patchedPushState;
  }

  return () => {
    historyListenerCount = Math.max(0, historyListenerCount - 1);
    if (historyListenerCount === 0 && window.history.pushState === patchedPushState && originalPushState) {
      window.history.pushState = originalPushState;
      originalPushState = null;
      patchedPushState = null;
    }
  };
}

/**
 * Global public-site analytics. It tracks only page transitions made through
 * pushState/popstate/hash routes. replaceState calls (catalog filters, sort,
 * URL cleanup) intentionally never create page views.
 */
export function useAnalytics() {
  const { consent, hasConsent } = useAnalyticsConsent();
  const lastRouteKeyRef = useRef(null);
  const scrollMilestonesRef = useRef(new Set());
  const lastVisitTouchRef = useRef(0);

  useEffect(() => {
    // v1 used an indefinite localStorage identifier. Retire it even for a
    // visitor who refuses v2 analytics so the old tracking state cannot linger.
    removeLegacyAnalyticsState();
  }, []);

  useEffect(() => {
    if (!hasConsent) return undefined;

    // A revoked-and-restored consent starts a fresh, correctly labelled visit.
    lastRouteKeyRef.current = null;

    const trackPageView = () => {
      const location = getLogicalLocation();
      if (!location || location.key === lastRouteKeyRef.current) return;
      lastRouteKeyRef.current = location.key;
      scrollMilestonesRef.current = new Set();
      trackEvent('page_view', {
        pageType: location.pageType,
        locale: getLocale()
      }, {
        dedupeWindowMs: 1000
      });
    };

    // A visit is extended by meaningful local interaction, not merely by a
    // timer or a durable identifier. This updates only the in-tab expiry
    // timestamp; it does not queue an event or collect interaction details.
    const touchVisit = () => {
      const now = Date.now();
      if (now - lastVisitTouchRef.current < 15 * 1000) return;
      lastVisitTouchRef.current = now;
      getVisitId();
    };

    const handleRouteChange = () => trackPageView();
    const handleScroll = () => {
      touchVisit();
      const location = getLogicalLocation();
      if (!location) return;
      const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const scrollableHeight = documentHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const scrollPercent = Math.round((window.scrollY / scrollableHeight) * 100);
      [25, 50, 75, 100].forEach((milestone) => {
        const threshold = milestone === 100 ? 97 : milestone;
        if (scrollPercent < threshold || scrollMilestonesRef.current.has(milestone)) return;
        scrollMilestonesRef.current.add(milestone);
        trackEvent('scroll_depth', { depth: milestone }, { dedupeWindowMs: VISIT_IDLE_TIMEOUT_MS });
      });
    };

    let scrollTimer = null;
    const throttledScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = null;
        handleScroll();
      }, 350);
    };
    const handlePageHide = () => flushAnalytics({ useBeacon: true });
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushAnalytics({ useBeacon: true });
    };

    const uninstallRouteDispatcher = installRouteDispatcher();
    trackPageView();
    window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('pointerdown', touchVisit, { passive: true });
    window.addEventListener('keydown', touchVisit);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      uninstallRouteDispatcher();
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('pointerdown', touchVisit);
      window.removeEventListener('keydown', touchVisit);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, [hasConsent]);

  return { consent, hasConsent };
}

export function AnalyticsConsentBanner() {
  const { language } = useLanguage();
  const { consent, setConsent } = useAnalyticsConsent();
  const copy = CONSENT_COPY[language] || CONSENT_COPY.en;

  if (consent !== CONSENT_UNKNOWN) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-2xl rounded-2xl border border-[#D8CEB8] bg-[#FFFEFC] p-4 shadow-[0_18px_55px_rgba(35,26,17,0.24)] sm:inset-x-6 sm:bottom-6 sm:p-5"
    >
      <div className="sm:flex sm:items-end sm:justify-between sm:gap-6">
        <div className="max-w-xl">
          <h2 id="analytics-consent-title" className="font-serif text-lg font-bold text-[#111111]">
            {copy.title}
          </h2>
          <p className="mt-2 font-serif text-sm leading-relaxed text-[#51483F]">
            {copy.body}
          </p>
          <a href="/privacy" className="mt-2 inline-flex text-xs font-semibold text-[#745A27] underline underline-offset-4 hover:text-[#111111]">
            {copy.privacy}
          </a>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:min-w-48">
          <button
            type="button"
            onClick={() => setConsent(CONSENT_GRANTED)}
            className="min-h-11 rounded-md bg-[#1C1A17] px-4 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#8E7035]"
          >
            {copy.accept}
          </button>
          <button
            type="button"
            onClick={() => setConsent(CONSENT_DENIED)}
            className="min-h-11 rounded-md border border-[#CFC3B2] bg-white px-4 font-sans text-xs font-bold uppercase tracking-[0.12em] text-[#332D27] transition-colors hover:border-[#8E7035]"
          >
            {copy.reject}
          </button>
        </div>
      </div>
    </section>
  );
}

export function AnalyticsConsentSettings() {
  const { language } = useLanguage();
  const { hasConsent, setConsent } = useAnalyticsConsent();
  const copy = CONSENT_COPY[language] || CONSENT_COPY.en;

  return (
    <section className="rounded-xl border border-[#D8CEB8] bg-[#FCFAF6] p-5 sm:p-6" aria-labelledby="analytics-settings-title">
      <h3 id="analytics-settings-title" className="font-serif text-xl font-bold text-[#111111]">
        {copy.settingsTitle}
      </h3>
      <p className="mt-2 max-w-2xl font-serif text-sm leading-relaxed text-[#51483F]">
        {copy.settingsBody}
      </p>
      <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#745A27]">
        {hasConsent ? copy.enabled : copy.disabled}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setConsent(CONSENT_GRANTED)}
          className="min-h-11 rounded-md bg-[#1C1A17] px-4 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#8E7035]"
        >
          {copy.allow}
        </button>
        <button
          type="button"
          onClick={() => setConsent(CONSENT_DENIED)}
          className="min-h-11 rounded-md border border-[#CFC3B2] bg-white px-4 font-sans text-xs font-bold uppercase tracking-[0.12em] text-[#332D27] transition-colors hover:border-[#8E7035]"
        >
          {copy.disable}
        </button>
      </div>
    </section>
  );
}
