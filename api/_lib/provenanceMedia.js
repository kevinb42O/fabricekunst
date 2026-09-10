import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { getR2Client, getR2SubmissionsBucketName, getR2SubmissionsConfigurationError } from './r2.js';
import { createUploadReceipt, verifyUploadReceipt } from './uploadReceipt.js';

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 20 * 1024 * 1024;
const PRIVATE_CACHE = 'private, no-store, max-age=0';
const PUBLIC_CACHE = 'public, max-age=31536000, immutable';

const privateBucket = () => {
  const error = getR2SubmissionsConfigurationError();
  if (error) throw new Error(error);
  return getR2SubmissionsBucketName();
};

const assertImage = (contentType, size) => {
  if (!TYPES.has(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > MAX_BYTES) {
    throw new Error('Gebruik een JPG, PNG, WebP of AVIF van maximaal 20 MB.');
  }
};

const cropRect = (crop, width, height) => {
  if (!crop) return { left: 0, top: 0, width, height };
  if (!['x', 'y', 'width', 'height'].every(key => Number.isFinite(crop[key])) || crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > 1.00001 || crop.y + crop.height > 1.00001) {
    throw new Error('De uitsnede valt buiten de afbeelding.');
  }
  const left = Math.floor(crop.x * width);
  const top = Math.floor(crop.y * height);
  return { left, top, width: Math.min(width - left, Math.max(1, Math.floor(crop.width * width))), height: Math.min(height - top, Math.max(1, Math.floor(crop.height * height))) };
};

export const renderProvenanceVariants = async (record, crop) => {
  const r2 = getR2Client();
  const object = await r2.send(new GetObjectCommand({ Bucket: privateBucket(), Key: record.original_key }));
  const source = Buffer.from(await object.Body.transformToByteArray());
  if (source.length > MAX_BYTES) throw new Error('Het origineel is te groot.');
  const oriented = await sharp(source, { limitInputPixels: 60_000_000 }).rotate().toBuffer();
  const metadata = await sharp(oriented).metadata();
  const rect = cropRect(crop, metadata.width, metadata.height);
  const widths = [...new Set([360, 720, 1200, 1600].map(width => Math.min(width, rect.width)))].sort((a, b) => a - b);
  const version = randomUUID();
  const variants = [];
  for (const width of widths) {
    const { data, info } = await sharp(oriented).extract(rect).resize({ width, withoutEnlargement: true }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
    const key = `provenance/media/${record.id}/${version}-${info.width}.webp`;
    await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: data, ContentType: 'image/webp', CacheControl: PUBLIC_CACHE }));
    variants.push({ url: `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`, width: info.width, height: info.height });
  }
  return { variants, width: metadata.width, height: metadata.height, crop: crop || null };
};

export async function provenanceMediaAction(supabase, user, action, body) {
  const r2 = getR2Client();
  if (action === 'media-init') {
    assertImage(body.contentType, body.size);
    const id = randomUUID();
    const objectKey = `provenance/originals/${id}`;
    const { error } = await supabase.from('provenance_media').insert({ id, original_key: objectKey, filename: String(body.filename || 'Afbeelding').slice(0, 180), content_type: body.contentType, size_bytes: body.size, created_by: user.id });
    if (error) throw error;
    const presignedUrl = await getSignedUrl(r2, new PutObjectCommand({ Bucket: privateBucket(), Key: objectKey, ContentType: body.contentType, CacheControl: PRIVATE_CACHE }), { expiresIn: 300 });
    return { id, objectKey, presignedUrl, cacheControl: PRIVATE_CACHE, uploadReceipt: createUploadReceipt({ objectKey, contentType: body.contentType, size: body.size, userId: user.id }, process.env.R2_SECRET_ACCESS_KEY) };
  }
  const { data: record, error } = await supabase.from('provenance_media').select('*').eq('id', body.id).single();
  if (error || !record) throw new Error('Afbeelding niet gevonden.');
  if (action === 'media-original') return { url: await getSignedUrl(r2, new GetObjectCommand({ Bucket: privateBucket(), Key: record.original_key }), { expiresIn: 300 }) };
  if (action === 'media-complete') {
    if (!verifyUploadReceipt(body.uploadReceipt, { objectKey: record.original_key, contentType: record.content_type, size: record.size_bytes, userId: user.id }, process.env.R2_SECRET_ACCESS_KEY)) throw new Error('De uploadbevestiging is verlopen of ongeldig.');
    const head = await r2.send(new HeadObjectCommand({ Bucket: privateBucket(), Key: record.original_key }));
    if (head.ContentLength !== record.size_bytes || head.ContentType !== record.content_type || head.CacheControl !== PRIVATE_CACHE) throw new Error('De upload is niet volledig ontvangen.');
    const object = await r2.send(new GetObjectCommand({ Bucket: privateBucket(), Key: record.original_key }));
    const source = Buffer.from(await object.Body.transformToByteArray());
    const sha256 = createHash('sha256').update(source).digest('hex');
    const { data: duplicate, error: duplicateError } = await supabase.from('provenance_media').select('*').eq('sha256', sha256).maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate && duplicate.id !== record.id) {
      await supabase.from('provenance_media').update({ status: 'archived' }).eq('id', record.id);
      return { media: duplicate, duplicate: true };
    }
    const metadata = await sharp(source, { limitInputPixels: 60_000_000 }).metadata();
    const { data, error: saveError } = await supabase.from('provenance_media').update({ sha256, width: metadata.autoOrient?.width || metadata.width, height: metadata.autoOrient?.height || metadata.height }).eq('id', record.id).select().single();
    if (saveError) throw saveError;
    return { media: data };
  }
  if (action === 'media-render') {
    if (body.confirmPublic !== true) throw new Error('Bevestig eerst de publieke uitsnede.');
    const rendered = await renderProvenanceVariants(record, body.crop);
    const { data, error: updateError } = await supabase.from('provenance_media').update({ ...rendered, status: 'ready' }).eq('id', record.id).select().single();
    if (updateError) throw updateError;
    return { media: data };
  }
  throw new Error('Onbekende beeldbewerking.');
}
