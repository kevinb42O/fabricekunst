import { getR2ConfigurationError } from './_lib/r2.js';
import { hiddenProjectAccess, readRembrandtProjectAccess } from './_lib/rembrandtProjectAccess.js';

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'no-store');
  const access = getR2ConfigurationError()
    ? hiddenProjectAccess()
    : await readRembrandtProjectAccess();
  return req.method === 'HEAD' ? res.status(200).end() : res.status(200).json(access);
}
