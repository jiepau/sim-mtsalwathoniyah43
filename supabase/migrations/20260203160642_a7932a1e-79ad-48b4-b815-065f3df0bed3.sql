-- Fix: Make surat-lampiran bucket private and update SELECT policy
-- This ensures only authenticated users with proper roles can access documents

-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'surat-lampiran';

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Public can view surat lampiran" ON storage.objects;

-- Create new policy that requires authentication and role check
CREATE POLICY "Authenticated users with roles can view surat lampiran"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'surat-lampiran' 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);