-- Add nilai_karakter column to ATP table for Kurikulum Berbasis Cinta integration
ALTER TABLE public.atp 
ADD COLUMN nilai_karakter text[] DEFAULT '{}'::text[];

-- Add comment for documentation
COMMENT ON COLUMN public.atp.nilai_karakter IS 'Nilai-nilai karakter dari Kurikulum Berbasis Cinta (kasih sayang, empati, ketulusan, dll)';