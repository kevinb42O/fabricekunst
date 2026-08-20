import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const getR2ConfigurationError = () => {
  const required = [
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL'
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

const S3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Verify token and user role
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Verify the user is an admin by checking admin_profiles table
  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile || !['admin', 'developer'].includes(profile.role)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { filename, contentType, size } = req.body;
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

    const configurationError = getR2ConfigurationError();
    if (configurationError) {
      console.error(configurationError);
      return res.status(503).json({ error: 'R2 image storage is unavailable' });
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    // Format the object key: e.g. catalog/timestamp_filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '') || 'image';
    const objectKey = `catalog/${Date.now()}_${randomUUID()}_${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType || 'application/octet-stream',
    });

    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 300 });
    
    // Construct public URL to return to client
    const publicDomain = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
    const publicUrl = `${publicDomain}/${objectKey}`;

    return res.status(200).json({ presignedUrl, publicUrl, objectKey });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
