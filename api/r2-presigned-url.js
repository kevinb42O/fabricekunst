import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { filename, contentType } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    // Format the object key: e.g. catalog/timestamp_filename
    const objectKey = `catalog/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType || 'application/octet-stream',
    });

    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
    
    // Construct public URL to return to client
    const publicDomain = process.env.R2_PUBLIC_URL || 'https://pub-8ac0d70685884231aa572bff64e4de8b.r2.dev';
    const publicUrl = `${publicDomain}/${objectKey}`;

    return res.status(200).json({ presignedUrl, publicUrl, objectKey });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
