-- Create alumni table for graduated students
CREATE TABLE public.alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nis TEXT NOT NULL,
  nama TEXT NOT NULL,
  alamat TEXT,
  wa_ortu TEXT,
  kelas_terakhir TEXT,
  tahun_lulus TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  -- Store original data
  original_siswa_id UUID,
  original_kelas_id UUID,
  original_ta_id UUID
);

-- Enable RLS
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view alumni"
ON public.alumni
FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage alumni"
ON public.alumni
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Add status column to siswa for tracking active status
ALTER TABLE public.siswa 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'naik_kelas', 'lulus'));