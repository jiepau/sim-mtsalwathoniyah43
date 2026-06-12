
-- Slot waktu per TA (jam pelajaran)
CREATE TABLE public.jadwal_jam (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  hari smallint NOT NULL CHECK (hari BETWEEN 1 AND 7),
  jam_ke smallint NOT NULL CHECK (jam_ke BETWEEN 1 AND 20),
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  is_istirahat boolean NOT NULL DEFAULT false,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ta_id, hari, jam_ke)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jadwal_jam TO authenticated;
GRANT ALL ON public.jadwal_jam TO service_role;
ALTER TABLE public.jadwal_jam ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jadwal_jam read auth" ON public.jadwal_jam FOR SELECT TO authenticated USING (true);
CREATE POLICY "jadwal_jam manage admin/operator" ON public.jadwal_jam FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'));
CREATE TRIGGER trg_jadwal_jam_updated BEFORE UPDATE ON public.jadwal_jam FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Jadwal pelajaran per semester
CREATE TABLE public.jadwal_pelajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  semester text NOT NULL CHECK (semester IN ('ganjil','genap')),
  kelas_id uuid NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  hari smallint NOT NULL CHECK (hari BETWEEN 1 AND 7),
  jam_ke smallint NOT NULL CHECK (jam_ke BETWEEN 1 AND 20),
  mapel text NOT NULL,
  gtk_id uuid REFERENCES public.gtk_ptk(id) ON DELETE SET NULL,
  ruang text,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ta_id, semester, kelas_id, hari, jam_ke)
);
CREATE UNIQUE INDEX jadwal_pelajaran_guru_unique
  ON public.jadwal_pelajaran (ta_id, semester, gtk_id, hari, jam_ke)
  WHERE gtk_id IS NOT NULL;
CREATE INDEX jadwal_pelajaran_kelas_idx ON public.jadwal_pelajaran (ta_id, semester, kelas_id);
CREATE INDEX jadwal_pelajaran_gtk_idx ON public.jadwal_pelajaran (ta_id, semester, gtk_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jadwal_pelajaran TO authenticated;
GRANT ALL ON public.jadwal_pelajaran TO service_role;
ALTER TABLE public.jadwal_pelajaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jadwal_pelajaran read auth" ON public.jadwal_pelajaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "jadwal_pelajaran manage admin/operator" ON public.jadwal_pelajaran FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'));
CREATE TRIGGER trg_jadwal_pelajaran_updated BEFORE UPDATE ON public.jadwal_pelajaran FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Preferensi/hari tidak mengajar guru
CREATE TABLE public.guru_unavailable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  semester text NOT NULL CHECK (semester IN ('ganjil','genap')),
  gtk_id uuid NOT NULL REFERENCES public.gtk_ptk(id) ON DELETE CASCADE,
  hari smallint NOT NULL CHECK (hari BETWEEN 1 AND 7),
  jam_ke smallint CHECK (jam_ke BETWEEN 1 AND 20),
  alasan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guru_unavailable_idx ON public.guru_unavailable (ta_id, semester, gtk_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guru_unavailable TO authenticated;
GRANT ALL ON public.guru_unavailable TO service_role;
ALTER TABLE public.guru_unavailable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guru_unavailable read auth" ON public.guru_unavailable FOR SELECT TO authenticated USING (true);
CREATE POLICY "guru_unavailable manage admin/operator" ON public.guru_unavailable FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'));
CREATE TRIGGER trg_guru_unavailable_updated BEFORE UPDATE ON public.guru_unavailable FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
