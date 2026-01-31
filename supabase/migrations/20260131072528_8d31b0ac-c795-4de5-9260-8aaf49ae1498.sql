-- Drop existing restrictive SELECT policy on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new PERMISSIVE SELECT policy for user_roles
-- This allows users to view their own roles without needing has_role check (which would cause recursion)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Also update the has_role function to use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Also update the has_any_role function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
  );
END;
$$;