-- Public bucket for brand assets referenced by email templates (e.g. OTP logo).
-- Readable by anyone (email clients fetch without auth); anon INSERT allows
-- pipeline uploads via the publishable key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('email-assets', 'email-assets', true, 1048576, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "email-assets public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'email-assets');

create policy "email-assets anon insert" on storage.objects
  for insert to anon
  with check (bucket_id = 'email-assets');