
-- 1. E-Learning Materi
CREATE TABLE public.elearning_materi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guru_id UUID REFERENCES public.gtk_ptk(id) ON DELETE SET NULL,
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE CASCADE,
  mapel TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  jenis TEXT NOT NULL DEFAULT 'teks',
  konten TEXT,
  file_path TEXT,
  urutan INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elearning_materi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru can manage own materi" ON public.elearning_materi
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'operator'::app_role) OR
    (has_role(auth.uid(), 'guru'::app_role) AND guru_id IN (SELECT id FROM gtk_ptk WHERE user_id = auth.uid()))
  );
CREATE POLICY "Siswa can view published materi" ON public.elearning_materi
  FOR SELECT USING (has_role(auth.uid(), 'siswa'::app_role) AND is_published = true);

-- 2. E-Learning Tugas
CREATE TABLE public.elearning_tugas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guru_id UUID REFERENCES public.gtk_ptk(id) ON DELETE SET NULL,
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE CASCADE,
  mapel TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  file_path TEXT,
  deadline TIMESTAMPTZ,
  nilai_max INTEGER DEFAULT 100,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elearning_tugas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru can manage own tugas" ON public.elearning_tugas
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'operator'::app_role) OR
    (has_role(auth.uid(), 'guru'::app_role) AND guru_id IN (SELECT id FROM gtk_ptk WHERE user_id = auth.uid()))
  );
CREATE POLICY "Siswa can view published tugas" ON public.elearning_tugas
  FOR SELECT USING (has_role(auth.uid(), 'siswa'::app_role) AND is_published = true);

-- 3. Submissions
CREATE TABLE public.elearning_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tugas_id UUID NOT NULL REFERENCES public.elearning_tugas(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  jawaban TEXT,
  file_path TEXT,
  nilai INTEGER,
  catatan_guru TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elearning_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa can manage own submissions" ON public.elearning_submissions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Guru can view and grade submissions" ON public.elearning_submissions
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'operator'::app_role) OR
    (has_role(auth.uid(), 'guru'::app_role) AND tugas_id IN (
      SELECT id FROM elearning_tugas WHERE guru_id IN (SELECT id FROM gtk_ptk WHERE user_id = auth.uid())
    ))
  );

-- 4. Forum Topics
CREATE TABLE public.elearning_forum_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE CASCADE,
  mapel TEXT,
  judul TEXT NOT NULL,
  konten TEXT NOT NULL,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elearning_forum_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with roles can view forum topics" ON public.elearning_forum_topics
  FOR SELECT USING (has_any_role(auth.uid()));
CREATE POLICY "Users can create forum topics" ON public.elearning_forum_topics
  FOR INSERT WITH CHECK (auth.uid() = author_id AND has_any_role(auth.uid()));
CREATE POLICY "Users can update own topics" ON public.elearning_forum_topics
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admin and guru can delete topics" ON public.elearning_forum_topics
  FOR DELETE USING (
    auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role)
  );

-- 5. Forum Replies
CREATE TABLE public.elearning_forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.elearning_forum_topics(id) ON DELETE CASCADE,
  konten TEXT NOT NULL,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elearning_forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with roles can view forum replies" ON public.elearning_forum_replies
  FOR SELECT USING (has_any_role(auth.uid()));
CREATE POLICY "Users can create forum replies" ON public.elearning_forum_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id AND has_any_role(auth.uid()));
CREATE POLICY "Users can update own replies" ON public.elearning_forum_replies
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admin and guru can delete replies" ON public.elearning_forum_replies
  FOR DELETE USING (
    auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role)
  );

-- 6. Add user_id to siswa for auth linking
ALTER TABLE public.siswa ADD COLUMN IF NOT EXISTS user_id UUID;

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('elearning', 'elearning', false);

CREATE POLICY "Users can upload elearning files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'elearning' AND has_any_role(auth.uid()));
CREATE POLICY "Authenticated can view elearning files" ON storage.objects
  FOR SELECT USING (bucket_id = 'elearning' AND has_any_role(auth.uid()));
CREATE POLICY "Guru can delete elearning files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'elearning' AND (
      has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'guru'::app_role)
    )
  );

-- 8. Triggers
CREATE TRIGGER update_elearning_materi_updated_at BEFORE UPDATE ON public.elearning_materi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_elearning_tugas_updated_at BEFORE UPDATE ON public.elearning_tugas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_elearning_submissions_updated_at BEFORE UPDATE ON public.elearning_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_elearning_forum_topics_updated_at BEFORE UPDATE ON public.elearning_forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_elearning_forum_replies_updated_at BEFORE UPDATE ON public.elearning_forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Realtime for forum
ALTER PUBLICATION supabase_realtime ADD TABLE public.elearning_forum_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.elearning_forum_replies;
