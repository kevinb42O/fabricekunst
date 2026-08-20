# Collector’s List rollout

The public form writes only through `/api/collector-list`; browser roles cannot
insert or read subscriber records directly. Apply migrations in timestamp order
before enabling the form in production.

## Required production configuration

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Server-side Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Server-only database access. |
| `COLLECTOR_LIST_RATE_LIMIT_SALT` | Distinct random secret of at least 32 characters. Never reuse the analytics or inquiry salt. |
| `COLLECTOR_LIST_ALLOWED_ORIGINS` | Exact comma-separated production origins. |
| `COLLECTOR_PUBLIC_SITE_URL` | Canonical HTTPS origin used in confirmation links. |

Optional double opt-in configuration:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Enables confirmation email delivery. |
| `COLLECTOR_FROM_EMAIL` | Verified sender, for example `Atelier Rembrandt <collectors@atelierrembrandt.com>`. |

When both optional variables are absent, explicit unchecked-box consent creates
an active subscription immediately. When both are present, subscriptions remain
`pending` until the personal confirmation link is used.

## Deployment order

1. Back up the database and apply `202608200003_collector_list.sql`.
2. Verify RLS is forced on `collector_subscribers` and that `anon` has no grants.
3. Configure the required environment variables in Production and Preview.
4. If using double opt-in, verify the sender domain (SPF and DKIM) before adding both email variables.
5. Deploy the application.
6. Submit one controlled test address in each locale and confirm the source, consent version and timestamps in the admin dashboard.
7. Verify confirmation and unsubscribe links before sending any campaign.
8. Apply `202608200004_schedule_retention.sql` to install the single daily
   retention job for analytics, inquiry and Collector's List rate-limit data.

## Operational rules

- Export and mail only records whose status is `active`.
- Every campaign must include a URL built from the subscriber’s unsubscribe token.
- Never upload `pending` or `unsubscribed` rows to a mailing platform.
- Do not delete unsubscribed rows during ordinary list cleanup; their suppressions prevent accidental re-mailing.
- Rotate the rate-limit salt only when necessary. Existing opaque buckets then become unusable and expire naturally.

## Rollback

The UI can be hidden independently while retaining consent records. Do not drop
the table as a routine rollback: consent and suppression history may be needed to
demonstrate compliance and respect prior unsubscribe choices.
