import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';

const SUPABASE_MANAGEMENT_TOKEN = process.env.SUPABASE_PAT || process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_ORG_SLUG = process.env.SUPABASE_ORG_SLUG;

const SUPABASE_USAGE_METRICS = {
  EGRESS: 'egress',
  CACHED_EGRESS: 'cached_egress',
  DATABASE_SIZE: 'db_size',
  STORAGE_SIZE: 'storage_size',
};

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

const normalizeUsage = (usage) => {
  if (!usage || typeof usage.metric !== 'string') return null;
  const value = Number(usage.usage);
  if (!Number.isFinite(value) || value < 0) return null;
  return { ...usage, usage: value };
};

const setUsage = (usages, metric, usage, source) => {
  if (!Number.isFinite(usage) || usage < 0) return;
  const existing = usages.find(item => item.metric === metric);
  const next = { metric, usage, unit: 'bytes', source };
  if (existing) Object.assign(existing, next);
  else usages.push(next);
};

async function getSupabaseUsage() {
  const projectRef = getSupabaseProjectRef();
  if (!SUPABASE_MANAGEMENT_TOKEN || !SUPABASE_ORG_SLUG || !projectRef) {
    return {
      usages: [],
      error: 'Supabase Management API is niet geconfigureerd.',
    };
  }

  try {
    const usageUrl = new URL(
      `/platform/organizations/${encodeURIComponent(SUPABASE_ORG_SLUG)}/usage`,
      'https://api.supabase.com'
    );
    usageUrl.searchParams.set('project_ref', projectRef);

    const response = await fetch(usageUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`request failed (${response.status})`);

    const payload = await response.json();
    const usages = Array.isArray(payload?.usages)
      ? payload.usages
          .map(usage => {
            const metric = SUPABASE_USAGE_METRICS[usage?.metric];
            // The organization usage endpoint exposes billable/normalized units
            // in `usage` and the actual byte count in `usage_original`.
            // Every metric returned by this endpoint is normalized to bytes for
            // the dashboard, so always prefer the original value.
            const rawBytes = Number.isFinite(Number(usage?.usage_original))
              ? usage.usage_original
              : usage?.usage;
            return metric ? normalizeUsage({ ...usage, metric, usage: rawBytes }) : null;
          })
          .filter(Boolean)
          .map(usage => ({ ...usage, source: 'supabase' }))
      : [];

    if (usages.length === 0) throw new Error('response contained no usage metrics');
    return { usages, error: null };
  } catch (error) {
    console.error('[hosting-metrics] Supabase usage unavailable:', error.message);
    return { usages: [], error: 'Supabase-verbruik kon niet worden opgehaald.' };
  }
}

async function getR2Egress() {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    return { usage: null, error: 'Cloudflare-verbruik is niet geconfigureerd.' };
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
    return { usage: null, error: 'Cloudflare-verbruik kon niet worden opgehaald.' };
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
    const [r2Size, plan, supabaseResult, r2EgressResult] = await Promise.all([
      getR2BucketSize(),
      getHostingPlan(),
      getSupabaseUsage(),
      getR2Egress(),
    ]);

    const usages = [...supabaseResult.usages];

    // Uploaded website media lives in R2. Keep Supabase Storage separate from
    // this customer-facing media figure and only fall back to it when R2 is not
    // available.
    if (Number.isFinite(r2Size)) {
      setUsage(usages, 'storage_size', r2Size, 'cloudflare_r2');
    }

    // Direct traffic is the actual uncached Supabase egress plus bytes served
    // by R2. Never manufacture cached traffic from a percentage estimate.
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
    const warnings = [supabaseResult.error, r2EgressResult.error].filter(Boolean);

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
