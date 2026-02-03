-- Drop existing SELECT policy and recreate with bendahara included
DROP POLICY IF EXISTS "Admin and operator can view siswa" ON public.siswa;

-- Create new SELECT policy that includes bendahara (read-only access)
CREATE POLICY "Users with roles can view siswa" 
ON public.siswa 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR 
  has_role(auth.uid(), 'bendahara'::app_role)
);

-- Note: The ALL policy for INSERT/UPDATE/DELETE remains only for admin and operator
-- Bendahara only gets SELECT (read-only) access