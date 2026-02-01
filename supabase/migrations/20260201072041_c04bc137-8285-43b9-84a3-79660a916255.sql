-- Fix infinite recursion on user_roles RLS policy
-- Drop the problematic policy that uses has_role() function
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate with direct subquery (no function call to avoid recursion)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'::app_role
  )
);