import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import { getR2ConfigurationError } from './_lib/r2.js';
import { publishPublicContentSnapshot } from './_lib/publicContent.js';
import rembrandtProjectHandler from './_lib/rembrandtProjectEndpoint.js';
import rembrandtProjectPreviewLinksHandler from './_lib/rembrandtProjectPreviewLinksEndpoint.js';

export default async function handler(req, res) {
  if (req.query?.resource === 'rembrandt-project-preview-links') {
    return rembrandtProjectPreviewLinksHandler(req, res);
  }
  if (req.query?.resource === 'rembrandt-project') {
    return rembrandtProjectHandler(req, res);
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  const supabase = getServerSupabase();
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });

  const configurationError = getR2ConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return sendJson(res, 503, { error: 'De websiteversie kan momenteel niet worden gepubliceerd.' });
  }

  try {
    const { snapshot, bytes } = await publishPublicContentSnapshot(supabase);

    return sendJson(res, 200, {
      ok: true,
      publishedAt: snapshot.publishedAt,
      bytes,
      items: snapshot.catalog.length,
    });
  } catch (error) {
    console.error('Public content publish failed:', error);
    return sendJson(res, 500, { error: 'De websiteversie kon niet worden gepubliceerd.' });
  }
}
