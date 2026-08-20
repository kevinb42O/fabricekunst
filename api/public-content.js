import { GetObjectCommand } from '@aws-sdk/client-s3';
import {
  getR2Client,
  getR2ConfigurationError,
  PUBLIC_CONTENT_POINTER_KEY,
  streamToString,
} from './_lib/r2.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const configurationError = getR2ConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return res.status(503).json({ error: 'Public content is unavailable.' });
  }

  try {
    const r2 = getR2Client();
    const pointerObject = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: PUBLIC_CONTENT_POINTER_KEY,
    }));
    const pointer = JSON.parse(await streamToString(pointerObject.Body));
    if (!pointer?.key || !pointer.key.startsWith('site-data/public-content-')) {
      throw new Error('Invalid R2 public content pointer');
    }

    const snapshotObject = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: pointer.key,
    }));
    const snapshot = await streamToString(snapshotObject.Body);
    JSON.parse(snapshot);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400, stale-if-error=604800');
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400, stale-if-error=604800');
    return res.status(200).send(snapshot);
  } catch (error) {
    console.error('Public content read failed:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Public content is temporarily unavailable.' });
  }
}
