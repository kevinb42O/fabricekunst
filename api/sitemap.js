import { createClient } from '@supabase/supabase-js';
import { INITIAL_CATALOG } from '../src/data/initialCatalog.js';
import { buildSitemapXml } from '../src/utils/sitemap.js';

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method Not Allowed');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  let catalogItems = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

      if (!error && Array.isArray(data) && data.length) catalogItems = data;
      if (error) console.error('Sitemap catalog fetch error:', error.message);
    } catch (error) {
      console.error('Sitemap catalog fetch error:', error.message);
    }
  }

  if (!catalogItems.length) catalogItems = INITIAL_CATALOG;

  const sitemap = buildSitemapXml(catalogItems);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(req.method === 'HEAD' ? '' : sitemap);
}
