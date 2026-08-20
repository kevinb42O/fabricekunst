# Secure inquiry-submission rollout

Public inquiry forms are server-mediated as of
[202608200002_inquiry_submission_security.sql](migrations/202608200002_inquiry_submission_security.sql).
The browser must never insert directly into `public.inquiries` with the
Supabase anonymous key.

## Deployment order

1. Apply the earlier admin/RLS and analytics v2 migrations, then apply
   `202608200002_inquiry_submission_security.sql`.
2. Add the required server-only environment variables below in Vercel.
3. Deploy `api/inquiries.js` and the storage-client change together. Once the
   migration is active, old direct browser inserts intentionally fail closed.
4. Verify a real form submission, admin read/update/delete, rate-limit
   behavior, and the existing one-time push-notification claim.

## Required server environment

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL for Vercel server handlers. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for the validated writer. Never expose it to the browser. |
| `INQUIRY_RATE_LIMIT_SALT` | A distinct random secret of at least 32 characters. It HMACs a transient IP/window bucket; it is not an IP address. |

`INQUIRY_ALLOWED_ORIGINS` is optional but strongly recommended: a comma-separated
allow-list of exact site origins, such as
`https://www.atelierrembrandt.com,https://atelierrembrandt.com`. If omitted,
the handler falls back to `ANALYTICS_ALLOWED_ORIGINS`, then enforces matching
same-origin host checks. The endpoint fails closed on all deployed URLs
(including previews) if an Origin header is absent; only an explicitly local
development runtime may omit it.

Optional:

| Variable | Default | Bounds | Meaning |
| --- | ---: | ---: | --- |
| `INQUIRY_RATE_LIMIT_PER_10_MINUTES` | 3 | 1–10 | Maximum accepted form submissions per IP-derived HMAC bucket per ten minutes. |

The daily `public.purge_analytics_v2(395)` task also deletes inquiry
rate-limit buckets after three days. It retains no raw IP address.

## Public API contract

### `POST /api/inquiries`

This same-origin endpoint accepts exactly the public form payload below;
unknown fields, client-generated IDs, timestamps, status, notes, and
notification flags are rejected. The server generates all of those values.

```json
{
  "itemTitle": "Optional object title",
  "itemRef": "Optional inventory reference",
  "name": "Required contact name",
  "email": "Required email address",
  "phone": "Optional phone number",
  "type": "Optional request type",
  "message": "Required message"
}
```

Validation limits are 2–200 characters for the name, 3–320 for email,
6–100 for a supplied phone number, 1–500 for an object title, 1–100 for a
reference, 1–160 for request type, and 3–5000 for the message. Control
characters, malformed emails, unsupported phone characters, excess request
size, cross-site browser requests, and rate-limit excess are rejected.

Successful responses intentionally return only non-contact metadata:

```json
{
  "inquiry": {
    "id": "inq-…",
    "date": "2026-08-20T12:00:00.000Z",
    "createdAt": "2026-08-20T12:00:00.000Z",
    "status": "Nieuw"
  }
}
```

The client may merge that metadata with its in-memory submission only for its
own success UI. It should use the returned opaque `id` for the existing
`/api/send-push` claim and the privacy-safe `inquiry_submitted` analytics
event. It must not attempt a direct Supabase insert as a fallback.

## Verification

As a project owner, confirm that browser roles have no INSERT grant/policy:

```sql
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'inquiries'
  and grantee in ('anon', 'authenticated', 'public')
order by grantee, privilege_type;

select policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'inquiries'
order by policyname;
```

Expected result: active admins retain authenticated `SELECT`, `UPDATE`, and
`DELETE` through RLS; neither `anon` nor `authenticated` has an `INSERT`
grant or policy. Then test:

1. a valid same-origin submission receives `201 Created`;
2. malformed or extra fields receive `400`;
3. cross-site browser submissions receive `403`;
4. the submission above the configured ten-minute limit receives `429`;
5. direct Supabase inserts fail for both anonymous and normal authenticated
   browser sessions;
6. an active administrator can still list, update, and delete inquiries.
