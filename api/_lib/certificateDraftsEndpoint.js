import { randomUUID } from 'node:crypto';
import { getServerSupabase, requireActiveAdmin, sendJson } from './adminAuth.js';
import {
  CERTIFICATE_FIELDS, CERTIFICATE_OPTIONS, CERTIFICATE_LANGUAGES,
  certificateDraftKey, normalizeCertificateDraft,
} from '../../src/utils/certificateDrafts.js';

const MAX_BYTES = 64 * 1024;
const validIdentity = (itemId, language) => typeof itemId === 'string'
  && /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/.test(itemId)
  && CERTIFICATE_LANGUAGES.includes(language);

export function parseCertificateSave(body) {
  if (!body || !validIdentity(body.itemId, body.language)
    || !(body.expectedVersion === null || (typeof body.expectedVersion === 'string' && /^[a-f0-9-]{36}$/.test(body.expectedVersion)))
    || !body.draft || typeof body.draft !== 'object' || Array.isArray(body.draft)
    || Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BYTES
    || CERTIFICATE_FIELDS.some(field => typeof body.draft[field] !== 'string' || body.draft[field].length > 12000)
    || CERTIFICATE_OPTIONS.some(field => typeof body.draft[field] !== 'boolean')
    || Object.keys(body.draft).some(field => ![...CERTIFICATE_FIELDS, ...CERTIFICATE_OPTIONS].includes(field))) return null;
  return { ...body, draft: normalizeCertificateDraft(body.draft) };
}

// Private certificate drafts use the existing admin-only settings table. Its
// public publication allow-list deliberately excludes certificate_draft_*.
export const createCertificateDraftsHandler = ({ getSupabase = getServerSupabase, authorize = requireActiveAdmin } = {}) => async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) return sendJson(res, 405, { error: 'Method Not Allowed' });
  if (Number(req.headers?.['content-length'] || 0) > MAX_BYTES) return sendJson(res, 413, { error: 'Het certificaat is te groot.' });
  const supabase = getSupabase();
  const auth = await authorize(req, supabase);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
  const input = req.method === 'POST' ? parseCertificateSave(req.body) : req.query;
  if (!input || !validIdentity(input.itemId, input.language)) return sendJson(res, 400, { error: 'Ongeldige certificaatgegevens.' });
  try {
    const key = certificateDraftKey(input.itemId, input.language);
    const { data: item, error: itemError } = await supabase.from('items').select('id').eq('id', input.itemId).maybeSingle();
    if (itemError) throw itemError;
    if (!item) return sendJson(res, 404, { error: 'Dit object bestaat niet meer in de catalogus.' });
    const { data: row, error: readError } = await supabase.from('admin_settings').select('value').eq('key', key).maybeSingle();
    if (readError) throw readError;
    const current = row ? JSON.parse(row.value) : null;
    if (req.method === 'GET') return sendJson(res, 200, { ok: true, draft: current ? normalizeCertificateDraft(current.draft) : null, version: current?.version ?? null });
    const conflict = () => sendJson(res, 409, { error: 'Dit certificaat is ondertussen in een andere sessie gewijzigd. Uw invoer blijft behouden. Herlaad de opgeslagen versie voordat u opnieuw opslaat.' });
    if (input.expectedVersion !== (current?.version ?? null)) return conflict();
    const version = randomUUID();
    const value = JSON.stringify({ version, draft: input.draft });
    const record = { key, value, updated_at: new Date().toISOString() };
    // Compare the entire previous value (including its unique version) inside
    // the UPDATE; checking a version before an unconditional upsert is racy.
    const result = row
      ? await supabase.from('admin_settings').update(record).eq('key', key).eq('value', row.value).select('key').maybeSingle()
      : await supabase.from('admin_settings').insert(record).select('key').single();
    if (result.error?.code === '23505' || (!result.error && !result.data)) return conflict();
    if (result.error) throw result.error;
    return sendJson(res, 200, { ok: true, draft: input.draft, version });
  } catch (error) {
    console.error('[certificate-drafts]', error?.message || error);
    return sendJson(res, 503, { error: 'Het certificaat kon niet worden geladen of opgeslagen. Uw invoer blijft behouden.' });
  }
};

export default createCertificateDraftsHandler();
