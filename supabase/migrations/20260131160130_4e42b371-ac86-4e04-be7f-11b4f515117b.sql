-- Fix: Restrict pembayaran (payment) table access to admin and bendahara roles only
-- Operators should not have access to sensitive financial payment data

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view pembayaran" ON public.pembayaran;

-- Create restricted SELECT policy - only admin and bendahara can view payment records
CREATE POLICY "Admin and bendahara can view pembayaran" 
ON public.pembayaran 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'bendahara'::app_role));