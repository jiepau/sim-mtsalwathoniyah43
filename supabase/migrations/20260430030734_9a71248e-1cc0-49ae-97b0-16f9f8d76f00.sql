ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sidebar_theme TEXT DEFAULT 'hijau',
  ADD COLUMN IF NOT EXISTS sidebar_intensity TEXT DEFAULT 'kuat';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_sidebar_theme_check CHECK (sidebar_theme IN ('hijau', 'tosca')),
  ADD CONSTRAINT profiles_sidebar_intensity_check CHECK (sidebar_intensity IN ('kuat', 'sedang', 'netral', 'kontras'));