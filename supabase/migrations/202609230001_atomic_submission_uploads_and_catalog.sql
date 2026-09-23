begin;

-- A signed browser receipt proves that an upload was prepared, but it must not
-- remain a capability to delete the object once it was attached to an inquiry.
create table if not exists public.painting_submission_uploads (
  id uuid primary key,
  object_path text not null unique check (
    object_path ~ '^pending/[0-9]{4}-[0-9]{2}-[0-9]{2}/[0-9a-f-]{36}/[A-Za-z0-9._-]+$'
  ),
  filename text not null check (char_length(filename) between 1 and 180),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 15728640),
  expires_at timestamptz not null,
  cleanup_started_at timestamptz,
  cleaned_at timestamptz,
  claimed_by_inquiry_id text references public.inquiries(id) on delete cascade,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((claimed_by_inquiry_id is null) = (claimed_at is null)),
  check (cleaned_at is null or cleanup_started_at is not null)
);

create index if not exists painting_submission_uploads_expiry_idx
  on public.painting_submission_uploads (expires_at)
  where claimed_by_inquiry_id is null and cleaned_at is null;

alter table public.painting_submission_uploads enable row level security;
alter table public.painting_submission_uploads force row level security;
revoke all on table public.painting_submission_uploads from public, anon, authenticated;
grant all on table public.painting_submission_uploads to service_role;

