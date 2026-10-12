-- Separate publication from sale status. Existing catalog entries stay online.
begin;

alter table public.items add column if not exists is_published boolean not null default true;
-- New direct inserts are drafts; the atomic writer handles legacy payloads explicitly.
alter table public.items alter column is_published set default false;

drop policy if exists items_public_read on public.items;
drop policy if exists "Public read items" on public.items;
create policy items_public_read on public.items for select to anon, authenticated
  using (is_published = true);
drop policy if exists items_admin_read on public.items;
create policy items_admin_read on public.items for select to authenticated
  using ((select private.is_admin()));

-- Extension payloads contain the complete editor data and must also stay private for drafts.
drop policy if exists admin_settings_public_content_read on public.admin_settings;
create policy admin_settings_public_content_read on public.admin_settings for select to anon, authenticated
  using (
    key in ('hero_image', 'mobile_hero_image', 'hero_slides', 'herkomst_page_data', 'faq_items')
    or (
      substring(key from 1 for 9) = 'item_ext_'
      and exists (select 1 from public.items item where item.id = substring(key from 10) and item.is_published = true)
    )
  );

create or replace function public.save_catalog_item_atomically(p_item jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item_id text;
  item_images jsonb;
  item_published boolean;
  previous_published boolean;
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

  select is_published into previous_published from public.items where id = item_id for update;
  item_published := coalesce((p_item->>'is_published')::boolean, (p_item->>'isPublished')::boolean, previous_published, true);
  if item_published and coalesce(previous_published, false) = false
    and not exists (select 1 from jsonb_array_elements(item_images) image where nullif(btrim(image->>'url'), '') is not null)
    and nullif(btrim(p_item->>'image'), '') is null then
    raise exception 'Voeg minstens één foto toe voordat u dit item publiceert.';
  end if;

  insert into public.items (
    id, item_type, collection_group, ref, title, subtitle, author, publisher,
    city, year, century, category, price, status, featured, condition,
    binding, dimensions, provenance, description, historical_context,
    condition_report, provenance_details, collation_specs, attributes,
    comparable_sales, images, is_published, updated_at
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
    item_images, item_published, now()
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
    images = excluded.images, is_published = excluded.is_published, updated_at = now();

  insert into public.admin_settings (key, value, updated_at)
  values ('item_ext_' || item_id, (p_item || jsonb_build_object('is_published', item_published, 'isPublished', item_published))::text, now())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.save_catalog_item_atomically(jsonb) from public, anon, authenticated;
grant execute on function public.save_catalog_item_atomically(jsonb) to service_role;

commit;
