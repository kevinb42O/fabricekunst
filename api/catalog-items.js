import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';
import { getR2ConfigurationError } from './_lib/r2.js';
import { publishPublicContentSnapshot } from './_lib/publicContent.js';
import { getCategorySlug, getCollectionGroupForItem } from '../src/data/catalogTaxonomy.js';

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const ITEM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export const parseCatalogMutation = (body) => {
  if (!isPlainObject(body) || Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES || typeof body.action !== 'string') return null;
  if (body.action === 'save') {
    if (!isPlainObject(body.item) || Buffer.byteLength(JSON.stringify(body.item), 'utf8') > 512 * 1024) return null;
    return { action: 'save', item: body.item };
  }
  if (body.action === 'save-many') {
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100
      || body.items.some((item) => !isPlainObject(item) || Buffer.byteLength(JSON.stringify(item), 'utf8') > 512 * 1024)) return null;
    return { action: 'save-many', items: body.items };
  }
  if (body.action === 'delete' && typeof body.itemId === 'string' && ITEM_ID_PATTERN.test(body.itemId)) {
    return { action: 'delete', itemId: body.itemId };
  }
  return null;
};

// Keep the canonical row in the same normalized form as the former browser
// mapper, while item_ext_* retains every editor field for public publication.
export const toStoredCatalogItem = (item) => ({
  ...item,
  category: getCategorySlug(item.category),
  collectionGroup: getCollectionGroupForItem(item),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
  const contentLength = Number.parseInt(req.headers['content-length'] || '0', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return sendJson(res, 413, { error: 'De cataloguswijziging is te groot.' });
  }
  const supabase = getServerSupabase();
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok) return sendJson(res, authorization.status, { error: authorization.error });
  const mutation = parseCatalogMutation(req.body);
  if (!mutation) return sendJson(res, 400, { error: 'Ongeldige cataloguswijziging.' });
  try {
    const { error } = mutation.action === 'save'
      ? await supabase.rpc('save_catalog_item_atomically', { p_item: toStoredCatalogItem(mutation.item) })
      : mutation.action === 'save-many'
        ? await supabase.rpc('save_catalog_items_atomically', { p_items: mutation.items.map(toStoredCatalogItem) })
        : await supabase.rpc('delete_catalog_item_atomically', { p_item_id: mutation.itemId });
    if (error) throw error;
    const configurationError = getR2ConfigurationError();
    if (configurationError) {
      console.error(configurationError);
      return sendJson(res, 503, {
        error: 'De catalogus is opgeslagen, maar de publieke websiteversie kon niet worden bijgewerkt.',
        saved: true,
      });
    }
    await publishPublicContentSnapshot(supabase);
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[catalog-items] Mutation failed:', error?.message || error);
    return sendJson(res, 503, { error: 'De cataloguswijziging kon niet veilig worden opgeslagen.' });
  }
}
