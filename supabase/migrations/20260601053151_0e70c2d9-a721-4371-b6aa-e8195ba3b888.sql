-- 1. Override hari kerja per GTK (nullable = pakai default global)
ALTER TABLE public.gtk_ptk
  ADD COLUMN IF NOT EXISTS hari_kerja_per_minggu integer,
  ADD COLUMN IF NOT EXISTS hari_kerja_hari integer[];

COMMENT ON COLUMN public.gtk_ptk.hari_kerja_per_minggu IS 'Override jumlah hari kerja per minggu untuk GTK ini. NULL = pakai default global di gaji_settings.';
COMMENT ON COLUMN public.gtk_ptk.hari_kerja_hari IS 'Array hari kerja spesifik (0=Minggu..6=Sabtu). Jika diisi, digunakan untuk menghitung hari kerja per bulan (lebih akurat). Jika NULL, fallback ke hari_kerja_per_minggu.';

-- 2. Tarif potongan tunggal (alpa+izin+sakit dianggap "tidak masuk")
ALTER TABLE public.gaji_settings
  ADD COLUMN IF NOT EXISTS potongan_per_tidak_masuk numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.gaji_settings.potongan_per_tidak_masuk IS 'Tarif potongan per hari tidak masuk (alpa+izin+sakit digabung). Jika > 0, menggantikan potongan_per_alpa/izin/sakit terpisah.';