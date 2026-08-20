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

// A build worker is not a reliable place for a live S3 request: network-level
// restrictions can reject valid R2 credentials. Runtime uploads remain fail-closed,
// while this guard catches missing variables and the malformed endpoint that caused
// the original incident before a deployment can go live.
console.log('R2 deployment configuration check passed.');
