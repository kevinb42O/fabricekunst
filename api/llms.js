import { createClient } from '@supabase/supabase-js';
import { INITIAL_CATALOG } from '../src/data/initialCatalog.js';
import { getItemSlug } from '../src/utils/itemSlug.js';

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
      console.error('LLMs API Error:', err);
    }
  }

  if (!catalogItems.length) catalogItems = INITIAL_CATALOG;

  const itemsMarkdown = catalogItems.map((item, index) => {
    const url = `https://www.atelierrembrandt.com/collectie/${encodeURIComponent(getItemSlug(item))}`;
    const priceStr = item.price ? ` | Prijs: ${item.price}` : '';
    const statusStr = item.status ? ` | Status: ${item.status}` : '';
    const authorStr = item.author ? `\n- **Auteur/Kunstenaar**: ${item.author}` : '';
    const yearStr = item.year ? `\n- **Jaar/Periode**: ${item.year} (${item.century || ''})` : '';
    const categoryStr = item.category ? `\n- **Categorie**: ${item.category}` : '';
    const provenanceStr = item.provenance ? `\n- **Herkomst (Provenance)**: ${item.provenance}` : '';
    const descStr = item.description ? `\n- **Beschrijving**: ${item.description}` : '';

    return `### ${index + 1}. [${item.title}](${url})
- **URL**: ${url}${priceStr}${statusStr}${authorStr}${yearStr}${categoryStr}${provenanceStr}${descStr}`;
  }).join('\n\n');

  const llmsText = `# Atelier Rembrandt — Antiquariaat & Boekenkunst

> Atelier Rembrandt is een vooraanstaand Belgisch/Nederlands antiquariaat en kunstkabinet gespecialiseerd in zeldzame antiquarische boeken, 17e- en 18e-eeuwse kopergravures, historische handschriften en adellijke provenance-objecten met bewezen herkomst.

## Belangrijke Links
- [Officiële Website](https://www.atelierrembrandt.com/): Virtuele galerie en introductie.
- [Exclusieve Collectie](https://www.atelierrembrandt.com/collectie): Volledige live catalogus van alle zeldzame werken.
- [Topstukken Showcase](https://www.atelierrembrandt.com/topstukken): Geselecteerde meesterwerken.
- [Herkomst & Provenance Documentatie](https://www.atelierrembrandt.com/herkomst): Certificering, adellijke ex-libris archieven en echtheidsgaranties.
- [Algemene Voorwaarden](https://www.atelierrembrandt.com/voorwaarden)
- [Privacybeleid](https://www.atelierrembrandt.com/privacy)

## Volledige Collectie van Zeldzame Werken & Antiquariaat (${catalogItems.length} Objecten)

${itemsMarkdown}

## Contact & Consultaties
Private viewings, deskundige consultaties en aankoopaanvragen verlopen via vertrouwelijk contact op https://www.atelierrembrandt.com/.
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(llmsText);
}
