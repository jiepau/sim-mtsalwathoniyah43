
-- Table for national holidays
CREATE TABLE public.hari_libur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  nama_libur TEXT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on date
ALTER TABLE public.hari_libur ADD CONSTRAINT hari_libur_tanggal_unique UNIQUE (tanggal);

-- Enable RLS
ALTER TABLE public.hari_libur ENABLE ROW LEVEL SECURITY;

-- Admin and operator can manage
CREATE POLICY "Admin and operator can manage hari_libur"
  ON public.hari_libur FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- All authenticated users can view
CREATE POLICY "Authenticated users can view hari_libur"
  ON public.hari_libur FOR SELECT
  USING (has_any_role(auth.uid()));
