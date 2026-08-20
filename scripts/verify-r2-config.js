import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

if (!process.env.VERCEL) {
  console.log('R2 deployment check skipped outside Vercel.');
  process.exit(0);
}

const requiredVariables = [
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL'
];

const missingVariables = requiredVariables.filter((key) => !process.env[key]);
if (missingVariables.length > 0) {
  throw new Error(`R2 deployment blocked: missing ${missingVariables.join(', ')}`);
}

const endpoint = new URL(process.env.R2_ENDPOINT);
const publicUrl = new URL(process.env.R2_PUBLIC_URL);

if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.r2.cloudflarestorage.com')) {
  throw new Error('R2 deployment blocked: invalid account endpoint.');
}
if (publicUrl.protocol !== 'https:' || publicUrl.hostname.includes('supabase.co')) {
  throw new Error('R2 deployment blocked: public media URL must point to R2.');
}

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

try {
  await client.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME }));
  console.log('R2 deployment check passed.');
} catch (error) {
  throw new Error(`R2 deployment blocked: bucket authentication failed (${error?.name || 'unknown error'}).`);
}
