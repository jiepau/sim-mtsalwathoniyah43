
-- Tighten gtk-photos INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload gtk photos" ON storage.objects;

CREATE POLICY "Admin, operator, or owner can upload gtk photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gtk-photos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.gtk_ptk g
      WHERE g.user_id = auth.uid()
        AND (
          objects.name LIKE (g.id::text || '%')
          OR objects.name LIKE ('%/' || g.id::text || '%')
        )
    )
  )
);

-- Add UPDATE policy for elearning bucket
CREATE POLICY "Guru can update elearning files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'elearning'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
    OR has_role(auth.uid(), 'guru'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'elearning'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'operator'::app_role)
    OR has_role(auth.uid(), 'guru'::app_role)
  )
);
