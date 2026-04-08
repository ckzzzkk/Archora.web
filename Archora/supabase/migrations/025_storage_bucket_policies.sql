-- 025_storage_bucket_policies.sql
-- Storage bucket creation + RLS policies for all 4 buckets.
-- Ensures bucket security is version-controlled, not just dashboard config.

-- Create buckets if they don't exist (idempotent)
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('ar-scans', 'ar-scans', false),
  ('reference-images', 'reference-images', false),
  ('renders', 'renders', true)
on conflict (id) do nothing;

-- Avatars: public read, authenticated user upload/delete own path
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Avatars public read') then
    create policy "Avatars public read"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users upload own avatar') then
    create policy "Users upload own avatar"
      on storage.objects for insert
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users delete own avatar') then
    create policy "Users delete own avatar"
      on storage.objects for delete
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- AR scans: private, user own only
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users read own ar-scans') then
    create policy "Users read own ar-scans"
      on storage.objects for select
      using (bucket_id = 'ar-scans' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users upload own ar-scans') then
    create policy "Users upload own ar-scans"
      on storage.objects for insert
      with check (bucket_id = 'ar-scans' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users delete own ar-scans') then
    create policy "Users delete own ar-scans"
      on storage.objects for delete
      using (bucket_id = 'ar-scans' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- Reference images: private, user own only
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users read own reference-images') then
    create policy "Users read own reference-images"
      on storage.objects for select
      using (bucket_id = 'reference-images' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users upload own reference-images') then
    create policy "Users upload own reference-images"
      on storage.objects for insert
      with check (bucket_id = 'reference-images' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users delete own reference-images') then
    create policy "Users delete own reference-images"
      on storage.objects for delete
      using (bucket_id = 'reference-images' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- Renders: public read, service-role upload only (edge functions use service_role_key)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Renders public read') then
    create policy "Renders public read"
      on storage.objects for select
      using (bucket_id = 'renders');
  end if;
end $$;
