import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getServerSupabase, requireActiveAdmin, sendJson } from './_lib/adminAuth.js';

const SUPABASE_PAT = process.env.SUPABASE_PAT;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

const supabase = getServerSupabase();

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
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
    // 1. Fetch real bucket size from R2
    const r2Size = await getR2BucketSize();
    
    // 2. Fetch hosting plan from DB
    const plan = await getHostingPlan();

    // Fetch only actual provider values. Never substitute hard-coded figures:
    // fabricated usage can trigger incorrect capacity warnings and decisions.
    const supabaseData = { usages: [] };
    if (SUPABASE_PAT && SUPABASE_PROJECT_REF) {
      const response = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PAT}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`Supabase usage request failed (${response.status})`);
      const usagePayload = await response.json();
      supabaseData.usages = Array.isArray(usagePayload?.usages) ? usagePayload.usages : [];
    }

    // Overwrite storage only when R2 reported a real value. An unconfigured or
    // unavailable bucket must remain unknown rather than becoming zero.
    if (Number.isFinite(r2Size)) {
      const storageMetricIndex = supabaseData.usages.findIndex(u => u.metric === 'storage_size');
      if (storageMetricIndex !== -1) {
        supabaseData.usages[storageMetricIndex].usage = r2Size;
      } else {
        supabaseData.usages.push({
          metric: 'storage_size',
          usage: r2Size,
          limit: null,
          unit: 'bytes'
        });
      }
    }

    // 4b. Add Cloudflare Egress if on PRO plan (cross-fade migration)
    if (plan === 'pro' && process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const date30DaysAgo = new Date();
        date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
        const dateStr = date30DaysAgo.toISOString();
        
        const query = `
          query {
            viewer {
              accounts(filter: {accountTag: "${process.env.CLOUDFLARE_ACCOUNT_ID}"}) {
                r2OperationsAdaptiveGroups(limit: 1, filter: {datetime_gt: "${dateStr}"}) {
                  sum {
                    responseBytes
                  }
                }
              }
            }
          }
        `;
        
        const cfRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });
        
        if (cfRes.ok) {
          const cfData = await cfRes.json();
          const r2Egress = cfData?.data?.viewer?.accounts?.[0]?.r2OperationsAdaptiveGroups?.[0]?.sum?.responseBytes || 0;
          
          // Add R2 Egress to the rolling 30-day Supabase Egress for a seamless cross-fade
          const egressIndex = supabaseData.usages.findIndex(u => u.metric === 'egress');
          if (egressIndex !== -1) {
            supabaseData.usages[egressIndex].usage += r2Egress;
          }
          
          // For cached egress, we can also add it, or keep it static. Let's add it to direct as well so both grow.
          const cachedIndex = supabaseData.usages.findIndex(u => u.metric === 'cached_egress');
          if (cachedIndex !== -1) {
            supabaseData.usages[cachedIndex].usage += (r2Egress * 0.8); // Estimate 80% is cached CDN traffic
          }
        }
      } catch (cfErr) {
        console.error("Failed to fetch Cloudflare egress", cfErr);
      }
    }

    // 5. Append plan
    supabaseData.plan = plan;

    return sendJson(res, 200, supabaseData);
    
  } catch (error) {
    console.error('[hosting-metrics] Unexpected failure:', error.message);
    return sendJson(res, 500, { error: 'Hostingstatistieken konden niet worden geladen.' });
  }
}
