import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { defaultProvenance } from '../src/data/defaultProvenance.js';
import { publicProvenance } from '../src/utils/provenance.js';
import { readPublishedProvenance, writeProvenancePublication } from '../api/_lib/provenancePublication.js';

dotenv.config({ path: process.env.PROVENANCE_ENV_FILE || '.env.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const userId = process.env.PROVENANCE_SEED_USER_ID || '3985d410-7ee6-492f-be4b-033741eb45ec';
const now = new Date().toISOString();

const { data: page, error: pageError } = await supabase.from('provenance_pages').select('*').eq('id', 'main').single();
if (pageError) throw pageError;
const { data: media, error: mediaError } = await supabase.from('provenance_media').select('*').eq('status', 'ready');
if (mediaError) throw mediaError;
const draft = defaultProvenance();
const content = publicProvenance(draft, media);
if (content.assets.some(asset => !asset.url || !asset.variants?.length)) throw new Error('Niet alle standaardafbeeldingen hebben een publieke R2-variant.');
const current = await readPublishedProvenance();
if (page.published_version && current?.data?.schemaVersion === 3) {
  console.log(`Provenance is al gepubliceerd (versie ${page.published_version}); seed-publicatie overgeslagen.`);
  process.exit(0);
}
const version = Math.max(Number(page.version) || 0, Number(page.published_version) || 0) + 1;
const pending = { operationId: randomUUID(), version, previousRevision: current?.pointer.revision ?? null, content, draft, userId, publishedAt: now };
const { error: draftError } = await supabase.from('provenance_pages').update({ draft, version, updated_at: now, updated_by: userId }).eq('id', 'main').eq('version', page.version);
if (draftError) throw draftError;
const publication = await writeProvenancePublication(pending);
const { error: revisionError } = await supabase.from('provenance_revisions').upsert({ version, content: draft, kind: 'publication', created_by: userId, created_at: now }, { onConflict: 'version,kind' });
if (revisionError) throw revisionError;
const { error: publishError } = await supabase.from('provenance_pages').update({ published_version: version, published_content: content, pending_publication: null }).eq('id', 'main').eq('version', version);
if (publishError) throw publishError;
console.log(`Eerste provenancepublicatie staat live: versie ${version}, ${publication.data.assets.length} R2-beelden.`);
