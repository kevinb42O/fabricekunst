// Narrow, repeatable content repair. Read-only unless --apply is supplied.
import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { publishPublicContentSnapshot } from '../api/_lib/publicContent.js';

dotenv.config({ path: '.env.local', quiet: true });
const itemId = 'item-1785997854984';
const damaged = 'Herkomst uit pAfkomstig uit een Hongaarse privécollectie en bewaard in een zeer goede conditie, vertegenwoordigt deze katana de hoogste traditie van het Japanse smeedambacht. Zij vormt een zeldzame kans voor verzamelaars van Japanse kunst, samurai-erfgoed, Aziatische antiquiteiten en museumwaardige historische objecten.articuliere collectie.';
const repaired = damaged.replace(/^Herkomst uit p/, '').replace(/articuliere collectie\.$/, '');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server configuration is incomplete.');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const [{ data: item, error: itemError }, { data: extension, error: extensionError }] = await Promise.all([
  db.from('items').select('id,title,provenance,updated_at').eq('id', itemId).single(),
  db.from('admin_settings').select('key,value,updated_at').eq('key', `item_ext_${itemId}`).single(),
]);
if (itemError || extensionError) throw new Error('The target item could not be read.');
const extensionValue = typeof extension.value === 'string' ? JSON.parse(extension.value) : extension.value;
if (!item.title.includes('Tadahiro') || ![damaged, repaired].includes(item.provenance) || ![damaged, repaired].includes(extensionValue?.provenance)) {
  throw new Error('The item has changed; review the current content before repairing it.');
}
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ apply: false, itemId, title: item.title, before: item.provenance, after: repaired }, null, 2));
} else {
  await mkdir('scratch/audit-2026-10-30', { recursive: true });
  const backup = `scratch/audit-2026-10-30/tadahiro-before-repair-${Date.now()}.json`;
  await writeFile(backup, JSON.stringify({ item, extension }, null, 2), { mode: 0o600, flag: 'wx' });
  let changedItem;
  if (item.provenance === damaged) {
    const { data, error } = await db.from('items')
      .update({ provenance: repaired, updated_at: new Date().toISOString() })
      .eq('id', itemId).eq('provenance', damaged).eq('updated_at', item.updated_at)
      .select('id,updated_at').maybeSingle();
    if (error || !data) throw new Error('Concurrent item change: no repair was applied.');
    changedItem = data;
  }
  if (extensionValue.provenance === damaged) {
    const { data, error } = await db.from('admin_settings')
      .update({ value: JSON.stringify({ ...extensionValue, provenance: repaired }), updated_at: new Date().toISOString() })
      .eq('key', extension.key).eq('value', extension.value).eq('updated_at', extension.updated_at)
      .select('key').maybeSingle();
    if (error || !data) {
      if (changedItem) {
        const rollback = await db.from('items').update({ provenance: damaged, updated_at: item.updated_at })
          .eq('id', itemId).eq('provenance', repaired).eq('updated_at', changedItem.updated_at)
          .select('id').maybeSingle();
        if (rollback.error || !rollback.data) throw new Error(`Concurrent change prevented rollback. Review ${backup}.`);
      }
      throw new Error('Concurrent extension change: publication was stopped.');
    }
  }
  const publication = await publishPublicContentSnapshot(db);
  if (publication.snapshot.catalog.find(entry => entry.id === itemId)?.provenance !== repaired) {
    throw new Error('The published snapshot does not contain the repair.');
  }
  console.log(JSON.stringify({ ok: true, itemId, provenance: repaired, publishedAt: publication.snapshot.publishedAt, backup }, null, 2));
}
