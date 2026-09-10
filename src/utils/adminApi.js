import { supabase } from './supabaseClient';

/**
 * Fetch an administrator-only server endpoint with the current Supabase access
 * token. The server still verifies the administrator role; this helper makes
 * it difficult for a dashboard caller to accidentally omit authentication.
 */
export const authenticatedAdminFetch = async (input, init = {}) => {
  if (!supabase) {
    throw new Error('Beheerdersauthenticatie is niet geconfigureerd.');
  }

  let { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  let accessToken = data?.session?.access_token;
  if (!accessToken) {
    try {
      const refreshed = await supabase.auth.refreshSession();
      accessToken = refreshed?.data?.session?.access_token;
    } catch {
      // ignore, handled below
    }
  }

  if (!accessToken) {
    throw new Error('Uw beheerderssessie is verlopen. Meld u opnieuw aan.');
  }

  const doFetch = (token) =>
    fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await doFetch(accessToken);

  // If server rejected with 401 (e.g. token expired while page was open), try to refresh token once and retry
  if (response.status === 401) {
    try {
      const refreshed = await supabase.auth.refreshSession();
      const newToken = refreshed?.data?.session?.access_token;
      if (newToken && newToken !== accessToken) {
        response = await doFetch(newToken);
      }
    } catch {
      // ignore, return original 401 response
    }
  }

  return response;
};
