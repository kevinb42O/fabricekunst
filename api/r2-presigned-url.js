import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import { getR2Client, getR2ConfigurationError } from './_lib/r2.js';
import { createUploadReceipt } from './_lib/uploadReceipt.js';

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

    const configurationError = getR2ConfigurationError();
    if (configurationError) {
      console.error(configurationError);
      return res.status(503).json({ error: 'R2 image storage is unavailable' });
    }

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
