import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import { getR2Client, getR2ConfigurationError } from './_lib/r2.js';
import { containsForbiddenImageSource, publishPublicContentSnapshot } from './_lib/publicContent.js';

const MAX_PAYLOAD_BYTES = 200 * 1024;
const MAX_STRING_LENGTH = 30_000;

export const validateProvenanceShape = (value, depth = 0) => {
  if (depth > 8) throw new Error('Payload nesting is too deep');
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) throw new Error('A text field is too long');
    return;
  }
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return;
  if (Array.isArray(value)) {
    if (value.length > 50) throw new Error('An array contains too many entries');
    value.forEach((entry) => validateProvenanceShape(entry, depth + 1));
    return;
  }
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error('Payload contains an unsupported value');
  }
  const entries = Object.entries(value);
  if (entries.length > 80) throw new Error('An object contains too many fields');
  entries.forEach(([, entry]) => validateProvenanceShape(entry, depth + 1));
};

export const classifyProvenanceImageUrl = (value) => {
  if (typeof value !== 'string' || !value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const configuredHost = new URL(process.env.R2_PUBLIC_URL).hostname;
    if (url.hostname === configuredHost || url.hostname === 'media.atelierrembrandt.com') {
      const objectKey = decodeURIComponent(url.pathname.replace(/^\//, ''));
      if (!objectKey || objectKey.includes('..') || !['catalog/', 'provenance/', 'site/'].some((prefix) => objectKey.startsWith(prefix))) return null;
      return { kind: 'r2', objectKey };
    }
  } catch {
    return null;
  }
  return null;
};

const verifyImage = async (r2, value, label) => {
  const image = classifyProvenanceImageUrl(value);
  if (!image) throw new Error(`${label} must be an image in the managed R2 bucket`);
  const object = await r2.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: image.objectKey }));
  if (!object.ContentType?.startsWith('image/') || !object.ContentLength || object.ContentLength > 20 * 1024 * 1024) {
    throw new Error(`${label} is not a valid R2 image`);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
  const supabase = getServerSupabase();
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });
  if (getR2ConfigurationError()) return sendJson(res, 503, { error: 'R2 storage is unavailable.' });

  const provenanceData = req.body?.provenanceData;
  try {
    validateProvenanceShape(provenanceData);
    if (!provenanceData?.hero || !provenanceData?.story || !provenanceData?.protocol || !provenanceData?.cta) {
      throw new Error('Required provenance sections are missing');
    }
    const serialized = JSON.stringify(provenanceData);
    if (Buffer.byteLength(serialized) > MAX_PAYLOAD_BYTES || containsForbiddenImageSource(provenanceData)) {
      throw new Error('Provenance payload is too large or contains a forbidden image');
    }
    const r2 = getR2Client();
    await Promise.all([
      verifyImage(r2, provenanceData.hero.bgImage, 'Hero image'),
      verifyImage(r2, provenanceData.story.image, 'Story image'),
    ]);

    const { data: previous, error: readError } = await supabase
      .from('admin_settings')
      .select('key, value, updated_at')
      .eq('key', 'herkomst_page_data')
      .maybeSingle();
    if (readError) throw readError;

    const updatedAt = new Date().toISOString();
    const { error: saveError } = await supabase.from('admin_settings').upsert({
      key: 'herkomst_page_data',
      value: serialized,
      updated_at: updatedAt,
    });
    if (saveError) throw saveError;

    try {
      const publication = await publishPublicContentSnapshot(supabase);
      return sendJson(res, 200, {
        ok: true,
        provenanceData,
        publishedAt: publication.snapshot.publishedAt,
        bytes: publication.bytes,
      });
    } catch (publishError) {
      // Do not leave Supabase ahead of the public R2 snapshot. The timestamp
      // condition prevents overwriting a newer concurrent administrator save.
      if (previous) {
        await supabase.from('admin_settings').update({
          value: previous.value,
          updated_at: previous.updated_at,
        }).eq('key', 'herkomst_page_data').eq('updated_at', updatedAt);
      } else {
        await supabase.from('admin_settings').delete().eq('key', 'herkomst_page_data').eq('updated_at', updatedAt);
      }
      await publishPublicContentSnapshot(supabase).catch((rollbackPublishError) => {
        console.error('Provenance rollback publication failed:', rollbackPublishError);
      });
      throw publishError;
    }
  } catch (error) {
    console.error('Provenance save failed:', error);
    return sendJson(res, 422, { error: 'De herkomstpagina is niet gepubliceerd; controleer de R2-afbeeldingen en probeer opnieuw.' });
  }
}
