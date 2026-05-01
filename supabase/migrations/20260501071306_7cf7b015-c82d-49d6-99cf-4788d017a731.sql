-- Allow panitia to manage ppdb_pendaftar
CREATE POLICY "Panitia can manage ppdb_pendaftar"
ON public.ppdb_pendaftar
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'panitia'::app_role))
WITH CHECK (has_role(auth.uid(), 'panitia'::app_role));

-- Allow panitia to view ppdb_settings
CREATE POLICY "Panitia can view ppdb_settings"
ON public.ppdb_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'panitia'::app_role));
