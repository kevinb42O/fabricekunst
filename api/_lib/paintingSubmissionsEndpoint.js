import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getServerSupabase, requireActiveAdmin, sendJson } from './adminAuth.js';

const BUCKET = 'painting-submissions';
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const LOCAL_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]);

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const receiptSecret = () => process.env.INQUIRY_RATE_LIMIT_SALT || '';

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

export const hasAllowedOrigin = (req) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin.replace(/\/$/, '') : '';
  if (!origin) return process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
  const configured = new Set(
    String(process.env.INQUIRY_ALLOWED_ORIGINS || process.env.ANALYTICS_ALLOWED_ORIGINS || '')
      .split(',')
      .map((entry) => entry.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
  if (configured.size) return configured.has(origin);
  if (LOCAL_ORIGINS.has(origin)) {
    return process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
  }
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
  for (const header of ['x-vercel-forwarded-for', 'x-forwarded-for', 'x-real-ip']) {
    const value = req.headers[header];
    if (typeof value === 'string' && value.trim()) return value.split(',')[0].trim();
  }
  return 'unavailable';
};

const rateBucket = (req, scope) => {
  const secret = receiptSecret();
  if (secret.length < 32) return null;
  const window = Math.floor(Date.now() / RATE_WINDOW_MS);
  return createHmac('sha256', secret)
    .update(`painting-submission:${scope}:${window}:${clientIp(req)}`)
    .digest('hex');
};

const consumeRateLimit = async (supabase, req, scope, limit) => {
  const bucket = rateBucket(req, scope);
  if (!bucket) return false;
  const { data, error } = await supabase.rpc('consume_inquiry_rate_limit', {
    p_bucket_key: bucket,
    p_limit: limit,
    p_cost: 1,
  });
  if (error) throw error;
  return data === true;
};

const normalize = (value, maximum, { required = false, multiline = false } = {}) => {
  if (value === undefined || value === null || value === '') return required ? null : '';
  if (typeof value !== 'string') return null;
  const text = value.normalize('NFC').replace(/\r\n?/g, '\n').trim();
  if ((required && !text) || text.length > maximum) return null;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return null;
  if (!multiline && /[\r\n\t]/.test(text)) return null;
  return text;
};

const normalizeEmail = (value) => {
  const email = normalize(value, 320, { required: true });
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.toLowerCase() : null;
};

const safeFilename = (filename) => {
  const cleaned = String(filename || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-120);
  return cleaned || 'attachment';
};

export const createReceipt = (payload) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', receiptSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

export const readReceipt = (receipt) => {
  if (typeof receipt !== 'string' || !receipt.includes('.')) return null;
  const parts = receipt.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = createHmac('sha256', receiptSecret()).update(encoded).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!isPlainObject(payload) || Number(payload.expiresAt) < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

const prepareUpload = async (req, res, supabase, body) => {
  const filename = normalize(body.filename, 180, { required: true });
  const contentType = normalize(body.contentType, 100, { required: true });
  const size = Number(body.size);
  if (!filename || !ALLOWED_TYPES.has(contentType) || !Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_BYTES) {
    return sendJson(res, 400, { error: 'Selecteer een JPG-, PNG-, WebP- of PDF-bestand van maximaal 15 MB.' });
  }
  if (!(await consumeRateLimit(supabase, req, 'upload', 10))) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return sendJson(res, 429, { error: 'Te veel uploadpogingen. Probeer het later opnieuw.' });
  }

  const claimId = randomUUID();
  const path = `pending/${new Date().toISOString().slice(0, 10)}/${claimId}/${safeFilename(filename)}`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data?.token) {
    console.error('[painting-submissions] Signed upload creation failed:', error?.message || 'No token returned.');
    return sendJson(res, 503, { error: 'De beveiligde upload kon niet worden voorbereid.' });
  }
  const receipt = createReceipt({ path, filename, contentType, size, expiresAt: Date.now() + 30 * 60 * 1000 });
  return sendJson(res, 200, { path, token: data.token, receipt });
};

