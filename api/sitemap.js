import { INITIAL_CATALOG } from "../src/data/initialCatalog.js";
import { buildSitemapXml } from "../src/utils/sitemap.js";
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
    } catch (error) {
      console.error("Sitemap R2 snapshot read error:", error.message);
    }
  }

  if (!catalogItems.length) catalogItems = INITIAL_CATALOG;

  const sitemap = buildSitemapXml(catalogItems, { rembrandtProject });
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=0, s-maxage=60, stale-while-revalidate=60",
  );
  return res.status(200).send(req.method === "HEAD" ? "" : sitemap);
}
