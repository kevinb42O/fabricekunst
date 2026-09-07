begin;

-- Attachment binaries were migrated to a dedicated, non-public Cloudflare R2
-- bucket. Supabase retains only the administrator-only inquiry metadata.
update public.inquiries as inquiry
set attachments = (
  select coalesce(jsonb_agg(attachment || '{"storage":"r2"}'::jsonb), '[]'::jsonb)
  from jsonb_array_elements(inquiry.attachments) as attachment
)
where inquiry.type = 'painting_submission'
  and jsonb_typeof(inquiry.attachments) = 'array';

do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'painting-submissions'
  ) then
    raise exception 'Private attachment migration refused: the legacy Supabase Storage bucket is not empty.';
  end if;

  delete from storage.buckets
  where id = 'painting-submissions';
end
$$;

comment on column public.inquiries.attachments is
  'Administrator-only attachment metadata. Binary files are held in the separate private Cloudflare R2 submissions bucket.';

commit;
