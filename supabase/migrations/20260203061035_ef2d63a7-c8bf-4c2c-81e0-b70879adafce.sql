-- =============================================
-- FASE 1-3: Aplikasi Surat Menyurat
-- =============================================

-- Tabel Surat Masuk
CREATE TABLE public.surat_masuk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_surat TEXT NOT NULL,
  tanggal_surat DATE NOT NULL,
  tanggal_terima DATE NOT NULL DEFAULT CURRENT_DATE,
  pengirim TEXT NOT NULL,
  perihal TEXT NOT NULL,
  klasifikasi TEXT DEFAULT 'biasa', -- rahasia, penting, biasa
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Surat Keluar
CREATE TABLE public.surat_keluar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_surat TEXT NOT NULL,
  tanggal_surat DATE NOT NULL DEFAULT CURRENT_DATE,
  tujuan TEXT NOT NULL,
  perihal TEXT NOT NULL,
  klasifikasi TEXT DEFAULT 'biasa',
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Disposisi (untuk tracking surat masuk)
CREATE TABLE public.disposisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_masuk_id UUID NOT NULL REFERENCES public.surat_masuk(id) ON DELETE CASCADE,
  dari TEXT NOT NULL,
  kepada TEXT NOT NULL,
  instruksi TEXT,
  tanggal_disposisi DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending', -- pending, proses, selesai
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Penomoran Surat (untuk auto-generate nomor)
CREATE TABLE public.surat_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis TEXT NOT NULL, -- 'masuk' atau 'keluar'
  tahun INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  UNIQUE(jenis, tahun)
);

-- Enable RLS
ALTER TABLE public.surat_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_counter ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk surat_masuk
CREATE POLICY "Admin and operator can view surat_masuk"
ON public.surat_masuk FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Admin and operator can manage surat_masuk"
ON public.surat_masuk FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- RLS Policies untuk surat_keluar
CREATE POLICY "Admin and operator can view surat_keluar"
ON public.surat_keluar FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Admin and operator can manage surat_keluar"
ON public.surat_keluar FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- RLS Policies untuk disposisi
CREATE POLICY "Admin and operator can view disposisi"
ON public.disposisi FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Admin and operator can manage disposisi"
ON public.disposisi FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- RLS Policies untuk surat_counter
CREATE POLICY "Admin and operator can view surat_counter"
ON public.surat_counter FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Admin and operator can manage surat_counter"
ON public.surat_counter FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Trigger untuk updated_at
CREATE TRIGGER update_surat_masuk_updated_at
BEFORE UPDATE ON public.surat_masuk
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surat_keluar_updated_at
BEFORE UPDATE ON public.surat_keluar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function untuk generate nomor surat otomatis
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(p_jenis TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tahun INTEGER;
  v_counter INTEGER;
  v_bulan TEXT;
  v_nomor TEXT;
BEGIN
  v_tahun := EXTRACT(YEAR FROM CURRENT_DATE);
  v_bulan := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Get or create counter
  INSERT INTO surat_counter (jenis, tahun, counter)
  VALUES (p_jenis, v_tahun, 1)
  ON CONFLICT (jenis, tahun) 
  DO UPDATE SET counter = surat_counter.counter + 1
  RETURNING counter INTO v_counter;
  
  -- Format: XXX/MTs.AW43/MM/YYYY
  v_nomor := LPAD(v_counter::TEXT, 3, '0') || '/MTs.AW43/' || v_bulan || '/' || v_tahun;
  
  RETURN v_nomor;
END;
$$;