-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'bendahara', 'operator');

-- 2. Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create tahun_ajaran table
CREATE TABLE public.tahun_ajaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_ta TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create kelas table
CREATE TABLE public.kelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas TEXT NOT NULL,
    tingkat INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create siswa table
CREATE TABLE public.siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    kelas_id UUID REFERENCES public.kelas(id) ON DELETE SET NULL,
    ta_id UUID REFERENCES public.tahun_ajaran(id) ON DELETE SET NULL,
    wa_ortu TEXT,
    alamat TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create gtk_ptk table (Guru & Tenaga Kependidikan)
CREATE TABLE public.gtk_ptk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip TEXT,
    nama TEXT NOT NULL,
    jabatan TEXT,
    no_hp TEXT,
    alamat TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Create jenis_tagihan table
CREATE TABLE public.jenis_tagihan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_tagihan TEXT NOT NULL,
    nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create pembayaran table
CREATE TABLE public.pembayaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID REFERENCES public.siswa(id) ON DELETE CASCADE NOT NULL,
    jenis_tagihan_id UUID REFERENCES public.jenis_tagihan(id) ON DELETE CASCADE NOT NULL,
    ta_id UUID REFERENCES public.tahun_ajaran(id) ON DELETE SET NULL,
    bulan INTEGER,
    tahun INTEGER,
    nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
    nominal_bayar DECIMAL(15,2) NOT NULL DEFAULT 0,
    tanggal_bayar TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'belum_lunas',
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Create pengeluaran table
CREATE TABLE public.pengeluaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    kategori TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtk_ptk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;

-- 12. Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 13. Create function to check if user has any role
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- 14. RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 16. RLS Policies for data tables (authenticated users with any role)
CREATE POLICY "Authenticated users can view tahun_ajaran" ON public.tahun_ajaran
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage tahun_ajaran" ON public.tahun_ajaran
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Authenticated users can view kelas" ON public.kelas
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage kelas" ON public.kelas
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Authenticated users can view siswa" ON public.siswa
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage siswa" ON public.siswa
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Authenticated users can view gtk_ptk" ON public.gtk_ptk
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin and operator can manage gtk_ptk" ON public.gtk_ptk
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Authenticated users can view jenis_tagihan" ON public.jenis_tagihan
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin and bendahara can manage jenis_tagihan" ON public.jenis_tagihan
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'bendahara'));

CREATE POLICY "Authenticated users can view pembayaran" ON public.pembayaran
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin and bendahara can manage pembayaran" ON public.pembayaran
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'bendahara'));

CREATE POLICY "Authenticated users can view pengeluaran" ON public.pengeluaran
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin and bendahara can manage pengeluaran" ON public.pengeluaran
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'bendahara'));

-- 17. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 18. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at BEFORE UPDATE ON public.siswa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gtk_ptk_updated_at BEFORE UPDATE ON public.gtk_ptk
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pembayaran_updated_at BEFORE UPDATE ON public.pembayaran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();