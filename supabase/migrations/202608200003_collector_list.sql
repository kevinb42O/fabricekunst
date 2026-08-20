-- Collector's List: consented, server-only subscriber ingestion and admin management.

begin;

do $$
begin
  if to_regprocedure('private.is_admin()') is null then
    raise exception 'Collector List requires the admin/RLS migration first.';
  end if;
end
$$;

alter table public.analytics_events_v2
  drop constraint if exists analytics_events_v2_event_name_check;
alter table public.analytics_events_v2
  add constraint analytics_events_v2_event_name_check check (event_name in (
    'page_view','utm_visit','catalog_search','catalog_filter_applied','item_viewed','item_card_clicked',
    'cta_clicked','inquiry_opened','form_started','form_validation_error','inquiry_submitted',
    'collector_list_started','collector_list_validation_error','collector_list_submitted',
    'email_clicked','phone_clicked','whatsapp_clicked','scroll_depth','rage_click'
  ));

create table if not exists public.collector_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 320),
  normalized_email text not null check (normalized_email = lower(btrim(normalized_email)) and char_length(normalized_email) between 3 and 320),
  locale text not null default 'nl' check (locale in ('nl', 'en', 'fr')),
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  source text not null default 'website' check (char_length(source) between 1 and 80),
  source_path text check (source_path is null or char_length(source_path) <= 500),
  consent_version text not null check (char_length(consent_version) between 1 and 100),
  consented_at timestamptz not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  confirmation_token_hash text check (confirmation_token_hash is null or confirmation_token_hash ~ '^[0-9a-f]{64}$'),
  unsubscribe_token_hash text not null check (unsubscribe_token_hash ~ '^[0-9a-f]{64}$'),
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collector_subscribers_normalized_email_unique unique (normalized_email)
);

create index if not exists collector_subscribers_status_created_idx
  on public.collector_subscribers (status, created_at desc);

create unique index if not exists collector_subscribers_confirmation_token_idx
  on public.collector_subscribers (confirmation_token_hash)
  where confirmation_token_hash is not null;

create unique index if not exists collector_subscribers_unsubscribe_token_idx
  on public.collector_subscribers (unsubscribe_token_hash);

create table if not exists public.collector_list_rate_limits (
  bucket_key text primary key check (bucket_key ~ '^[0-9a-f]{64}$'),
  request_count integer not null check (request_count between 0 and 1000),
  updated_at timestamptz not null default now()
);

alter table public.collector_subscribers enable row level security;
alter table public.collector_subscribers force row level security;
revoke all on table public.collector_subscribers from public, anon, authenticated;
grant select, update, delete on table public.collector_subscribers to authenticated;
grant all on table public.collector_subscribers to service_role;

create policy collector_subscribers_admin_read
  on public.collector_subscribers for select to authenticated
  using ((select private.is_admin()));

create policy collector_subscribers_admin_update
  on public.collector_subscribers for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy collector_subscribers_admin_delete
  on public.collector_subscribers for delete to authenticated
  using ((select private.is_admin()));

alter table public.collector_list_rate_limits enable row level security;
alter table public.collector_list_rate_limits force row level security;
revoke all on table public.collector_list_rate_limits from public, anon, authenticated;
grant all on table public.collector_list_rate_limits to service_role;

create or replace function public.consume_collector_list_rate_limit(
  p_bucket_key text,
  p_limit integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if p_bucket_key !~ '^[0-9a-f]{64}$' or p_limit not between 1 and 20 then
    raise exception 'Invalid Collector List rate-limit request.';
  end if;

  insert into public.collector_list_rate_limits (bucket_key, request_count, updated_at)
  values (p_bucket_key, 1, now())
  on conflict (bucket_key) do update
    set request_count = public.collector_list_rate_limits.request_count + 1,
        updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_collector_list_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.consume_collector_list_rate_limit(text, integer) to service_role;

create or replace function public.purge_collector_list_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare removed integer;
begin
  delete from public.collector_list_rate_limits where updated_at < now() - interval '3 days';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.purge_collector_list_rate_limits() from public, anon, authenticated;
grant execute on function public.purge_collector_list_rate_limits() to service_role;

comment on table public.collector_subscribers is
  'Consent records for the Atelier Rembrandt Collector’s List. Public writes pass exclusively through /api/collector-list.';
comment on table public.collector_list_rate_limits is
  'Opaque hourly HMAC rate-limit buckets; never contains a raw IP address.';

commit;
