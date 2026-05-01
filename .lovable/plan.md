
## Fitur: Input Pendaftar Offline (Manual) di SPMB

Saat ini pendaftaran hanya bisa dilakukan via form online publik. Panitia yang menerima pendaftaran langsung di sekolah belum bisa menginput data calon siswa dari halaman SPMB admin.

### Rencana

1. **Tombol "Tambah Pendaftar"** di halaman SPMB (`src/pages/PPDB.tsx`)
   - Tombol baru di area toolbar (sejajar dengan Export/Import)
   - Membuka dialog form input manual

2. **Dialog Form Input Offline** (komponen baru `src/components/ppdb/PPDBInputOfflineDialog.tsx`)
   - Form ringkas dengan field wajib: Nama, Jenis Kelamin, Tempat/Tanggal Lahir, Alamat, Asal Sekolah, No HP Ortu
   - Field opsional: NIK, NISN, KIP, data Ayah/Ibu/Wali (collapsible/accordion)
   - Otomatis generate nomor pendaftaran via `generate_nomor_ppdb()`
   - Status default: `baru`
   - Scrollable dialog dengan tombol Simpan/Batal sticky di bawah

3. **Tidak perlu migrasi database** — tabel `ppdb_pendaftar` dan RLS policy "Panitia can manage" sudah mendukung INSERT dari role panitia

### Detail Teknis

- Komponen baru: `src/components/ppdb/PPDBInputOfflineDialog.tsx`
- Edit: `src/pages/PPDB.tsx` — tambah tombol dan state dialog
- Reuse logic dari `PPDBDaftar.tsx` (payload builder, validasi minimal)
- Form menggunakan Accordion untuk kelompok data (Data Siswa, Data Ayah, Data Ibu, Data Wali)
