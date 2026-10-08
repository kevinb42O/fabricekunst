import { authenticatedAdminFetch } from './adminApi.js';
import { isSupabaseConfigured } from './supabaseClient.js';
import { certificateDraftKey, normalizeCertificateDraft } from './certificateDrafts.js';

const endpoint = '/api/publish-public-content?resource=certificate-drafts';
const readResponse = async response => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    const error = new Error(body.error || 'Het certificaat kon niet worden opgeslagen.');
    error.status = response.status;
    throw error;
  }
  return body;
};

export async function loadCertificateDraft(itemId, language) {
  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem(certificateDraftKey(itemId, language));
    return saved ? JSON.parse(saved) : { draft: null, version: null };
  }
  return readResponse(await authenticatedAdminFetch(`${endpoint}&itemId=${encodeURIComponent(itemId)}&language=${language}`, {
    method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' },
  }));
}

export async function saveCertificateDraft(itemId, language, draft, expectedVersion) {
  const normalized = normalizeCertificateDraft(draft);
  if (!isSupabaseConfigured()) {
    const key = certificateDraftKey(itemId, language);
    const current = JSON.parse(localStorage.getItem(key) || 'null');
    if ((current?.version ?? null) !== expectedVersion) {
      throw new Error('Dit certificaat is in een ander tabblad gewijzigd. Herlaad de opgeslagen versie.');
    }
    const result = { draft: normalized, version: crypto.randomUUID() };
    localStorage.setItem(key, JSON.stringify(result));
    return result;
  }
  return readResponse(await authenticatedAdminFetch(endpoint, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ itemId, language, draft: normalized, expectedVersion }),
  }));
}
