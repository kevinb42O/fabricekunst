import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import curatedAssets from '../src/data/provenanceAssets.json' with { type: 'json' };

dotenv.config({ path: process.env.PROVENANCE_ENV_FILE || '.env.local' });

const inventoryPath = process.env.PROVENANCE_INVENTORY || '/Users/kevin/.codex/visualizations/2026/09/10/01a08c3b-c358-74e2-91ba-da1ca6c228d6/provenance-review/inventory.json';
const privateBucket = process.env.R2_SUBMISSIONS_BUCKET_NAME || 'atelier-rembrandt-private-submissions';
const publicBucket = process.env.R2_BUCKET_NAME;
const publicUrl = String(process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const seedUserId = process.env.PROVENANCE_SEED_USER_ID || '3985d410-7ee6-492f-be4b-033741eb45ec';
const r2 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, forcePathStyle: true, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const curatedByNumber = new Map(curatedAssets.map(asset => [asset.number, asset]));
const idFor = number => curatedByNumber.get(number)?.id || `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const locale = (nl, en = nl, fr = nl) => ({ nl, en, fr });
const categoryFor = number => curatedByNumber.get(number)?.category || 'unconfirmed';
const approvedFor = number => curatedByNumber.get(number)?.approved === true;
const metadataFor = number => curatedByNumber.get(number) || ({
  id: idFor(number), number, category: categoryFor(number), approved: false,
  title: locale(`Onderzoeksfoto ${number}`, `Research photograph ${number}`, `Photographie de recherche ${number}`),
  caption: locale('Nog te beschrijven in de beeldbank.', 'To be described in the media library.', 'À décrire dans la photothèque.'),
  alt: locale(`Onderzoeksfoto ${number}`, `Research photograph ${number}`, `Photographie de recherche ${number}`),
});

async function exists(bucket, key) {
  try { await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; } catch (error) { if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') return false; throw error; }
}

async function renderPublicVariants(source, id) {
  const oriented = await sharp(source, { limitInputPixels: 60_000_000 }).rotate().toBuffer();
  const info = await sharp(oriented).metadata();
  const widths = [...new Set([360, 720, 1200, 1600].map(width => Math.min(width, info.width)))].sort((a, b) => a - b);
  const version = 'seed';
  const variants = [];
  for (const width of widths) {
    const { data, info: output } = await sharp(oriented).resize({ width, withoutEnlargement: true }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
    const key = `provenance/media/${id}/${version}-${output.width}.webp`;
    if (!(await exists(publicBucket, key))) await r2.send(new PutObjectCommand({ Bucket: publicBucket, Key: key, Body: data, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }));
    variants.push({ url: `${publicUrl}/${key}`, width: output.width, height: output.height });
  }
  return { variants, width: info.width, height: info.height };
}

const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8')).filter(item => !item.duplicateOf);
if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !publicBucket || !publicUrl || !process.env.SUPABASE_URL) throw new Error('R2 en Supabase configuratie ontbreekt.');
const { data: existing, error: existingError } = await supabase.from('provenance_media').select('*');
if (existingError) throw existingError;
const byId = new Map((existing || []).map(item => [item.id, item]));
let ready = 0;
for (const item of inventory) {
  const id = idFor(item.number);
  const file = await fs.readFile(item.preserved);
  const sha256 = createHash('sha256').update(file).digest('hex');
  const originalKey = `provenance/originals/${id}`;
  if (!(await exists(privateBucket, originalKey))) await r2.send(new PutObjectCommand({ Bucket: privateBucket, Key: originalKey, Body: file, ContentType: 'image/jpeg', CacheControl: 'private, no-store, max-age=0' }));
  let row = byId.get(id);
  if (!row) {
    const { data, error } = await supabase.from('provenance_media').insert({ id, original_key: originalKey, filename: path.basename(item.preserved), sha256, content_type: 'image/jpeg', size_bytes: file.length, width: item.width, height: item.height, status: 'uploaded', created_by: seedUserId }).select().single();
    if (error) throw error;
    row = data;
  }
  if (approvedFor(item.number) && row.status !== 'ready') {
    const rendered = await renderPublicVariants(file, id);
    const { data, error } = await supabase.from('provenance_media').update({ ...rendered, status: 'ready' }).eq('id', id).select().single();
    if (error) throw error;
    row = data;
  }
  byId.set(id, row);
  if (row.status === 'ready') ready += 1;
  console.log(`${String(item.number).padStart(2, '0')} ${row.status} ${metadataFor(item.number).category}`);
}
console.log(`Seed voltooid: ${inventory.length} unieke originelen naar ${privateBucket}; ${ready} gecontroleerde publieke varianten naar ${publicBucket}.`);
