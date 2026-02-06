-- Tabel untuk menyimpan hasil generate RPP/Modul Ajar
CREATE TABLE public.modul_ajar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guru_id UUID REFERENCES public.gtk_ptk(id),
  atp_id UUID REFERENCES public.atp(id),
  ta_id UUID REFERENCES public.tahun_ajaran(id),
  
  -- Identitas
  jenjang TEXT NOT NULL,
  kelas INTEGER NOT NULL,
  semester TEXT NOT NULL,
  mapel TEXT NOT NULL,
  topik TEXT NOT NULL,
  alokasi_waktu TEXT NOT NULL,
  
  -- Kurikulum Data
  capaian_pembelajaran TEXT,
  tujuan_pembelajaran TEXT[],
  
  -- Model Pembelajaran Deep Learning
  model_pembelajaran TEXT NOT NULL DEFAULT 'discovery_learning',
  
  -- Profil Pelajar Pancasila
  profil_pelajar TEXT[] DEFAULT '{}',
  
  -- Kurikulum Berbasis Cinta
  nilai_karakter TEXT[] DEFAULT '{}',
  materi_insersi TEXT,
  
  -- Asesmen HOTS
  teknik_asesmen TEXT[] DEFAULT '{}',
  jenis_asesmen TEXT[] DEFAULT '{}',
  
  -- Diferensiasi
  diferensiasi_konten TEXT,
  diferensiasi_proses TEXT,
  diferensiasi_produk TEXT,
  
  -- Hasil Generate
  hasil_rpp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.modul_ajar ENABLE ROW LEVEL SECURITY;

-- Policies: Admin, operator, and guru can manage their own modul_ajar
CREATE POLICY "Admin and operator can manage all modul_ajar" 
  ON public.modul_ajar 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Guru can view their own modul_ajar" 
  ON public.modul_ajar 
  FOR SELECT 
  USING (has_role(auth.uid(), 'guru'::app_role) AND created_by = auth.uid());

CREATE POLICY "Guru can insert their own modul_ajar" 
  ON public.modul_ajar 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'guru'::app_role) AND created_by = auth.uid());

CREATE POLICY "Guru can update their own modul_ajar" 
  ON public.modul_ajar 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'guru'::app_role) AND created_by = auth.uid());

CREATE POLICY "Guru can delete their own modul_ajar" 
  ON public.modul_ajar 
  FOR DELETE 
  USING (has_role(auth.uid(), 'guru'::app_role) AND created_by = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_modul_ajar_updated_at
  BEFORE UPDATE ON public.modul_ajar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS for guru to access generator-rpp edge function
-- (Already has admin/operator access, adding guru)

-- Comment for documentation
COMMENT ON TABLE public.modul_ajar IS 'Stores generated RPP/Modul Ajar with Deep Learning models and KBC integration';