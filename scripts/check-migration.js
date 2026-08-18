import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: items } = await supabase.from('items').select('*');
  const { data: settings } = await supabase.from('admin_settings').select('*');
  
  let issues = 0;
  for (const item of items) {
    if (JSON.stringify(item).includes('supabase.co/storage')) {
      console.log('Found supabase storage url in item:', item.id);
      issues++;
    }
  }
  for (const setting of settings) {
    if (JSON.stringify(setting).includes('supabase.co/storage')) {
      console.log('Found supabase storage url in setting:', setting.key);
      issues++;
    }
  }
  if (issues === 0) {
    console.log('Success: No Supabase Storage URLs found in the database.');
  }
}
main();
