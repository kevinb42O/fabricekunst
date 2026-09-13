begin;

-- The media library owns image binaries and their reusable editorial record.
-- Page-specific captions/crops remain in the page document, so one image can
-- appear in several contexts without duplicating the underlying file.
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  original_key text not null unique check ((original_key like 'media/originals/%' or original_key like 'provenance/originals/%') and original_key not like '%..%'),
  filename text not null check (char_length(filename) between 1 and 180),
  sha256 text unique,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 20971520),
  width integer,
  height integer,
  variants jsonb not null default '[]'::jsonb,
  crop jsonb,
  status text not null default 'uploaded' check (status in ('uploaded', 'ready', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  legacy_source text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.media_asset_usages (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  consumer_type text not null check (consumer_type in ('provenance', 'rembrandt-project', 'catalog', 'site')),
  consumer_id text not null check (char_length(consumer_id) between 1 and 120),
  placement text not null check (char_length(placement) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(asset_id, consumer_type, consumer_id, placement)
);

create index if not exists media_asset_usages_asset_idx on public.media_asset_usages(asset_id);
create index if not exists media_asset_usages_consumer_idx on public.media_asset_usages(consumer_type, consumer_id);
create index if not exists media_assets_status_idx on public.media_assets(status, created_at desc);

-- Copy the existing Provenance media records without moving a byte in R2.
-- Their public variants remain valid and are exposed through the same IDs.
insert into public.media_assets (
  id, original_key, filename, sha256, content_type, size_bytes, width, height,
  variants, crop, status, metadata, legacy_source, created_at, created_by, updated_at
)
select
  pm.id,
  pm.original_key,
  pm.filename,
  pm.sha256,
  pm.content_type,
  pm.size_bytes,
  pm.width,
  pm.height,
  pm.variants,
  pm.crop,
  pm.status,
  coalesce(asset.metadata, '{}'::jsonb),
  'provenance',
  pm.created_at,
  pm.created_by,
  pm.created_at
from public.provenance_media pm
left join lateral (
  select jsonb_build_object(
    'title', item->'title',
    'caption', item->'caption',
    'alt', item->'alt',
    'credit', item->'credit',
    'objectLabel', item->'objectLabel',
    'category', coalesce(item->'category', '"context"'::jsonb),
    'approved', coalesce(item->'approved', 'false'::jsonb),
    'tags', '[]'::jsonb
  ) as metadata
  from jsonb_array_elements(coalesce((select draft->'assets' from public.provenance_pages where id = 'main'), '[]'::jsonb)) item
  where item->>'id' = pm.id::text
  limit 1
) asset on true
on conflict (id) do update set
  variants = excluded.variants,
  crop = excluded.crop,
  status = excluded.status,
  metadata = case when public.media_assets.metadata = '{}'::jsonb then excluded.metadata else public.media_assets.metadata end,
  updated_at = now();

alter table public.media_assets enable row level security;
alter table public.media_assets force row level security;
alter table public.media_asset_usages enable row level security;
alter table public.media_asset_usages force row level security;
revoke all on public.media_assets, public.media_asset_usages from public, anon, authenticated;
grant all on public.media_assets, public.media_asset_usages to service_role;

notify pgrst, 'reload schema';
commit;
