-- =============================================
-- FASE 2: PROTA (Program Tahunan) & PROMES (Program Semester)
-- =============================================

-- Tabel Prota
CREATE TABLE public.prota (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mapel TEXT NOT NULL,
  fase fase_pembelajaran NOT NULL DEFAULT 'D',
  kelas INTEGER,
  ta_id UUID REFERENCES public.tahun_ajaran(id) ON DELETE SET NULL,
  guru_id UUID REFERENCES public.gtk_ptk(id) ON DELETE SET NULL,
  kompetensi_inti TEXT,
  alokasi_waktu_total TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel detail Prota (mapping bulan ke materi)
CREATE TABLE public.prota_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prota_id UUID NOT NULL REFERENCES public.prota(id) ON DELETE CASCADE,
  bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
  materi TEXT,
  alokasi_waktu TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Promes
CREATE TABLE public.promes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mapel TEXT NOT NULL,
  fase fase_pembelajaran NOT NULL DEFAULT 'D',
  kelas INTEGER,
  semester TEXT NOT NULL DEFAULT 'ganjil' CHECK (semester IN ('ganjil', 'genap')),
  ta_id UUID REFERENCES public.tahun_ajaran(id) ON DELETE SET NULL,
  guru_id UUID REFERENCES public.gtk_ptk(id) ON DELETE SET NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel detail Promes (mapping minggu ke materi)
CREATE TABLE public.promes_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promes_id UUID NOT NULL REFERENCES public.promes(id) ON DELETE CASCADE,
  bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
  minggu INTEGER NOT NULL CHECK (minggu >= 1 AND minggu <= 5),
  tema TEXT,
  sub_tema TEXT,
  tujuan_pembelajaran TEXT,
  alokasi_waktu TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prota_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promes_detail ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk Prota
CREATE POLICY "Authenticated users can view prota" 
ON public.prota FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage prota" 
ON public.prota FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- RLS Policies untuk Prota Detail
CREATE POLICY "Authenticated users can view prota_detail" 
ON public.prota_detail FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage prota_detail" 
ON public.prota_detail FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- RLS Policies untuk Promes
CREATE POLICY "Authenticated users can view promes" 
ON public.promes FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage promes" 
ON public.promes FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- RLS Policies untuk Promes Detail
CREATE POLICY "Authenticated users can view promes_detail" 
ON public.promes_detail FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage promes_detail" 
ON public.promes_detail FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Trigger untuk update timestamp
CREATE TRIGGER update_prota_updated_at
BEFORE UPDATE ON public.prota
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promes_updated_at
BEFORE UPDATE ON public.promes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();