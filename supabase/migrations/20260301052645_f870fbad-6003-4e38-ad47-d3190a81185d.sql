
-- Tabel absensi siswa
CREATE TABLE public.absensi_siswa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  ta_id UUID NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'hadir' CHECK (status IN ('hadir', 'sakit', 'izin', 'alfa')),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(siswa_id, tanggal)
);

-- Tabel absensi guru/PTK
CREATE TABLE public.absensi_gtk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gtk_id UUID NOT NULL REFERENCES public.gtk_ptk(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'hadir' CHECK (status IN ('hadir', 'sakit', 'izin', 'alfa', 'dinas_luar', 'cuti')),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(gtk_id, tanggal)
);

-- Enable RLS
ALTER TABLE public.absensi_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_gtk ENABLE ROW LEVEL SECURITY;

-- RLS policies for absensi_siswa
CREATE POLICY "Admin, operator, guru can manage absensi_siswa"
  ON public.absensi_siswa FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'guru'::app_role));

CREATE POLICY "Authenticated users can view absensi_siswa"
  ON public.absensi_siswa FOR SELECT
  USING (has_any_role(auth.uid()));

-- RLS policies for absensi_gtk
CREATE POLICY "Admin and operator can manage absensi_gtk"
  ON public.absensi_gtk FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Authenticated users can view absensi_gtk"
  ON public.absensi_gtk FOR SELECT
  USING (has_any_role(auth.uid()));

-- Index untuk performa query
CREATE INDEX idx_absensi_siswa_tanggal ON public.absensi_siswa(tanggal);
CREATE INDEX idx_absensi_siswa_kelas ON public.absensi_siswa(kelas_id, tanggal);
CREATE INDEX idx_absensi_gtk_tanggal ON public.absensi_gtk(tanggal);
