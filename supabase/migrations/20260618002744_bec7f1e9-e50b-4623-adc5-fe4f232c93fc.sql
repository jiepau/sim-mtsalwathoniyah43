
ALTER TABLE public.ppdb_settings
  ADD COLUMN IF NOT EXISTS alamat text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS jam_layanan text,
  ADD COLUMN IF NOT EXISTS jadwal jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS persyaratan jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.ppdb_settings
SET
  alamat = COALESCE(alamat, 'Jl. Raya Madrasah, Bekasi'),
  whatsapp = COALESCE(whatsapp, '6281234567890'),
  jam_layanan = COALESCE(jam_layanan, 'Senin – Sabtu, 07.30 – 14.00 WIB'),
  jadwal = CASE WHEN jadwal = '[]'::jsonb THEN '[
    {"fase":"Pendaftaran Online","tanggal":"1 Juli – 20 Juli 2026","status":"aktif"},
    {"fase":"Seleksi Berkas","tanggal":"21 – 25 Juli 2026","status":"akan-datang"},
    {"fase":"Pengumuman","tanggal":"28 Juli 2026","status":"akan-datang"},
    {"fase":"Daftar Ulang","tanggal":"29 Juli – 5 Agustus 2026","status":"akan-datang"}
  ]'::jsonb ELSE jadwal END,
  persyaratan = CASE WHEN persyaratan = '[]'::jsonb THEN '[
    "Fotokopi Akta Kelahiran",
    "Fotokopi Kartu Keluarga",
    "Fotokopi Ijazah / Surat Keterangan Lulus SD/MI",
    "Pas foto 3x4 sebanyak 2 lembar (background merah)",
    "Fotokopi KTP orang tua/wali",
    "Surat Keterangan Sehat dari Dokter/Puskesmas",
    "Fotokopi NISN (jika ada)"
  ]'::jsonb ELSE persyaratan END;
