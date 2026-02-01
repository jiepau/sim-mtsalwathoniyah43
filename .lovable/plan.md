
# Plan Finalisasi Aplikasi - Audit Menyeluruh & Perbaikan

## Ringkasan Hasil Audit

### A. Integrasi Data (Status: BAIK)

| Modul | Status | Koneksi Data |
|-------|--------|--------------|
| Dashboard | OK | Mengambil dari siswa, kelas, gtk_ptk, pembayaran, pengeluaran |
| Siswa | OK | Terhubung ke kelas, tahun_ajaran |
| Pembayaran | OK | Terhubung ke siswa, jenis_tagihan |
| Tunggakan | OK | Mengambil dari pembayaran dengan filter status cicil/belum_lunas |
| Pemasukan | OK | Mengambil dari pembayaran dengan filter nominal_bayar > 0 |
| Pengeluaran | OK | Tabel terpisah untuk pencatatan pengeluaran |

### B. Alur Pembayaran (Status: SUDAH AMAN)

```text
Jenis Tagihan (PPDB, SPP, dll)
         |
         v
Proses Pembayaran --> siswa + jenis_tagihan + nominal
         |
         +-- Lunas (nominal_bayar >= nominal)
         +-- Cicil (0 < nominal_bayar < nominal)
         +-- Belum Lunas (nominal_bayar = 0)
         |
         v
Tunggakan --> Filter: cicil OR belum_lunas
              Grouped per siswa (mendukung tunggakan lintas tahun)
              WhatsApp notification ready
```

### C. Temuan Security Scan

| Level | Issue | Rekomendasi |
|-------|-------|-------------|
| ERROR | Data siswa (wa_ortu, alamat) bisa dilihat semua user | Perlu RLS policy update |
| ERROR | Data alumni (wa_ortu, alamat) bisa dilihat semua user | Perlu RLS policy update |
| ERROR | Data GTK/PTK (NIK) sensitif | Sudah dibatasi ke admin/operator - OK |
| WARN | Pengeluaran bisa dilihat semua user | Perlu batasi ke admin/bendahara |
| WARN | Profiles visible to all | Acceptable untuk nama display |
| INFO | User bisa lihat rolenya sendiri | Acceptable - diperlukan untuk UI |

### D. Perubahan yang Akan Dilakukan

#### 1. Perbaikan RLS Policy (Security)
Update RLS policies untuk tabel berikut agar data sensitif terlindungi:
- **siswa**: Batasi akses data sensitif (wa_ortu, alamat) hanya untuk admin/operator
- **alumni**: Batasi akses data sensitif hanya untuk admin/operator
- **pengeluaran**: Batasi SELECT hanya untuk admin/bendahara (bukan semua authenticated user)

#### 2. Update Footer
Ubah footer sesuai permintaan:
- Tahun diganti ke tahun pembuatan aplikasi (2026) bukan tahun ajaran aktif
- Tambahkan versi aplikasi (v1.0.0)

### E. Detail Teknis

#### File yang akan diubah:

**1. `src/components/layout/Footer.tsx`**
```typescript
// SEBELUM: Mengambil tahun dari tahun_ajaran aktif
const displayYear = activeTAYear || new Date().getFullYear().toString();

// SESUDAH: Tahun tetap (tahun pembuatan) + versi aplikasi
const APP_VERSION = "1.0.0";
const APP_YEAR = "2026";

// Footer akan menampilkan:
// © 2026 MTs AL WATHONIYAH 43 | v1.0.0
```

**2. Database Migration - RLS Policies**
```sql
-- 1. Drop policy pengeluaran yang terlalu permissive
DROP POLICY IF EXISTS "Authenticated users can view pengeluaran" ON pengeluaran;

-- 2. Create policy yang lebih ketat
CREATE POLICY "Admin and bendahara can view pengeluaran" 
  ON pengeluaran FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'bendahara'));
```

### F. Yang TIDAK Perlu Diubah (Sudah Aman)

1. **Pembayaran & Tunggakan**: RLS sudah benar - hanya admin/bendahara bisa akses
2. **Jenis Tagihan**: RLS sudah benar - semua bisa lihat, hanya admin/bendahara bisa kelola
3. **GTK/PTK**: RLS sudah ketat - hanya admin/operator
4. **User Roles**: RLS aman dengan SECURITY DEFINER function
5. **Alur cicilan**: Logika sudah benar (totalBayar = old + new, status auto-update)
6. **Tunggakan lintas tahun**: Sudah didukung (siswa kelas 9 dengan tunggakan kelas 7/8)

### G. Catatan Khusus untuk Madrasah

Fitur yang sudah mendukung kebutuhan:
- Pencarian siswa by NIS/nama (cepat, tidak perlu buka buku)
- Pembayaran cicilan (flexible untuk kondisi ekonomi wali)
- Tunggakan grouped per siswa (mudah lihat total per anak)
- WhatsApp integration (langsung kirim tagihan ke ortu)
- Histori pembayaran lengkap dengan tanggal

### H. Langkah Implementasi

| No | Langkah | Prioritas |
|----|---------|-----------|
| 1 | Update Footer (tahun + versi) | Tinggi |
| 2 | Perbaiki RLS pengeluaran | Tinggi |
| 3 | Test semua menu setelah perubahan | Tinggi |

### Bagian Teknis (untuk Developer)

**Perubahan Footer.tsx:**
- Hapus useEffect yang fetch tahun_ajaran
- Hardcode tahun pembuatan = "2026"
- Tambah konstanta APP_VERSION = "1.0.0"
- Update tampilan footer dengan format: "© 2026 MTs AL WATHONIYAH 43 | v1.0.0"

**Perubahan RLS:**
- Satu migration untuk update policy pengeluaran
- Tidak perlu ubah code frontend (sudah benar)