export const validateAttachments = (attachments) => {
  if (!Array.isArray(attachments) || attachments.length < 1 || attachments.length > MAX_ATTACHMENTS) return null;
  const verified = [];
  const paths = new Set();
  let total = 0;
  for (const attachment of attachments) {
    if (!isPlainObject(attachment)) return null;
    const payload = readReceipt(attachment.receipt);
    if (
      !payload ||
      payload.path !== attachment.path ||
      !/^pending\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/i.test(payload.path) ||
      !ALLOWED_TYPES.has(payload.contentType) ||
      !Number.isSafeInteger(payload.size) ||
      payload.size < 1 ||
      payload.size > MAX_FILE_BYTES ||
      paths.has(payload.path)
    ) return null;
    paths.add(payload.path);
    total += Number(payload.size) || 0;
    if (total > MAX_TOTAL_BYTES) return null;
    verified.push({
      path: payload.path,
      name: payload.filename,
      contentType: payload.contentType,
      size: payload.size,
    });
  }
  return verified;
};

const verifyStoredAttachments = async (supabase, attachments) => {
  for (const attachment of attachments) {
    const { data, error } = await supabase.storage.from(BUCKET).info(attachment.path);
    if (error || !data) return false;
    const storedSize = Number(data.size ?? data.metadata?.size);
    const storedType = data.contentType || data.metadata?.mimetype;
    if (
      !Number.isSafeInteger(storedSize) ||
      storedSize !== attachment.size ||
      (storedType && storedType !== attachment.contentType)
    ) {
      return false;
    }
  }
  return true;
};

const cleanupUploads = async (res, supabase, body) => {
  const attachments = validateAttachments(body.attachments || []);
  if (!attachments) return sendJson(res, 400, { error: 'Ongeldige uploadbewijzen.' });
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove(attachments.map((attachment) => attachment.path));
  if (error) throw error;
  return sendJson(res, 200, { ok: true });
};

const submitPainting = async (req, res, supabase, body) => {
  if (!(await consumeRateLimit(supabase, req, 'submit', 3))) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return sendJson(res, 429, { error: 'Te veel inzendingen. Probeer het later opnieuw.' });
  }
  const data = {
    name: normalize(body.name, 200, { required: true }),
    email: normalizeEmail(body.email),
    phone: normalize(body.phone, 100),
    country: normalize(body.country, 120),
    paintingTitle: normalize(body.paintingTitle, 300, { required: true }),
    estimatedDate: normalize(body.estimatedDate, 120),
    dimensions: normalize(body.dimensions, 240, { required: true }),
    support: normalize(body.support, 160, { required: true }),
    signature: normalize(body.signature, 1000, { multiline: true }),
    provenance: normalize(body.provenance, 5000, { multiline: true }),
    notes: normalize(body.notes, 5000, { multiline: true }),
    preferredLanguage: ['nl', 'en', 'fr'].includes(body.preferredLanguage) ? body.preferredLanguage : 'en',
  };
  const attachments = validateAttachments(body.attachments || []);
  if (Object.values(data).some((value) => value === null) || !attachments || body.consent !== true) {
    return sendJson(res, 400, { error: 'Controleer de verplichte velden en de toestemming.' });
  }
  if (!(await verifyStoredAttachments(supabase, attachments))) {
    return sendJson(res, 400, { error: 'Een of meer bijlagen ontbreken of komen niet overeen met de upload.' });
  }

  const timestamp = new Date().toISOString();
  const id = `inq-${randomUUID()}`;
  const message = [
    `Schilderij: ${data.paintingTitle}`,
    `Afmetingen: ${data.dimensions}`,
    `Drager: ${data.support}`,
    data.estimatedDate && `Vermoedelijke periode: ${data.estimatedDate}`,
    data.signature && `Signatuur of datering: ${data.signature}`,
    data.provenance && `Provenance: ${data.provenance}`,
    data.notes && `Aanvullende informatie: ${data.notes}`,
  ].filter(Boolean).join('\n\n');

  const { data: inserted, error } = await supabase
    .from('inquiries')
    .insert({
      id,
      date: timestamp,
      created_at: timestamp,
      item_title: data.paintingTitle,
      item_ref: 'LOST-REMBRANDT',
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      type: 'painting_submission',
      message,
      status: 'Nieuw',
      notes: null,
      metadata: {
        country: data.country,
        estimatedDate: data.estimatedDate,
        dimensions: data.dimensions,
        support: data.support,
        signature: data.signature,
        provenance: data.provenance,
        preferredLanguage: data.preferredLanguage,
      },
      attachments,
      notification_sent_at: null,
    })
    .select('id, date, created_at, status')
    .single();
  if (error || !inserted) {
    console.error('[painting-submissions] Insert failed:', error?.message || 'No row returned.');
    await supabase.storage.from(BUCKET).remove(attachments.map((attachment) => attachment.path)).catch(() => {});
    return sendJson(res, 503, { error: 'Uw inzending kon tijdelijk niet worden opgeslagen.' });
  }
  return sendJson(res, 201, {
    inquiry: { id: inserted.id, date: inserted.date, createdAt: inserted.created_at, status: inserted.status },
  });
};

