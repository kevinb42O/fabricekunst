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

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Uw beheerderssessie is verlopen. Meld u opnieuw aan.');
  }

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  });
};
