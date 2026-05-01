CREATE POLICY "Panitia can view activity_logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'panitia'::app_role));