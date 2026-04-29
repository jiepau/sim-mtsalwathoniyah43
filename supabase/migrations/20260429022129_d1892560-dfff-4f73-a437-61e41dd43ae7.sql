-- Add new columns to gtk_ptk for kepegawaian tracking
ALTER TABLE public.gtk_ptk 
  ADD COLUMN IF NOT EXISTS status_kepegawaian text,
  ADD COLUMN IF NOT EXISTS sertifikasi boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nomor_sertifikasi text,
  ADD COLUMN IF NOT EXISTS status_aktif text NOT NULL DEFAULT 'aktif';

-- Helpful index for dashboard counts
CREATE INDEX IF NOT EXISTS idx_gtk_ptk_status_kepegawaian ON public.gtk_ptk(status_kepegawaian);
CREATE INDEX IF NOT EXISTS idx_gtk_ptk_sertifikasi ON public.gtk_ptk(sertifikasi);