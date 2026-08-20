-- Catalog media is hosted exclusively on Cloudflare R2.
-- Keep legacy objects readable for recovery, but make Supabase Storage
-- impossible to use for new or modified catalog images.

begin;

drop policy if exists "Public Storage Insert" on storage.objects;
drop policy if exists "Public Storage Update" on storage.objects;
drop policy if exists "Public Storage Delete" on storage.objects;
drop policy if exists catalog_images_admin_insert on storage.objects;
drop policy if exists catalog_images_admin_update on storage.objects;
drop policy if exists catalog_images_admin_delete on storage.objects;

commit;
