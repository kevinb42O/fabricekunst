import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';

const SUPABASE_MANAGEMENT_TOKEN = process.env.SUPABASE_PAT || process.env.SUPABASE_ACCESS_TOKEN;
const getSupabaseProjectRef = () => {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;

  try {
    const hostname = new URL(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).hostname;
    return hostname.endsWith('.supabase.co') ? hostname.split('.')[0] : null;
  } catch {
    return null;
  }
};

const supabase = getServerSupabase();

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function getR2BucketSize() {
  if (!process.env.R2_BUCKET_NAME) return null;
  try {
    let totalSize = 0;
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
      });
      const response = await s3.send(command);

      if (response.Contents) {
        response.Contents.forEach(obj => {
          totalSize += obj.Size;
        });
      }

      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }
    return totalSize;
  } catch (e) {
    console.error("Failed to fetch R2 bucket size", e);
    return null;
  }
}

async function getHostingPlan() {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'hosting_plan')
      .maybeSingle();
    
    if (error) throw error;
    return ['basis', 'pro', 'premium'].includes(data?.value) ? data.value : 'basis';
  } catch (e) {
    console.error('[hosting-metrics] Hosting plan unavailable:', e.message);
    return 'basis';
  }
}

const setUsage = (usages, metric, usage, source) => {
  if (!Number.isFinite(usage) || usage < 0) return;
  const existing = usages.find(item => item.metric === metric);
  const next = { metric, usage, unit: 'bytes', source };
  if (existing) Object.assign(existing, next);
  else usages.push(next);
};

async function getSupabaseDatabaseSize() {
  const projectRef = getSupabaseProjectRef();
  if (!SUPABASE_MANAGEMENT_TOKEN || !projectRef) {
    return {
      usage: null,
      error: 'Supabase Management API is niet geconfigureerd.',
    };
  }

  try {
    // Supabase's internal organization billing endpoint only accepts a
    // dashboard session and rejects Personal Access Tokens. The supported
    // Management API can, however, run this official read-only size query.
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'select sum(pg_database_size(pg_database.datname))::text as bytes from pg_database',
          read_only: true,
        }),
      }
    );
    if (!response.ok) throw new Error(`request failed (${response.status})`);

    const payload = await response.json();
    const usage = Number(payload?.[0]?.bytes);
    if (!Number.isFinite(usage) || usage < 0) throw new Error('response contained no database size');
    return { usage, error: null };
  } catch (error) {
    console.error('[hosting-metrics] Supabase database size unavailable:', error.message);
    return { usage: null, error: 'Supabase-databasegrootte kon niet worden opgehaald.' };
  }
}

async function getR2Egress() {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    return { usage: null, error: 'Het mediaverbruik is niet geconfigureerd.' };
  }

  try {
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
    const dateStr = date30DaysAgo.toISOString();
    const query = `
      query {
        viewer {
          accounts(filter: {accountTag: "${process.env.CLOUDFLARE_ACCOUNT_ID}"}) {
            r2OperationsAdaptiveGroups(limit: 1, filter: {datetime_gt: "${dateStr}"}) {
              sum { responseBytes }
            }
          }
        }
      }
    `;
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) throw new Error(`request failed (${response.status})`);

    const payload = await response.json();
    if (payload?.errors?.length) throw new Error(payload.errors[0]?.message || 'GraphQL request failed');
    const usage = Number(payload?.data?.viewer?.accounts?.[0]?.r2OperationsAdaptiveGroups?.[0]?.sum?.responseBytes);
    if (!Number.isFinite(usage) || usage < 0) throw new Error('response contained no responseBytes value');
    return { usage, error: null };
  } catch (error) {
    console.error('[hosting-metrics] Cloudflare egress unavailable:', error.message);
    return { usage: null, error: 'Het mediaverbruik kon niet worden opgehaald.' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!supabase) {
    console.error('[hosting-metrics] Required server configuration is missing.');
    return sendJson(res, 503, { error: 'Hostingstatistieken zijn tijdelijk niet beschikbaar.' });
  }

  const admin = await requireActiveAdmin(req, supabase);
  if (!admin.ok) return sendJson(res, admin.status, { error: 'Beheerderssessie vereist.' });

  try {
    const [r2Size, plan, databaseSizeResult, r2EgressResult] = await Promise.all([
      getR2BucketSize(),
      getHostingPlan(),
      getSupabaseDatabaseSize(),
      getR2Egress(),
    ]);

    const usages = [];

    if (Number.isFinite(databaseSizeResult.usage)) {
      setUsage(usages, 'db_size', databaseSizeResult.usage, 'supabase_database');
    }

    // Cached egress is Supabase Smart CDN traffic. This application serves its
    // media through Cloudflare R2 instead of Supabase Storage, so no Supabase
    // cached egress is generated.
    setUsage(usages, 'cached_egress', 0, 'not_applicable_supabase_cdn');

    // Uploaded website media lives in R2. Keep Supabase Storage separate from
    // this customer-facing media figure and only fall back to it when R2 is not
    // available.
    if (Number.isFinite(r2Size)) {
      setUsage(usages, 'storage_size', r2Size, 'cloudflare_r2');
    }

    // Website media traffic is served by R2. Never manufacture traffic from a
    // percentage estimate.
    if (Number.isFinite(r2EgressResult.usage)) {
      const supabaseEgress = usages.find(item => item.metric === 'egress')?.usage;
      setUsage(
        usages,
        'egress',
        (Number.isFinite(supabaseEgress) ? supabaseEgress : 0) + r2EgressResult.usage,
        Number.isFinite(supabaseEgress) ? 'supabase+cloudflare_r2' : 'cloudflare_r2'
      );
    }

    const requiredMetrics = ['storage_size', 'db_size', 'egress', 'cached_egress'];
    const unavailableMetrics = requiredMetrics.filter(metric => !usages.some(item => item.metric === metric));
    const warnings = [databaseSizeResult.error, r2EgressResult.error].filter(Boolean);

    return sendJson(res, 200, {
      usages,
      plan,
      unavailableMetrics,
      warnings,
    });
    
  } catch (error) {
    console.error('[hosting-metrics] Unexpected failure:', error.message);
    return sendJson(res, 500, { error: 'Hostingstatistieken konden niet worden geladen.' });
  }
}
