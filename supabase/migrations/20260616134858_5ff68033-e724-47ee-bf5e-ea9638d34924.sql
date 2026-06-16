
-- absensi_gtk: restrict SELECT to staff roles
DROP POLICY IF EXISTS "Authenticated users can view absensi_gtk" ON public.absensi_gtk;
CREATE POLICY "Staff can view absensi_gtk"
ON public.absensi_gtk
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operator'::app_role)
  OR has_role(auth.uid(), 'bendahara'::app_role)
  OR has_role(auth.uid(), 'guru'::app_role)
);

-- ujian_peserta: drop broad SELECT, allow staff + own siswa record
DROP POLICY IF EXISTS "Authenticated view ujian_peserta" ON public.ujian_peserta;
DROP POLICY IF EXISTS "Staff view ujian_peserta" ON public.ujian_peserta;

CREATE POLICY "Staff view ujian_peserta"
ON public.ujian_peserta
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operator'::app_role)
  OR has_role(auth.uid(), 'panitia'::app_role)
);

CREATE POLICY "Siswa view own ujian_peserta"
ON public.ujian_peserta
FOR SELECT
USING (
  siswa_id IN (SELECT id FROM public.siswa WHERE user_id = auth.uid())
);
