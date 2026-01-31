
# Perbaikan Definitif Bug Login "Muter-Muter"

## Diagnosa Final

Setelah investigasi mendalam dengan browser debugging, saya menemukan:

1. **Query ke `user_roles` TIDAK PERNAH terkirim ke server** - Tidak ada network request dan tidak ada postgres log
2. **`fetchRoles()` stuck tanpa timeout** - Promise tidak pernah resolve atau reject
3. **Loading state tetap `true` selamanya** - Karena rolesLoading tidak pernah selesai

### Alur Masalah

```text
[Browser Load]
     |
     v
initializeAuth() --> getSession() OK
     |
     v
fetchRoles() --> supabase.from('user_roles').select() 
     |
     [STUCK - TIDAK TERKIRIM KE SERVER]
     |
     v
authLoading tetap true --> ProtectedRoute spinner --> MUTER-MUTER
```

## Solusi

### Pendekatan: Defensive Coding dengan Timeout

Tambahkan timeout pada `fetchRoles()` agar jika query stuck, aplikasi tetap bisa berjalan dengan roles kosong (graceful degradation).

### Perubahan File

#### 1. `src/contexts/AuthContext.tsx`

```typescript
// Tambah helper function dengan timeout
const fetchWithTimeout = async (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Modifikasi fetchRoles untuk menggunakan timeout
const fetchRoles = async (userId) => {
  setRolesLoading(true);
  try {
    const userRoles = await fetchWithTimeout(
      getUserRoles(userId),
      5000 // 5 detik timeout
    );
    setRoles(userRoles);
  } catch (error) {
    console.error('Error/timeout fetching roles:', error);
    setRoles([]); // Graceful degradation
  } finally {
    setRolesLoading(false);
  }
};
```

#### 2. `src/lib/supabase-helpers.ts`

```typescript
// Tambah logging untuk debug
export async function getUserRoles(userId) {
  console.log('getUserRoles: Starting query for', userId);
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  console.log('getUserRoles: Query completed', { data, error });
  
  if (error) throw error;
  return data?.map(r => r.role) || [];
}
```

### Mengapa Ini Lebih Baik?

1. **Tidak ada infinite loading** - Timeout memastikan loading selalu selesai
2. **Graceful degradation** - Jika roles gagal diambil, user tetap bisa masuk (dengan akses terbatas)
3. **Tidak perlu rebuild besar** - Perubahan minimal dan targeted
4. **Debugging lebih mudah** - Console log membantu identifikasi masalah di masa depan

## Investigasi Lanjutan

Setelah fix ini berjalan, perlu investigasi kenapa Supabase client tidak mengirim query:
- Kemungkinan bug di Supabase JS client dengan timing tertentu
- Kemungkinan issue dengan token refresh internal
- Kemungkinan race condition di Supabase client

## Langkah Implementasi

| Langkah | File | Aksi |
|---------|------|------|
| 1 | `src/contexts/AuthContext.tsx` | Tambah timeout wrapper di fetchRoles |
| 2 | `src/lib/supabase-helpers.ts` | Tambah console.log untuk debug |
| 3 | Test | Coba login dan verifikasi tidak muter-muter |
