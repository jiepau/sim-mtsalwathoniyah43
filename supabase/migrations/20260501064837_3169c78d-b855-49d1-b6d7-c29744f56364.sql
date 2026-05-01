
-- Add EMIS 4.0 fields to ppdb_pendaftar

-- Data Siswa tambahan
ALTER TABLE public.ppdb_pendaftar
  ADD COLUMN IF NOT EXISTS nik text,
  ADD COLUMN IF NOT EXISTS kip text,
  ADD COLUMN IF NOT EXISTS agama text DEFAULT 'Islam',
  ADD COLUMN IF NOT EXISTS jumlah_saudara integer,
  ADD COLUMN IF NOT EXISTS anak_ke integer,
  ADD COLUMN IF NOT EXISTS hobi text,
  ADD COLUMN IF NOT EXISTS cita_cita text,
  ADD COLUMN IF NOT EXISTS no_hp text,
  ADD COLUMN IF NOT EXISTS email_siswa text,
  ADD COLUMN IF NOT EXISTS yang_membiayai text,
  ADD COLUMN IF NOT EXISTS kebutuhan_disabilitas text,
  ADD COLUMN IF NOT EXISTS kebutuhan_khusus text,
  ADD COLUMN IF NOT EXISTS status_tempat_tinggal text,
  ADD COLUMN IF NOT EXISTS jarak_ke_madrasah text,
  ADD COLUMN IF NOT EXISTS waktu_tempuh text,
  ADD COLUMN IF NOT EXISTS transportasi text;

-- Data Ayah Kandung
ALTER TABLE public.ppdb_pendaftar
  ADD COLUMN IF NOT EXISTS ayah_nik text,
  ADD COLUMN IF NOT EXISTS ayah_tempat_lahir text,
  ADD COLUMN IF NOT EXISTS ayah_tanggal_lahir date,
  ADD COLUMN IF NOT EXISTS ayah_status text,
  ADD COLUMN IF NOT EXISTS ayah_pendidikan text,
  ADD COLUMN IF NOT EXISTS ayah_pekerjaan text,
  ADD COLUMN IF NOT EXISTS ayah_domisili text,
  ADD COLUMN IF NOT EXISTS ayah_no_hp text,
  ADD COLUMN IF NOT EXISTS ayah_penghasilan text,
  ADD COLUMN IF NOT EXISTS ayah_alamat text,
  ADD COLUMN IF NOT EXISTS ayah_status_tempat_tinggal text;

-- Data Ibu Kandung
ALTER TABLE public.ppdb_pendaftar
  ADD COLUMN IF NOT EXISTS ibu_nik text,
  ADD COLUMN IF NOT EXISTS ibu_nama text,
  ADD COLUMN IF NOT EXISTS ibu_tempat_lahir text,
  ADD COLUMN IF NOT EXISTS ibu_tanggal_lahir date,
  ADD COLUMN IF NOT EXISTS ibu_status text,
  ADD COLUMN IF NOT EXISTS ibu_pendidikan text,
  ADD COLUMN IF NOT EXISTS ibu_pekerjaan text,
  ADD COLUMN IF NOT EXISTS ibu_domisili text,
  ADD COLUMN IF NOT EXISTS ibu_no_hp text,
  ADD COLUMN IF NOT EXISTS ibu_penghasilan text,
  ADD COLUMN IF NOT EXISTS ibu_alamat text,
  ADD COLUMN IF NOT EXISTS ibu_status_tempat_tinggal text;

-- Data Wali
ALTER TABLE public.ppdb_pendaftar
  ADD COLUMN IF NOT EXISTS wali_nik text,
  ADD COLUMN IF NOT EXISTS wali_nama text,
  ADD COLUMN IF NOT EXISTS wali_tempat_lahir text,
  ADD COLUMN IF NOT EXISTS wali_tanggal_lahir date,
  ADD COLUMN IF NOT EXISTS wali_status text,
  ADD COLUMN IF NOT EXISTS wali_pendidikan text,
  ADD COLUMN IF NOT EXISTS wali_pekerjaan text,
  ADD COLUMN IF NOT EXISTS wali_domisili text,
  ADD COLUMN IF NOT EXISTS wali_no_hp text,
  ADD COLUMN IF NOT EXISTS wali_penghasilan text,
  ADD COLUMN IF NOT EXISTS wali_alamat text,
  ADD COLUMN IF NOT EXISTS wali_status_tempat_tinggal text;

-- Update nomor pendaftaran function from PPDB to SPMB
CREATE OR REPLACE FUNCTION public.generate_nomor_ppdb()
RETURNS text AS $$
DECLARE
  v_tahun integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(split_part(nomor_pendaftaran, '-', 3) AS integer)), 0) + 1
  INTO v_counter FROM public.ppdb_pendaftar
  WHERE nomor_pendaftaran LIKE 'SPMB-' || v_tahun || '-%';
  RETURN 'SPMB-' || v_tahun || '-' || LPAD(v_counter::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
