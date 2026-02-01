-- Perbaikan RLS untuk tabel pengeluaran
-- Batasi SELECT hanya untuk admin dan bendahara (bukan semua authenticated user)

-- 1. Drop policy yang terlalu permissive
DROP POLICY IF EXISTS "Authenticated users can view pengeluaran" ON public.pengeluaran;

-- 2. Create policy yang lebih ketat untuk SELECT
CREATE POLICY "Admin and bendahara can view pengeluaran" 
  ON public.pengeluaran 
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'bendahara')
  );