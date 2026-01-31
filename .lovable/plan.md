

# Reset Password Admin Account

## Situasi
Akun admin `achmadruz@gmail.com` tidak bisa login karena credential invalid. Karena ini adalah satu-satunya admin, kita perlu cara untuk reset password tanpa perlu login terlebih dahulu.

## Solusi
Membuat edge function baru `admin-password-reset` yang dapat mereset password menggunakan secret key khusus (bukan auth token).

## Langkah Implementasi

### 1. Buat Edge Function Baru
**File:** `supabase/functions/admin-password-reset/index.ts`

Function ini akan:
- Menerima email, password baru, dan secret key
- Memvalidasi secret key yang cocok dengan environment variable
- Menggunakan Supabase Admin API untuk update password user
- Menghapus function setelah digunakan (one-time use)

### 2. Set Secret Key
Menambahkan secret `ADMIN_RESET_SECRET` sebagai kunci untuk mengakses function ini.

### 3. Eksekusi Reset
Memanggil function untuk reset password.

### 4. Cleanup
Setelah berhasil login, hapus edge function ini untuk keamanan.

---

## Detail Teknis

### Edge Function Code
```typescript
// Memvalidasi secret key dari request
// Menggunakan supabaseAdmin.auth.admin.updateUserById()
// untuk update password berdasarkan email
```

### Keamanan
- Function dilindungi dengan secret key
- Akan dihapus setelah password berhasil direset
- Hanya bisa digunakan untuk akun yang sudah ada

### Password Baru
Setelah diimplementasikan, password baru akan di-set dan Anda bisa langsung login.

