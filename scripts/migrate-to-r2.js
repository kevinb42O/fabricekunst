import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const S3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.R2_BUCKET_NAME;
const publicDomain = 'media.atelierrembrandt.com';
const SUPABASE_STORAGE_URL_PART = '.supabase.co/storage/v1/object/public/';

async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        resolve({ buffer: Buffer.concat(data), contentType: res.headers['content-type'] });
      });
    }).on('error', (err) => reject(err));
  });
}

async function uploadToR2(buffer, objectKey, contentType) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
  });
  await S3.send(command);
  return `https://${publicDomain}/${objectKey}`;
}

async function migrateStringUrls(inputString) {
  if (!inputString || typeof inputString !== 'string') return inputString;
  if (!inputString.includes(SUPABASE_STORAGE_URL_PART)) return inputString;

  let newString = inputString;
  const regex = /https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/([^"'\s]+)/g;
  
  let match;
  const urlMappings = [];
  
  while ((match = regex.exec(inputString)) !== null) {
    const fullUrl = match[0];
    const objectPath = match[1]; // e.g. catalog-images/catalog/filename.jpg
    
    // Convert to R2 object key (we can strip 'catalog-images/' bucket prefix or keep it)
    // We'll strip the supabase bucket name ('catalog-images/') if it's there
    let r2ObjectKey = objectPath.startsWith('catalog-images/') ? objectPath.replace('catalog-images/', '') : objectPath;
    
    urlMappings.push({ fullUrl, r2ObjectKey });
  }

  for (const { fullUrl, r2ObjectKey } of urlMappings) {
    if (newString.includes(`https://${publicDomain}/${r2ObjectKey}`)) continue; // Already migrated somehow
    console.log(`Downloading: ${fullUrl}`);
    try {
      const { buffer, contentType } = await downloadFile(fullUrl);
      console.log(`Uploading to R2: ${r2ObjectKey}`);
      const newUrl = await uploadToR2(buffer, r2ObjectKey, contentType);
      newString = newString.replaceAll(fullUrl, newUrl);
    } catch (e) {
      console.error(`Failed to migrate ${fullUrl}:`, e.message);
    }
  }

  return newString;
}

async function main() {
  console.log("Starting R2 Migration...");

  // 1. Fetch data
  const { data: items, error: itemsError } = await supabase.from('items').select('*');
  const { data: settings, error: settingsError } = await supabase.from('admin_settings').select('*');

  if (itemsError || settingsError) {
    console.error("Failed to fetch data:", itemsError, settingsError);
    process.exit(1);
  }

  // 2. Backup data
  const backup = { items, settings };
  fs.writeFileSync(path.join(__dirname, '../migration_backup.json'), JSON.stringify(backup, null, 2));
  console.log("Backup written to migration_backup.json");

  // 3. Migrate Items
  for (const item of items) {
    console.log(`Processing item: ${item.id} (${item.title})`);
    const originalJson = JSON.stringify(item);
    const migratedJson = await migrateStringUrls(originalJson);
    
    if (originalJson !== migratedJson) {
      const updatedItem = JSON.parse(migratedJson);
      const { error } = await supabase.from('items').update(updatedItem).eq('id', item.id);
      if (error) console.error(`Failed to update item ${item.id}:`, error);
      else console.log(`Successfully migrated and updated item ${item.id}`);
    } else {
      console.log(`No Supabase URLs found in item ${item.id}`);
    }
  }

  // 4. Migrate Admin Settings
  for (const setting of settings) {
    console.log(`Processing setting: ${setting.key}`);
    const originalValue = typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value;
    const originalStr = typeof originalValue === 'string' ? originalValue : JSON.stringify(originalValue);
    
    const migratedStr = await migrateStringUrls(originalStr);
    
    if (originalStr !== migratedStr) {
      let updatedValue = migratedStr;
      try {
        if (typeof setting.value === 'object') updatedValue = JSON.parse(migratedStr);
      } catch (e) {}

      const { error } = await supabase.from('admin_settings').update({ value: updatedValue }).eq('key', setting.key);
      if (error) console.error(`Failed to update setting ${setting.key}:`, error);
      else console.log(`Successfully migrated and updated setting ${setting.key}`);
    } else {
      console.log(`No Supabase URLs found in setting ${setting.key}`);
    }
  }

  console.log("Migration complete.");
}

main().catch(console.error);
