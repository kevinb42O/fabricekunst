# Daily Supabase health check

Vercel calls `GET /api/supabase-health` daily at `06:00 UTC`. On Hobby,
execution may occur between 06:00 and 06:59 UTC (07:00–07:59 Belgian winter
time, 08:00–08:59 summer time). No GitHub Actions are used.

Set a distinct, randomly generated `CRON_SECRET` of at least 32 characters in
the Vercel project's Production environment **before** deploying, and Preview
for pre-production verification. Vercel
automatically supplies `Authorization: Bearer <CRON_SECRET>` to cron requests.
The handler rejects unauthenticated requests without querying Supabase.
It uses the existing server-only `SUPABASE_SECRET_KEY` or
`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` (or `VITE_SUPABASE_URL`).

Each execution reads at most one ID/key from `items`, `admin_settings` and
`analytics_events_v2`. Empty tables are healthy. No rows are inserted,
updated or deleted, and no synthetic analytics are generated. Requests bypass
caching, reject redirects and have a five-second timeout. Only failed requests
with network errors, timeouts, HTTP 429 or HTTP 5xx retry, once after 500 ms.
The function's maximum duration is explicitly 30 seconds, allowing both
five-second attempts to finish even on a plan with a shorter default.

Authenticated responses and `[supabase-health]` Vercel logs contain check
names, success/error categories, timestamp, elapsed time and attempt count.
They never include database values, provider error bodies or credentials.
Success returns HTTP 200; a failed check returns 503. Other methods return
405, missing/invalid authorization returns 401, and incomplete configuration
returns 503. Responses cannot be cached or indexed.

## Verification and operation

Implementation validation: the full 103-test suite and production build pass.
The deployed preview returns 200 with all three checks healthy, 401 without
authorization and 405 for POST. Preview's existing R2 configuration differs
from Production, so validate public content in a staged Production deployment
before assigning the live domains.

After deployment, verify the task appears under Project Settings → Cron Jobs
and use its Run control. Check the matching production log entry: all three
checks must report `ok: true`. Confirm an unauthenticated HTTP request returns
401. Monitor the first scheduled execution as well; a manual success does not
prove the scheduler will always run.

The current deployment budget allows 12 functions including middleware; this
endpoint uses the last available slot. The build guard prevents adding another
function beyond that budget.

This is a daily database availability check and creates database activity even
when there are no website visitors. Supabase Free can still pause projects:
the provider does not guarantee that scheduled checks prevent inactivity
pausing. Do not describe this as guaranteed uptime or an automatic resume
mechanism. Watch Supabase's warning emails.

Vercel logs are not an independent alerting system and cannot detect a cron
that never starts. No independent notification service is configured by this
change. Automatic failure alerts require a separately configured destination.

To stop the task, remove its `crons` entry from `vercel.json` and deploy again.
For rollback, revert this change and redeploy; a rollback to a deployment
without the cron configuration removes the task. The secret may then be
removed if no other task uses it.

References:
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://vercel.com/docs/cron-jobs/usage-and-pricing
