-- Allow bendahara to view gtk_ptk data (for dashboard stats)
CREATE POLICY "Bendahara can view gtk_ptk"
ON public.gtk_ptk
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'bendahara'::app_role));