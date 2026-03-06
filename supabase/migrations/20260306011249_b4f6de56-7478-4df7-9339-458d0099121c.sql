
-- Add foto_path column to siswa table
ALTER TABLE public.siswa ADD COLUMN IF NOT EXISTS foto_path text;

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('siswa-photos', 'siswa-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for siswa-photos bucket
CREATE POLICY "Admin and operator can upload siswa photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'siswa-photos' AND
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role))
);

CREATE POLICY "Admin and operator can update siswa photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'siswa-photos' AND
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role))
);

CREATE POLICY "Admin and operator can delete siswa photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'siswa-photos' AND
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'operator'::public.app_role))
);

CREATE POLICY "Anyone can view siswa photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'siswa-photos');
