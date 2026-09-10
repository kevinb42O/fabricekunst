import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getR2Client, streamToString } from './r2.js';

export const PROVENANCE_POINTER = 'site-data/provenance-current.json';

export async function readPublishedProvenance() {
  const r2 = getR2Client();
  try {
    const pointerObject = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: PROVENANCE_POINTER }));
    const pointer = JSON.parse(await streamToString(pointerObject.Body));
    if (!/^site-data\/provenance-[a-zA-Z0-9-]+\.json$/.test(pointer.key)) throw new Error('Ongeldige herkomstversie.');
    const contentObject = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: pointer.key }));
    if (Number(contentObject.ContentLength || 0) > 1024 * 1024) throw new Error('Herkomstversie te groot.');
    const data = JSON.parse(await streamToString(contentObject.Body));
    if (data?.schemaVersion !== 3) throw new Error('Ongeldig herkomstschema.');
    return { pointer, data, etag: pointerObject.ETag };
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || ['NoSuchKey', 'NotFound'].includes(error?.name)) return null;
    throw error;
  }
}

export async function writeProvenancePublication(pending) {
  const r2 = getR2Client();
  const current = await readPublishedProvenance();
  if (current?.pointer.operationId === pending.operationId) return current;
  if ((current?.pointer.revision ?? null) !== pending.previousRevision) throw Object.assign(new Error('De publieke versie is ondertussen gewijzigd. Herlaad de pagina.'), { status: 409 });
  const key = `site-data/provenance-${pending.operationId || randomUUID()}.json`;
  await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: JSON.stringify(pending.content), ContentType: 'application/json; charset=utf-8', CacheControl: 'public, max-age=31536000, immutable' }));
  const pointer = { key, revision: pending.version, operationId: pending.operationId, publishedAt: pending.publishedAt };
  await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: PROVENANCE_POINTER, Body: JSON.stringify(pointer), ContentType: 'application/json; charset=utf-8', CacheControl: 'no-store', ...(current?.etag ? { IfMatch: current.etag } : { IfNoneMatch: '*' }) }));
  const verified = await readPublishedProvenance();
  if (verified?.pointer.operationId !== pending.operationId) throw new Error('Publicatie kon niet worden bevestigd.');
  return verified;
}

export async function finishProvenancePublication(supabase, row) {
  const pending = row.pending_publication;
  const publication = await writeProvenancePublication(pending);
  const { error: revisionError } = await supabase.from('provenance_revisions').upsert({ version: pending.version, content: pending.draft, kind: 'publication', created_by: pending.userId, created_at: pending.publishedAt }, { onConflict: 'version,kind' });
  if (revisionError) throw revisionError;
  const { data, error } = await supabase.from('provenance_pages').update({ published_version: pending.version, published_content: pending.content, pending_publication: null }).eq('id', 'main').eq('version', pending.version).select().single();
  if (error) throw error;
  const { data: old } = await supabase.from('provenance_revisions').select('id').eq('kind', 'publication').order('version', { ascending: false }).range(30, 1000);
  if (old?.length) await supabase.from('provenance_revisions').delete().in('id', old.map(item => item.id));
  return { row: data, publication };
}
