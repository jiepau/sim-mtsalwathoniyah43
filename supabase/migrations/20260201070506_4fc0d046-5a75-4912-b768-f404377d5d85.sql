-- Drop the inconsistent function signature and keep only the correct one
DROP FUNCTION IF EXISTS public.has_role(app_role, uuid);

-- Recreate with the correct standardized signature (_user_id first, then _role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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