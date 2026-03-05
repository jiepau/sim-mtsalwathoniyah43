ALTER TABLE public.cp_templates DROP CONSTRAINT cp_templates_mapel_fase_key;
ALTER TABLE public.cp_templates ADD CONSTRAINT cp_templates_mapel_fase_kelas_key UNIQUE (mapel, fase, kelas);