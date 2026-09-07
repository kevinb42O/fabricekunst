import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  getR2Client,
  getR2SubmissionsBucketName,
  getR2SubmissionsConfigurationError,
} from '../api/_lib/r2.js';
import { paintingSubmissionObjectKey } from '../api/_lib/paintingSubmissionsEndpoint.js';

dotenv.config({ path: '.env.local' });

const SOURCE_BUCKET = 'painting-submissions';
const PRIVATE_CACHE_CONTROL = 'private, no-store, max-age=0';
const deleteSource = process.argv.includes('--delete-source');
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) throw new Error('Supabase server credentials are missing.');
const r2ConfigurationError = getR2SubmissionsConfigurationError();
if (r2ConfigurationError) throw new Error(r2ConfigurationError);

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const r2 = getR2Client();
const targetBucket = getR2SubmissionsBucketName();

const headTarget = async (attachment) => {
  const objectKey = paintingSubmissionObjectKey(attachment.path);
  if (!objectKey) throw new Error('An inquiry contains an invalid attachment path.');
  try {
    const object = await r2.send(new HeadObjectCommand({ Bucket: targetBucket, Key: objectKey }));
    return Number(object.ContentLength) === Number(attachment.size) &&
      object.ContentType === attachment.contentType &&
      object.CacheControl === PRIVATE_CACHE_CONTROL;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || ['NotFound', 'NoSuchKey'].includes(error?.name)) return false;
    throw error;
  }
};

const { data: inquiries, error: readError } = await supabase
  .from('inquiries')
  .select('id, attachments')
  .eq('type', 'painting_submission');
if (readError) throw readError;

let copied = 0;
let verified = 0;
let updatedRows = 0;
const sourcePaths = new Set();

for (const inquiry of inquiries || []) {
  const attachments = Array.isArray(inquiry.attachments) ? inquiry.attachments : [];
  const migrated = [];
  for (const attachment of attachments) {
    if (!paintingSubmissionObjectKey(attachment?.path)) {
      throw new Error(`Inquiry ${inquiry.id} contains an invalid attachment reference.`);
    }
    sourcePaths.add(attachment.path);
    if (await headTarget(attachment)) {
      verified += 1;
    } else {
      const { data: source, error: downloadError } = await supabase.storage
        .from(SOURCE_BUCKET)
        .download(attachment.path);
      if (downloadError || !source) throw downloadError || new Error('A source attachment is missing.');
      const body = Buffer.from(await source.arrayBuffer());
      if (body.byteLength !== Number(attachment.size)) throw new Error('A source attachment size does not match its database record.');
      await r2.send(new PutObjectCommand({
        Bucket: targetBucket,
        Key: paintingSubmissionObjectKey(attachment.path),
        Body: body,
        ContentLength: body.byteLength,
        ContentType: attachment.contentType,
        CacheControl: PRIVATE_CACHE_CONTROL,
      }));
      if (!(await headTarget(attachment))) throw new Error('An R2 attachment failed post-copy verification.');
      copied += 1;
    }
    migrated.push({ ...attachment, storage: 'r2' });
  }
  if (JSON.stringify(migrated) !== JSON.stringify(attachments)) {
    const { error: updateError } = await supabase
      .from('inquiries')
      .update({ attachments: migrated })
      .eq('id', inquiry.id);
    if (updateError) throw updateError;
    updatedRows += 1;
  }
}

if (deleteSource) {
  for (const inquiry of inquiries || []) {
    for (const attachment of inquiry.attachments || []) {
      if (!(await headTarget(attachment))) throw new Error('Source deletion refused: an R2 target is unverified.');
    }
  }
  const { error: emptyError } = await supabase.storage.emptyBucket(SOURCE_BUCKET);
  if (emptyError) throw emptyError;
  const { error: deleteError } = await supabase.storage.deleteBucket(SOURCE_BUCKET);
  if (deleteError) throw deleteError;
}

console.log(JSON.stringify({
  inquiries: inquiries?.length || 0,
  attachments: sourcePaths.size,
  copied,
  verified,
  updatedRows,
  sourceBucketDeleted: deleteSource,
}));
