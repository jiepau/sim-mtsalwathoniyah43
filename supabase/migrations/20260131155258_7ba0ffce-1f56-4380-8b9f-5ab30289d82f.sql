-- Fix: Restrict gtk_ptk table access to admin and operator roles only
-- This prevents sensitive personal information (NIK, email, phone, addresses) from being exposed to all authenticated users

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view gtk_ptk" ON public.gtk_ptk;

-- Create restricted SELECT policy - only admin and operator can view teacher/staff data
CREATE POLICY "Admin and operator can view gtk_ptk" 
ON public.gtk_ptk 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));