
-- 1. Forum author_role validation trigger
CREATE OR REPLACE FUNCTION public.validate_forum_author_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.author_id <> auth.uid() THEN
    RAISE EXCEPTION 'author_id must match authenticated user';
  END IF;
  IF NEW.author_role NOT IN ('admin','bendahara','operator','guru','siswa','panitia') THEN
    RAISE EXCEPTION 'invalid author_role';
  END IF;
  -- Verify the claimed role belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = NEW.author_role
  ) THEN
    RAISE EXCEPTION 'author_role does not match any role assigned to user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_forum_topic_role ON public.elearning_forum_topics;
CREATE TRIGGER trg_validate_forum_topic_role
  BEFORE INSERT OR UPDATE ON public.elearning_forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.validate_forum_author_role();

DROP TRIGGER IF EXISTS trg_validate_forum_reply_role ON public.elearning_forum_replies;
CREATE TRIGGER trg_validate_forum_reply_role
  BEFORE INSERT OR UPDATE ON public.elearning_forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.validate_forum_author_role();

-- 2. madrasah_settings: restrict sensitive fields via view + tighter RLS
-- Drop broad SELECT; only admin/operator can read full row. Others use a public-safe view.
DROP POLICY IF EXISTS "Authenticated users can view madrasah_settings" ON public.madrasah_settings;

CREATE POLICY "Admin and operator can view madrasah_settings full"
ON public.madrasah_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Public-safe view exposes only non-sensitive identity fields
CREATE OR REPLACE VIEW public.madrasah_settings_public AS
SELECT
  id,
  nama_madrasah,
  npsn,
  nsm,
  alamat,
  kabupaten_kota,
  provinsi,
  kode_pos,
  website,
  akreditasi,
  kepala_madrasah,
  no_sk_pendirian,
  tanggal_sk_pendirian
FROM public.madrasah_settings;

GRANT SELECT ON public.madrasah_settings_public TO authenticated, anon;

-- Allow authenticated users with any role to still see non-sensitive subset by adding a policy
-- restricted via column-less view. We also add a secondary SELECT policy on the base table
-- limited to non-sensitive use cases is not feasible at row level, so we rely on the view above
-- and inform code to use it for non-admin contexts.

-- 3. elearning_submissions: explicit per-row siswa policy (replace permissive ALL)
DROP POLICY IF EXISTS "Siswa can manage own submissions" ON public.elearning_submissions;

CREATE POLICY "Siswa can view own submissions"
ON public.elearning_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Siswa can insert own submissions"
ON public.elearning_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'siswa'::app_role));

CREATE POLICY "Siswa can update own submissions"
ON public.elearning_submissions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Siswa can delete own submissions"
ON public.elearning_submissions FOR DELETE
USING (auth.uid() = user_id);

-- 4. notifikasi_wa_settings: add WITH CHECK to admin ALL policy
DROP POLICY IF EXISTS "Admin can manage notifikasi_wa_settings" ON public.notifikasi_wa_settings;
CREATE POLICY "Admin can manage notifikasi_wa_settings"
ON public.notifikasi_wa_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
