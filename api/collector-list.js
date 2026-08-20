import { createHash, createHmac, randomBytes } from 'node:crypto';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';

const MAX_BODY_BYTES = 8 * 1024;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const LOCALES = new Set(['nl', 'en', 'fr']);
const STATUSES = new Set(['pending', 'active', 'unsubscribed']);
const LOCAL_ORIGINS = new Set(['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173']);

const copy = {
  nl: {
    subject: 'Bevestig uw plaats op de Collector’s List',
    title: 'Bevestig uw inschrijving',
    body: 'Klik op de onderstaande knop om als eerste nieuwe aanwinsten van Atelier Rembrandt te ontdekken.',
    action: 'Inschrijving bevestigen',
    confirmed: 'Uw inschrijving is bevestigd.',
    unsubscribed: 'U bent uitgeschreven van de Collector’s List.',
    invalid: 'Deze link is ongeldig of verlopen.'
  },
  en: {
    subject: 'Confirm your place on the Collector’s List',
    title: 'Confirm your subscription',
    body: 'Use the button below to receive Atelier Rembrandt’s new acquisitions before they are publicly offered.',
    action: 'Confirm subscription',
    confirmed: 'Your subscription has been confirmed.',
    unsubscribed: 'You have been unsubscribed from the Collector’s List.',
    invalid: 'This link is invalid or has expired.'
  },
  fr: {
    subject: 'Confirmez votre inscription à la liste des collectionneurs',
    title: 'Confirmez votre inscription',
    body: 'Utilisez le bouton ci-dessous pour découvrir les nouvelles acquisitions d’Atelier Rembrandt avant leur mise en vente publique.',
    action: 'Confirmer l’inscription',
    confirmed: 'Votre inscription est confirmée.',
    unsubscribed: 'Vous êtes désinscrit de la liste des collectionneurs.',
    invalid: 'Ce lien est invalide ou a expiré.'
  }
};

const parseBody = (req) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) return req.body;
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    return typeof raw === 'string' ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const configuredOrigins = () => new Set(String(process.env.COLLECTOR_LIST_ALLOWED_ORIGINS || process.env.ANALYTICS_ALLOWED_ORIGINS || '')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean));

const requestOrigin = (req) => typeof req.headers.origin === 'string' ? req.headers.origin.replace(/\/$/, '') : '';

const allowedOrigin = (req) => {
  const origin = requestOrigin(req);
  if (!origin) return req.method === 'GET' || process.env.NODE_ENV === 'development';
  const configured = configuredOrigins();
  if (configured.size) return configured.has(origin);
  if (LOCAL_ORIGINS.has(origin)) return true;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  try { return new URL(origin).host.toLowerCase() === host; } catch { return false; }
};

const clientIp = (req) => String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unavailable').split(',')[0].trim();
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
const makeToken = () => randomBytes(32).toString('base64url');

const rateBucket = (req) => {
  const salt = process.env.COLLECTOR_LIST_RATE_LIMIT_SALT;
  if (!salt || salt.length < 32) return null;
  const window = Math.floor(Date.now() / RATE_WINDOW_MS);
  return createHmac('sha256', salt).update(`collector-list:${window}:${clientIp(req)}`).digest('hex');
};

const cleanText = (value, maximum) => {
  if (typeof value !== 'string') return null;
  const result = value.normalize('NFC').trim();
  return result && result.length <= maximum && !/[\u0000-\u001f\u007f]/.test(result) ? result : null;
};

