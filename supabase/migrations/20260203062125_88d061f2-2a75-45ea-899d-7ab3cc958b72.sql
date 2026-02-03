
-- Update function to use Roman numerals for month
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(p_jenis text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tahun INTEGER;
  v_counter INTEGER;
  v_bulan INTEGER;
  v_bulan_romawi TEXT;
  v_nomor TEXT;
BEGIN
  v_tahun := EXTRACT(YEAR FROM CURRENT_DATE);
  v_bulan := EXTRACT(MONTH FROM CURRENT_DATE);
  
  -- Convert month to Roman numerals
  v_bulan_romawi := CASE v_bulan
    WHEN 1 THEN 'I'
    WHEN 2 THEN 'II'
    WHEN 3 THEN 'III'
    WHEN 4 THEN 'IV'
    WHEN 5 THEN 'V'
    WHEN 6 THEN 'VI'
    WHEN 7 THEN 'VII'
    WHEN 8 THEN 'VIII'
    WHEN 9 THEN 'IX'
    WHEN 10 THEN 'X'
    WHEN 11 THEN 'XI'
    WHEN 12 THEN 'XII'
  END;
  
  -- Get or create counter
  INSERT INTO surat_counter (jenis, tahun, counter)
  VALUES (p_jenis, v_tahun, 1)
  ON CONFLICT (jenis, tahun) 
  DO UPDATE SET counter = surat_counter.counter + 1
  RETURNING counter INTO v_counter;
  
  -- Format: MTs/Wath43/02/no.surat/bulan(romawi)/tahun
  v_nomor := 'MTs/Wath43/02/' || LPAD(v_counter::TEXT, 3, '0') || '/' || v_bulan_romawi || '/' || v_tahun;
  
  RETURN v_nomor;
END;
$function$;

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('surat-lampiran', 'surat-lampiran', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for surat-lampiran bucket
CREATE POLICY "Admin and operator can upload surat lampiran"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'surat-lampiran' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role))
);

CREATE POLICY "Admin and operator can update surat lampiran"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'surat-lampiran' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role))
);

CREATE POLICY "Admin and operator can delete surat lampiran"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'surat-lampiran' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role))
);

CREATE POLICY "Public can view surat lampiran"
ON storage.objects FOR SELECT
USING (bucket_id = 'surat-lampiran');
