# Analytics v2 rollout

Analytics v2 is intentionally server-mediated. Browser code must never read
from or write to `page_views`, `analytics_events`, or
`analytics_events_v2` through the Supabase client.

## Deployment order

1. Apply [202608200001_analytics_v2_security.sql](migrations/202608200001_analytics_v2_security.sql).
   It preserves historical v1 rows, revokes all browser-role telemetry access,
   creates `analytics_events_v2`, indexes, the rate limiter, and retention
   functions.
2. Configure the server-only environment variables below in Vercel. Do not use
   a `VITE_` prefix for any secret.
3. Deploy the API handlers and the client tracking update together. The v1
   tracker safely stops working as soon as the migration is applied; it must not
   be re-enabled as a fallback.
4. Verify authenticated reporting, then schedule the v2 retention function.
5. After the v2 rollout is accepted, explicitly purge the unsafe v1 raw data.

## Required server environment

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL for server handlers. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service key used by the collector and aggregate report API. Never expose it to the browser. |
| `ANALYTICS_RATE_LIMIT_SALT` | A random secret of at least 32 characters. It HMACs transient per-IP rate-limit buckets; rotate it if it is exposed. |
| `ANALYTICS_ALLOWED_ORIGINS` | Comma-separated exact origins permitted to call the collector, for example `https://www.atelierrembrandt.com,https://atelierrembrandt.com`. |

Optional controls:

| Variable | Default | Bounds | Meaning |
| --- | ---: | ---: | --- |
| `ANALYTICS_RATE_LIMIT_PER_MINUTE` | 60 | 10–240 | Event cost accepted per IP/minute. A batch costs its number of events. |
| `ANALYTICS_MAX_EVENT_AGE_SECONDS` | 900 | 60–3600 | Largest accepted delay between a browser event and collector receipt. |
| `ANALYTICS_REPORT_MAX_EVENTS` | 25000 | 1000–100000 | Maximum v2 rows the aggregate endpoint reads per reporting window; API response sets `meta.partial` when capped. |

The collector is fail-closed if its Supabase configuration or rate-limit salt is
missing. It also requires an Origin header on deployed production and preview
URLs. That is preferable to silently reopening direct telemetry writes.

## Endpoint contracts

### `POST /api/analytics`

This is same-origin, rate-limited, and deliberately returns only ingestion
counts. It accepts at most 20 v2 events:

```json
{
  "events": [
    {
      "eventId": "UUID used for retry de-duplication",
      "eventName": "page_view",
      "occurredAt": "2026-08-20T12:00:00.000Z",
      "pagePath": "/collectie",
      "visitId": "ephemeral 30-minute UUID",
      "attribution": {
        "source": "instagram",
        "medium": "social",
        "campaign": "organisch"
      },
      "data": { "pageType": "collection", "locale": "nl" },
      "version": 2
    }
  ]
}
```

`visitorId` is neither required nor persisted. If an older client sends it, the
collector ignores it. The API stores a short-lived `visitId` only, strips raw
URLs to a referrer origin, derives a coarse device/browser category from the
request header, and retains only the documented event-property allow-list.

`inquiry_submitted` must contain only `data.inquiryId` after the inquiry was
saved successfully. The collector confirms that opaque ID exists and was
created within the past 24 hours before counting the conversion. It never
stores names, email addresses, messages, search terms, click coordinates,
selectors, raw user agents, full referrers, or IP addresses.

### `GET /api/admin-analytics?range=7d`

This endpoint requires the current Supabase access token in
`Authorization: Bearer <token>` and verifies an active `admin_profiles` role.
It returns aggregates only—not telemetry rows—with exact supported ranges:
`24h`, `7d`, `30d`, `3m`, `12m`, `ytd`, and `all`. The dashboard should display
`meta.partial` if the configured report cap is reached and should use the term
**sessions**, never visitors.

`GET /api/admin-analytics?sessionId=<recent-visit-uuid>` returns a redacted,
recent (35-minute) timeline for the live-activity detail view. It contains no
raw properties or personal/contact data.

The response's `funnel` fields are session-level journey signals. Direct object
landings count as object intent, and general contact journeys count as inquiry
intent; they are not hidden merely because they did not first open the
catalogue list. Read a stage's supplied `definition` alongside its share rather
than assuming every lead followed one linear route.

## Retention and legacy remediation

Run the v2 retention function once daily as a project owner or scheduler:

```sql
select public.purge_analytics_v2(395);
```

This retains v2 telemetry for 395 days and opaque HMAC rate-limit buckets for
three days (including inquiry-submission buckets after the inquiry hardening
migration). If `pg_cron` is enabled for the project, schedule the same command
daily through the project owner; otherwise invoke it through an approved
server-side scheduled job using `service_role` credentials.

The pre-v2 tables are intentionally retained during rollout because they may be
needed to validate migration history. They include unsafe raw user-agent,
referrer, and persistent-ID data and must not be retained indefinitely. Once
the v2 deployment is verified and any required backup/records process is
complete, a project owner can execute this explicit, irreversible purge:

```sql
select public.purge_legacy_analytics_v1(now());
```

The function has no default cutoff, is service-role-only, and no browser role
can invoke it. Take any required approved backup before running it.

## Verification queries

Run these as a project owner after the migration:

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('page_views', 'analytics_events', 'analytics_events_v2')
order by tablename, policyname;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('page_views', 'analytics_events', 'analytics_events_v2')
  and grantee in ('anon', 'authenticated', 'public')
order by table_name, grantee, privilege_type;
```

Both queries should show no browser-role telemetry access. Then verify:

1. a consented public event receives `202 Accepted` from `POST /api/analytics`;
2. direct browser attempts to query or insert raw telemetry tables fail;
3. a valid admin bearer token can read the aggregate endpoint;
4. a valid non-admin bearer token receives `403 Forbidden`;
5. an event that exceeds the configured per-minute cost receives `429`.
