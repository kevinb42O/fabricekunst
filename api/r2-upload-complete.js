import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import { getR2Client, getR2ConfigurationError } from './_lib/r2.js';
import { verifyUploadReceipt } from './_lib/uploadReceipt.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const ALLOWED_PREFIXES = ['catalog/', 'provenance/', 'site/'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
  const authorization = await requireActiveAdmin(req, getServerSupabase());
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });
  if (getR2ConfigurationError()) return sendJson(res, 503, { error: 'R2 image storage is unavailable.' });

  const { objectKey, contentType, size, uploadReceipt } = req.body || {};
  if (typeof objectKey !== 'string' || !ALLOWED_PREFIXES.some((prefix) => objectKey.startsWith(prefix))) {
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
    const object = await getR2Client().send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
    }));
    if (object.ContentLength !== size || object.ContentType !== contentType) {
      return sendJson(res, 409, { error: 'R2 upload verification did not match the selected file.' });
    }
    return sendJson(res, 200, { ok: true, objectKey, size: object.ContentLength, contentType: object.ContentType });
  } catch (error) {
    console.error('R2 upload verification failed:', error);
    return sendJson(res, 502, { error: 'R2 could not confirm the uploaded image.' });
  }
}
