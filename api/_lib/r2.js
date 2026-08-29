import { S3Client } from '@aws-sdk/client-s3';

export const PUBLIC_CONTENT_POINTER_KEY = 'site-data/current.json';
export const REMBRANDT_PROJECT_ACCESS_KEY = 'site-data/rembrandt-project-access.json';

export const getR2ConfigurationError = () => {
  const required = [
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];
  if (required.some((key) => !process.env[key])) return 'R2 configuration is incomplete';

  try {
    const endpoint = new URL(process.env.R2_ENDPOINT);
    const publicUrl = new URL(process.env.R2_PUBLIC_URL);
    if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.r2.cloudflarestorage.com')) {
      return 'R2 endpoint is invalid';
    }
    if (publicUrl.protocol !== 'https:' || publicUrl.hostname.includes('supabase.co')) {
      return 'R2 public URL is invalid';
    }
  } catch {
    return 'R2 URLs are invalid';
  }
  return null;
};

export const getR2Client = () => new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  // Cloudflare R2's S3 endpoint is path-style. Without this, the AWS SDK
  // signs URLs for `<bucket>.<account>.r2.cloudflarestorage.com`, a hostname
  // that Cloudflare does not serve and browsers report only as “Failed to fetch”.
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const streamToString = async (body) => {
  if (!body) throw new Error('R2 object has no body');
  if (typeof body.transformToString === 'function') return body.transformToString();
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
};
