-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view alumni" ON public.alumni;

-- Create restricted policy for admin and operator only
CREATE POLICY "Admin and operator can view alumni"
ON public.alumni
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));