-- Add kelas and semester columns to ATP table
ALTER TABLE public.atp 
ADD COLUMN kelas INTEGER CHECK (kelas IN (7, 8, 9)),
ADD COLUMN semester TEXT CHECK (semester IN ('ganjil', 'genap'));

-- Add index for better query performance
CREATE INDEX idx_atp_kelas_semester ON public.atp(kelas, semester);