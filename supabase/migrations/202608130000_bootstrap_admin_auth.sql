-- Zero-downtime bootstrap for Supabase Auth administrator profiles.
-- Run this after creating the two Auth users and before deploying the new app.
-- It intentionally leaves the legacy policies untouched until the new app is live.

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
    'admin@rareartbooks.com'
  );

  if required_admin_count <> 2 then
    raise exception 'Auth bootstrap stopped: both required administrator accounts must exist first.';
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
  end,
  'admin',
  true,
  now()
from auth.users
where lower(email) in (
  'admin@atelierrembrandt.com',
  'admin@rareartbooks.com'
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
drop policy if exists admin_profiles_self_read on public.admin_profiles;
create policy admin_profiles_self_read
  on public.admin_profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.admin_profiles from anon, authenticated;
grant select on table public.admin_profiles to authenticated;

commit;
