
# Modul PPDB (Penerimaan Peserta Didik Baru)

## Fitur yang akan dibangun

### 1. Form Pendaftaran Online (Publik)
- Halaman `/ppdb/daftar` yang bisa diakses tanpa login
- Field: Nama, NIS (opsional), NISN, Tempat/Tanggal Lahir, Jenis Kelamin, Alamat, Nama Ayah, Nama Ibu, No WA Ortu, Asal Sekolah
- Setelah submit, tampilkan nomor pendaftaran unik
- Admin bisa buka/tutup pendaftaran secara manual (toggle)

### 2. Manajemen Pendaftar (Admin only)
- Halaman `/ppdb` di sidebar (hanya admin)
- Tabel daftar pendaftar dengan filter status: Baru, Diterima, Ditolak
- Aksi: ubah status per pendaftar atau bulk update
- Export data pendaftar ke CSV

### 3. Konversi ke Siswa
- Pendaftar berstatus "Diterima" bisa dikonversi menjadi siswa
- Pilih kelas dan tahun ajaran tujuan saat konversi
- Data otomatis masuk ke tabel `siswa` (dan `siswa_riwayat`)
- Bisa konversi satu per satu atau bulk

## Detail Teknis

### Database (2 tabel baru)

**Tabel `ppdb_settings`** - pengaturan PPDB
- `id`, `is_open` (boolean, default false), `tahun_ajaran` (text), `pesan_selamat` (text, opsional), `created_at`, `updated_at`
- RLS: Admin ALL, public SELECT (untuk cek apakah pendaftaran buka)

**Tabel `ppdb_pendaftar`** - data calon siswa
- `id`, `nomor_pendaftaran` (text, unique), `nama`, `nisn`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `alamat`, `nama_ayah`, `nama_ibu`, `wa_ortu`, `asal_sekolah`, `status` (enum: baru/diterima/ditolak, default baru), `catatan`, `created_at`, `updated_at`
- RLS: Admin ALL, anon/public INSERT (saat ppdb_settings.is_open = true), anon SELECT own row by nomor_pendaftaran

### Halaman baru
- `src/pages/PPDB.tsx` - manajemen pendaftar (admin)
- `src/pages/PPDBDaftar.tsx` - form pendaftaran publik (tanpa login)

### Perubahan existing
- `src/components/layout/Sidebar.tsx` - tambah menu "PPDB" dengan icon `UserPlus`, roles: ['admin']
- `src/App.tsx` - tambah route `/ppdb` (protected admin) dan `/ppdb/daftar` (publik, di luar ProtectedRoute)

### Komponen pendukung
- `src/components/ppdb/PPDBFormDialog.tsx` - form pendaftaran
- `src/components/ppdb/PPDBKonversiDialog.tsx` - dialog konversi ke siswa (pilih kelas & TA)
- `src/components/ppdb/PPDBSettingsPanel.tsx` - toggle buka/tutup pendaftaran
