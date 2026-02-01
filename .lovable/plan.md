

## Rencana Perbaikan: Menu Reload Issue & Logo Madrasah

### Ringkasan Masalah

Ada dua masalah yang perlu diperbaiki:

1. **Menu Hilang & Reload Terus-menerus**
   - Penyebab: RLS policy pada tabel `user_roles` menggunakan fungsi `has_role()` yang membuat **infinite recursion** (loop tak berujung)
   - Ketika sistem mencoba mengambil role pengguna, ia perlu memanggil `has_role()`, tapi `has_role()` sendiri perlu query ke `user_roles` 
   - Akibatnya: query timeout, roles kosong, hanya menu Dashboard & Siswa yang tampil

2. **Logo Perlu Diganti**
   - Logo saat ini menggunakan ikon masjid generik
   - Perlu diganti dengan logo resmi Al Wathoniyah 43 yang diunggah

---

### Rencana Perbaikan

#### Bagian 1: Perbaiki RLS Policy (Prioritas Tinggi)

Akan memperbaiki policy pada tabel `user_roles` agar tidak terjadi recursion:

**Perubahan Database:**
- Hapus policy lama yang menggunakan `has_role()` 
- Buat policy baru yang langsung check ke tabel `user_roles` tanpa memanggil function

```text
Sebelum (BERMASALAH):
"Admins can manage all roles" -> has_role(auth.uid(), 'admin'::app_role)
                                        |
                                        v
                                Query user_roles (BLOCKED - butuh RLS check)
                                        |
                                        v
                                Panggil has_role() lagi (LOOP INFINIT)

Sesudah (BENAR):
"Admins can manage all roles" -> Langsung subquery ke user_roles
                                        |
                                        v
                                EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
```

---

#### Bagian 2: Ganti Logo Madrasah

**Perubahan File:**
1. Copy file logo yang diunggah ke `public/logo-alwathoniyah.png`
2. Update `public/favicon.svg` dengan logo baru (convert ke SVG atau gunakan PNG langsung)
3. Update `src/components/layout/Sidebar.tsx` - ganti src gambar logo
4. Update `src/pages/auth/Login.tsx` - ganti ikon Building2 dengan logo

---

### Detail Teknis

**1. Database Migration - Fix RLS Recursion:**
```sql
-- Hapus policy bermasalah
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Buat ulang dengan subquery langsung (tanpa function call)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'::app_role
  )
);
```

**2. File Changes - Logo:**
- `public/logo-alwathoniyah.png` - File logo baru
- `public/favicon.svg` atau `public/favicon.png` - Update favicon
- `src/components/layout/Sidebar.tsx` - Line 164-167, ganti path gambar
- `src/pages/auth/Login.tsx` - Line 79-81, ganti ikon dengan gambar logo

---

### Hasil yang Diharapkan

Setelah perbaikan:
- Semua menu akan tampil sesuai role pengguna tanpa delay/timeout
- Tidak ada reload otomatis saat berpindah halaman
- Logo Al Wathoniyah 43 yang resmi tampil di sidebar dan halaman login
- Favicon browser menampilkan logo yang benar

