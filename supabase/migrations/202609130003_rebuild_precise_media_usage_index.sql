begin;

-- Repair the original universal-media backfill. `provenance_pages.draft.assets`
-- is an editorial catalogue, not a list of rendered placements. Rebuild the
-- usage ledger solely from concrete assetId fields, and preserve the state in
-- the consumer ID so both saved draft and live content remain deletion-safe.
delete from public.media_asset_usages
where consumer_type = 'provenance'
  and (
    consumer_id = 'main'
    or consumer_id like 'main:%'
    or consumer_id like 'revision:%'
  );

with documents as (
  select 'main:draft'::text as consumer_id, draft as document
  from public.provenance_pages
  where id = 'main'

  union all

  select 'main:live'::text as consumer_id, published_content as document
  from public.provenance_pages
  where id = 'main' and published_content is not null

  union all

  select concat('revision:', id)::text as consumer_id, content as document
  from public.provenance_revisions
  where kind = 'publication'
),
placements as (
  select consumer_id, 'hero'::text as placement, document->'hero'->>'assetId' as asset_id from documents
  union all
  select consumer_id, 'seo-share'::text, document->'seo'->>'assetId' from documents
  union all
  select consumer_id, 'homepage-teaser'::text, document->'homepageTeaser'->>'assetId'
  from documents
  where coalesce(document->'homepageTeaser'->>'enabled', 'true') <> 'false'
  union all
  select d.consumer_id, 'contact-cta'::text, d.document->'cta'->>'assetId'
  from documents d
  where exists (
    select 1 from jsonb_array_elements(coalesce(d.document->'sections', '[]'::jsonb)) section
    where section->>'id' = 'contact' and coalesce(section->>'enabled', 'true') <> 'false'
  )
  union all
  select d.consumer_id, concat('method:', method.item->>'id', ':', asset.position)::text, asset.asset_id
  from documents d
  cross join lateral jsonb_array_elements(coalesce(d.document->'methods', '[]'::jsonb)) with ordinality as method(item, method_position)
  cross join lateral jsonb_array_elements_text(coalesce(method.item->'assetIds', '[]'::jsonb)) with ordinality as asset(asset_id, position)
  where coalesce(method.item->>'enabled', 'true') <> 'false'
    and exists (
      select 1 from jsonb_array_elements(coalesce(d.document->'sections', '[]'::jsonb)) section
      where section->>'id' = 'methods' and coalesce(section->>'enabled', 'true') <> 'false'
    )
  union all
  select d.consumer_id, concat('example:', example.item->>'id', ':', asset.position)::text, asset.asset_id
  from documents d
  cross join lateral jsonb_array_elements(coalesce(d.document->'examples', '[]'::jsonb)) with ordinality as example(item, example_position)
  cross join lateral jsonb_array_elements_text(coalesce(example.item->'assetIds', '[]'::jsonb)) with ordinality as asset(asset_id, position)
  where coalesce(example.item->>'enabled', 'true') <> 'false'
    and exists (
      select 1 from jsonb_array_elements(coalesce(d.document->'sections', '[]'::jsonb)) section
      where section->>'id' = 'examples' and coalesce(section->>'enabled', 'true') <> 'false'
    )
  union all
  select d.consumer_id, concat('gallery:', asset.position)::text, asset.asset_id
  from documents d
  cross join lateral jsonb_array_elements_text(coalesce(d.document->'gallery'->'assetIds', '[]'::jsonb)) with ordinality as asset(asset_id, position)
  where exists (
    select 1 from jsonb_array_elements(coalesce(d.document->'sections', '[]'::jsonb)) section
    where section->>'id' = 'gallery' and coalesce(section->>'enabled', 'true') <> 'false'
  )
  union all
  select d.consumer_id, concat('comparison:', comparison.item->>'id', ':left')::text, comparison.item->>'leftId'
  from documents d
  cross join lateral jsonb_array_elements(coalesce(d.document->'comparisons', '[]'::jsonb)) as comparison(item)
  where coalesce(comparison.item->>'enabled', 'true') <> 'false'
    and exists (
      select 1 from jsonb_array_elements(coalesce(d.document->'sections', '[]'::jsonb)) section
      where section->>'id' = 'gallery' and coalesce(section->>'enabled', 'true') <> 'false'
    )
  union all
  select d.consumer_id, concat('comparison:', comparison.item->>'id', ':right')::text, comparison.item->>'rightId'
  from documents d
  cross join lateral jsonb_array_elements(coalesce(d.document->'comparisons', '[]'::jsonb)) as comparison(item)
  where coalesce(comparison.item->>'enabled', 'true') <> 'false'
    and exists (
      select 1 from jsonb_array_elements(coalesce(d.document->'sections', '[]'::jsonb)) section
      where section->>'id' = 'gallery' and coalesce(section->>'enabled', 'true') <> 'false'
    )
)
insert into public.media_asset_usages (asset_id, consumer_type, consumer_id, placement)
select distinct media.id, 'provenance', placements.consumer_id, placements.placement
from placements
join public.media_assets media on media.id::text = placements.asset_id
where coalesce(placements.asset_id, '') <> '';

commit;
