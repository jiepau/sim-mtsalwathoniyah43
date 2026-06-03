
-- 1) absensi_siswa: restrict SELECT
DROP POLICY IF EXISTS "Authenticated users can view absensi_siswa" ON public.absensi_siswa;
CREATE POLICY "Staff can view absensi_siswa" ON public.absensi_siswa
  FOR SELECT USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator') OR has_role(auth.uid(),'guru') OR has_role(auth.uid(),'bendahara')
  );
CREATE POLICY "Siswa view own absensi" ON public.absensi_siswa
  FOR SELECT USING (
    has_role(auth.uid(),'siswa') AND siswa_id IN (SELECT id FROM public.siswa WHERE user_id = auth.uid())
  );

-- 2) gaji_settings: restrict SELECT to admin/bendahara
DROP POLICY IF EXISTS "Authenticated view gaji_settings" ON public.gaji_settings;
CREATE POLICY "Admin bendahara view gaji_settings" ON public.gaji_settings
  FOR SELECT USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'bendahara'));

-- 3) pdum_nilai_rapor
DROP POLICY IF EXISTS "Authenticated view pdum_rapor" ON public.pdum_nilai_rapor;
CREATE POLICY "Staff view pdum_rapor" ON public.pdum_nilai_rapor
  FOR SELECT USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Siswa view own pdum_rapor" ON public.pdum_nilai_rapor
  FOR SELECT USING (
    has_role(auth.uid(),'siswa') AND siswa_id IN (SELECT id FROM public.siswa WHERE user_id = auth.uid())
  );

-- 4) pdum_nilai_um
DROP POLICY IF EXISTS "Authenticated view pdum_um" ON public.pdum_nilai_um;
CREATE POLICY "Staff view pdum_um" ON public.pdum_nilai_um
  FOR SELECT USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Siswa view own pdum_um" ON public.pdum_nilai_um
  FOR SELECT USING (
    has_role(auth.uid(),'siswa') AND siswa_id IN (SELECT id FROM public.siswa WHERE user_id = auth.uid())
  );

-- 5) pdum_peserta
DROP POLICY IF EXISTS "Authenticated view pdum_peserta" ON public.pdum_peserta;
CREATE POLICY "Staff view pdum_peserta" ON public.pdum_peserta
  FOR SELECT USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));

-- 6) ujian_peserta
DROP POLICY IF EXISTS "Authenticated users can view ujian_peserta" ON public.ujian_peserta;
CREATE POLICY "Staff view ujian_peserta" ON public.ujian_peserta
  FOR SELECT USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
