-- Add tempat_lahir, tanggal_lahir, and jenis_kelamin to siswa table
ALTER TABLE public.siswa 
ADD COLUMN tempat_lahir text,
ADD COLUMN tanggal_lahir date,
ADD COLUMN jenis_kelamin text;

-- Add tempat_lahir, tanggal_lahir, and jenis_kelamin to gtk_ptk table
ALTER TABLE public.gtk_ptk 
ADD COLUMN tempat_lahir text,
ADD COLUMN tanggal_lahir date,
ADD COLUMN jenis_kelamin text;