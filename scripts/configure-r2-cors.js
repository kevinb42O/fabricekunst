import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const required = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}

export const R2_CORS_RULES = [{
  AllowedOrigins: [
    'https://www.atelierrembrandt.com',
    'https://atelierrembrandt.com',
    // Canonical Vercel aliases used by the production admin. Keeping these
    // explicit avoids opening the bucket to arbitrary third-party origins.
    'https://rareartbooks.vercel.app',
    'https://rareartbooks-lanternnetworks-projects.vercel.app',
    'http://localhost:5173',
  ],
  AllowedMethods: ['GET', 'HEAD', 'PUT'],
  AllowedHeaders: ['content-type', 'x-amz-*'],
  ExposeHeaders: ['ETag'],
  MaxAgeSeconds: 3600,
}];

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

await r2.send(new PutBucketCorsCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  CORSConfiguration: { CORSRules: R2_CORS_RULES },
}));
const configured = await r2.send(new GetBucketCorsCommand({ Bucket: process.env.R2_BUCKET_NAME }));
const normalizeRules = (rules = []) => rules.map((rule) => ({
  AllowedOrigins: [...(rule.AllowedOrigins || [])].sort(),
  AllowedMethods: [...(rule.AllowedMethods || [])].sort(),
  AllowedHeaders: [...(rule.AllowedHeaders || [])].map((header) => header.toLowerCase()).sort(),
  ExposeHeaders: [...(rule.ExposeHeaders || [])].map((header) => header.toLowerCase()).sort(),
  MaxAgeSeconds: rule.MaxAgeSeconds,
}));
if (JSON.stringify(normalizeRules(configured.CORSRules)) !== JSON.stringify(normalizeRules(R2_CORS_RULES))) {
  throw new Error('R2 returned a different CORS policy after configuration');
}
console.log('R2 browser upload CORS policy is configured and verified.');
