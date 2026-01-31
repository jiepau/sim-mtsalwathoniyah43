

# Perbaikan Bug Login "Muter-Muter"

## Diagnosa Masalah

Setelah investigasi mendalam, saya menemukan **race condition** pada alur autentikasi yang menyebabkan halaman login "muter-muter" (stuck di loading):

### Alur yang Bermasalah

```text
Login.tsx                          AuthContext.tsx
    |                                    |
    |-- signIn() ----------------------->|
    |                                    |-- setLoading(false)
    |<-- return (no error) --------------|
    |                                    |
    |-- navigate("/dashboard") --------->|
    |                                    |-- onAuthStateChange dipanggil
    |                                    |-- setLoading(true) IMPLISIT dari fetchRoles
    |                                    |
    |                              ProtectedRoute
    |                                    |
    |                                    |-- loading = true (dari rolesLoading)
    |                                    |-- tampilkan spinner
    |                                    |
    |<-- useEffect navigate() ---------- |-- loading = false
    |                                    |-- user ada
    |-- navigate("/dashboard") lagi ---->|
    |                                    |
    [LOOP TERCIPTA]
```

### Akar Masalah

1. **Double Navigation**: `handleSubmit` memanggil `navigate()` langsung, sementara `useEffect` di Login.tsx juga memanggil `navigate()` saat user berubah.

2. **Inconsistent Loading State**: Ada `loading` dan `rolesLoading` yang tidak disinkronisasi. ProtectedRoute hanya cek `loading` tapi tidak cek apakah roles sudah selesai diambil.

3. **Race Condition di AuthContext**: 
   - `signIn()` set `setLoading(false)` 
   - `onAuthStateChange` juga akan dipanggil dan set ulang state
   - Keduanya memanggil `fetchRoles()` yang bisa tumpang tindih

## Solusi

### 1. Perbaiki AuthContext.tsx

- Gunakan **satu sumber kebenaran** untuk loading state
- Gabungkan `loading` dengan pengecekan `rolesLoading` jika user ada
- Cegah `onAuthStateChange` trigger ulang jika `signIn()` sudah handle

```typescript
// Perubahan utama:
// - Tambah flag untuk mencegah double trigger
// - Loading = true sampai user DAN roles siap
// - signIn() tidak perlu manual set state karena onAuthStateChange akan handle
```

### 2. Perbaiki Login.tsx

- Hapus navigasi langsung di `handleSubmit` 
- Biarkan `useEffect` yang handle navigasi (single source of navigation)
- Ini mencegah double navigation

```typescript
// handleSubmit hanya fokus pada login, tidak navigate
// useEffect akan navigate ketika user sudah ada dan authLoading false
```

### 3. Perbaiki ProtectedRoute.tsx

- Tambah pengecekan roles selain loading
- Pastikan tidak redirect ke login saat roles masih loading

## Langkah Implementasi

### Langkah 1: Update AuthContext.tsx
- Gabungkan loading state dengan rolesLoading
- Expose combined loading ke consumer
- Cegah race condition dengan proper state management

### Langkah 2: Update Login.tsx  
- Hapus `navigate()` dari handleSubmit
- Biarkan useEffect handle semua navigasi

### Langkah 3: Update ProtectedRoute.tsx
- Tidak perlu perubahan besar jika AuthContext sudah benar

## Kenapa Ini Terjadi Sekarang?

Ini **bukan** langsung disebabkan oleh penambahan fitur User Management. Masalah ini sudah ada tapi menjadi lebih terlihat karena:
- Password reset menyebabkan session lama invalid
- Re-login memicu race condition yang sebelumnya "kebetulan" tidak terjadi
- Timing yang sedikit berbeda dalam network response

## Detail Teknis

Perubahan akan dilakukan di file-file berikut:

| File | Perubahan |
|------|-----------|
| `src/contexts/AuthContext.tsx` | Perbaiki loading state management, cegah double trigger |
| `src/pages/auth/Login.tsx` | Hapus navigate di handleSubmit, serahkan ke useEffect |

