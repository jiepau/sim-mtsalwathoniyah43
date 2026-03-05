
-- Add foto_path column to gtk_ptk
ALTER TABLE public.gtk_ptk ADD COLUMN IF NOT EXISTS foto_path text DEFAULT NULL;

-- Create storage bucket for GTK photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('gtk-photos', 'gtk-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to gtk-photos bucket
CREATE POLICY "Authenticated users can upload gtk photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gtk-photos');

-- Allow authenticated users to update gtk photos
CREATE POLICY "Authenticated users can update gtk photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gtk-photos');

-- Allow anyone to view gtk photos (public bucket)
CREATE POLICY "Anyone can view gtk photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gtk-photos');

-- Allow authenticated users to delete gtk photos
CREATE POLICY "Authenticated users can delete gtk photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gtk-photos');
