
CREATE TABLE IF NOT EXISTS public.guru_piket (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ta_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  semester text NOT NULL DEFAULT 'ganjil',
  hari smallint NOT NULL CHECK (hari BETWEEN 1 AND 7),
  gtk_id uuid NOT NULL REFERENCES public.gtk_ptk(id) ON DELETE CASCADE,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ta_id, semester, hari, gtk_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guru_piket TO authenticated;
GRANT ALL ON public.guru_piket TO service_role;

ALTER TABLE public.guru_piket ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage guru_piket" ON public.guru_piket
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));

CREATE POLICY "All authenticated view guru_piket" ON public.guru_piket
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_guru_piket_updated_at BEFORE UPDATE ON public.guru_piket
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
