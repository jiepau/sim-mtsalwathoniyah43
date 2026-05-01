
-- 1. Add role check inside generate_nomor_surat
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(p_jenis text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tahun INTEGER;
  v_counter INTEGER;
  v_bulan INTEGER;
  v_bulan_romawi TEXT;
  v_nomor TEXT;
BEGIN
  -- Verify caller has admin or operator role
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator')) THEN
    RAISE EXCEPTION 'Only admin and operator can generate document numbers';
  END IF;

  v_tahun := EXTRACT(YEAR FROM CURRENT_DATE);
  v_bulan := EXTRACT(MONTH FROM CURRENT_DATE);
  
  v_bulan_romawi := CASE v_bulan
    WHEN 1 THEN 'I' WHEN 2 THEN 'II' WHEN 3 THEN 'III'
    WHEN 4 THEN 'IV' WHEN 5 THEN 'V' WHEN 6 THEN 'VI'
    WHEN 7 THEN 'VII' WHEN 8 THEN 'VIII' WHEN 9 THEN 'IX'
    WHEN 10 THEN 'X' WHEN 11 THEN 'XI' WHEN 12 THEN 'XII'
  END;
  
  INSERT INTO surat_counter (jenis, tahun, counter)
  VALUES (p_jenis, v_tahun, 1)
  ON CONFLICT (jenis, tahun) 
  DO UPDATE SET counter = surat_counter.counter + 1
  RETURNING counter INTO v_counter;
  
  v_nomor := 'MTs/Wath43/02/' || LPAD(v_counter::TEXT, 3, '0') || '/' || v_bulan_romawi || '/' || v_tahun;
  
  RETURN v_nomor;
END;
$$;

-- 2. Fix generate_nomor_ppdb search_path
CREATE OR REPLACE FUNCTION public.generate_nomor_ppdb()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_tahun integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(split_part(nomor_pendaftaran, '-', 3) AS integer)), 0) + 1
  INTO v_counter FROM public.ppdb_pendaftar
  WHERE nomor_pendaftaran LIKE 'SPMB-' || v_tahun || '-%';
  RETURN 'SPMB-' || v_tahun || '-' || LPAD(v_counter::text, 4, '0');
END;
$$;

-- 3. Revoke anon EXECUTE on security-sensitive functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_nomor_surat(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_nomor_ppdb() FROM anon;
