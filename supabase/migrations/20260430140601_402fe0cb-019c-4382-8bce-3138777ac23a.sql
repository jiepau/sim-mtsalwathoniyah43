
-- 1) Normalize jenis_kelamin to L/P consistently
UPDATE public.siswa SET jenis_kelamin = 'L' WHERE LOWER(jenis_kelamin) IN ('laki-laki','laki laki','lakilaki','l');
UPDATE public.siswa SET jenis_kelamin = 'P' WHERE LOWER(jenis_kelamin) IN ('perempuan','p');

-- 2) Same normalization for gtk_ptk for consistency
UPDATE public.gtk_ptk SET jenis_kelamin = 'L' WHERE LOWER(jenis_kelamin) IN ('laki-laki','laki laki','lakilaki','l');
UPDATE public.gtk_ptk SET jenis_kelamin = 'P' WHERE LOWER(jenis_kelamin) IN ('perempuan','p');

-- 3) Create archive table for printed Buku Induk records
CREATE TABLE IF NOT EXISTS public.buku_induk_arsip (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('rekap','detail')),
  filter_kelas text,
  filter_ta text,
  jumlah_siswa integer NOT NULL DEFAULT 0,
  daftar_siswa jsonb NOT NULL DEFAULT '[]'::jsonb,
  catatan text,
  dicetak_oleh uuid,
  dicetak_oleh_nama text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buku_induk_arsip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and bendahara can view buku_induk_arsip"
  ON public.buku_induk_arsip FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'bendahara'::app_role));

CREATE POLICY "Admin and bendahara can insert buku_induk_arsip"
  ON public.buku_induk_arsip FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'bendahara'::app_role));

CREATE POLICY "Admin can delete buku_induk_arsip"
  ON public.buku_induk_arsip FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_buku_induk_arsip_created_at ON public.buku_induk_arsip(created_at DESC);
