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
  if (req.query?.resource === 'rembrandt-project') {
    if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Method Not Allowed' });
    try {
      const access = await readRembrandtProjectAccess();
      let project = { isEnabled: false };
      if (access.enabled === true) {
        const { snapshot } = await readPublicContentSnapshot();
        project = redactHiddenRembrandtProject(snapshot, access).rembrandtProject;
      }
      res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      res.setHeader('CDN-Cache-Control', 'no-store');
      return req.method === 'HEAD'
        ? res.status(200).end()
        : res.status(200).json({ ok: true, project });
    } catch (error) {
      console.error('Public Rembrandt Project read failed:', error);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json({ error: 'Het project is tijdelijk niet beschikbaar.' });
    }
  }
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  const configurationError = getR2ConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return res.status(503).json({ error: "Public content is unavailable." });
  }

  try {
    const { snapshot } = await readPublicContentSnapshot();
    // The large shared website snapshot is cacheable only because project
    // content is always stripped. The gated project has its own no-store API.
    const serialized = JSON.stringify({ ...snapshot, rembrandtProject: { isEnabled: false } });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).send(serialized);
  } catch (error) {
    console.error("Public content read failed:", error);
    res.setHeader("Cache-Control", "no-store");
    return res
      .status(503)
      .json({ error: "Public content is temporarily unavailable." });
  }
}
