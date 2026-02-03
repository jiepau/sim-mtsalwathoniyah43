-- Fix: Restrict siswa table SELECT access to only Admin and Operator roles
-- Bendahara should not have access to full student personal data

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view siswa" ON public.siswa;

-- Create a more restrictive policy for viewing student data
CREATE POLICY "Admin and operator can view siswa"
ON public.siswa
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'operator'::app_role)
);

-- Note: Bendahara can still access payment data through pembayaran table
-- which includes siswa_id for reference, but they cannot see full student PII