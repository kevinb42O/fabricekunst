-- Analytics v2: private-by-default measurement boundary
--
-- This migration intentionally preserves page_views and analytics_events as
-- historical v1 data, but removes all public access to them. New telemetry is
-- written only by the server-side /api/analytics collector with a service-role
-- key. The browser never receives a raw telemetry read policy.

begin;

do $$
begin
  if to_regprocedure('private.is_admin()') is null then
    raise exception 'Analytics v2 requires the admin/RLS migration (private.is_admin()) first.';
  end if;
end
$$;

-- A v2 event contains only privacy-reviewed dimensions. There is deliberately
-- no permanent visitor identifier, raw IP address, full user agent, referrer
-- URL, coordinates, selector, search text, or form value column.
create table if not exists public.analytics_events_v2 (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,
  event_name text not null check (event_name in (
    'page_view',
    'utm_visit',
    'catalog_search',
    'catalog_filter_applied',
    'item_viewed',
    'item_card_clicked',
    'cta_clicked',
    'inquiry_opened',
    'form_started',
    'form_validation_error',
    'inquiry_submitted',
    'email_clicked',
    'phone_clicked',
    'whatsapp_clicked',
    'scroll_depth',
    'rage_click'
  )),
  -- Client time is accepted only in a tight window by /api/analytics. Server
  -- receipt time is the canonical reporting/retention boundary.
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  visit_id uuid not null,
  page_path text not null check (
    char_length(page_path) between 1 and 500
    and left(page_path, 1) = '/'
    and page_path !~ '[?#]'
  ),
  referrer_origin text check (referrer_origin is null or char_length(referrer_origin) <= 255),
  utm_source text check (utm_source is null or char_length(utm_source) <= 120),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 120),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 160),
  item_id text check (item_id is null or char_length(item_id) <= 160),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  device_type text not null check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  browser_family text not null check (browser_family in ('Chrome', 'Safari', 'Firefox', 'Edge', 'Other')),
  tracking_version smallint not null default 2 check (tracking_version = 2)
);

-- Rate-limit buckets are one-way HMACs scoped to one minute and are removed
-- after three days. The table is never exposed through the Data API.
create table if not exists public.analytics_ingest_rate_limits (
  bucket_key text primary key check (bucket_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 0 and 10000),
  updated_at timestamptz not null default now()
);

create index if not exists analytics_events_v2_received_at_idx
  on public.analytics_events_v2 (received_at desc);
create index if not exists analytics_events_v2_visit_received_at_idx
  on public.analytics_events_v2 (visit_id, received_at desc);
create index if not exists analytics_events_v2_name_received_at_idx
  on public.analytics_events_v2 (event_name, received_at desc);
create index if not exists analytics_events_v2_page_received_at_idx
  on public.analytics_events_v2 (page_path, received_at desc);
create index if not exists analytics_events_v2_utm_received_at_idx
  on public.analytics_events_v2 (utm_source, utm_medium, utm_campaign, received_at desc);
create index if not exists analytics_events_v2_inquiry_received_at_idx
  on public.analytics_events_v2 (received_at desc, visit_id)
  where event_name = 'inquiry_submitted';
create index if not exists analytics_ingest_rate_limits_updated_at_idx
  on public.analytics_ingest_rate_limits (updated_at);

-- Remove all historic policies from v1 and v2 telemetry tables, then create a
-- no browser policy. Browser clients receive no telemetry table grants at all;
-- the authenticated /api/admin-analytics endpoint is the sole reader and the
-- server-side /api/analytics endpoint is the sole v2 writer.
do $$
declare
  target_table text;
  policy_record record;
begin
  foreach target_table in array array['page_views', 'analytics_events', 'analytics_events_v2']
  loop
    if to_regclass(format('public.%I', target_table)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', target_table);
    execute format('alter table public.%I force row level security', target_table);

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.policyname, target_table);
    end loop;

    execute format('revoke all on table public.%I from public, anon, authenticated', target_table);
    execute format('grant all on table public.%I to service_role', target_table);
  end loop;
end
$$;

alter table public.analytics_ingest_rate_limits enable row level security;
revoke all on table public.analytics_ingest_rate_limits from public, anon, authenticated;
grant all on table public.analytics_ingest_rate_limits to service_role;

-- Explicitly prevent a legacy direct-insert path through serial/identity
-- sequences. service_role remains the only writer used by the API handler.
do $$
declare
  sequence_record record;
