ALTER TABLE public.cp_templates 
  ADD COLUMN IF NOT EXISTS elemen_cp text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS iktp jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS materi_pembelajaran text[] DEFAULT '{}'::text[];