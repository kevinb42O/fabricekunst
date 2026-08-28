import { getR2ConfigurationError } from "./_lib/r2.js";
import { readPublicContentSnapshot } from "./_lib/publicContentReader.js";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  const configurationError = getR2ConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return res.status(503).json({ error: "Public content is unavailable." });
  }

  try {
    const { serialized: snapshot } = await readPublicContentSnapshot();

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=15, stale-while-revalidate=86400, stale-if-error=604800",
    );
    res.setHeader(
      "CDN-Cache-Control",
      "public, s-maxage=15, stale-while-revalidate=86400, stale-if-error=604800",
    );
    return res.status(200).send(snapshot);
  } catch (error) {
    console.error("Public content read failed:", error);
    res.setHeader("Cache-Control", "no-store");
    return res
      .status(503)
      .json({ error: "Public content is temporarily unavailable." });
  }
}
