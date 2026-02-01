-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a new function specifically for checking admin role that bypasses RLS
-- This is already done with has_role() which is SECURITY DEFINER
-- So we use it in the policy instead of direct subquery

-- Create policy using the SECURITY DEFINER function (which bypasses RLS)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);