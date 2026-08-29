import { randomUUID } from 'node:crypto';
import { createPreviewToken } from './rembrandtPreviewToken.js';
import { activePreviewLink, mutatePreviewLinks, readPreviewLinks } from './rembrandtPreviewStore.js';
import { getServerSupabase, requireActiveAdmin, sendJson } from './adminAuth.js';

const publicLink = (req, token) => {
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.atelierrembrandt.com').split(',')[0].trim();
  const origin = forwardedHost.includes('localhost')
    ? `http://${forwardedHost}`
    : 'https://www.atelierrembrandt.com';
  return `${origin}/rembrandt-project/preview#${token}`;
};

const serializeLink = (row) => row ? ({
  id: row.id,
  label: row.label,
  createdAt: row.createdAt,
  expiresAt: row.expiresAt,
  lastUsedAt: row.lastUsedAt,
  accessCount: Number(row.accessCount || 0),
}) : null;

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) return sendJson(res, 405, { error: 'Method Not Allowed' });
  const supabase = getServerSupabase();
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });

  if (req.method === 'GET') {
    try {
      const { links } = await readPreviewLinks(supabase);
      return sendJson(res, 200, { ok: true, link: serializeLink(activePreviewLink(links)) });
    } catch {
      return sendJson(res, 500, { error: 'De privélink kon niet worden geladen.' });
    }
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id;
    if (typeof id !== 'string') return sendJson(res, 400, { error: 'Ongeldige privélink.' });
    try {
      const revokedAt = new Date().toISOString();
      await mutatePreviewLinks(supabase, (links) => links.map((entry) =>
        entry.id === id && !entry.revokedAt ? { ...entry, revokedAt } : entry,
      ));
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 500, { error: 'De privélink kon niet worden ingetrokken.' });
    }
  }

  const days = Number(req.body?.days ?? 30);
  if (![7, 14, 30, 60].includes(days)) return sendJson(res, 400, { error: 'Kies een geldigheid van 7, 14, 30 of 60 dagen.' });
  const label = String(req.body?.label || 'Advocaat – privébeoordeling').trim().slice(0, 100);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 86400000).toISOString();
  const { token, tokenHash } = createPreviewToken();

  try {
    const revokedAt = now.toISOString();
    const nextLink = {
      id: randomUUID(), tokenHash, label, createdAt: revokedAt,
      createdBy: authorization.user.id, expiresAt, revokedAt: null,
      lastUsedAt: null, accessCount: 0,
    };
    await mutatePreviewLinks(supabase, (links) => [
        nextLink,
        ...links.map((entry) => !entry.revokedAt ? { ...entry, revokedAt } : entry),
      ]);
    return sendJson(res, 201, { ok: true, link: serializeLink(nextLink), url: publicLink(req, token) });
  } catch {
    return sendJson(res, 500, { error: 'De privélink kon niet worden aangemaakt.' });
  }
}
