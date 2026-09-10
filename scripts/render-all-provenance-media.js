import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { HeadObjectCommand, PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: process.env.PROVENANCE_ENV_FILE || '.env.local' });

const localOriginalsDir = '/Users/kevin/.codex/visualizations/2026/09/10/01a08c3b-c358-74e2-91ba-da1ca6c228d6/provenance-review/originals';
const privateBucket = process.env.R2_SUBMISSIONS_BUCKET_NAME || 'atelier-rembrandt-private-submissions';
const publicBucket = process.env.R2_BUCKET_NAME;
const publicUrl = String(process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function exists(bucket, key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') return false;
    throw error;
  }
}

async function renderVariants(source, id) {
  const oriented = await sharp(source, { limitInputPixels: 60_000_000 }).rotate().toBuffer();
  const info = await sharp(oriented).metadata();
  const widths = [...new Set([360, 720, 1200, 1600].map(width => Math.min(width, info.width)))].sort((a, b) => a - b);
  const version = 'preview';
  const variants = [];
  for (const width of widths) {
    const { data, info: output } = await sharp(oriented)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    const key = `provenance/media/${id}/${version}-${output.width}.webp`;
    if (!(await exists(publicBucket, key))) {
      await r2.send(new PutObjectCommand({
        Bucket: publicBucket,
        Key: key,
        Body: data,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable'
      }));
    }
    variants.push({ url: `${publicUrl}/${key}`, width: output.width, height: output.height });
  }
  return { variants, width: info.width, height: info.height };
}

async function main() {
  console.log('Ophalen media records uit Supabase...');
  const { data: media, error } = await supabase.from('provenance_media').select('*');
  if (error) throw error;

  console.log(`Totaal aantal media: ${media.length}`);
  let renderedCount = 0;

  for (const item of media) {
    if (item.variants && item.variants.length > 0) {
      console.log(`[OK] ${item.filename} heeft al ${item.variants.length} varianten.`);
      continue;
    }

    console.log(`[BEZIG] Renderen van varianten voor ${item.filename} (id: ${item.id})...`);
    let fileBuffer;
    const localPath = path.join(localOriginalsDir, item.filename);

    try {
      fileBuffer = await fs.readFile(localPath);
    } catch {
      console.log(`  Lokaal niet gevonden (${localPath}), downloaden uit private R2...`);
      const getObj = await r2.send(new GetObjectCommand({
        Bucket: privateBucket,
        Key: item.original_key
      }));
      fileBuffer = Buffer.from(await getObj.Body.transformToByteArray());
    }

    const { variants, width, height } = await renderVariants(fileBuffer, item.id);
    const { error: updateError } = await supabase
      .from('provenance_media')
      .update({
        variants,
        width,
        height,
        status: 'ready'
      })
      .eq('id', item.id);

    if (updateError) {
      console.error(`  Fout bij updaten van ${item.filename}:`, updateError);
    } else {
      renderedCount++;
      console.log(`  [KLAAR] ${item.filename} geüpdatet met ${variants.length} WebP varianten.`);
    }
  }

  console.log(`\nVoltooid! ${renderedCount} nieuwe media-items voorzien van WebP-varianten in R2 en Supabase.`);
}

main().catch(err => {
  console.error('Fout:', err);
  process.exit(1);
});
