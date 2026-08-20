import { createHmac, randomUUID } from 'node:crypto';
import { getServerSupabase, sendJson } from './_lib/adminAuth.js';

const MAX_BODY_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const ALLOWED_BODY_KEYS = new Set(['itemTitle', 'itemRef', 'name', 'email', 'phone', 'type', 'message']);
const LOCAL_DEVELOPMENT_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]);

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

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

const configuredOrigins = () => {
  const raw = process.env.INQUIRY_ALLOWED_ORIGINS || process.env.ANALYTICS_ALLOWED_ORIGINS || '';
  return new Set(raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean));
};

const hasAllowedOrigin = (req) => {
  const origin = typeof req.headers.origin === 'string'
    ? req.headers.origin.replace(/\/$/, '')
    : '';
  const allowed = configuredOrigins();

  // A same-origin browser fetch/sendBeacon POST carries Origin. Only a local
  // development runtime may omit it; deployed preview URLs are public too.
  if (!origin) return process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
  if (allowed.size > 0) return allowed.has(origin);
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

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return 'unavailable';
};

const rateLimitBucket = (req) => {
  const secret = process.env.INQUIRY_RATE_LIMIT_SALT;
  if (!secret || secret.length < 32) return null;

  const window = Math.floor(Date.now() / RATE_WINDOW_MS);
  return createHmac('sha256', secret)
    .update(`inquiry:${window}:${clientIp(req)}`)
    .digest('hex');
};

const rateLimit = () => {
  const parsed = Number.parseInt(process.env.INQUIRY_RATE_LIMIT_PER_10_MINUTES || '3', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 10) : 3;
};

const hasForbiddenControlCharacter = (value) => /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);

const normalizeText = (value, { minimum = 0, maximum, multiline = false } = {}) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;

  const normalized = value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .trim();
  if (!normalized || normalized.length < minimum || normalized.length > maximum) return null;
  if (hasForbiddenControlCharacter(normalized)) return null;
  if (!multiline && /[\r\n\t]/.test(normalized)) return null;
  return normalized;
};

const normalizeOptionalText = (value, options) => {
  if (value === undefined || value === null || value === '') return null;
  return normalizeText(value, options);
};

const normalizeEmail = (value) => {
  const email = normalizeText(value, { minimum: 3, maximum: 320 });
  if (!email) return null;
  // Deliberately pragmatic rather than RFC-complete: the form should accept
  // ordinary addresses while rejecting malformed/control-character payloads.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email.toLowerCase();
};

const normalizePhone = (value) => {
  const phone = normalizeOptionalText(value, { minimum: 6, maximum: 100 });
  if (phone === null && (value === undefined || value === null || value === '')) return null;
  if (!phone || !/^[0-9+().\s/-]+$/.test(phone)) return null;
  return phone;
};

const validateInquiry = (body) => {
  if (!isPlainObject(body)) return null;
  if (Object.keys(body).some((key) => !ALLOWED_BODY_KEYS.has(key))) return null;

  const name = normalizeText(body.name, { minimum: 2, maximum: 200 });
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const itemTitle = normalizeOptionalText(body.itemTitle, { minimum: 1, maximum: 500 });
  const itemRef = normalizeOptionalText(body.itemRef, { minimum: 1, maximum: 100 });
  const type = normalizeOptionalText(body.type, { minimum: 1, maximum: 160 });
  const message = normalizeText(body.message, { minimum: 3, maximum: 5000, multiline: true });

  if (!name || !email || !message) return null;
  if (body.phone !== undefined && body.phone !== null && body.phone !== '' && !phone) return null;
  if (body.itemTitle !== undefined && body.itemTitle !== null && body.itemTitle !== '' && !itemTitle) return null;
  if (body.itemRef !== undefined && body.itemRef !== null && body.itemRef !== '' && !itemRef) return null;
  if (body.type !== undefined && body.type !== null && body.type !== '' && !type) return null;

  return { name, email, phone, itemTitle, itemRef, type, message };
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
    return sendJson(res, 413, { error: 'Inquiry payload is too large.' });
  }
  if (!hasAllowedOrigin(req)) {
    return sendJson(res, 403, { error: 'Inquiry requests must originate from this site.' });
  }

  const supabase = getServerSupabase();
  if (!supabase || !process.env.INQUIRY_RATE_LIMIT_SALT || process.env.INQUIRY_RATE_LIMIT_SALT.length < 32) {
    console.error('[inquiries] Required server configuration is missing.');
    return sendJson(res, 503, { error: 'Aanvragen zijn tijdelijk niet beschikbaar.' });
  }

  const body = parseBody(req);
  const inquiry = validateInquiry(body);
  if (!inquiry) {
    return sendJson(res, 400, { error: 'Controleer de ingevulde aanvraaggegevens.' });
  }

  const bucketKey = rateLimitBucket(req);
  if (!bucketKey) return sendJson(res, 503, { error: 'Aanvragen zijn tijdelijk niet beschikbaar.' });

  const { data: allowed, error: rateLimitError } = await supabase.rpc('consume_inquiry_rate_limit', {
    p_bucket_key: bucketKey,
    p_limit: rateLimit(),
    p_cost: 1,
  });
  if (rateLimitError) {
    console.error('[inquiries] Rate-limit check failed:', rateLimitError.message);
    return sendJson(res, 503, { error: 'Aanvragen zijn tijdelijk niet beschikbaar.' });
  }
  if (!allowed) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return sendJson(res, 429, { error: 'Te veel aanvragen. Probeer het over enkele minuten opnieuw.' });
  }

  const timestamp = new Date().toISOString();
  const row = {
    id: `inq-${randomUUID()}`,
    date: timestamp,
    created_at: timestamp,
    item_title: inquiry.itemTitle,
    item_ref: inquiry.itemRef,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    type: inquiry.type,
    message: inquiry.message,
    status: 'Nieuw',
    notes: null,
    notification_sent_at: null,
  };

  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert(row)
      .select('id, date, created_at, status')
      .single();
    if (error || !data) {
      console.error('[inquiries] Insert failed:', error?.message || 'No row returned.');
      return sendJson(res, 503, { error: 'Uw aanvraag kon tijdelijk niet worden opgeslagen.' });
    }

    return sendJson(res, 201, {
      inquiry: {
        id: data.id,
        date: data.date,
        createdAt: data.created_at,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('[inquiries] Unexpected submission failure:', error.message);
    return sendJson(res, 503, { error: 'Uw aanvraag kon tijdelijk niet worden opgeslagen.' });
  }
}
