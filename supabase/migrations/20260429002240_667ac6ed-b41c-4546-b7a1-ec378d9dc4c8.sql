-- Backfill ta_id pada pembayaran yang masih NULL dengan TA yang aktif
UPDATE public.pembayaran
SET ta_id = (SELECT id FROM public.tahun_ajaran WHERE is_active = true LIMIT 1)
WHERE ta_id IS NULL
  AND EXISTS (SELECT 1 FROM public.tahun_ajaran WHERE is_active = true);

-- Index untuk filter tunggakan per TA
CREATE INDEX IF NOT EXISTS idx_pembayaran_ta_id ON public.pembayaran(ta_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_siswa_ta ON public.pembayaran(siswa_id, ta_id);