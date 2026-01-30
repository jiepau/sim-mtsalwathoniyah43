-- Add semester column to tahun_ajaran
ALTER TABLE public.tahun_ajaran 
ADD COLUMN semester text DEFAULT 'ganjil' CHECK (semester IN ('ganjil', 'genap'));

-- Update existing data to have semester
UPDATE public.tahun_ajaran 
SET semester = 'ganjil' 
WHERE semester IS NULL;