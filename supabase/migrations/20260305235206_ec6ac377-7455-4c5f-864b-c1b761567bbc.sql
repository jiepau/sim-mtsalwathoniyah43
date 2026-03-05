
ALTER TABLE public.atp 
  ADD COLUMN IF NOT EXISTS model_pembelajaran text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profil_pelajar text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sumber_belajar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_pembelajaran text DEFAULT NULL;
