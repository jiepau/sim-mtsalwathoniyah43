
-- Create siswa_riwayat table for enrollment history
CREATE TABLE public.siswa_riwayat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id),
  ta_id UUID NOT NULL REFERENCES public.tahun_ajaran(id),
  status TEXT NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate enrollment
ALTER TABLE public.siswa_riwayat ADD CONSTRAINT unique_siswa_kelas_ta UNIQUE (siswa_id, kelas_id, ta_id);

-- Enable RLS
ALTER TABLE public.siswa_riwayat ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin and operator can manage siswa_riwayat"
ON public.siswa_riwayat
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Users with roles can view siswa_riwayat"
ON public.siswa_riwayat
FOR SELECT
TO authenticated
USING (has_any_role(auth.uid()));

-- Migrate existing data: insert current siswa positions into riwayat
INSERT INTO public.siswa_riwayat (siswa_id, kelas_id, ta_id, status)
SELECT id, kelas_id, ta_id, 'aktif'
FROM public.siswa
WHERE kelas_id IS NOT NULL AND ta_id IS NOT NULL;
