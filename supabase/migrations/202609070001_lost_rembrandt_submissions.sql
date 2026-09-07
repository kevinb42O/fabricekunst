begin;

alter table public.inquiries
  add column if not exists metadata jsonb,
  add column if not exists attachments jsonb;

alter table public.inquiries
  drop constraint if exists inquiries_metadata_object,
  drop constraint if exists inquiries_attachments_array;

alter table public.inquiries
  add constraint inquiries_metadata_object
    check (metadata is null or jsonb_typeof(metadata) = 'object'),
  add constraint inquiries_attachments_array
    check (attachments is null or jsonb_typeof(attachments) = 'array');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'painting-submissions',
  'painting-submissions',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Visitors receive short-lived, single-object signed upload tokens from the
-- server endpoint. There is deliberately no broad anon/authenticated storage
-- policy and no public read policy for this bucket.

comment on column public.inquiries.metadata is
  'Structured, administrator-only intake data for specialised inquiry types.';
comment on column public.inquiries.attachments is
  'Private storage object references; never expose these paths in public responses.';
comment on table public.inquiries is
  'Contact requests and confidential painting submissions. Public writes pass through server-side validation.';

commit;
