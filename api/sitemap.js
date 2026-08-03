import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  let catalogItems = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        catalogItems = data;
      }
    } catch (err) {
      console.error('Sitemap API Error:', err);
    }
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

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(sitemapXml);
}