create or replace function public.claim_painting_submission_uploads(
  p_inquiry jsonb,
  p_upload_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_count integer;
  locked_count integer;
  stored_attachments jsonb;
begin
  if jsonb_typeof(p_inquiry) <> 'object'
    or coalesce(p_inquiry->>'id', '') !~ '^inq-[0-9a-f-]{36}$'
    or coalesce(p_inquiry->>'name', '') = ''
    or coalesce(p_inquiry->>'email', '') = ''
    or coalesce(p_inquiry->>'type', '') <> 'painting_submission'
    or jsonb_typeof(p_inquiry->'attachments') <> 'array' then
    raise exception 'Invalid painting submission payload.';
  end if;

  expected_count := coalesce(cardinality(p_upload_ids), 0);
  if expected_count not between 1 and 10
    or expected_count <> (select count(distinct upload_id) from unnest(p_upload_ids) as upload(upload_id))
    or expected_count <> jsonb_array_length(p_inquiry->'attachments') then
    raise exception 'Invalid or duplicate painting upload references.';
  end if;

  perform 1
  from public.painting_submission_uploads
  where id = any(p_upload_ids)
  order by id
  for update;
  get diagnostics locked_count = row_count;
  if locked_count <> expected_count then
    raise exception 'One or more painting uploads are unavailable.';
  end if;

  if exists (
    select 1
    from public.painting_submission_uploads as upload
    where upload.id = any(p_upload_ids)
      and (
        upload.expires_at <= now()
        or upload.claimed_by_inquiry_id is not null
        or upload.cleanup_started_at is not null
        or upload.cleaned_at is not null
      )
  ) then
    raise exception 'One or more painting uploads have expired or were already claimed.';
  end if;

  if exists (
    select 1
    from public.painting_submission_uploads as upload
    where upload.id = any(p_upload_ids)
      and not exists (
        select 1
        from jsonb_array_elements(p_inquiry->'attachments') as entry
        where entry->>'uploadId' = upload.id::text
          and entry->>'path' = upload.object_path
          and entry->>'name' = upload.filename
          and entry->>'contentType' = upload.content_type
          and (entry->>'size')::integer = upload.size_bytes
      )
  ) then
    raise exception 'Painting upload metadata mismatch.';
  end if;

  select jsonb_agg(entry - 'uploadId' order by entry->>'path')
  into stored_attachments
  from jsonb_array_elements(p_inquiry->'attachments') as entry;

  insert into public.inquiries (
    id, date, created_at, item_title, item_ref, name, email, phone, type,
    message, status, notes, metadata, attachments, notification_sent_at
  ) values (
    p_inquiry->>'id',
    (p_inquiry->>'date')::timestamptz,
    (p_inquiry->>'created_at')::timestamptz,
    p_inquiry->>'item_title',
    p_inquiry->>'item_ref',
    p_inquiry->>'name',
    p_inquiry->>'email',
    nullif(p_inquiry->>'phone', ''),
    p_inquiry->>'type',
    p_inquiry->>'message',
    p_inquiry->>'status',
    nullif(p_inquiry->>'notes', ''),
    p_inquiry->'metadata',
    stored_attachments,
    null
  );

  update public.painting_submission_uploads
  set claimed_by_inquiry_id = p_inquiry->>'id', claimed_at = now()
  where id = any(p_upload_ids);

  return jsonb_build_object(
    'id', p_inquiry->>'id',
    'date', p_inquiry->>'date',
    'created_at', p_inquiry->>'created_at',
    'status', p_inquiry->>'status'
  );
end;
$$;

create or replace function public.reserve_painting_submission_upload_cleanup(p_upload_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_count integer;
  locked_count integer;
begin
  expected_count := coalesce(cardinality(p_upload_ids), 0);
  if expected_count not between 1 and 10
    or expected_count <> (select count(distinct upload_id) from unnest(p_upload_ids) as upload(upload_id)) then
    raise exception 'Invalid or duplicate painting upload references.';
  end if;
  perform 1 from public.painting_submission_uploads
  where id = any(p_upload_ids)
  order by id for update;
  get diagnostics locked_count = row_count;
  if locked_count <> expected_count then
    raise exception 'One or more painting uploads are unavailable.';
  end if;
  if exists (
    select 1 from public.painting_submission_uploads
    where id = any(p_upload_ids)
      and (expires_at <= now() or claimed_by_inquiry_id is not null
        or cleanup_started_at is not null or cleaned_at is not null)
  ) then
    raise exception 'One or more painting uploads are unavailable for cleanup.';
  end if;
  update public.painting_submission_uploads
  set cleanup_started_at = now()
  where id = any(p_upload_ids);
end;
$$;

create or replace function public.release_painting_submission_upload_cleanup(p_upload_ids uuid[])
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.painting_submission_uploads
  set cleanup_started_at = null
  where id = any(p_upload_ids)
    and claimed_by_inquiry_id is null
    and cleaned_at is null;
$$;

create or replace function public.complete_painting_submission_upload_cleanup(p_upload_ids uuid[])
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.painting_submission_uploads
  set cleaned_at = now()
  where id = any(p_upload_ids)
    and claimed_by_inquiry_id is null
    and cleanup_started_at is not null;
$$;

revoke all on function public.claim_painting_submission_uploads(jsonb, uuid[]) from public, anon, authenticated;
revoke all on function public.reserve_painting_submission_upload_cleanup(uuid[]) from public, anon, authenticated;
revoke all on function public.release_painting_submission_upload_cleanup(uuid[]) from public, anon, authenticated;
revoke all on function public.complete_painting_submission_upload_cleanup(uuid[]) from public, anon, authenticated;
grant execute on function public.claim_painting_submission_uploads(jsonb, uuid[]) to service_role;
grant execute on function public.reserve_painting_submission_upload_cleanup(uuid[]) to service_role;
grant execute on function public.release_painting_submission_upload_cleanup(uuid[]) to service_role;
grant execute on function public.complete_painting_submission_upload_cleanup(uuid[]) to service_role;

-- One RPC owns both the canonical item row and the complete editor payload.
-- PostgreSQL executes the whole function in the caller's transaction, so a
-- failure can no longer leave an orphaned item_ext_* backup (or vice versa).
create or replace function public.save_catalog_item_atomically(p_item jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item_id text;
  item_images jsonb;
begin
  if jsonb_typeof(p_item) <> 'object' or octet_length(p_item::text) > 524288 then
    raise exception 'Invalid catalog item payload.';
  end if;
  item_id := p_item->>'id';
  if item_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$'
    or coalesce(nullif(btrim(p_item->>'title'), ''), '') = '' then
    raise exception 'A catalog item needs a valid id and title.';
  end if;
  if p_item ? 'images' and jsonb_typeof(p_item->'images') <> 'array' then
    raise exception 'Catalog images must be an array.';
  end if;
  select coalesce(jsonb_agg(image), '[]'::jsonb)
  into item_images
  from jsonb_array_elements(coalesce(p_item->'images', '[]'::jsonb)) as image
  where coalesce((image->>'__ext__')::boolean, false) is false;

  insert into public.items (
    id, item_type, collection_group, ref, title, subtitle, author, publisher,
    city, year, century, category, price, status, featured, condition,
    binding, dimensions, provenance, description, historical_context,
    condition_report, provenance_details, collation_specs, attributes,
    comparable_sales, images, updated_at
  ) values (
    item_id,
    coalesce(nullif(p_item->>'itemType', ''), nullif(p_item->>'item_type', ''), 'book'),
    coalesce(nullif(p_item->>'collectionGroup', ''), nullif(p_item->>'collection_group', ''), 'books'),
    nullif(p_item->>'ref', ''), p_item->>'title', nullif(p_item->>'subtitle', ''),
    nullif(p_item->>'author', ''), nullif(p_item->>'publisher', ''), nullif(p_item->>'city', ''),
    nullif(p_item->>'year', ''), nullif(p_item->>'century', ''), nullif(p_item->>'category', ''),
    nullif(p_item->>'price', ''), coalesce(nullif(p_item->>'status', ''), 'Beschikbaar'),
    coalesce((p_item->>'featured')::boolean, false), nullif(p_item->>'condition', ''),
    nullif(p_item->>'binding', ''), nullif(p_item->>'dimensions', ''), nullif(p_item->>'provenance', ''),
    nullif(p_item->>'description', ''), nullif(coalesce(p_item->>'historicalContext', p_item->>'historical_context'), ''),
    nullif(coalesce(p_item->>'conditionReport', p_item->>'condition_report'), ''),
    nullif(coalesce(p_item->>'provenanceDetails', p_item->>'provenance_details'), ''),
    nullif(coalesce(p_item->>'collationSpecs', p_item->>'collation_specs'), ''),
    coalesce(p_item->'attributes', '{}'::jsonb), coalesce(p_item->'comparableSales', p_item->'comparable_sales', '[]'::jsonb),
    item_images, now()
  )
  on conflict (id) do update set
    item_type = excluded.item_type, collection_group = excluded.collection_group,
    ref = excluded.ref, title = excluded.title, subtitle = excluded.subtitle,
    author = excluded.author, publisher = excluded.publisher, city = excluded.city,
    year = excluded.year, century = excluded.century, category = excluded.category,
    price = excluded.price, status = excluded.status, featured = excluded.featured,
    condition = excluded.condition, binding = excluded.binding, dimensions = excluded.dimensions,
    provenance = excluded.provenance, description = excluded.description,
    historical_context = excluded.historical_context, condition_report = excluded.condition_report,
    provenance_details = excluded.provenance_details, collation_specs = excluded.collation_specs,
    attributes = excluded.attributes, comparable_sales = excluded.comparable_sales,
    images = excluded.images, updated_at = now();

  insert into public.admin_settings (key, value, updated_at)
  values ('item_ext_' || item_id, p_item::text, now())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.delete_catalog_item_atomically(p_item_id text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_item_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$' then
    raise exception 'Invalid catalog item id.';
  end if;
  delete from public.admin_settings where key = 'item_ext_' || p_item_id;
  delete from public.items where id = p_item_id;
end;
$$;

create or replace function public.save_catalog_items_atomically(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  catalog_item jsonb;
begin
  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'Invalid catalog item batch.';
  end if;
  for catalog_item in select value from jsonb_array_elements(p_items) loop
    perform public.save_catalog_item_atomically(catalog_item);
  end loop;
end;
$$;

revoke all on function public.save_catalog_item_atomically(jsonb) from public, anon, authenticated;
revoke all on function public.delete_catalog_item_atomically(text) from public, anon, authenticated;
revoke all on function public.save_catalog_items_atomically(jsonb) from public, anon, authenticated;
grant execute on function public.save_catalog_item_atomically(jsonb) to service_role;
grant execute on function public.delete_catalog_item_atomically(text) to service_role;
grant execute on function public.save_catalog_items_atomically(jsonb) to service_role;

commit;
