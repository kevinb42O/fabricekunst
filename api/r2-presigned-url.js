import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import { getR2Client, getR2ConfigurationError } from './_lib/r2.js';
import { createUploadReceipt, verifyUploadReceipt } from './_lib/uploadReceipt.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const PURPOSE_PREFIXES = {
  catalog: 'catalog',
  comparable: 'catalog/comparable',
  'home-hero': 'site/home-hero',
  'mobile-hero': 'site/mobile-hero',
  'provenance-hero': 'provenance/hero',
  'provenance-story': 'provenance/story',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }
  const authorization = await requireActiveAdmin(req, getServerSupabase());
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });
  const configurationError = getR2ConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return sendJson(res, 503, { error: 'R2 image storage is unavailable' });
  }

  if (req.body?.action === 'complete') {
    const { objectKey, contentType, size, uploadReceipt } = req.body;
    if (typeof objectKey !== 'string' || !['catalog/', 'provenance/', 'site/'].some((prefix) => objectKey.startsWith(prefix))) {
      return sendJson(res, 400, { error: 'Invalid R2 object key.' });
    }
    if (!ALLOWED_IMAGE_TYPES.has(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > 20 * 1024 * 1024) {
      return sendJson(res, 400, { error: 'Invalid image metadata.' });
    }
    if (!verifyUploadReceipt(uploadReceipt, {
      objectKey,
      contentType,
      size,
      userId: authorization.user.id,
    }, process.env.R2_SECRET_ACCESS_KEY)) {
      return sendJson(res, 403, { error: 'Invalid R2 upload receipt.' });
    }
    try {
      const object = await getR2Client().send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: objectKey }));
      if (object.ContentLength !== size || object.ContentType !== contentType) {
        return sendJson(res, 409, { error: 'R2 upload verification did not match the selected file.' });
      }
      return sendJson(res, 200, { ok: true, objectKey, size: object.ContentLength, contentType: object.ContentType });
    } catch (error) {
      console.error('R2 upload verification failed:', error);
      return sendJson(res, 502, { error: 'R2 could not confirm the uploaded image.' });
    }
  }

  try {
    const { filename, contentType, size, purpose = 'catalog' } = req.body || {};
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    if (filename.length > 180) {
      return res.status(400).json({ error: 'Filename is too long' });
    }
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return res.status(415).json({ error: 'Unsupported image type' });
    }
    if (!Number.isSafeInteger(size) || size <= 0 || size > 20 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image must be between 1 byte and 20 MB' });
    }
    const prefix = PURPOSE_PREFIXES[purpose];
    if (!prefix) return res.status(400).json({ error: 'Unknown image upload purpose' });

    const bucketName = process.env.R2_BUCKET_NAME;
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '') || 'image';
    const objectKey = `${prefix}/${Date.now()}_${randomUUID()}_${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType || 'application/octet-stream',
    });

    const presignedUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });
    
    // Construct public URL to return to client
    const publicDomain = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
    const publicUrl = `${publicDomain}/${objectKey}`;
    const uploadReceipt = createUploadReceipt({ objectKey, contentType, size, userId: authorization.user.id }, process.env.R2_SECRET_ACCESS_KEY);

    return res.status(200).json({ presignedUrl, publicUrl, objectKey, uploadReceipt });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
