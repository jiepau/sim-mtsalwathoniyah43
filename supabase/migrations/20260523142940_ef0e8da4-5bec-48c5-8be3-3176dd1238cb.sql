
-- ============ pdum_mapel ============
CREATE TABLE public.pdum_mapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_mapel text NOT NULL UNIQUE,
  nama_mapel text NOT NULL,
  kelompok text NOT NULL DEFAULT 'umum', -- agama|umum|mulok
  urutan integer NOT NULL DEFAULT 0,
  kkm numeric DEFAULT 70,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pdum_mapel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin operator manage pdum_mapel" ON public.pdum_mapel FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view pdum_mapel" ON public.pdum_mapel FOR SELECT
  USING (has_any_role(auth.uid()));

-- ============ pdum_peserta ============
CREATE TABLE public.pdum_peserta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL,
  ta_id uuid NOT NULL,
  nomor_peserta text,
  kelas_ujian integer DEFAULT 1,
  jurusan text DEFAULT 'UMUM',
  no_absen integer DEFAULT 0,
  nama_ayah_override text,
  nama_ibu_override text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, ta_id)
);
ALTER TABLE public.pdum_peserta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin operator manage pdum_peserta" ON public.pdum_peserta FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view pdum_peserta" ON public.pdum_peserta FOR SELECT
  USING (has_any_role(auth.uid()));
CREATE TRIGGER pdum_peserta_set_updated BEFORE UPDATE ON public.pdum_peserta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ pdum_nilai_rapor ============
CREATE TABLE public.pdum_nilai_rapor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL,
  ta_id uuid NOT NULL,
  kode_mapel text NOT NULL,
  semester text NOT NULL, -- 7g, 7n, 8g, 8n, 9g
  nilai numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, ta_id, kode_mapel, semester)
);
ALTER TABLE public.pdum_nilai_rapor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin operator manage pdum_rapor" ON public.pdum_nilai_rapor FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view pdum_rapor" ON public.pdum_nilai_rapor FOR SELECT
  USING (has_any_role(auth.uid()));
CREATE TRIGGER pdum_rapor_set_updated BEFORE UPDATE ON public.pdum_nilai_rapor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_pdum_rapor_lookup ON public.pdum_nilai_rapor(ta_id, siswa_id);

-- ============ pdum_nilai_um ============
CREATE TABLE public.pdum_nilai_um (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL,
  ta_id uuid NOT NULL,
  kode_mapel text NOT NULL,
  nilai numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, ta_id, kode_mapel)
);
ALTER TABLE public.pdum_nilai_um ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin operator manage pdum_um" ON public.pdum_nilai_um FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view pdum_um" ON public.pdum_nilai_um FOR SELECT
  USING (has_any_role(auth.uid()));
CREATE TRIGGER pdum_um_set_updated BEFORE UPDATE ON public.pdum_nilai_um
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_pdum_um_lookup ON public.pdum_nilai_um(ta_id, siswa_id);

-- ============ pdum_settings ============
CREATE TABLE public.pdum_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid NOT NULL UNIQUE,
  bobot_rapor numeric NOT NULL DEFAULT 60,
  bobot_um numeric NOT NULL DEFAULT 40,
  nsm text,
  nomor_peserta_prefix text, -- contoh: 26-09-02-2-0180
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pdum_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage pdum_settings" ON public.pdum_settings FOR ALL
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated view pdum_settings" ON public.pdum_settings FOR SELECT
  USING (has_any_role(auth.uid()));
CREATE TRIGGER pdum_settings_set_updated BEFORE UPDATE ON public.pdum_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Seed default mapel ============
INSERT INTO public.pdum_mapel (kode_mapel, nama_mapel, kelompok, urutan) VALUES
  ('quran_hadis', 'Al-Qur''an Hadis', 'agama', 1),
  ('aqidah_akhlak', 'Akidah Akhlak', 'agama', 2),
  ('fiqih', 'Fikih', 'agama', 3),
  ('ski', 'Sejarah Kebudayaan Islam', 'agama', 4),
  ('bahasa_arab', 'Bahasa Arab', 'agama', 5),
  ('ppkn', 'Pendidikan Pancasila', 'umum', 6),
  ('b_indonesia', 'Bahasa Indonesia', 'umum', 7),
  ('b_inggris', 'Bahasa Inggris', 'umum', 8),
  ('matematika', 'Matematika', 'umum', 9),
  ('ipa', 'Ilmu Pengetahuan Alam', 'umum', 10),
  ('ips', 'Ilmu Pengetahuan Sosial', 'umum', 11),
  ('penjasorkes', 'Pendidikan Jasmani Olahraga & Kesehatan', 'umum', 12),
  ('seni_budaya', 'Seni Budaya', 'umum', 13),
  ('informatika', 'Informatika', 'umum', 14),
  ('mulok', 'Muatan Lokal', 'mulok', 15);
