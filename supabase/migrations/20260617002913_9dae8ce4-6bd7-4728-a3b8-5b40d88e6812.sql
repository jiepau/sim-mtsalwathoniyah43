ALTER TABLE public.ppdb_settings
  ADD COLUMN IF NOT EXISTS is_finalized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS finalized_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS finalized_by uuid NULL;