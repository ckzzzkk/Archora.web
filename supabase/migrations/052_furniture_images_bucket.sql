-- 035_furniture_images_bucket.sql
-- Storage bucket for user-uploaded furniture photos (image-to-furniture pipeline).

INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture-images', 'furniture-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their own folder
DO $$ begin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users upload own furniture images'
  ) THEN
    CREATE POLICY "Users upload own furniture images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'furniture-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- Allow public read of furniture images (needed for Meshy AI to fetch images)
DO $$ begin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read furniture images'
  ) THEN
    CREATE POLICY "Public read furniture images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'furniture-images');
  END IF;
END $$;
