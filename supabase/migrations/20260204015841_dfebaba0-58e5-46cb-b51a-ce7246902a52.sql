-- Add nsm column to madrasah_settings table
ALTER TABLE public.madrasah_settings
ADD COLUMN IF NOT EXISTS nsm text;