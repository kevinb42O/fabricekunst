import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getR2Client, PUBLIC_CONTENT_POINTER_KEY } from './r2.js';

const parseSetting = (row, fallback = null) => {
  if (!row?.value) return fallback;
  if (typeof row.value !== 'string') return row.value;
  try { return JSON.parse(row.value); } catch { return row.value; }
};

export const containsForbiddenImageSource = (value) => {
  const serialized = JSON.stringify(value);
  return serialized.includes('data:image/') || serialized.includes('.supabase.co/storage/');
};

export const buildPublicContentSnapshot = async (supabase) => {
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
    const extension = parseSetting(byKey.get(`item_ext_${item.id}`));
    return extension && typeof extension === 'object' ? { ...item, ...extension } : item;
  });
  const snapshot = {
    schemaVersion: 1,
    publishedAt: new Date().toISOString(),
    catalog,
    heroImage: parseSetting(byKey.get('hero_image')),
    mobileHeroImage: parseSetting(byKey.get('mobile_hero_image')),
    provenanceData: parseSetting(byKey.get('herkomst_page_data')),
    faqItems: parseSetting(byKey.get('faq_items')),
  };
  if (containsForbiddenImageSource(snapshot)) {
    throw new Error('Public content contains a forbidden image source');
  }
  return snapshot;
};

export const publishPublicContentSnapshot = async (supabase) => {
  const r2 = getR2Client();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let currentEtag = null;
    try {
      const current = await r2.send(new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: PUBLIC_CONTENT_POINTER_KEY,
      }));
      currentEtag = current.ETag;
    } catch (error) {
      if (error?.$metadata?.httpStatusCode !== 404 && error?.name !== 'NotFound') throw error;
    }

    const snapshot = await buildPublicContentSnapshot(supabase);
    const serialized = JSON.stringify(snapshot);
    const versionKey = `site-data/public-content-${Date.now()}-${randomUUID()}.json`;
    const pointer = JSON.stringify({ schemaVersion: 1, key: versionKey, publishedAt: snapshot.publishedAt });

    // Write the immutable payload first. The pointer uses compare-and-swap so
    // concurrent administrator saves cannot overwrite a newer publication.
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: versionKey,
      Body: serialized,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    try {
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: PUBLIC_CONTENT_POINTER_KEY,
        Body: pointer,
        ContentType: 'application/json; charset=utf-8',
        CacheControl: 'no-cache',
        ...(currentEtag ? { IfMatch: currentEtag } : { IfNoneMatch: '*' }),
      }));
      return { snapshot, bytes: Buffer.byteLength(serialized), versionKey };
    } catch (error) {
      if (![409, 412].includes(error?.$metadata?.httpStatusCode) || attempt === 2) throw error;
    }
  }
  throw new Error('Public content pointer could not be updated safely');
};
