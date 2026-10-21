-- Public bucket for the Android APK linked from the landing page.
--
-- Uploads stay operator-only: the dashboard and service-role tooling bypass
-- RLS, and no INSERT policy is granted here, so neither anon nor authenticated
-- clients can replace the published build. The bucket is public only so the
-- `/download` redirect target can be fetched without a session.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-downloads',
  'app-downloads',
  true,
  209715200,
  array['application/vnd.android.package-archive', 'application/octet-stream']
)
on conflict (id) do nothing;

create policy "app-downloads public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'app-downloads');