const attachmentUrl = async (req, res, supabase) => {
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });
  const inquiryId = Array.isArray(req.query?.inquiryId) ? req.query.inquiryId[0] : req.query?.inquiryId;
  const path = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;
  if (!/^inq-[0-9a-f-]{36}$/i.test(inquiryId || '') || typeof path !== 'string') {
    return sendJson(res, 400, { error: 'Ongeldige bijlage.' });
  }
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select('attachments')
    .eq('id', inquiryId)
    .maybeSingle();
  if (error || !inquiry) return sendJson(res, 404, { error: 'De inzending bestaat niet meer.' });
  const allowed = Array.isArray(inquiry.attachments) && inquiry.attachments.some((entry) => entry?.path === path);
  if (!allowed) return sendJson(res, 404, { error: 'De bijlage hoort niet bij deze inzending.' });
  const { data, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(path, 10 * 60);
  if (signedError || !data?.signedUrl) return sendJson(res, 503, { error: 'De bijlage kan tijdelijk niet worden geopend.' });
  return sendJson(res, 200, { url: data.signedUrl });
};

const deleteInquiry = async (req, res, supabase) => {
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });
  const inquiryId = Array.isArray(req.query?.inquiryId) ? req.query.inquiryId[0] : req.query?.inquiryId;
  if (!/^inq-[0-9a-f-]{36}$/i.test(inquiryId || '')) {
    return sendJson(res, 400, { error: 'Ongeldige aanvraag.' });
  }
  const { data: inquiry, error: readError } = await supabase
    .from('inquiries')
    .select('attachments')
    .eq('id', inquiryId)
    .maybeSingle();
  if (readError) throw readError;
  if (!inquiry) return sendJson(res, 404, { error: 'De aanvraag bestaat niet meer.' });
  const paths = Array.isArray(inquiry.attachments)
    ? inquiry.attachments.map((entry) => entry?.path).filter(Boolean)
    : [];
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
    if (storageError) throw storageError;
  }
  const { error: deleteError } = await supabase.from('inquiries').delete().eq('id', inquiryId);
  if (deleteError) throw deleteError;
  return sendJson(res, 200, { ok: true });
};

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE', 'OPTIONS'].includes(req.method)) return sendJson(res, 405, { error: 'Method not allowed.' });
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(204).end();
  }
  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJson(res, 503, { error: 'Inzendingen zijn tijdelijk niet beschikbaar.' });
  }
  if (req.method === 'POST' && receiptSecret().length < 32) {
    return sendJson(res, 503, { error: 'Inzendingen zijn tijdelijk niet beschikbaar.' });
  }
  if (req.method === 'GET') return attachmentUrl(req, res, supabase);
  if (req.method === 'DELETE') return deleteInquiry(req, res, supabase);
  const contentLength = Number.parseInt(req.headers['content-length'] || '0', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return sendJson(res, 413, { error: 'De inzending is te groot.' });
  }
  if (!hasAllowedOrigin(req)) return sendJson(res, 403, { error: 'Inzendingen moeten vanaf deze website worden verstuurd.' });
  const body = parseBody(req);
  if (!body) return sendJson(res, 400, { error: 'Ongeldige inzending.' });
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return sendJson(res, 413, { error: 'De inzending is te groot.' });
  }
  try {
    if (body.action === 'prepare-upload') return prepareUpload(req, res, supabase, body);
    if (body.action === 'submit') return submitPainting(req, res, supabase, body);
    if (body.action === 'cleanup') return cleanupUploads(res, supabase, body);
    return sendJson(res, 400, { error: 'Onbekende inzendingsactie.' });
  } catch (error) {
    console.error('[painting-submissions] Request failed:', error.message);
    return sendJson(res, 503, { error: 'Inzendingen zijn tijdelijk niet beschikbaar.' });
  }
}
