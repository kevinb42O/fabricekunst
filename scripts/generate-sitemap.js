import { loadCatalogForBuild } from "./catalog-source.js";
import { buildSitemapXml } from "../src/utils/sitemap.js";

const { items, project, source } = await loadCatalogForBuild();
process.stdout.write(buildSitemapXml(items, { rembrandtProject: project }));
console.error(
  `Generated sitemap preview with ${items.length} items from ${source}.`,
);
