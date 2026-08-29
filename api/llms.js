import { INITIAL_CATALOG } from "../src/data/initialCatalog.js";
import { getItemSlug } from "../src/utils/itemSlug.js";
import { getR2ConfigurationError } from "./_lib/r2.js";
import { readPublicContentSnapshot } from "./_lib/publicContentReader.js";
import { readRembrandtProjectAccess } from "./_lib/rembrandtProjectAccess.js";

export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method Not Allowed");
  }
  let catalogItems = [];
  let rembrandtProject = null;

  if (!getR2ConfigurationError()) {
    try {
      const [{ snapshot }, access] = await Promise.all([
        readPublicContentSnapshot(),
        readRembrandtProjectAccess(),
      ]);
      catalogItems = snapshot.catalog;
      rembrandtProject = access.enabled === true ? snapshot.rembrandtProject || null : null;
    } catch (err) {
      console.error("LLMs R2 snapshot read error:", err);
    }
  }

  if (!catalogItems.length) catalogItems = INITIAL_CATALOG;

  const itemsMarkdown = catalogItems
    .map((item, index) => {
      const url = `https://www.atelierrembrandt.com/collectie/${encodeURIComponent(getItemSlug(item))}`;
      const priceStr = item.price ? ` | Prijs: ${item.price}` : "";
      const statusStr = item.status ? ` | Status: ${item.status}` : "";
      const authorStr = item.author
        ? `\n- **Auteur/Kunstenaar**: ${item.author}`
        : "";
      const yearStr = item.year
        ? `\n- **Jaar/Periode**: ${item.year} (${item.century || ""})`
        : "";
      const categoryStr = item.category
        ? `\n- **Categorie**: ${item.category}`
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

  const llmsText = `# Atelier Rembrandt — Antiquariaat & Boekenkunst

> Atelier Rembrandt is een vooraanstaand Belgisch/Nederlands antiquariaat en kunstkabinet gespecialiseerd in zeldzame antiquarische boeken, 17e- en 18e-eeuwse kopergravures, historische handschriften en adellijke provenance-objecten met bewezen herkomst.

## Belangrijke Links
- [Officiële Website](https://www.atelierrembrandt.com/): Virtuele galerie en introductie.
- [Exclusieve Collectie](https://www.atelierrembrandt.com/collectie): Volledige live catalogus van alle zeldzame werken.
- [Topstukken Showcase](https://www.atelierrembrandt.com/topstukken): Geselecteerde meesterwerken.
- [Herkomst & Provenance Documentatie](https://www.atelierrembrandt.com/herkomst): Certificering, adellijke ex-libris archieven en echtheidsgaranties.
${rembrandtProject?.isEnabled ? "- [The Rembrandt Project](https://www.atelierrembrandt.com/rembrandt-project): Doorlopend onderzoeksjournaal met gecontroleerde bevindingen en duidelijke voorbehouden.\n" : ""}- [Algemene Voorwaarden](https://www.atelierrembrandt.com/voorwaarden)
- [Privacybeleid](https://www.atelierrembrandt.com/privacy)

## Volledige Collectie van Zeldzame Werken & Antiquariaat (${catalogItems.length} Objecten)

${itemsMarkdown}

## Contact & Consultaties
Private viewings, deskundige consultaties en aankoopaanvragen verlopen via vertrouwelijk contact op https://www.atelierrembrandt.com/.
`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.status(200).send(req.method === "HEAD" ? "" : llmsText);
}
