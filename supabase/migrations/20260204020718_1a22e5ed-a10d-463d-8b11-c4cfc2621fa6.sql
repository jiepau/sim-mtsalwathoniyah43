-- Part 2: Update RLS policies for guru role

-- Create RLS policy for guru to view and edit their own GTK data
CREATE POLICY "Guru can view own gtk_ptk data"
ON public.gtk_ptk
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  (has_role(auth.uid(), 'guru'::app_role) AND user_id = auth.uid())
);

CREATE POLICY "Guru can update own gtk_ptk data"
ON public.gtk_ptk
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  (has_role(auth.uid(), 'guru'::app_role) AND user_id = auth.uid())
);

-- Drop old restrictive policies and replace with new ones
DROP POLICY IF EXISTS "Admin and operator can view gtk_ptk" ON public.gtk_ptk;
DROP POLICY IF EXISTS "Admin and operator can manage gtk_ptk" ON public.gtk_ptk;

-- Recreate admin/operator management policy (for INSERT and DELETE)
CREATE POLICY "Admin and operator can insert gtk_ptk"
ON public.gtk_ptk
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);

CREATE POLICY "Admin and operator can delete gtk_ptk"
ON public.gtk_ptk
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);

-- Allow guru to view financial summary (read-only)
DROP POLICY IF EXISTS "Admin and bendahara can view pembayaran" ON public.pembayaran;
CREATE POLICY "Admin, bendahara, and guru can view pembayaran"
ON public.pembayaran
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'bendahara'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

DROP POLICY IF EXISTS "Admin and bendahara can view pengeluaran" ON public.pengeluaran;
CREATE POLICY "Admin, bendahara, and guru can view pengeluaran"
ON public.pengeluaran
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'bendahara'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

-- Allow guru to view siswa (for kurikulum context)
DROP POLICY IF EXISTS "Users with roles can view siswa" ON public.siswa;
CREATE POLICY "Users with roles can view siswa"
ON public.siswa
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR 
  has_role(auth.uid(), 'bendahara'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

-- Update kurikulum policies to allow guru full access
DROP POLICY IF EXISTS "Admin and operator can manage atp" ON public.atp;
CREATE POLICY "Admin, operator, and guru can manage atp"
ON public.atp
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

DROP POLICY IF EXISTS "Admin and operator can manage kktp" ON public.kktp;
CREATE POLICY "Admin, operator, and guru can manage kktp"
ON public.kktp
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

DROP POLICY IF EXISTS "Admin and operator can manage prota" ON public.prota;
CREATE POLICY "Admin, operator, and guru can manage prota"
ON public.prota
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

DROP POLICY IF EXISTS "Admin and operator can manage prota_detail" ON public.prota_detail;
CREATE POLICY "Admin, operator, and guru can manage prota_detail"
ON public.prota_detail
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

DROP POLICY IF EXISTS "Admin and operator can manage promes" ON public.promes;
CREATE POLICY "Admin, operator, and guru can manage promes"
ON public.promes
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

DROP POLICY IF EXISTS "Admin and operator can manage promes_detail" ON public.promes_detail;
CREATE POLICY "Admin, operator, and guru can manage promes_detail"
ON public.promes_detail
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);

DROP POLICY IF EXISTS "Admin and operator can manage cp_templates" ON public.cp_templates;
CREATE POLICY "Admin, operator, and guru can manage cp_templates"
ON public.cp_templates
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'guru'::app_role)
);