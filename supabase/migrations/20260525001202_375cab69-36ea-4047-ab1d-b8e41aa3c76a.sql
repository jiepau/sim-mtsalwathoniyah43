
CREATE TABLE public.ujian_sesi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis text NOT NULL CHECK (jenis IN ('pts','pas','pat','um')),
  nama text NOT NULL,
  ta_id uuid,
  semester text CHECK (semester IN ('ganjil','genap')),
  tanggal_mulai date,
  tanggal_selesai date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','aktif','selesai')),
  nomor_peserta_prefix text,
  kelas_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ujian_ruang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL REFERENCES public.ujian_sesi(id) ON DELETE CASCADE,
  nama_ruang text NOT NULL,
  lokasi text,
  kapasitas integer NOT NULL DEFAULT 32,
  baris integer NOT NULL DEFAULT 4,
  kolom integer NOT NULL DEFAULT 8,
  urutan integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ujian_peserta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL REFERENCES public.ujian_sesi(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL,
  kelas_asal_id uuid,
  nomor_peserta text NOT NULL,
  ruang_id uuid REFERENCES public.ujian_ruang(id) ON DELETE SET NULL,
  nomor_kursi integer,
  is_manual_override boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sesi_id, siswa_id),
  UNIQUE (sesi_id, nomor_peserta)
);

CREATE INDEX idx_ujian_peserta_sesi ON public.ujian_peserta(sesi_id);
CREATE INDEX idx_ujian_peserta_ruang ON public.ujian_peserta(ruang_id);
CREATE INDEX idx_ujian_ruang_sesi ON public.ujian_ruang(sesi_id);

ALTER TABLE public.ujian_sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian_ruang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian_peserta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin operator manage ujian_sesi" ON public.ujian_sesi
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view ujian_sesi" ON public.ujian_sesi
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin operator manage ujian_ruang" ON public.ujian_ruang
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view ujian_ruang" ON public.ujian_ruang
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin operator manage ujian_peserta" ON public.ujian_peserta
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Authenticated view ujian_peserta" ON public.ujian_peserta
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE TRIGGER trg_ujian_sesi_updated BEFORE UPDATE ON public.ujian_sesi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ujian_peserta_updated BEFORE UPDATE ON public.ujian_peserta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
