
-- Master komponen gaji per guru
CREATE TABLE public.gaji_komponen_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gtk_id uuid NOT NULL,
  nama_komponen text NOT NULL,
  kategori text NOT NULL CHECK (kategori IN ('pendapatan','potongan')),
  nominal numeric NOT NULL DEFAULT 0,
  urutan integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaji_komponen_master TO authenticated;
GRANT ALL ON public.gaji_komponen_master TO service_role;
ALTER TABLE public.gaji_komponen_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin bendahara manage gaji_komponen_master" ON public.gaji_komponen_master FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'bendahara'));

-- Pengaturan gaji global
CREATE TABLE public.gaji_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarif_per_hadir numeric NOT NULL DEFAULT 0,
  potongan_per_alpa numeric NOT NULL DEFAULT 0,
  potongan_per_izin numeric NOT NULL DEFAULT 0,
  potongan_per_sakit numeric NOT NULL DEFAULT 0,
  format_nomor_slip text NOT NULL DEFAULT 'SLIP/{bulan}/{tahun}/{seq}',
  judul_slip text NOT NULL DEFAULT 'SLIP GAJI GURU & TENAGA KEPENDIDIKAN',
  hari_kerja_per_minggu integer NOT NULL DEFAULT 6,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gaji_settings TO authenticated;
GRANT ALL ON public.gaji_settings TO service_role;
ALTER TABLE public.gaji_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin bendahara manage gaji_settings" ON public.gaji_settings FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'bendahara'));
CREATE POLICY "Authenticated view gaji_settings" ON public.gaji_settings FOR SELECT
  USING (has_any_role(auth.uid()));

-- Header gaji per guru per periode
CREATE TABLE public.gaji_periode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gtk_id uuid NOT NULL,
  bulan integer NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun integer NOT NULL,
  jumlah_hadir integer NOT NULL DEFAULT 0,
  jumlah_izin integer NOT NULL DEFAULT 0,
  jumlah_sakit integer NOT NULL DEFAULT 0,
  jumlah_alpa integer NOT NULL DEFAULT 0,
  hari_kerja integer NOT NULL DEFAULT 0,
  total_pendapatan numeric NOT NULL DEFAULT 0,
  total_potongan numeric NOT NULL DEFAULT 0,
  total_bersih numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final','dibayar')),
  nomor_slip text,
  tanggal_bayar date,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gtk_id, bulan, tahun)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaji_periode TO authenticated;
GRANT ALL ON public.gaji_periode TO service_role;
ALTER TABLE public.gaji_periode ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin bendahara manage gaji_periode" ON public.gaji_periode FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'bendahara'));
CREATE POLICY "Guru view own gaji_periode" ON public.gaji_periode FOR SELECT
  USING (
    has_role(auth.uid(),'guru')
    AND status IN ('final','dibayar')
    AND gtk_id IN (SELECT id FROM public.gtk_ptk WHERE user_id = auth.uid())
  );

-- Detail komponen per slip (snapshot)
CREATE TABLE public.gaji_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gaji_periode_id uuid NOT NULL REFERENCES public.gaji_periode(id) ON DELETE CASCADE,
  nama_komponen text NOT NULL,
  kategori text NOT NULL CHECK (kategori IN ('pendapatan','potongan')),
  nominal numeric NOT NULL DEFAULT 0,
  urutan integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaji_detail TO authenticated;
GRANT ALL ON public.gaji_detail TO service_role;
ALTER TABLE public.gaji_detail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin bendahara manage gaji_detail" ON public.gaji_detail FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'bendahara'));
CREATE POLICY "Guru view own gaji_detail" ON public.gaji_detail FOR SELECT
  USING (
    has_role(auth.uid(),'guru')
    AND gaji_periode_id IN (
      SELECT id FROM public.gaji_periode
      WHERE status IN ('final','dibayar')
        AND gtk_id IN (SELECT id FROM public.gtk_ptk WHERE user_id = auth.uid())
    )
  );

-- Triggers updated_at
CREATE TRIGGER trg_gaji_komponen_master_updated BEFORE UPDATE ON public.gaji_komponen_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gaji_settings_updated BEFORE UPDATE ON public.gaji_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gaji_periode_updated BEFORE UPDATE ON public.gaji_periode
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gaji_komponen_master_gtk ON public.gaji_komponen_master(gtk_id);
CREATE INDEX idx_gaji_periode_gtk_periode ON public.gaji_periode(gtk_id, tahun, bulan);
CREATE INDEX idx_gaji_detail_periode ON public.gaji_detail(gaji_periode_id);

-- Seed default settings row
INSERT INTO public.gaji_settings (tarif_per_hadir) VALUES (0);
