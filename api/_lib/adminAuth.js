import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

/**
 * Returns a server-only Supabase client. Never import this module into browser
 * code: the service-role key deliberately bypasses row-level security.
 */
export const getServerSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

export const getBearerToken = (req) => {
  const authorization = req.headers.authorization || '';
  return authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;
};

/**
 * Verify an active administrator using the same Auth/profile boundary as the
 * rest of the protected Vercel handlers. The service client is only used to
 * verify the bearer token and inspect the allow-listed profile.
 */
export const requireActiveAdmin = async (req, suppliedClient = null) => {
  const supabase = suppliedClient || getServerSupabase();
  if (!supabase) return { ok: false, status: 503, error: 'Server configuration is incomplete.' };

  const accessToken = getBearerToken(req);
  if (!accessToken) return { ok: false, status: 401, error: 'A bearer token is required.' };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return { ok: false, status: 401, error: 'The bearer token is invalid or expired.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('user_id, role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .in('role', ['admin', 'developer'])
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, status: 403, error: 'An active administrator profile is required.' };
  }

  return { ok: true, supabase, user, profile };
};

export const sendJson = (res, status, payload) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(status).json(payload);
};
