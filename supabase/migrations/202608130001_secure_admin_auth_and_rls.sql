-- Atelier Rembrandt security hardening
-- Prerequisite: create all three privileged accounts in Supabase Auth first.
-- This migration deliberately fails before changing policies when any account is missing.

begin;

do $$
declare
  required_admin_count integer;
begin
  select count(*)
    into required_admin_count
  from auth.users
  where lower(email) in (
    'admin@atelierrembrandt.com',
    'admin@rareartbooks.com',
    'kevin@webaanzee.be'
  );

  if required_admin_count <> 3 then
    raise exception 'Security migration stopped: all three required Supabase Auth administrators must exist first.';
  end if;
end
$$;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'admin' check (role in ('admin', 'developer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_profiles_email_unique
  on public.admin_profiles (lower(email));

insert into public.admin_profiles (user_id, email, name, role, active, updated_at)
select
  id,
  lower(email),
  case lower(email)
    when 'admin@atelierrembrandt.com' then 'Atelier Rembrandt Admin'
    when 'admin@rareartbooks.com' then 'Fabrice Goffin'
    when 'kevin@webaanzee.be' then 'Kevin'
  end,
  case lower(email)
    when 'kevin@webaanzee.be' then 'developer'
    else 'admin'
  end,
  true,
  now()
from auth.users
where lower(email) in (
  'admin@atelierrembrandt.com',
  'admin@rareartbooks.com',
  'kevin@webaanzee.be'
)
on conflict (user_id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  active = excluded.active,
  updated_at = now();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles as profile
    where profile.user_id = (select auth.uid())
      and profile.active = true
      and profile.role in ('admin', 'developer')
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

alter table public.admin_profiles enable row level security;
alter table public.items enable row level security;
alter table public.inquiries enable row level security;
alter table public.admin_settings enable row level security;
alter table public.faq_items enable row level security;
alter table public.push_subscriptions enable row level security;

alter table public.inquiries
  add column if not exists notification_sent_at timestamptz;

-- Remove every legacy/permissive policy on application tables before recreating
-- the complete allow-list below. This also catches policies created outside setup.sql.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'admin_profiles',
        'items',
        'inquiries',
        'admin_settings',
        'faq_items',
        'push_subscriptions'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

revoke all on table public.admin_profiles from anon, authenticated;
revoke all on table public.items from anon, authenticated;
revoke all on table public.inquiries from anon, authenticated;
revoke all on table public.admin_settings from anon, authenticated;
revoke all on table public.faq_items from anon, authenticated;
revoke all on table public.push_subscriptions from anon, authenticated;

grant select on table public.items to anon, authenticated;
grant insert, update, delete on table public.items to authenticated;

grant select, update, delete on table public.inquiries to authenticated;

grant select on table public.admin_settings to anon, authenticated;
grant insert, update, delete on table public.admin_settings to authenticated;

grant select on table public.faq_items to anon, authenticated;
grant insert, update, delete on table public.faq_items to authenticated;

grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant usage, select on sequence public.push_subscriptions_id_seq to authenticated;

grant select, insert, update, delete on table public.admin_profiles to authenticated;

create policy items_public_read
  on public.items for select
  to anon, authenticated
  using (true);

create policy items_admin_insert
  on public.items for insert
  to authenticated
  with check ((select private.is_admin()));

create policy items_admin_update
  on public.items for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy items_admin_delete
  on public.items for delete
  to authenticated
  using ((select private.is_admin()));

-- Public inquiry submission is intentionally server-mediated. The later
-- 202608200002_inquiry_submission_security.sql migration adds the rate-limited
-- /api/inquiries boundary; browser roles receive no direct INSERT policy.

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

create policy admin_settings_public_content_read
  on public.admin_settings for select
  to anon, authenticated
  using (
    key in (
      'hero_image',
      'mobile_hero_image',
      'hero_slides',
      'herkomst_page_data',
      'faq_items'
    )
    or substring(key from 1 for 9) = 'item_ext_'
  );

create policy admin_settings_admin_read
  on public.admin_settings for select
  to authenticated
  using ((select private.is_admin()));

create policy admin_settings_admin_insert
  on public.admin_settings for insert
  to authenticated
  with check ((select private.is_admin()));

create policy admin_settings_admin_update
  on public.admin_settings for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy admin_settings_admin_delete
  on public.admin_settings for delete
  to authenticated
  using ((select private.is_admin()));

create policy faq_items_public_read
  on public.faq_items for select
  to anon, authenticated
  using (true);

create policy faq_items_admin_insert
  on public.faq_items for insert
  to authenticated
  with check ((select private.is_admin()));

create policy faq_items_admin_update
  on public.faq_items for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy faq_items_admin_delete
  on public.faq_items for delete
  to authenticated
  using ((select private.is_admin()));

create policy push_subscriptions_admin_read
  on public.push_subscriptions for select
  to authenticated
  using ((select private.is_admin()));

create policy push_subscriptions_admin_insert
  on public.push_subscriptions for insert
  to authenticated
  with check ((select private.is_admin()));

create policy push_subscriptions_admin_update
  on public.push_subscriptions for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy push_subscriptions_admin_delete
  on public.push_subscriptions for delete
  to authenticated
  using ((select private.is_admin()));

create policy admin_profiles_self_or_admin_read
  on public.admin_profiles for select
  to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy admin_profiles_admin_insert
  on public.admin_profiles for insert
  to authenticated
  with check ((select private.is_admin()));

create policy admin_profiles_admin_update
  on public.admin_profiles for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy admin_profiles_admin_delete
  on public.admin_profiles for delete
  to authenticated
  using ((select private.is_admin()));

-- Storage remains publicly readable because catalog images are public site assets.
-- Every modifying operation now requires an active administrator.
drop policy if exists "Public Storage Read" on storage.objects;
drop policy if exists "Public Storage Insert" on storage.objects;
drop policy if exists "Public Storage Update" on storage.objects;
drop policy if exists "Public Storage Delete" on storage.objects;
drop policy if exists catalog_images_public_read on storage.objects;
drop policy if exists catalog_images_admin_insert on storage.objects;
drop policy if exists catalog_images_admin_update on storage.objects;
drop policy if exists catalog_images_admin_delete on storage.objects;

create policy catalog_images_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'catalog-images');

create policy catalog_images_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'catalog-images' and (select private.is_admin()));

create policy catalog_images_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'catalog-images' and (select private.is_admin()))
  with check (bucket_id = 'catalog-images' and (select private.is_admin()));

create policy catalog_images_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'catalog-images' and (select private.is_admin()));

-- Remove the legacy credential store only after Auth users and profiles exist.
delete from public.admin_settings
where key = 'admin_pin'
   or substring(key from 1 for 5) = 'user_';

drop table if exists public.admin_users;

commit;
