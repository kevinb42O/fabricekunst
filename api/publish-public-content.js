import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import {
  getR2Client,
  getR2ConfigurationError,
  PUBLIC_CONTENT_POINTER_KEY,
} from './_lib/r2.js';

const parseSetting = (row, fallback) => {
  if (!row?.value) return fallback;
  if (typeof row.value !== 'string') return row.value;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
};

const containsForbiddenImageSource = (value) => {
  const serialized = JSON.stringify(value);
  return serialized.includes('data:image/') || serialized.includes('.supabase.co/storage/');
};

const buildSnapshot = async (supabase) => {
  const [{ data: items, error: itemsError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from('items').select('*').order('created_at', { ascending: true }),
    supabase
      .from('admin_settings')
      .select('key, value, updated_at')
      .or('key.like.item_ext_%,key.eq.hero_image,key.eq.mobile_hero_image,key.eq.herkomst_page_data,key.eq.faq_items'),
  ]);

  if (itemsError) throw itemsError;
  if (settingsError) throw settingsError;

  const byKey = new Map((settings || []).map((row) => [row.key, row]));
  const catalog = (items || []).map((item) => {
    const extension = parseSetting(byKey.get(`item_ext_${item.id}`), null);
    return extension && typeof extension === 'object' ? { ...item, ...extension } : item;
  });

  const snapshot = {
    schemaVersion: 1,
    publishedAt: new Date().toISOString(),
    catalog,
    heroImage: parseSetting(byKey.get('hero_image'), null),
    mobileHeroImage: parseSetting(byKey.get('mobile_hero_image'), null),
    provenanceData: parseSetting(byKey.get('herkomst_page_data'), null),
    faqItems: parseSetting(byKey.get('faq_items'), null),
  };

  if (containsForbiddenImageSource(snapshot)) {
    throw new Error('Public content still contains base64 or Supabase Storage images');
  }
  return snapshot;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  const supabase = getServerSupabase();
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });

  const configurationError = getR2ConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return sendJson(res, 503, { error: 'R2 public content storage is unavailable.' });
  }

  try {
    const snapshot = await buildSnapshot(supabase);
    const serialized = JSON.stringify(snapshot);
    const versionKey = `site-data/public-content-${Date.now()}-${randomUUID()}.json`;
    const pointer = JSON.stringify({
      schemaVersion: 1,
      key: versionKey,
      publishedAt: snapshot.publishedAt,
    });
    const r2 = getR2Client();

    // Publish the immutable payload first; only then switch the tiny pointer.
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: versionKey,
      Body: serialized,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: PUBLIC_CONTENT_POINTER_KEY,
      Body: pointer,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'no-cache',
    }));

    return sendJson(res, 200, {
      ok: true,
      publishedAt: snapshot.publishedAt,
      bytes: Buffer.byteLength(serialized),
      items: snapshot.catalog.length,
    });
  } catch (error) {
    console.error('Public content publish failed:', error);
    return sendJson(res, 500, { error: 'De publieke R2-versie kon niet worden gepubliceerd.' });
  }
}
