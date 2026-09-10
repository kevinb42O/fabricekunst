import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import { getR2Client, getR2ConfigurationError } from './_lib/r2.js';
import { normalizeProvenance, provenanceIssues, publicProvenance } from '../src/utils/provenance.js';
import { defaultProvenance } from '../src/data/defaultProvenance.js';
import { finishProvenancePublication, readPublishedProvenance } from './_lib/provenancePublication.js';
import { provenanceMediaAction } from './_lib/provenanceMedia.js';

export const classifyProvenanceImageUrl = value => {
  try {
    const url = new URL(value);
    const configured = new URL(process.env.R2_PUBLIC_URL);
    const key = decodeURIComponent(url.pathname.replace(/^\//, ''));
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && [configured.hostname, 'media.atelierrembrandt.com'].includes(url.hostname) && ['provenance/', 'catalog/', 'site/'].some(prefix => key.startsWith(prefix)) && !key.includes('..') ? { kind: 'r2', objectKey: key } : null;
  } catch {
    return null;
  }
};

const conflict = () => Object.assign(new Error('Een andere beheerder heeft deze versie gewijzigd. Herlaad de opgeslagen versie voordat je verdergaat.'), { status: 409 });

export const validateProvenanceShape = value => {
  // Keep the exported guard backwards-compatible for callers that still send
  // the pre-schema-3 shape, while all writes from the editor use the strict
  // normalized validator below.
  if (value?.schemaVersion === 3) {
    const issues = provenanceIssues(value);
    if (issues.length) throw new Error(issues.join('\n'));
    return;
  }
  const bytes = new TextEncoder().encode(JSON.stringify(value)).length;
  if (bytes > 512 * 1024) throw new Error('De pagina is groter dan 512 KiB.');
  const walk = (node, depth = 0) => {
    if (depth > 8) throw new Error('De inhoud is te diep genest.');
    if (typeof node === 'string' && node.length > 10_000) throw new Error('Een tekstveld is langer dan 10.000 tekens.');
    if (node && typeof node === 'object') Object.values(node).forEach(child => walk(child, depth + 1));
  };
  walk(value);
};

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return sendJson(res, 405, { error: 'Method Not Allowed' });
  const supabase = getServerSupabase();
  const auth = await requireActiveAdmin(req, supabase);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
  try {
    const { data: row, error } = await supabase.from('provenance_pages').select('*').eq('id', 'main').single();
    if (error || !row) throw new Error('De herkomstmigratie is nog niet beschikbaar.');
    if (req.method === 'GET') {
      const [{ data: media, error: mediaError }, { data: revisions, error: revisionsError }] = await Promise.all([
        supabase.from('provenance_media').select('*').neq('status', 'archived').order('created_at'),
        supabase.from('provenance_revisions').select('id,version,kind,created_at').order('version', { ascending: false }).limit(31),
      ]);
      if (mediaError || revisionsError) throw mediaError || revisionsError;
      return sendJson(res, 200, { ok: true, ...row, draft: row.draft?.schemaVersion === 3 ? normalizeProvenance(row.draft) : defaultProvenance(), media, revisions });
    }
    if (getR2ConfigurationError()) throw new Error('De R2-mediabibliotheek is niet beschikbaar.');
    const body = req.body || {};
    if (typeof body.action === 'string' && body.action.startsWith('media-')) return sendJson(res, 200, { ok: true, ...(await provenanceMediaAction(supabase, auth.user, body.action, body)) });
    if (body.action === 'retry-publication') {
      if (!row.pending_publication) throw new Error('Er staat geen publicatie open.');
      const result = await finishProvenancePublication(supabase, row);
      return sendJson(res, 200, { ok: true, ...result.row, provenanceData: result.publication.data });
    }
    if (row.pending_publication) throw Object.assign(new Error('Er staat een publicatie open. Rond deze eerst af met Opnieuw proberen.'), { status: 409 });
    if (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion !== row.version) throw conflict();
    if (body.action === 'save-draft' || body.action === 'restore') {
      let content = body.content;
      if (body.action === 'restore') {
        const { data: revision, error: restoreError } = await supabase.from('provenance_revisions').select('content').eq('id', body.revisionId).eq('kind', 'publication').single();
        if (restoreError) throw new Error('Deze revisie kan niet worden hersteld.');
        content = revision.content;
      }
      validateProvenanceShape(content);
      const { data, error: saveError } = await supabase.from('provenance_pages').update({ draft: normalizeProvenance(content), version: row.version + 1, updated_at: new Date().toISOString(), updated_by: auth.user.id }).eq('id', 'main').eq('version', body.expectedVersion).is('pending_publication', null).select().maybeSingle();
      if (saveError) throw saveError;
      if (!data) throw conflict();
      return sendJson(res, 200, { ok: true, ...data });
    }
    if (body.action !== 'publish') return sendJson(res, 400, { error: 'Onbekende bewerking.' });
    const issues = provenanceIssues(row.draft, { publishing: true });
    if (issues.length) return sendJson(res, 422, { error: 'Controleer de publicatiepunten.', issues });
    const { data: media, error: mediaError } = await supabase.from('provenance_media').select('*').eq('status', 'ready');
    if (mediaError) throw mediaError;
    const content = publicProvenance(row.draft, media);
    const r2 = getR2Client();
    for (const asset of content.assets) {
      if (!asset.variants.length) throw new Error(`Afbeelding ${asset.id} heeft nog geen publieke variant.`);
      for (const variant of asset.variants) {
        const image = classifyProvenanceImageUrl(variant.url);
        if (!image) throw new Error('Afbeeldingen moeten uit de beheerde R2-bucket komen.');
        const head = await r2.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: image.objectKey }));
        if (!head.ContentType?.startsWith('image/') || !head.ContentLength || head.ContentLength > 20 * 1024 * 1024) throw new Error('Een R2-afbeelding is ongeldig.');
      }
    }
    const current = await readPublishedProvenance();
    const pending = { operationId: randomUUID(), version: row.version, previousRevision: current?.pointer.revision ?? null, content, draft: row.draft, userId: auth.user.id, publishedAt: new Date().toISOString() };
    const { data: locked, error: lockError } = await supabase.from('provenance_pages').update({ pending_publication: pending }).eq('id', 'main').eq('version', body.expectedVersion).is('pending_publication', null).select().maybeSingle();
    if (lockError) throw lockError;
    if (!locked) throw conflict();
    const result = await finishProvenancePublication(supabase, locked);
    return sendJson(res, 200, { ok: true, ...result.row, provenanceData: result.publication.data });
  } catch (error) {
    console.error('Provenance operation failed:', error.message);
    return sendJson(res, error.status || 422, { error: error.message || 'De bewerking is niet voltooid. Probeer opnieuw.' });
  }
}
