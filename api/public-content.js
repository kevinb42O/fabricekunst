import { getR2ConfigurationError } from "./_lib/r2.js";
import { readPublicContentSnapshot } from "./_lib/publicContentReader.js";
import {
  readRembrandtProjectAccess,
  redactHiddenRembrandtProject,
} from "./_lib/rembrandtProjectAccess.js";
import rembrandtProjectAccessHandler from './_lib/rembrandtProjectAccessEndpoint.js';
import rembrandtProjectPreviewHandler from './_lib/rembrandtProjectPreviewEndpoint.js';

export default async function handler(req, res) {
  if (req.query?.resource === 'rembrandt-project-access') {
    return rembrandtProjectAccessHandler(req, res);
  }
  if (req.query?.resource === 'rembrandt-project-preview') {
    return rembrandtProjectPreviewHandler(req, res);
  }
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  const configurationError = getR2ConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return res.status(503).json({ error: "Public content is unavailable." });
  }

  try {
    const [{ snapshot }, access] = await Promise.all([
      readPublicContentSnapshot(),
      readRembrandtProjectAccess(),
    ]);
    const serialized = JSON.stringify(redactHiddenRembrandtProject(snapshot, access));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    res.setHeader("CDN-Cache-Control", "no-store");
    return res.status(200).send(serialized);
  } catch (error) {
    console.error("Public content read failed:", error);
    res.setHeader("Cache-Control", "no-store");
    return res
      .status(503)
      .json({ error: "Public content is temporarily unavailable." });
  }
}
