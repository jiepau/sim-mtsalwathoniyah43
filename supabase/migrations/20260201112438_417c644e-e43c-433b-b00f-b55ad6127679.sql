-- =============================================
-- FASE 1: ATP (Alur Tujuan Pembelajaran) + KKTP
-- =============================================

-- Create ENUM for Fase (Phase in Kurikulum Merdeka)
CREATE TYPE public.fase_pembelajaran AS ENUM ('A', 'B', 'C', 'D', 'E', 'F');

-- =============================================
-- Table: ATP (Alur Tujuan Pembelajaran)
-- =============================================
CREATE TABLE public.atp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guru_id UUID REFERENCES public.gtk_ptk(id) ON DELETE SET NULL,
    ta_id UUID REFERENCES public.tahun_ajaran(id) ON DELETE SET NULL,
    mapel TEXT NOT NULL,
    fase fase_pembelajaran NOT NULL DEFAULT 'D',
    elemen TEXT,
    capaian_pembelajaran TEXT NOT NULL,
    tujuan_pembelajaran TEXT[] DEFAULT '{}',
    alokasi_waktu TEXT,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atp ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ATP
CREATE POLICY "Admin and operator can manage atp"
ON public.atp
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Authenticated users can view atp"
ON public.atp
FOR SELECT
USING (has_any_role(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_atp_updated_at
BEFORE UPDATE ON public.atp
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Table: KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
-- =============================================
CREATE TABLE public.kktp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    atp_id UUID REFERENCES public.atp(id) ON DELETE CASCADE NOT NULL,
    tujuan_pembelajaran TEXT NOT NULL,
    kriteria_ketercapaian TEXT[] DEFAULT '{}',
    teknik_penilaian TEXT,
    bentuk_instrumen TEXT,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kktp ENABLE ROW LEVEL SECURITY;

-- RLS Policies for KKTP
CREATE POLICY "Admin and operator can manage kktp"
ON public.kktp
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Authenticated users can view kktp"
ON public.kktp
FOR SELECT
USING (has_any_role(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_kktp_updated_at
BEFORE UPDATE ON public.kktp
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Indexes for better performance
-- =============================================
CREATE INDEX idx_atp_guru_id ON public.atp(guru_id);
CREATE INDEX idx_atp_ta_id ON public.atp(ta_id);
CREATE INDEX idx_atp_mapel ON public.atp(mapel);
CREATE INDEX idx_atp_fase ON public.atp(fase);
CREATE INDEX idx_kktp_atp_id ON public.kktp(atp_id);