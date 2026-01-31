-- Add wali_kelas_id column to kelas table (FK to gtk_ptk)
ALTER TABLE public.kelas 
ADD COLUMN wali_kelas_id uuid REFERENCES public.gtk_ptk(id) ON DELETE SET NULL;

-- Add mapel (mata pelajaran) column to gtk_ptk table
ALTER TABLE public.gtk_ptk 
ADD COLUMN mapel text;

-- Add index for better performance
CREATE INDEX idx_kelas_wali_kelas ON public.kelas(wali_kelas_id);