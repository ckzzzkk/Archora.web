-- 057_viga_storage_buckets.sql
-- Storage buckets for VIGA image→3D reconstruction pipeline.
-- viga-inputs: user-uploaded photos (private, user own only)
-- viga-outputs: rendered GLTF meshes (public read, service-role upload)

insert into storage.buckets (id, name, public)
values
  ('viga-inputs', 'viga-inputs', false),
  ('viga-outputs', 'viga-outputs', true)
on conflict (id) do nothing;

-- viga-inputs: private, user own only
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users read own viga-inputs') then
    create policy "Users read own viga-inputs"
      on storage.objects for select
      using (bucket_id = 'viga-inputs' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users upload own viga-inputs') then
    create policy "Users upload own viga-inputs"
      on storage.objects for insert
      with check (bucket_id = 'viga-inputs' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users delete own viga-inputs') then
    create policy "Users delete own viga-inputs"
      on storage.objects for delete
      using (bucket_id = 'viga-inputs' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- viga-outputs: public read for mobile app GLTF loading
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Public read viga-outputs') then
    create policy "Public read viga-outputs"
      on storage.objects for select
      using (bucket_id = 'viga-outputs');
  end if;
end $$;

-- Service role can upload GLTF files (worker uses service_role_key)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Service role upload viga-outputs') then
    create policy "Service role upload viga-outputs"
      on storage.objects for insert
      with check (bucket_id = 'viga-outputs');
  end if;
end $$;
