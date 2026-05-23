
-- 1. Restrict ppdb_pendaftar public SELECT
DROP POLICY IF EXISTS "Anyone can view own ppdb_pendaftar by nomor" ON public.ppdb_pendaftar;

-- 2. Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.ppdb_pendaftar;
ALTER PUBLICATION supabase_realtime DROP TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 3. Tighten storage policies for gtk-photos bucket
DROP POLICY IF EXISTS "Authenticated users can update gtk photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete gtk photos" ON storage.objects;

CREATE POLICY "Admin, operator, or owner can update gtk photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gtk-photos' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'operator'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.gtk_ptk g
      WHERE g.user_id = auth.uid()
        AND (storage.objects.name LIKE g.id::text || '%' OR storage.objects.name LIKE '%/' || g.id::text || '%')
    )
  )
);

CREATE POLICY "Admin, operator, or owner can delete gtk photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gtk-photos' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'operator'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.gtk_ptk g
      WHERE g.user_id = auth.uid()
        AND (storage.objects.name LIKE g.id::text || '%' OR storage.objects.name LIKE '%/' || g.id::text || '%')
    )
  )
);
