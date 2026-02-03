
-- Add file_path column to surat_masuk
ALTER TABLE surat_masuk ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add file_path column to surat_keluar
ALTER TABLE surat_keluar ADD COLUMN IF NOT EXISTS file_path TEXT;
