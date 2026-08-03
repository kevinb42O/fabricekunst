import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables
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
    console.warn('Could not load .env file:', e.message);
  }
}

import { INITIAL_CATALOG } from '../src/data/initialCatalog.js';

export async function generateLlmsContent() {
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
      console.error('Supabase fetch error for llms.txt:', err.message);
    }
  }

  if (catalogItems.length === 0) {
    catalogItems = INITIAL_CATALOG;
  }

  const itemsMarkdown = catalogItems.map((item, index) => {
    const url = `https://www.atelierrembrandt.com/collectie/${encodeURIComponent(item.id)}`;
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

  return `# Atelier Rembrandt — Antiquariaat & Boekenkunst

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
}

async function run() {
  console.log('🔄 Generating comprehensive llms.txt with all live catalog items...');
  const content = await generateLlmsContent();
  const outputPath = path.resolve(__dirname, '../public/llms.txt');
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`🎉 Successfully created hyper-detailed llms.txt at: ${outputPath}`);
}

run();
