
-- 1. Mapel settings
CREATE TABLE public.ijazah_mapel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid,
  urutan integer NOT NULL DEFAULT 0,
  nama_mapel text NOT NULL,
  kode_mapel text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ijazah_mapel_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin operator manage ijazah_mapel" ON public.ijazah_mapel_settings
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view ijazah_mapel" ON public.ijazah_mapel_settings
  FOR SELECT USING (has_any_role(auth.uid()));

-- 2. Nilai
CREATE TABLE public.ijazah_nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL,
  ta_id uuid NOT NULL,
  kode_mapel text NOT NULL,
  nilai numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, ta_id, kode_mapel)
);
ALTER TABLE public.ijazah_nilai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin operator manage ijazah_nilai" ON public.ijazah_nilai
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Bendahara view ijazah_nilai" ON public.ijazah_nilai
  FOR SELECT USING (has_role(auth.uid(),'bendahara'));
CREATE TRIGGER trg_ijazah_nilai_updated BEFORE UPDATE ON public.ijazah_nilai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ijazah_nilai_siswa_ta ON public.ijazah_nilai(siswa_id, ta_id);

-- 3. Kelulusan
CREATE TABLE public.kelulusan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL,
  ta_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('lulus','tidak_lulus','pending')),
  nomor_sk text,
  tanggal_lulus date,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, ta_id)
);
ALTER TABLE public.kelulusan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin operator manage kelulusan" ON public.kelulusan
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Bendahara view kelulusan" ON public.kelulusan
  FOR SELECT USING (has_role(auth.uid(),'bendahara'));
CREATE TRIGGER trg_kelulusan_updated BEFORE UPDATE ON public.kelulusan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_kelulusan_ta ON public.kelulusan(ta_id);

-- 4. Settings pengumuman (singleton per ta)
CREATE TABLE public.kelulusan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid UNIQUE,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  judul_pengumuman text DEFAULT 'Pengumuman Kelulusan',
  pesan_ucapan text DEFAULT 'Selamat! Anda dinyatakan LULUS dari MTs Al-Wathoniyah 43.',
  nomor_sk_format text DEFAULT 'SK-LULUS/MTs43/{tahun}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kelulusan_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage kelulusan_settings" ON public.kelulusan_settings
  FOR ALL USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Public view kelulusan_settings" ON public.kelulusan_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER trg_kelulusan_settings_updated BEFORE UPDATE ON public.kelulusan_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 12 mapel default (ta_id NULL = global default)
INSERT INTO public.ijazah_mapel_settings (urutan, nama_mapel, kode_mapel) VALUES
  (1,'Al-Qur''an Hadits','quran_hadits'),
  (2,'Akidah Akhlak','akidah_akhlak'),
  (3,'Fiqih','fiqih'),
  (4,'Sejarah Kebudayaan Islam','ski'),
  (5,'Bahasa Arab','bahasa_arab'),
  (6,'Pendidikan Pancasila','ppkn'),
  (7,'Bahasa Indonesia','b_indo'),
  (8,'Bahasa Inggris','b_ing'),
  (9,'Matematika','matematika'),
  (10,'Ilmu Pengetahuan Alam','ipa'),
  (11,'Ilmu Pengetahuan Sosial','ips'),
  (12,'Seni Budaya','seni'),
  (13,'PJOK','pjok'),
  (14,'Informatika','informatika'),
  (15,'Muatan Lokal','mulok');
