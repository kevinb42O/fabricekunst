begin;

-- Images live exclusively in R2. These tables contain editorial data and keys.
create table if not exists public.provenance_pages (
  id text primary key default 'main' check (id = 'main'),
  draft jsonb not null default '{}'::jsonb,
  version integer not null default 0 check (version >= 0),
  published_version integer,
  published_content jsonb,
  pending_publication jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create table if not exists public.provenance_revisions (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  content jsonb not null,
  kind text not null default 'publication' check (kind in ('publication','legacy-backup')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create unique index if not exists provenance_revision_version_idx on public.provenance_revisions(version,kind);
create table if not exists public.provenance_media (
  id uuid primary key default gen_random_uuid(),
  original_key text not null unique check (original_key like 'provenance/originals/%' and original_key not like '%..%'),
  filename text not null,
  sha256 text unique,
  aliases integer[] not null default '{}',
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 20971520),
  width integer,
  height integer,
  variants jsonb not null default '[]'::jsonb,
  crop jsonb,
  status text not null default 'uploaded' check (status in ('uploaded','ready','archived')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.provenance_pages enable row level security;
alter table public.provenance_pages force row level security;
alter table public.provenance_revisions enable row level security;
alter table public.provenance_revisions force row level security;
alter table public.provenance_media enable row level security;
alter table public.provenance_media force row level security;
-- All access goes through the existing active-admin server boundary.
revoke all on public.provenance_pages, public.provenance_revisions, public.provenance_media from public, anon, authenticated;
grant all on public.provenance_pages, public.provenance_revisions, public.provenance_media to service_role;

insert into public.provenance_pages(id,draft)
values ('main', coalesce((select value::jsonb from public.admin_settings where key='herkomst_page_data'),'{}'::jsonb))
on conflict (id) do nothing;
insert into public.provenance_revisions(version,content,kind)
select 0, draft, 'legacy-backup' from public.provenance_pages where id='main'
on conflict (version,kind) do nothing;
notify pgrst, 'reload schema';
commit;
