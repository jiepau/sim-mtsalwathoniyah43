-- Add initial_password column to profiles table for admin to share credentials
ALTER TABLE public.profiles ADD COLUMN initial_password text;

-- Update RLS: admin can update profiles (to set initial_password)
-- No new policy needed since manage-user edge function uses service role key