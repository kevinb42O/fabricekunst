import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CATALOG } from '../src/data/initialCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readLocalEnv() {
  const values = {};
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return values;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    values[key] = value;
  }
  return values;
}

export async function loadCatalogForBuild() {
  const localEnv = readLocalEnv();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || localEnv.VITE_SUPABASE_URL || localEnv.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY || localEnv.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

      if (!error && Array.isArray(data) && data.length) {
        return { items: data, source: 'Supabase' };
      }
      if (error) console.warn(`Catalog fetch warning: ${error.message}`);
    } catch (error) {
      console.warn(`Catalog fetch warning: ${error.message}`);
    }
  }

  return { items: INITIAL_CATALOG, source: 'initial catalog fallback' };
}
