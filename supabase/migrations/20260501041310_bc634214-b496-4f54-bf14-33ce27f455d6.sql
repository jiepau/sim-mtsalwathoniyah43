
-- Create ppdb_settings table
CREATE TABLE public.ppdb_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_open boolean NOT NULL DEFAULT false,
  tahun_ajaran text,
  pesan_selamat text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ppdb_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage ppdb_settings"
  ON public.ppdb_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view ppdb_settings"
  ON public.ppdb_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert default row
INSERT INTO public.ppdb_settings (is_open, tahun_ajaran) VALUES (false, '2025/2026');

-- Create ppdb_pendaftar table
CREATE TABLE public.ppdb_pendaftar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_pendaftaran text NOT NULL UNIQUE,
  nama text NOT NULL,
  nisn text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  alamat text,
  nama_ayah text,
  nama_ibu text,
  wa_ortu text,
  asal_sekolah text,
  status text NOT NULL DEFAULT 'baru',
  catatan text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ppdb_pendaftar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage ppdb_pendaftar"
  ON public.ppdb_pendaftar FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert ppdb_pendaftar when open"
  ON public.ppdb_pendaftar FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ppdb_settings WHERE is_open = true)
  );

CREATE POLICY "Anyone can view own ppdb_pendaftar by nomor"
  ON public.ppdb_pendaftar FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_ppdb_settings_updated_at
  BEFORE UPDATE ON public.ppdb_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ppdb_pendaftar_updated_at
  BEFORE UPDATE ON public.ppdb_pendaftar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate PPDB registration number
CREATE OR REPLACE FUNCTION public.generate_nomor_ppdb()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tahun integer;
  v_counter integer;
BEGIN
  v_tahun := EXTRACT(YEAR FROM CURRENT_DATE);
  SELECT COALESCE(MAX(
    CAST(NULLIF(split_part(nomor_pendaftaran, '-', 3), '') AS integer)
  ), 0) + 1
  INTO v_counter
  FROM public.ppdb_pendaftar
  WHERE nomor_pendaftaran LIKE 'PPDB-' || v_tahun || '-%';
  
  RETURN 'PPDB-' || v_tahun || '-' || LPAD(v_counter::text, 4, '0');
END;
$$;
