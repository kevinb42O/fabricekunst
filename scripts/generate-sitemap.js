import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables (from process.env or fallback to .env file)
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const val = valueParts.join('=').trim();
          if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
          if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
        }
      });
    }
  } catch (e) {
    console.warn('Could not load .env file for sitemap generation:', e.message);
  }
}

import { INITIAL_CATALOG } from '../src/data/initialCatalog.js';

async function generateSitemap() {
  console.log('🔄 Fetching live catalog items from Supabase for sitemap generation...');
  let catalogItems = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Query 'items' table from Supabase
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        catalogItems = data;
        console.log(`✅ Loaded ${catalogItems.length} live catalog items directly from Supabase ('items' table).`);
      } else if (error) {
        console.warn('⚠️ Supabase fetch warning:', error.message);
      }
    } catch (err) {
      console.error('⚠️ Could not fetch from Supabase:', err.message);
    }
  }

  if (catalogItems.length === 0) {
    catalogItems = INITIAL_CATALOG;
    console.log(`ℹ️ Using initial catalog fallback (${catalogItems.length} items).`);
  }

  const today = new Date().toISOString().split('T')[0];

  const escapeXml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const xmlEntries = catalogItems.map(item => {
    const itemUrl = `https://www.atelierrembrandt.com/collectie/${encodeURIComponent(item.id)}`;
    let imageXml = '';

    let cleanImages = Array.isArray(item.images) ? item.images.filter(img => img && !img.__ext__) : [];
    if (cleanImages.length > 0 && cleanImages[0]?.url) {
      let imgUrl = cleanImages[0].url;
      if (imgUrl.startsWith('/')) {
        imgUrl = `https://www.atelierrembrandt.com${imgUrl}`;
      }
      imageXml = `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(item.title || 'Atelier Rembrandt Collectie')}</image:title>
    </image:image>`;
    }

    return `  <!-- Item: ${escapeXml(item.title)} -->
  <url>
    <loc>${itemUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>${imageXml}
  </url>`;
  }).join('\n\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Main Pages -->
  <url>
    <loc>https://www.atelierrembrandt.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://www.atelierrembrandt.com/images/provenience-light-cream-hero.jpg</image:loc>
      <image:title>Atelier Rembrandt — Antiquariaat &amp; Boekenkunst</image:title>
    </image:image>
  </url>

  <url>
    <loc>https://www.atelierrembrandt.com/collectie</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://www.atelierrembrandt.com/topstukken</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://www.atelierrembrandt.com/herkomst</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Live Dynamic Items from Supabase Database (${catalogItems.length} Items) -->
${xmlEntries}

  <!-- Legal & Static Pages -->
  <url>
    <loc>https://www.atelierrembrandt.com/voorwaarden</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>https://www.atelierrembrandt.com/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>
`;

  const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemapXml, 'utf-8');
  console.log(`🎉 Successfully generated hyper-complete sitemap with ${catalogItems.length} Supabase items at: ${outputPath}`);
}

generateSitemap();
