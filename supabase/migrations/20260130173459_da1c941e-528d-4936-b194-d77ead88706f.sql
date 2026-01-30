-- Add new columns to gtk_ptk table
ALTER TABLE public.gtk_ptk ADD COLUMN IF NOT EXISTS nuptk TEXT;
ALTER TABLE public.gtk_ptk ADD COLUMN IF NOT EXISTS nik TEXT;
ALTER TABLE public.gtk_ptk ADD COLUMN IF NOT EXISTS lulusan TEXT;
ALTER TABLE public.gtk_ptk ADD COLUMN IF NOT EXISTS email TEXT;