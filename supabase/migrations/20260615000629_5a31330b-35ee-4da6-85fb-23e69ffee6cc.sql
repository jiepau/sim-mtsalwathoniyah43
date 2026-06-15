
CREATE TABLE public.jadwal_model (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  nama text NOT NULL,
  keterangan text,
  max_jam_per_hari integer NOT NULL DEFAULT 10,
  hari_libur text[] NOT NULL DEFAULT ARRAY['minggu']::text[],
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jadwal_model TO authenticated;
GRANT ALL ON public.jadwal_model TO service_role;

ALTER TABLE public.jadwal_model ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read jadwal_model"
  ON public.jadwal_model FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Operator manage jadwal_model"
  ON public.jadwal_model FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operator'));

CREATE TRIGGER update_jadwal_model_updated_at
  BEFORE UPDATE ON public.jadwal_model
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Unik: hanya satu model aktif per TA
CREATE UNIQUE INDEX jadwal_model_one_active_per_ta
  ON public.jadwal_model(ta_id) WHERE is_active = true;

-- Tautkan jadwal_jam & jadwal_pelajaran ke model
ALTER TABLE public.jadwal_jam
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.jadwal_model(id) ON DELETE CASCADE;
ALTER TABLE public.jadwal_pelajaran
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.jadwal_model(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_jadwal_jam_model ON public.jadwal_jam(model_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_pelajaran_model ON public.jadwal_pelajaran(model_id);
