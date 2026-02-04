-- Part 1: Add additional fields to madrasah_settings
ALTER TABLE public.madrasah_settings
ADD COLUMN IF NOT EXISTS akreditasi text,
ADD COLUMN IF NOT EXISTS no_sk_pendirian text,
ADD COLUMN IF NOT EXISTS tanggal_sk_pendirian date;

-- Add user_id column to gtk_ptk to link teachers with their user accounts
ALTER TABLE public.gtk_ptk
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_gtk_ptk_user_id ON public.gtk_ptk(user_id);

-- Add 'guru' to app_role enum (will be used in next migration)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guru';