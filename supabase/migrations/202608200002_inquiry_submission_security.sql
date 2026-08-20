-- Inquiry submissions: server-only public write boundary
--
-- Public visitors submit through /api/inquiries. This migration removes the
-- former direct anon/authenticated INSERT path while preserving active-admin
-- browser management (read, update, delete) through existing Supabase Auth.

begin;

do $$
begin
  if to_regprocedure('private.is_admin()') is null then
    raise exception 'Inquiry submission hardening requires the admin/RLS migration first.';
  end if;
end
$$;

alter table public.inquiries
  add column if not exists notification_sent_at timestamptz;

-- The value is a server-produced HMAC of client IP + a 10-minute window, not
-- an IP address. Buckets are deleted after three days by the existing daily
-- v2 retention function (replaced below).
create table if not exists public.inquiry_ingest_rate_limits (
  bucket_key text primary key check (bucket_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 0 and 1000),
  updated_at timestamptz not null default now()
);

create index if not exists inquiry_ingest_rate_limits_updated_at_idx
  on public.inquiry_ingest_rate_limits (updated_at);

-- Rebuild the inquiry policy allow-list. There is intentionally no INSERT
-- policy/grant for anon or authenticated browser roles; service_role is the
-- sole writer used by /api/inquiries. Administrators retain normal management.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'inquiries'
  loop
    execute format('drop policy if exists %I on public.inquiries', policy_record.policyname);
  end loop;
end
$$;

alter table public.inquiries enable row level security;
alter table public.inquiries force row level security;
revoke all on table public.inquiries from public, anon, authenticated;
grant select, update, delete on table public.inquiries to authenticated;
grant all on table public.inquiries to service_role;

create policy inquiries_admin_read
  on public.inquiries for select
  to authenticated
  using ((select private.is_admin()));

create policy inquiries_admin_update
  on public.inquiries for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy inquiries_admin_delete
  on public.inquiries for delete
  to authenticated
  using ((select private.is_admin()));

alter table public.inquiry_ingest_rate_limits enable row level security;
revoke all on table public.inquiry_ingest_rate_limits from public, anon, authenticated;
grant all on table public.inquiry_ingest_rate_limits to service_role;

-- Atomic database-backed rate limiting protects against concurrent Vercel
-- function instances. The API derives a new opaque bucket key every ten
-- minutes, so no raw network identifier is stored.
create or replace function public.consume_inquiry_rate_limit(
  p_bucket_key text,
  p_limit integer default 3,
  p_cost integer default 1
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if p_bucket_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid inquiry rate-limit bucket.';
  end if;
  if p_limit not between 1 and 10 then
    raise exception 'Invalid inquiry rate limit.';
  end if;
  if p_cost <> 1 then
    raise exception 'Invalid inquiry rate-limit cost.';
  end if;

  insert into public.inquiry_ingest_rate_limits (
    bucket_key,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_bucket_key, date_trunc('minute', now()), p_cost, now())
  on conflict (bucket_key) do update
  set
    request_count = public.inquiry_ingest_rate_limits.request_count + p_cost,
    updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_inquiry_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_inquiry_rate_limit(text, integer, integer) to service_role;

-- Extend the daily v2 retention task to remove opaque inquiry rate buckets too.
create or replace function public.purge_analytics_v2(
  p_event_retention_days integer default 395
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed_events integer := 0;
  removed_rate_buckets integer := 0;
  removed_inquiry_rate_buckets integer := 0;
begin
  if p_event_retention_days not between 30 and 730 then
    raise exception 'Analytics retention must be between 30 and 730 days.';
  end if;

  delete from public.analytics_events_v2
  where received_at < now() - make_interval(days => p_event_retention_days);
  get diagnostics removed_events = row_count;

  delete from public.analytics_ingest_rate_limits
  where updated_at < now() - interval '3 days';
  get diagnostics removed_rate_buckets = row_count;

  delete from public.inquiry_ingest_rate_limits
  where updated_at < now() - interval '3 days';
  get diagnostics removed_inquiry_rate_buckets = row_count;

  return jsonb_build_object(
    'removedEvents', removed_events,
    'removedRateLimitBuckets', removed_rate_buckets,
    'removedInquiryRateLimitBuckets', removed_inquiry_rate_buckets,
    'eventRetentionDays', p_event_retention_days,
    'ranAt', now()
  );
end;
$$;

revoke all on function public.purge_analytics_v2(integer) from public, anon, authenticated;
grant execute on function public.purge_analytics_v2(integer) to service_role;

comment on table public.inquiry_ingest_rate_limits is
  'Opaque per-10-minute HMAC buckets used only by /api/inquiries. Retain for three days.';
comment on function public.consume_inquiry_rate_limit(text, integer, integer) is
  'Service-role-only atomic per-10-minute inquiry submission limiter.';
comment on function public.purge_analytics_v2(integer) is
  'Run once daily with service_role/project scheduler. Purges v2 telemetry after its configured retention period and all opaque ingestion rate-limit buckets after three days.';

commit;
