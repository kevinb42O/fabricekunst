import { timingSafeEqual } from 'node:crypto';
import { getServerSupabase, sendJson } from './adminAuth.js';
import { hashPreviewToken, isValidPreviewToken } from './rembrandtPreviewToken.js';
import { publishedRembrandtProject } from '../../src/utils/rembrandtProject.js';
import { cloneDefaultRembrandtProject } from '../../src/data/defaultRembrandtProject.js';
import { mutatePreviewLinks, readPreviewLinks } from './rembrandtPreviewStore.js';

const attempts = new Map();
const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 30;

const requestAddress = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
  .split(',')[0]
  .trim()
  .slice(0, 80);

const isRateLimited = (req) => {
  const now = Date.now();
  const key = requestAddress(req);
  if (attempts.size > 500) {
    for (const [address, entry] of attempts) {
      if (now - entry.startedAt >= ATTEMPT_WINDOW_MS) attempts.delete(address);
    }
  }
  const current = attempts.get(key);
  if (!current || now - current.startedAt >= ATTEMPT_WINDOW_MS) {
    while (attempts.size >= 1000) attempts.delete(attempts.keys().next().value);
    attempts.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS_PER_WINDOW;
};

const parseProject = (value) => {
  try {
    return publishedRembrandtProject(typeof value === 'string' ? JSON.parse(value) : value);
  } catch {
    return { ...cloneDefaultRembrandtProject(), isEnabled: false };
  }
};

const safeHashEqual = (left, right) => {
  if (!/^[0-9a-f]{64}$/.test(left || '') || !/^[0-9a-f]{64}$/.test(right || '')) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
  if (isRateLimited(req)) return sendJson(res, 429, { error: 'Te veel pogingen. Probeer het over een minuut opnieuw.' });
  const token = req.body?.token;
  if (!isValidPreviewToken(token)) return sendJson(res, 404, { error: 'Deze privélink is ongeldig of niet meer actief.' });
  const supabase = getServerSupabase();
  if (!supabase) return sendJson(res, 503, { error: 'De privépreview is tijdelijk niet beschikbaar.' });

  let previewLinks;
  try {
    previewLinks = await readPreviewLinks(supabase);
  } catch {
    return sendJson(res, 503, { error: 'De privépreview is tijdelijk niet beschikbaar.' });
  }
  const tokenHash = hashPreviewToken(token);
  const link = previewLinks.links.find((entry) =>
    safeHashEqual(entry.tokenHash, tokenHash) &&
    !entry.revokedAt &&
    new Date(entry.expiresAt).getTime() > Date.now(),
  );
  if (!link) return sendJson(res, 404, { error: 'Deze privélink is ongeldig of niet meer actief.' });
  if (req.body?.validateOnly === true) {
    return sendJson(res, 200, { ok: true, expiresAt: link.expiresAt });
  }

  const { data: setting, error: projectError } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'rembrandt_project_data')
    .maybeSingle();
  if (projectError || !setting) return sendJson(res, 503, { error: 'De privépreview is tijdelijk niet beschikbaar.' });

  const project = parseProject(setting.value);
  await mutatePreviewLinks(supabase, (links) => links.map((entry) =>
    entry.id === link.id
      ? {
          ...entry,
          lastUsedAt: new Date().toISOString(),
          accessCount: Number(entry.accessCount || 0) + 1,
        }
      : entry,
  )).catch(() => {});
  return sendJson(res, 200, { ok: true, project: { ...project, isEnabled: true }, expiresAt: link.expiresAt });
}
