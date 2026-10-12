import { timingSafeEqual } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const CHECKS = [
  { name: 'catalog', table: 'items', column: 'id' },
  { name: 'settings', table: 'admin_settings', column: 'key' },
  { name: 'analytics', table: 'analytics_events_v2', column: 'id' },
];

const authorized = (header, secret) => {
  if (typeof header !== 'string') return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

// Dependency injection keeps security, retries and timeouts testable without
// touching a real database. Each query reads at most one narrow column; none
// of the returned database values enter the response or logs.
export function createSupabaseHealthHandler({
  env = process.env,
  fetchImpl = (...args) => fetch(...args),
  wait = delay,
  logger = console,
  timeoutMs = 5000,
} = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'Method not allowed.' });
    }
    const secret = env.CRON_SECRET;
    if (typeof secret !== 'string' || secret.length < 32) {
      return res.status(503).json({ ok: false, error: 'Health check is not configured.' });
    }
    if (!authorized(req.headers?.authorization, secret)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized.' });
    }

    const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
    let base;
    try {
      base = new URL(env.SUPABASE_URL || env.VITE_SUPABASE_URL);
      if (base.protocol !== 'https:' || base.username || base.password || !key) throw new Error();
    } catch {
      return res.status(503).json({ ok: false, error: 'Database configuration is incomplete.' });
    }

    const started = Date.now();
    const query = async (check) => {
      const url = new URL(`/rest/v1/${check.table}`, base);
      url.searchParams.set('select', check.column);
      url.searchParams.set('limit', '1');
      const signal = AbortSignal.timeout(timeoutMs);
      try {
        const response = await fetchImpl(url, {
          method: 'GET',
          headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
          cache: 'no-store',
          redirect: 'error',
          signal,
        });
        if (!response.ok) {
          await response.body?.cancel();
          return {
            name: check.name, ok: false, error: `http_${response.status}`,
            retryable: response.status === 429 || response.status >= 500,
          };
        }
        const rows = await response.json();
        if (!Array.isArray(rows) || rows.length > 1) {
          return { name: check.name, ok: false, error: 'invalid_response', retryable: false };
        }
        return { name: check.name, ok: true, retryable: false };
      } catch {
        // Never serialize provider errors: they may include URLs, credentials
        // or response data. Redirects are refused to protect the service key.
        return {
          name: check.name, ok: false,
          error: signal.aborted ? 'timeout' : 'request_failed', retryable: true,
        };
      }
    };

    let checks = await Promise.all(CHECKS.map(query));
    let attempts = 1;
    if (checks.some(check => check.retryable)) {
      await wait(500);
      attempts = 2;
      checks = await Promise.all(checks.map((result, index) =>
        result.retryable ? query(CHECKS[index]) : result));
    }
    const report = {
      ok: checks.every(check => check.ok),
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      attempts,
      checks: checks.map(({ retryable: _retryable, ...result }) => result),
    };
    logger[report.ok ? 'info' : 'error']('[supabase-health]', JSON.stringify(report));
    return res.status(report.ok ? 200 : 503).json(report);
  };
}
