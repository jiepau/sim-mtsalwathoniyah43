-- Tabel arsip Tutup Buku Keuangan (immutable snapshot)
CREATE TABLE public.laporan_tahunan (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judul text NOT NULL,
  periode_jenis text NOT NULL CHECK (periode_jenis IN ('tahun_ajaran','tahun_kalender')),
  periode_label text NOT NULL,
  tanggal_mulai date NOT NULL,
  tanggal_akhir date NOT NULL,
  ta_id uuid,
  total_pemasukan numeric NOT NULL DEFAULT 0,
  total_pengeluaran numeric NOT NULL DEFAULT 0,
  saldo numeric NOT NULL DEFAULT 0,
  breakdown_pemasukan jsonb NOT NULL DEFAULT '[]'::jsonb,
  breakdown_pengeluaran jsonb NOT NULL DEFAULT '[]'::jsonb,
  daftar_tunggakan jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_tunggakan numeric NOT NULL DEFAULT 0,
  jumlah_siswa_nunggak integer NOT NULL DEFAULT 0,
  catatan text,
  tutup_oleh uuid,
  tutup_oleh_nama text,
  nama_bendahara text,
  nama_kepala text,
  nip_kepala text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.laporan_tahunan ENABLE ROW LEVEL SECURITY;

-- Admin & Bendahara bisa view
CREATE POLICY "Admin and bendahara can view laporan_tahunan"
ON public.laporan_tahunan FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'bendahara'::app_role));

-- Admin & Bendahara bisa insert (tutup buku)
CREATE POLICY "Admin and bendahara can insert laporan_tahunan"
ON public.laporan_tahunan FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'bendahara'::app_role));

-- Hanya admin yang bisa delete
CREATE POLICY "Admin can delete laporan_tahunan"
ON public.laporan_tahunan FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tidak ada UPDATE policy = data immutable

CREATE INDEX idx_laporan_tahunan_periode ON public.laporan_tahunan(periode_jenis, tanggal_mulai DESC);
CREATE INDEX idx_laporan_tahunan_ta ON public.laporan_tahunan(ta_id);