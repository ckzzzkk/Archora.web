-- 031_furniture_images_bucket.sql
-- Storage bucket for user-uploaded furniture photos (image-to-furniture pipeline).

insert into storage.buckets (id, name, public)
values ('furniture-images', 'furniture-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload images to their own folder
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users upload own furniture images') then
    create policy "Users upload own furniture images"
      on storage.objects for insert
      with check (bucket_id = 'furniture-images' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- Allow public read of furniture images (needed for Meshy AI to fetch images)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Public read furniture images') then
    create policy "Public read furniture images"
      on storage.objects for select
      using (bucket_id = 'furniture-images');
  end if;
end $$;