import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadCatalogForBuild } from "./catalog-source.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getLocalizedCategoryLabel } from "../src/data/catalogTaxonomy.js";
import { getItemSlug } from "../src/utils/itemSlug.js";

export async function generateLlmsContent() {
  const { items: catalogItems, project } = await loadCatalogForBuild();

  const itemsMarkdown = catalogItems
    .map((item, index) => {
      const url = `https://www.atelierrembrandt.com/collectie/${encodeURIComponent(getItemSlug(item))}`;
      const priceStr = item.price ? ` | Prijs: ${item.price}` : "";
      const statusStr = item.status ? ` | Status: ${item.status}` : "";
      const authorStr = item.author
        ? `\n- **Auteur/Kunstenaar**: ${item.author.trim()}`
        : "";
      const yearStr = item.year
        ? `\n- **Jaar/Periode**: ${item.year} (${item.century || ""})`
        : "";
      const categoryStr = item.category
        ? `\n- **Categorie**: ${getLocalizedCategoryLabel(item.category, "nl")}`
        : "";
      const provenanceStr = item.provenance
        ? `\n- **Herkomst (Provenance)**: ${item.provenance}`
        : "";
      const descStr = item.description
        ? `\n- **Beschrijving**: ${item.description}`
        : "";

      return `### ${index + 1}. [${item.title}](${url})
- **URL**: ${url}${priceStr}${statusStr}${authorStr}${yearStr}${categoryStr}${provenanceStr}${descStr}`;
    })
    .join("\n\n");

  return `# Atelier Rembrandt — Antiquariaat & Boekenkunst

> Atelier Rembrandt is een vooraanstaand Belgisch/Nederlands antiquariaat en kunstkabinet gespecialiseerd in zeldzame antiquarische boeken, 17e- en 18e-eeuwse kopergravures, historische handschriften en adellijke provenance-objecten met bewezen herkomst.

## Belangrijke Links
- [Officiële Website](https://www.atelierrembrandt.com/): Virtuele galerie en introductie.
- [Exclusieve Collectie](https://www.atelierrembrandt.com/collectie): Volledige live catalogus van alle zeldzame werken.
- [Topstukken Showcase](https://www.atelierrembrandt.com/topstukken): Geselecteerde meesterwerken.
- [Herkomst & Provenance Documentatie](https://www.atelierrembrandt.com/herkomst): Certificering, adellijke ex-libris archieven en echtheidsgaranties.
${project?.isEnabled ? "- [The Rembrandt Project](https://www.atelierrembrandt.com/rembrandt-project): Doorlopend onderzoeksjournaal over de mogelijke ontdekking van een verloren werk, met transparante updates, bevindingen en voorbehouden.\n" : ""}\
- [Algemene Voorwaarden](https://www.atelierrembrandt.com/voorwaarden)
- [Privacybeleid](https://www.atelierrembrandt.com/privacy)

## Volledige Collectie van Zeldzame Werken & Antiquariaat (${catalogItems.length} Objecten)

${itemsMarkdown}

## Contact & Consultaties
Private viewings, deskundige consultaties en aankoopaanvragen verlopen via vertrouwelijk contact op https://www.atelierrembrandt.com/.
`;
}

async function run() {
  console.log(
    "Generating comprehensive llms.txt with all live catalog items...",
  );
  const content = await generateLlmsContent();
  const outputPath = path.resolve(__dirname, "../public/llms.txt");
  fs.writeFileSync(outputPath, content, "utf-8");
  console.log(`Created hyper-detailed llms.txt at: ${outputPath}`);
}

run();