const validEmail = (value) => {
  const email = cleanText(value, 320)?.toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const publicSiteUrl = (req) => {
  const configured = String(process.env.COLLECTOR_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (configured) return configured;
  const origin = requestOrigin(req);
  return allowedOrigin(req) && origin ? origin : 'https://www.atelierrembrandt.com';
};

const confirmationEmail = ({ locale, confirmUrl }) => {
  const labels = copy[locale] || copy.en;
  return {
    subject: labels.subject,
    html: `<!doctype html><html><body style="margin:0;background:#f7f3ec;color:#1c1a17;font-family:Georgia,serif"><div style="max-width:620px;margin:0 auto;padding:48px 24px"><p style="font:700 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#8e7035">Atelier Rembrandt</p><h1 style="font-size:36px;line-height:1.1">${labels.title}</h1><p style="font-size:17px;line-height:1.7;color:#554b41">${labels.body}</p><p style="margin:32px 0"><a href="${confirmUrl}" style="display:inline-block;background:#1c1a17;color:#fff;padding:16px 22px;font:700 11px Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none">${labels.action}</a></p><p style="font:12px/1.6 Arial,sans-serif;color:#786e64">Atelier Rembrandt · contact@atelierrembrandt.com</p></div></body></html>`
  };
};

const sendConfirmation = async ({ email, locale, confirmUrl }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COLLECTOR_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const message = confirmationEmail({ locale, confirmUrl });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [email], subject: message.subject, html: message.html })
  });
  if (!response.ok) throw new Error(`Confirmation email rejected (${response.status}).`);
  return true;
};

const renderResultPage = (res, locale, message, success) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(success ? 200 : 400).send(`<!doctype html><html lang="${locale}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atelier Rembrandt</title><body style="margin:0;background:#f7f3ec;color:#1c1a17;font-family:Georgia,serif"><main style="min-height:100vh;display:grid;place-items:center;padding:24px"><div style="max-width:620px;border:1px solid #d8ceb8;background:#fff;padding:48px;text-align:center"><p style="font:700 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#8e7035">Atelier Rembrandt</p><h1 style="font-size:36px;line-height:1.15">${message}</h1><a href="/" style="display:inline-block;margin-top:24px;color:#4a1521">Atelier Rembrandt</a></div></main></body></html>`);
};

const handleTokenAction = async (req, res, supabase) => {
  const action = req.query?.action;
  const token = typeof req.query?.token === 'string' ? req.query.token : '';
  const locale = LOCALES.has(req.query?.locale) ? req.query.locale : 'en';
  if (!['confirm', 'unsubscribe'].includes(action) || token.length < 32 || token.length > 100) {
    return renderResultPage(res, locale, copy[locale].invalid, false);
  }
  const hashColumn = action === 'confirm' ? 'confirmation_token_hash' : 'unsubscribe_token_hash';
  const { data } = await supabase.from('collector_subscribers').select('id, status').eq(hashColumn, tokenHash(token)).maybeSingle();
  if (!data) return renderResultPage(res, locale, copy[locale].invalid, false);
  const timestamp = new Date().toISOString();
  const changes = action === 'confirm'
    ? { status: 'active', confirmed_at: timestamp, confirmation_token_hash: null, updated_at: timestamp }
    : { status: 'unsubscribed', unsubscribed_at: timestamp, updated_at: timestamp };
  const { error } = await supabase.from('collector_subscribers').update(changes).eq('id', data.id);
  if (error) return renderResultPage(res, locale, copy[locale].invalid, false);
  return renderResultPage(res, locale, action === 'confirm' ? copy[locale].confirmed : copy[locale].unsubscribed, true);
};

