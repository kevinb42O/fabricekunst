import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { defaultProvenance } from '../src/data/defaultProvenance.js';
import { normalizeProvenance, provenanceIssues, publicProvenance } from '../src/utils/provenance.js';
import { readPublishedProvenance, writeProvenancePublication } from '../api/_lib/provenancePublication.js';

dotenv.config({ path: process.env.PROVENANCE_ENV_FILE || '.env.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const userId = process.env.PROVENANCE_SEED_USER_ID || '3985d410-7ee6-492f-be4b-033741eb45ec';
const now = new Date().toISOString();

async function publish() {
  console.log('1. Ophalen huidige status...');
  const { data: page, error: pageError } = await supabase.from('provenance_pages').select('*').eq('id', 'main').single();
  if (pageError) throw pageError;

  const { data: media, error: mediaError } = await supabase.from('provenance_media').select('*').eq('status', 'ready');
  if (mediaError) throw mediaError;

  const draft = normalizeProvenance(defaultProvenance());
  const issues = provenanceIssues(draft, { publishing: true });
  if (issues.length) {
    console.error('Publicatiefouten:', issues);
    throw new Error('Publicatiecontrole mislukt: ' + issues.join('; '));
  }

  const content = publicProvenance(draft, media);
  console.log(`2. Inhoud gevalideerd: ${content.assets.length} beelden, ${content.comparisons.length} vergelijkingen.`);

  if (content.assets.some(asset => !asset.url || !asset.variants?.length)) {
    throw new Error('Niet alle standaardafbeeldingen hebben een publieke R2-variant.');
  }

  const current = await readPublishedProvenance();
  const nextVersion = Math.max(Number(page.version) || 0, Number(page.published_version) || 0, Number(current?.pointer?.revision) || 0) + 1;
  const operationId = randomUUID();

  const pending = {
    operationId,
    version: nextVersion,
    previousRevision: current?.pointer?.revision ?? null,
    content,
    draft,
    userId,
    publishedAt: now,
  };

  console.log(`3. Publiceren naar R2 (versie ${nextVersion}, vorig: ${pending.previousRevision})...`);
  const publication = await writeProvenancePublication(pending);

  console.log('4. Bijwerken Supabase provenance_pages en provenance_revisions...');
  const { error: revisionError } = await supabase.from('provenance_revisions').upsert(
    { version: nextVersion, content: draft, kind: 'publication', created_by: userId, created_at: now },
    { onConflict: 'version,kind' }
  );
  if (revisionError) throw revisionError;

  const { error: updateError } = await supabase
    .from('provenance_pages')
    .update({
      draft,
      version: nextVersion,
      published_version: nextVersion,
      published_content: content,
      pending_publication: null,
      updated_at: now,
      updated_by: userId,
    })
    .eq('id', 'main');
  if (updateError) throw updateError;

  console.log('5. Verifiëren live publicatiepointer...');
  const verified = await readPublishedProvenance();
  console.log(`Succes! Live herkomstversie ${verified.pointer.revision} staat online.`);
  console.log(`Assets: ${verified.data.assets.length}, Vergelijkingen: ${verified.data.comparisons.length}`);
}

publish().catch(err => {
  console.error('Fout bij publiceren:', err);
  process.exit(1);
});
