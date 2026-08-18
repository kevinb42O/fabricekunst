export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_PAT = process.env.SUPABASE_PAT;
  const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

  if (!SUPABASE_PAT || !SUPABASE_PROJECT_REF) {
    // If running without keys, return the mock data to keep the UI functional
    return res.status(200).json(getMockData(SUPABASE_PROJECT_REF || 'demo-project'));
  }

  try {
    // Fetch main usage metrics from Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase API Error:", response.status, errorText);
      
      // Return a simulated structured response if API endpoint is incorrect / changed or lacks permissions
      // We do this to ensure the dashboard doesn't break while configuring the correct permissions
      if (response.status === 404 || response.status === 403 || response.status === 401) {
         return res.status(200).json(getMockData(SUPABASE_PROJECT_REF));
      }
      
      return res.status(response.status).json({ error: `Supabase API Error: ${response.statusText}` });
    }

    const data = await response.json();

    // Cache the response at the edge for 5 minutes (300 seconds) to prevent rate limiting
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error("Error fetching Supabase metrics:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Fallback mock data structure matching the Supabase Usage Dashboard
// This is used if the PAT lacks permissions or the endpoint is 404
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
