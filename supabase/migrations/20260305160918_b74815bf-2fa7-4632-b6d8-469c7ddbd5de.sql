
ALTER TABLE public.cp_templates ADD COLUMN semester text NULL DEFAULT 'ganjil';

ALTER TABLE public.cp_templates DROP CONSTRAINT cp_templates_mapel_fase_kelas_key;
ALTER TABLE public.cp_templates ADD CONSTRAINT cp_templates_mapel_fase_kelas_semester_key UNIQUE (mapel, fase, kelas, semester);
