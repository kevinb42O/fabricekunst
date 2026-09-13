begin;

-- Existing Provenance assets were copied to the universal library before the
-- generic usage index existed. Register the current draft references so an
-- in-use image cannot be archived before that page is next saved.
insert into public.media_asset_usages (asset_id, consumer_type, consumer_id, placement)
select media.id, 'provenance', 'main', 'page-reference'
from jsonb_array_elements(
  coalesce((select draft -> 'assets' from public.provenance_pages where id = 'main'), '[]'::jsonb)
) as asset
join public.media_assets media on media.id::text = asset ->> 'id'
on conflict (asset_id, consumer_type, consumer_id, placement) do update
set updated_at = now();

commit;