const handleAdmin = async (req, res, supabase) => {
  const auth = await requireActiveAdmin(req, supabase);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('collector_subscribers').select('id,email,locale,status,source,source_path,consent_version,consented_at,confirmed_at,unsubscribed_at,created_at,updated_at').order('created_at', { ascending: false }).limit(5000);
    return error ? sendJson(res, 503, { error: 'Inschrijvingen konden niet worden geladen.' }) : sendJson(res, 200, { subscribers: data || [] });
  }
  if (req.method === 'PATCH') {
    const body = parseBody(req);
    if (!body?.id || !STATUSES.has(body.status)) return sendJson(res, 400, { error: 'Ongeldige statuswijziging.' });
    const now = new Date().toISOString();
    const changes = { status: body.status, updated_at: now, unsubscribed_at: body.status === 'unsubscribed' ? now : null, confirmed_at: body.status === 'active' ? now : undefined };
    Object.keys(changes).forEach((key) => changes[key] === undefined && delete changes[key]);
    const { error } = await supabase.from('collector_subscribers').update(changes).eq('id', body.id);
    return error ? sendJson(res, 503, { error: 'Status kon niet worden bijgewerkt.' }) : sendJson(res, 200, { success: true });
  }
  return sendJson(res, 405, { error: 'Method not allowed.' });
};

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const supabase = getServerSupabase();
  if (!supabase) return sendJson(res, 503, { error: 'Inschrijven is tijdelijk niet beschikbaar.' });

  if (req.query?.admin === '1') return handleAdmin(req, res, supabase);
  if (req.method === 'GET') return handleTokenAction(req, res, supabase);
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!allowedOrigin(req)) return sendJson(res, 403, { error: 'Request must originate from this site.' });
  const contentLength = Number.parseInt(req.headers['content-length'] || '0', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return sendJson(res, 413, { error: 'Payload is too large.' });

  const body = parseBody(req);
  if (body?.website) return sendJson(res, 200, { success: true, status: 'active' });
  const email = validEmail(body?.email);
  const locale = LOCALES.has(body?.locale) ? body.locale : null;
  const source = cleanText(body?.source, 80);
  const sourcePath = cleanText(body?.sourcePath, 500);
  const consentVersion = cleanText(body?.consentVersion, 100);
  if (!email || !locale || !source || !sourcePath || !consentVersion || body?.consent !== true) return sendJson(res, 400, { error: 'Controleer uw e-mailadres en toestemming.' });

  const bucket = rateBucket(req);
  if (!bucket) return sendJson(res, 503, { error: 'Inschrijven is tijdelijk niet beschikbaar.' });
  const { data: allowed, error: limitError } = await supabase.rpc('consume_collector_list_rate_limit', { p_bucket_key: bucket, p_limit: 5 });
  if (limitError || !allowed) {
    if (!limitError) res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return sendJson(res, limitError ? 503 : 429, { error: 'Probeer het later opnieuw.' });
  }

  const now = new Date().toISOString();
  const confirmToken = makeToken();
  const unsubscribeToken = makeToken();
  const doubleOptIn = Boolean(process.env.RESEND_API_KEY && process.env.COLLECTOR_FROM_EMAIL);
  const { data: existingSubscriber, error: existingError } = await supabase
    .from('collector_subscribers')
    .select('id,status')
    .eq('normalized_email', email)
    .maybeSingle();
  if (existingError) return sendJson(res, 503, { error: 'Inschrijving kon niet worden gecontroleerd.' });
  if (existingSubscriber?.status === 'active') {
    return sendJson(res, 200, { success: true, status: 'active' });
  }
  const row = {
    email,
    normalized_email: email,
    locale,
    status: doubleOptIn ? 'pending' : 'active',
    source,
    source_path: sourcePath,
    consent_version: consentVersion,
    consented_at: now,
    confirmed_at: doubleOptIn ? null : now,
    unsubscribed_at: null,
    confirmation_token_hash: doubleOptIn ? tokenHash(confirmToken) : null,
    unsubscribe_token_hash: tokenHash(unsubscribeToken),
    confirmation_sent_at: doubleOptIn ? now : null,
    updated_at: now
  };

  const { data, error } = await supabase.from('collector_subscribers').upsert(row, { onConflict: 'normalized_email' }).select('id,status').single();
  if (error || !data) return sendJson(res, 503, { error: 'Inschrijving kon niet worden opgeslagen.' });

  if (doubleOptIn) {
    const confirmUrl = `${publicSiteUrl(req)}/api/collector-list?action=confirm&locale=${locale}&token=${encodeURIComponent(confirmToken)}`;
    try { await sendConfirmation({ email, locale, confirmUrl }); }
    catch (error) {
      console.error('[collector-list] Confirmation delivery failed:', error.message);
      return sendJson(res, 503, { error: 'Bevestigingsmail kon niet worden verzonden.' });
    }
  }

  return sendJson(res, 201, { success: true, status: data.status });
}
