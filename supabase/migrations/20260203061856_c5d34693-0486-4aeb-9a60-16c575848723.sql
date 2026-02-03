
-- Update function to use new format: MTs/Wath43/02/no.surat/bulan/tahun
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(p_jenis text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Format: MTs/Wath43/02/no.surat/bulan/tahun
  v_nomor := 'MTs/Wath43/02/' || LPAD(v_counter::TEXT, 3, '0') || '/' || v_bulan || '/' || v_tahun;
  
  RETURN v_nomor;
END;
$function$;
