import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const OLD_DOMAIN = 'https://media.atelierrembrandt.com/';
const NEW_DOMAIN = process.env.R2_PUBLIC_URL + '/';

async function main() {
  console.log(`Replacing ${OLD_DOMAIN} with ${NEW_DOMAIN}...`);

  const { data: items, error: itemsError } = await supabase.from('items').select('*');
  const { data: settings, error: settingsError } = await supabase.from('admin_settings').select('*');

  if (itemsError || settingsError) {
    console.error("Failed to fetch data", itemsError, settingsError);
    process.exit(1);
  }

  for (const item of items) {
    const originalJson = JSON.stringify(item);
    if (originalJson.includes(OLD_DOMAIN)) {
      const newJson = originalJson.replaceAll(OLD_DOMAIN, NEW_DOMAIN);
      const updatedItem = JSON.parse(newJson);
      const { error } = await supabase.from('items').update(updatedItem).eq('id', item.id);
      if (error) console.error(`Failed to update item ${item.id}:`, error);
      else console.log(`Updated item ${item.id}`);
    }
  }

  for (const setting of settings) {
    const originalValue = typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value;
    const originalStr = typeof originalValue === 'string' ? originalValue : JSON.stringify(originalValue);
    
    if (originalStr.includes(OLD_DOMAIN)) {
      const newStr = originalStr.replaceAll(OLD_DOMAIN, NEW_DOMAIN);
      let updatedValue = newStr;
      try {
        if (typeof setting.value === 'object') updatedValue = JSON.parse(newStr);
      } catch (e) {}

      const { error } = await supabase.from('admin_settings').update({ value: updatedValue }).eq('key', setting.key);
      if (error) console.error(`Failed to update setting ${setting.key}:`, error);
      else console.log(`Updated setting ${setting.key}`);
    }
  }

  console.log("Done updating URLs in DB.");
}

main().catch(console.error);
