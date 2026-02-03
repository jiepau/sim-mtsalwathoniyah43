-- Add new columns to siswa table
ALTER TABLE public.siswa
ADD COLUMN nisn text,
ADD COLUMN nama_ibu_kandung text,
ADD COLUMN nama_ayah_kandung text;