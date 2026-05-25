
ALTER TABLE public.madrasah_settings 
  ADD COLUMN IF NOT EXISTS ttd_kepala_url TEXT,
  ADD COLUMN IF NOT EXISTS stempel_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('madrasah-assets', 'madrasah-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Madrasah assets public read" ON storage.objects;
CREATE POLICY "Madrasah assets public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'madrasah-assets');

DROP POLICY IF EXISTS "Admin manage madrasah assets" ON storage.objects;
CREATE POLICY "Admin manage madrasah assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'madrasah-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'madrasah-assets' AND public.has_role(auth.uid(), 'admin'));
