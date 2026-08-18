import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PAT = process.env.SUPABASE_PAT;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function getR2BucketSize() {
  if (!process.env.R2_BUCKET_NAME) return 0;
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
    return 0;
  }
}

async function getHostingPlan() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return 'basis';
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'hosting_plan')
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Row doesn't exist yet, we can create it
      await supabase.from('admin_settings').insert({ key: 'hosting_plan', value: 'basis' });
      return 'basis';
    }
    
    return data?.value || 'basis';
  } catch (e) {
    console.error("Failed to fetch hosting plan", e);
    return 'basis';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Fetch real bucket size from R2
    const r2Size = await getR2BucketSize();
    
    // 2. Fetch hosting plan from DB
    const plan = await getHostingPlan();

    // 3. Fetch Supabase API Metrics
    let supabaseData = getMockData(SUPABASE_PROJECT_REF || 'demo-project');
    if (SUPABASE_PAT && SUPABASE_PROJECT_REF) {
      const response = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PAT}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        supabaseData = await response.json();
      }
    }

    // 4. Overwrite storage size in supabase data with real R2 data
    const storageMetricIndex = supabaseData.usages.findIndex(u => u.metric === 'storage_size');
    if (storageMetricIndex !== -1) {
      supabaseData.usages[storageMetricIndex].usage = r2Size;
    } else {
      supabaseData.usages.push({
        metric: 'storage_size',
        usage: r2Size,
        limit: 1073741824, // Fallback limit, will be overridden by frontend anyway
        unit: 'bytes'
      });
    }

    // 5. Append plan
    supabaseData.plan = plan;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(supabaseData);
    
  } catch (error) {
    console.error("Error fetching hosting metrics:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

function getMockData(ref) {
  return {
    usages: [
      {
        metric: 'cached_egress',
        usage: 6503673364, // ~6.057 GB
        limit: 5368709120, // 5.00 GB
        unit: 'bytes'
      },
      {
        metric: 'egress',
        usage: 2099157893, // ~1.955 GB
        limit: 5368709120, // 5 GB
        unit: 'bytes'
      },
      {
        metric: 'db_size',
        usage: 31138512, // ~0.029 GB
        limit: 536870912, // 0.5 GB
        unit: 'bytes'
      },
      {
        metric: 'storage_size',
        usage: 170724966, // ~0.159 GB
        limit: 1073741824, // 1 GB
        unit: 'bytes'
      },
      {
        metric: 'monthly_active_users',
        usage: 4,
        limit: 50000,
        unit: 'users'
      },
      {
        metric: 'monthly_active_sso_users',
        usage: 0,
        limit: 0,
        unit: 'users',
        available_in_plan: false
      }
    ],
    project_ref: ref,
    is_mock: true
  };
}
