
ALTER VIEW public.madrasah_settings_public SET (security_invoker = true);

-- Allow authenticated roles to read base table via the view; the view itself bypasses
-- column-level sensitivity by exposing only safe columns. Grant SELECT on those columns:
GRANT SELECT (id, nama_madrasah, npsn, nsm, alamat, kabupaten_kota, provinsi, kode_pos, website, akreditasi, kepala_madrasah, no_sk_pendirian, tanggal_sk_pendirian)
ON public.madrasah_settings TO authenticated, anon;

-- Add a permissive SELECT policy limited via the view's column grants
CREATE POLICY "Authenticated can read public madrasah info"
ON public.madrasah_settings FOR SELECT
USING (has_any_role(auth.uid()));
