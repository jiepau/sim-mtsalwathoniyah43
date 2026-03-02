-- Allow students to read their own siswa record
CREATE POLICY "Siswa can view own data"
ON public.siswa
FOR SELECT
TO authenticated
USING (user_id = auth.uid());