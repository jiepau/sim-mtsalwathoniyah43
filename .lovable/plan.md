## Modul Gaji Guru

Menu baru **Keuangan → Gaji Guru** untuk mengelola penggajian bulanan: master komponen per guru, generate gaji bulanan dengan kehadiran auto dari Absensi GTK (bisa diedit), potongan, dan cetak slip PDF. Guru bisa lihat slip gajinya sendiri di halaman Profil Guru.

### Alur penggunaan

1. **Setup master gaji** (sekali per guru) — Bendahara buka tab "Master Gaji", isi gaji pokok + tunjangan tetap per guru (wali kelas, ekskul, dansos, piket, transport, dll). Komponen bisa custom (tidak hardcode).
2. **Tarif kehadiran** — Set tarif default per hari hadir / potongan per alpa / potongan per izin di tab "Pengaturan".
3. **Generate gaji bulanan** — Pilih bulan & tahun → klik "Generate" → sistem buat baris untuk semua guru aktif, isi otomatis: komponen dari master + jumlah hadir/izin/sakit/alpa dari `absensi_gtk` bulan tsb.
4. **Review & edit** — Bendahara bisa edit nominal komponen, tambah potongan (kasbon, dll), atau ubah jumlah hadir bila perlu.
5. **Finalisasi & cetak slip** — Klik "Finalkan" → status jadi `final`, slip PDF bisa dicetak (kop madrasah + ttd kepala/bendahara). Setelah final, guru bisa lihat slipnya di Profil Guru.

### Halaman & UI

- **`/gaji-guru`** (admin, bendahara) — 4 tab:
  - **Daftar Gaji**: filter bulan/tahun, tabel guru × komponen + total, badge status (draft/final/dibayar), tombol Generate, Edit, Cetak Slip, Tandai Dibayar.
  - **Master Gaji**: per-guru, daftar komponen tetap (nama, nominal, kategori). Tambah/edit/hapus komponen.
  - **Pengaturan**: tarif default kehadiran, format nomor slip, header slip.
  - **Rekap**: total gaji per bulan/tahun untuk laporan keuangan.
- **Profil Guru** (guru sendiri) — tab baru "Slip Gaji Saya" yang list slip berstatus `final`/`dibayar`, tombol unduh PDF.
- **Sidebar** — item "Gaji Guru" di group Keuangan (admin + bendahara); item "Slip Gaji" di Profil Guru untuk role guru.

### Cetak slip PDF

Layout A5 portrait: kop madrasah + logo, identitas guru (nama, NIP/NUPTK, jabatan), periode, ringkasan kehadiran, rincian pendapatan (gaji pokok + tunjangan), rincian potongan, total bersih (terbilang), ttd kepala madrasah & bendahara. Menggunakan komponen `PrintKopMadrasah` yang sudah ada.

### Detail teknis

**Database (4 tabel baru):**

- `gaji_komponen_master` — komponen tetap per guru
  - `gtk_id` (uuid), `nama_komponen` (text), `kategori` (`pendapatan`|`potongan`), `nominal` (numeric), `is_active` (bool)
- `gaji_settings` — tarif & header slip (single row)
  - `tarif_per_hadir`, `potongan_per_alpa`, `potongan_per_izin`, `potongan_per_sakit`, `format_nomor_slip`, `judul_slip`
- `gaji_periode` — header gaji bulanan per guru
  - `gtk_id`, `bulan` (int), `tahun` (int), `jumlah_hadir`, `jumlah_izin`, `jumlah_sakit`, `jumlah_alpa`, `hari_kerja`, `total_pendapatan`, `total_potongan`, `total_bersih`, `status` (`draft`|`final`|`dibayar`), `tanggal_bayar`, `nomor_slip`, `catatan`
  - Unique: `(gtk_id, bulan, tahun)`
- `gaji_detail` — baris komponen per slip (snapshot agar histori aman saat master diubah)
  - `gaji_periode_id`, `nama_komponen`, `kategori`, `nominal`

**RLS:**
- 3 tabel pertama: admin + bendahara full CRUD; guru tidak akses.
- `gaji_periode` & `gaji_detail`: admin + bendahara full; **guru SELECT hanya baris miliknya sendiri** (`gtk_id IN (SELECT id FROM gtk_ptk WHERE user_id = auth.uid())`) dan **hanya yang status `final`/`dibayar`**.
- Semua tabel: GRANT sesuai aturan project.

**Integrasi Absensi GTK:** Saat Generate, query `absensi_gtk` filter `tanggal` di bulan target, group by `gtk_id` & `status`, hitung jumlah per status. Hari kerja dihitung dari jumlah hari di bulan tsb dikurangi `hari_libur` (Sabtu/Minggu sesuai kebijakan; bisa dikonfirmasi nanti).

**Files baru:**
- `src/pages/GajiGuru.tsx` (halaman utama 4 tab)
- `src/components/gaji/MasterGajiTab.tsx`
- `src/components/gaji/DaftarGajiTab.tsx`
- `src/components/gaji/PengaturanGajiTab.tsx`
- `src/components/gaji/RekapGajiTab.tsx`
- `src/components/gaji/GenerateGajiDialog.tsx`
- `src/components/gaji/EditGajiDialog.tsx`
- `src/components/gaji/SlipGajiPrint.tsx`
- `src/components/gaji/SlipGajiSayaTab.tsx` (untuk Profil Guru)

**Files diubah:**
- `src/App.tsx` — route `/gaji-guru` (admin, bendahara)
- `src/components/layout/Sidebar.tsx` — menu baru di group Keuangan
- `src/pages/ProfilGuru.tsx` — tab "Slip Gaji Saya"
- `src/pages/PetaSitus.tsx` — daftarkan menu baru

### Yang tidak termasuk (bisa fase berikutnya)

- Integrasi bank/transfer otomatis
- BPJS / pajak PPh21
- Slip via WhatsApp otomatis (bisa tambah pakai Fonnte nanti)
- Lembur per jam

Konfirmasi plan ini untuk saya mulai bangun.