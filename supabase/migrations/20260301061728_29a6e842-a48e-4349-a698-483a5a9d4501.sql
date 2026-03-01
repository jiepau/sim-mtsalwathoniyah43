-- Allow Guru to insert their own attendance (gtk_ptk.user_id = auth.uid())
CREATE POLICY "Guru can insert own absensi_gtk"
ON public.absensi_gtk
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'guru'::app_role)
  AND gtk_id IN (SELECT id FROM public.gtk_ptk WHERE user_id = auth.uid())
);

-- Allow Guru to update their own attendance
CREATE POLICY "Guru can update own absensi_gtk"
ON public.absensi_gtk
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'guru'::app_role)
  AND gtk_id IN (SELECT id FROM public.gtk_ptk WHERE user_id = auth.uid())
);