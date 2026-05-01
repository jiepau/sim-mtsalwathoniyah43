
-- Panitia can view siswa
CREATE POLICY "Panitia can view siswa"
  ON public.siswa
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'panitia'::app_role));

-- Panitia can view gtk_ptk
CREATE POLICY "Panitia can view gtk_ptk"
  ON public.gtk_ptk
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'panitia'::app_role));

-- Panitia can view pembayaran
CREATE POLICY "Panitia can view pembayaran"
  ON public.pembayaran
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'panitia'::app_role));

-- Panitia can view pengeluaran
CREATE POLICY "Panitia can view pengeluaran"
  ON public.pengeluaran
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'panitia'::app_role));
