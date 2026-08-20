import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const parseSetting = (row, fallback = null) => {
  if (!row?.value) return fallback;
  if (typeof row.value !== 'string') return row.value;
  try { return JSON.parse(row.value); } catch { return row.value; }
};

const uploadLegacyDataImage = async (dataUrl, label) => {
  const match = /^data:(image\/(?:jpeg|png|webp|avif));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new Error(`Unsupported legacy data image in ${label}`);
  const extension = match[1] === 'image/jpeg' ? 'jpg' : match[1].split('/')[1];
  const body = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!body.length || body.length > 20 * 1024 * 1024) throw new Error(`Invalid legacy image size in ${label}`);
  const key = `site/${Date.now()}_${randomUUID()}_${label}.${extension}`;
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: match[1],
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
};

const { data: settingsRows, error: settingsReadError } = await supabase
  .from('admin_settings')
  .select('key, value, updated_at')
  .or('key.like.item_ext_%,key.eq.hero_image,key.eq.mobile_hero_image,key.eq.herkomst_page_data,key.eq.faq_items');
if (settingsReadError) throw settingsReadError;

const settings = new Map((settingsRows || []).map((row) => [row.key, row]));
const provenance = parseSetting(settings.get('herkomst_page_data'));
let migratedImages = 0;
if (provenance?.hero?.bgImage?.startsWith('data:image/')) {
  provenance.hero.bgImage = await uploadLegacyDataImage(provenance.hero.bgImage, 'provenance-hero');
  migratedImages += 1;
}
if (provenance?.story?.image?.startsWith('data:image/')) {
  provenance.story.image = await uploadLegacyDataImage(provenance.story.image, 'provenance-story');
  migratedImages += 1;
}
if (migratedImages) {
  const value = JSON.stringify(provenance);
  const { error } = await supabase.from('admin_settings').upsert({
    key: 'herkomst_page_data',
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  settings.set('herkomst_page_data', { key: 'herkomst_page_data', value });
}

const { data: items, error: itemsError } = await supabase
  .from('items')
  .select('*')
  .order('created_at', { ascending: true });
if (itemsError) throw itemsError;

const catalog = (items || []).map((item) => {
  const extension = parseSetting(settings.get(`item_ext_${item.id}`));
  return extension && typeof extension === 'object' ? { ...item, ...extension } : item;
});
const snapshot = {
  schemaVersion: 1,
  publishedAt: new Date().toISOString(),
  catalog,
  heroImage: parseSetting(settings.get('hero_image')),
  mobileHeroImage: parseSetting(settings.get('mobile_hero_image')),
  provenanceData: provenance,
  faqItems: parseSetting(settings.get('faq_items')),
};
const serialized = JSON.stringify(snapshot);
if (serialized.includes('data:image/') || serialized.includes('.supabase.co/storage/')) {
  throw new Error('Snapshot contains a forbidden image source');
}

const versionKey = `site-data/public-content-${Date.now()}-${randomUUID()}.json`;
await r2.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: versionKey,
  Body: serialized,
  ContentType: 'application/json; charset=utf-8',
  CacheControl: 'public, max-age=31536000, immutable',
}));
await r2.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: 'site-data/current.json',
  Body: JSON.stringify({ schemaVersion: 1, key: versionKey, publishedAt: snapshot.publishedAt }),
  ContentType: 'application/json; charset=utf-8',
  CacheControl: 'no-cache',
}));

console.log(JSON.stringify({
  ok: true,
  items: catalog.length,
  bytes: Buffer.byteLength(serialized),
  migratedImages,
  publishedAt: snapshot.publishedAt,
}));
