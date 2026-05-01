
ALTER TABLE public.ppdb_pendaftar
  ADD COLUMN IF NOT EXISTS npsn_asal_sekolah text,
  ADD COLUMN IF NOT EXISTS nsm_asal_sekolah text;