begin
  for sequence_record in
    select namespace.nspname as schema_name, class.relname as sequence_name
    from pg_class as class
    join pg_namespace as namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relkind = 'S'
      and class.relname in (
        'page_views_id_seq',
        'analytics_events_id_seq',
        'analytics_events_v2_id_seq'
      )
  loop
    execute format(
      'revoke all on sequence %I.%I from public, anon, authenticated',
      sequence_record.schema_name,
      sequence_record.sequence_name
    );
    execute format(
      'grant usage, select on sequence %I.%I to service_role',
      sequence_record.schema_name,
      sequence_record.sequence_name
    );
  end loop;
end
$$;

-- Database-backed, atomic minute window limiter. The public API calls this
-- function with a service-role client; anonymous/authenticated roles cannot.
create or replace function public.consume_analytics_rate_limit(
  p_bucket_key text,
  p_limit integer default 60,
  p_cost integer default 1
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_window timestamptz := date_trunc('minute', now());
  current_count integer;
begin
  if p_bucket_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid analytics rate-limit bucket.';
  end if;
  if p_limit not between 1 and 240 then
    raise exception 'Invalid analytics rate limit.';
  end if;
  if p_cost not between 1 and 20 then
    raise exception 'Invalid analytics rate-limit cost.';
  end if;

  insert into public.analytics_ingest_rate_limits (
    bucket_key,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_bucket_key, current_window, p_cost, now())
  on conflict (bucket_key) do update
  set
    window_started_at = excluded.window_started_at,
    request_count = case
      when public.analytics_ingest_rate_limits.window_started_at = excluded.window_started_at
        then public.analytics_ingest_rate_limits.request_count + p_cost
      else p_cost
    end,
    updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_analytics_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_analytics_rate_limit(text, integer, integer) to service_role;

-- Retention policy: keep v2 telemetry for 395 days, enough for a year-over-
-- year comparison with a small operational buffer. Keep opaque rate-limit
-- buckets for three days. Schedule this function once daily using a project
-- scheduler; it is intentionally not callable by browser roles.
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

  return jsonb_build_object(
    'removedEvents', removed_events,
    'removedRateLimitBuckets', removed_rate_buckets,
    'eventRetentionDays', p_event_retention_days,
    'ranAt', now()
  );
end;
$$;

revoke all on function public.purge_analytics_v2(integer) from public, anon, authenticated;
grant execute on function public.purge_analytics_v2(integer) to service_role;

-- Legacy v1 rows contain persistent IDs and may include raw user agents and
-- referrer URLs. They are intentionally preserved by this migration so the
-- rollout is reversible, but must be explicitly purged by a project owner
-- after the v2 deployment has been verified. The function is service-role
-- only, has no default cutoff, and cannot be called by a browser role.
create or replace function public.purge_legacy_analytics_v1(
  p_before timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed_page_views integer := 0;
  removed_events integer := 0;
begin
  if p_before is null or p_before > now() + interval '1 minute' then
    raise exception 'Provide a valid legacy analytics purge cutoff.';
  end if;

  if to_regclass('public.page_views') is not null then
    execute 'delete from public.page_views where created_at < $1' using p_before;
    get diagnostics removed_page_views = row_count;
  end if;

  if to_regclass('public.analytics_events') is not null then
    execute 'delete from public.analytics_events where created_at < $1' using p_before;
    get diagnostics removed_events = row_count;
  end if;

  return jsonb_build_object(
    'removedPageViews', removed_page_views,
    'removedEvents', removed_events,
    'cutoff', p_before,
    'ranAt', now()
  );
end;
$$;

revoke all on function public.purge_legacy_analytics_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.purge_legacy_analytics_v1(timestamptz) to service_role;

comment on table public.analytics_events_v2 is
  'Analytics v2: server-ingested, privacy-minimised telemetry. Retain for 395 days via public.purge_analytics_v2().';
comment on table public.analytics_ingest_rate_limits is
  'Opaque per-minute HMAC buckets used only by /api/analytics. Retain for three days.';
comment on function public.purge_analytics_v2(integer) is
  'Run once daily with service_role/project scheduler. Purges v2 telemetry after the configured retention period and rate-limit buckets after three days.';
comment on function public.purge_legacy_analytics_v1(timestamptz) is
  'One-time project-owner remediation for unsafe v1 analytics rows. Explicit cutoff required; browser roles cannot execute it.';

commit;
