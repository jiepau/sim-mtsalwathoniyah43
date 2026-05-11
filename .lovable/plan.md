## Tujuan

Menambah dua modul terkait kelulusan kelas 9 di SIM (bukan aplikasi terpisah):

1. **E-Ijazah** — pengolah nilai akhir per mapel untuk siap disalin ke blanko ijazah & SKL Kemenag (impor dari Excel/CSV).
2. **Pengumuman Kelulusan publik** — halaman publik `/kelulusan` tanpa login, siswa cek status via NISN, bisa download Surat Kelulusan PDF.

## Kenapa ditambah ke SIM (bukan app baru)

- Data siswa kelas 9, NIS/NISN, identitas madrasah, kepala madrasah & TTD sudah ada di sini.
- 1 backend, 1 deploy, hemat biaya.
- Halaman publik tetap bisa dibuat sebagai **route tanpa login** (`/kelulusan`) — pola yang sama sudah dipakai untuk `/spmb/daftar` dan `/spmb/cek-status`.

## Lingkup fitur

### A. Modul E-Ijazah (admin/operator)
- Menu baru di sidebar grup **Akademik**: "E-Ijazah & Kelulusan".
- Pilih Tahun Ajaran + Kelas 9 → tampil daftar siswa.
- **Import nilai dari Excel/CSV**: template berisi kolom NISN/NIS + nilai per mapel (PAI, B.Arab, PKn, B.Indo, B.Ing, MTK, IPA, IPS, Seni, PJOK, Prakarya, Mulok, dst — daftar mapel bisa diatur).
- Edit nilai inline per siswa (kalau perlu koreksi manual).
- **Cetak rekap nilai** (untuk disalin ke blanko Kemenag) — format A4 portrait, 1 siswa per halaman atau tabel rekap semua siswa.
- **Set status kelulusan** per siswa: `LULUS` / `TIDAK LULUS` / `BELUM DIUMUMKAN`.
- **Pengaturan pengumuman**: tanggal & jam pengumuman aktif (sebelum waktu itu, halaman publik tampilkan "belum diumumkan"), nomor SK kelulusan, pesan ucapan selamat.

### B. Halaman Publik Kelulusan (`/kelulusan`)
- Tanpa login. Form input NISN (+ opsional tanggal lahir untuk verifikasi ganda).
- Setelah submit:
  - Jika belum waktunya → "Pengumuman belum dibuka. Akan diumumkan pada [tanggal jam]."
  - Jika `LULUS` → tampil nama, NISN, kelas, ucapan selamat, **tombol Download Surat Kelulusan (PDF)**.
  - Jika `TIDAK LULUS` → pesan netral & saran konsultasi ke madrasah (tidak menampilkan nilai).
  - Jika NISN tidak ditemukan → pesan error.
- Surat Kelulusan PDF: kop madrasah dua-logo (komponen `PrintKopMadrasah` sudah ada), nomor SK, identitas siswa, pernyataan LULUS, TTD Kepala Madrasah dari `madrasah_settings`.

### C. Cetak SKL & Rekap Nilai (admin)
- Cetak SKL massal (per kelas) atau per siswa dari menu E-Ijazah.
- Cetak rekap nilai per siswa (untuk pegangan sebelum mengisi blanko Kemenag).

## Yang TIDAK termasuk (sesuai permintaan user)

- Tidak mencetak ijazah resmi (blanko Kemenag dicetak manual oleh admin).
- Tidak ada modul rapor/penilaian harian (nilai diimpor dari Excel hasil olahan di luar sistem).
- Tidak ada QR code verifikasi publik (bisa ditambah nanti kalau dibutuhkan).

## Detail teknis

### Database (3 tabel baru)

```text
ijazah_mapel_settings
  id, ta_id, urutan, nama_mapel, kode_mapel, is_active

ijazah_nilai
  id, siswa_id, ta_id, mapel (text), nilai (numeric)
  unique(siswa_id, ta_id, mapel)

kelulusan
  id, siswa_id, ta_id, status ('lulus'|'tidak_lulus'|'pending')
  nomor_sk, tanggal_lulus, catatan
  unique(siswa_id, ta_id)

kelulusan_settings
  id (singleton), ta_id, is_published (bool), published_at (timestamp)
  judul_pengumuman, pesan_ucapan, nomor_sk_format
```

### RLS

- `ijazah_*` & `kelulusan`: admin/operator manage; bendahara read.
- `kelulusan_settings`: admin manage; **publik (anon) bisa SELECT** (untuk cek apakah pengumuman sudah aktif).
- Untuk pengecekan publik NISN → buat **Edge Function `cek-kelulusan`** dengan service role key yang menerima NISN (+ tgl lahir), mengembalikan hanya field aman (nama, status, nomor_sk). Pola sama dengan `validate-gtk` yang sudah ada. Ini menghindari membuka tabel `siswa` ke anon.

### Edge Functions (2 baru)

- `cek-kelulusan` — input NISN/tgl lahir, output status + identitas terbatas.
- `generate-surat-kelulusan` — input siswa_id, output PDF/HTML Surat Kelulusan dengan kop & TTD.

### Frontend

- `src/pages/EIjazah.tsx` — menu admin (manage nilai + status + import).
- `src/components/ijazah/ImportNilaiDialog.tsx` — wizard upload Excel.
- `src/components/ijazah/CetakSKLDialog.tsx` — preview & cetak SKL.
- `src/pages/KelulusanPublik.tsx` — route publik `/kelulusan`.
- Routing: tambah `/kelulusan` (publik) + `/e-ijazah` (admin/operator) di `App.tsx`.
- Sidebar: tambah item di grup Akademik dengan ikon GraduationCap.

### Format Excel import

```text
NISN | NAMA (read-only) | PAI | B.Arab | PKn | B.Indo | B.Ing | MTK | IPA | IPS | ...
```

Sistem download template per kelas (sudah terisi NISN & nama), admin tinggal isi nilai lalu upload.

## Fase pengerjaan

1. **Migrasi DB** + RLS + seed `ijazah_mapel_settings` default (12 mapel standar MTs).
2. **Edge function** `cek-kelulusan`.
3. **Halaman admin E-Ijazah**: list siswa kelas 9, edit nilai inline, set status.
4. **Import Excel** + download template.
5. **Halaman publik `/kelulusan`** + integrasi edge function.
6. **Cetak SKL** (PDF dengan kop & TTD).
7. **Cetak rekap nilai per siswa** (untuk panduan isi blanko Kemenag).
8. Tambah link "Pengumuman Kelulusan" di halaman Login (mirip link SPMB) supaya mudah ditemukan.

## Pertanyaan saat implementasi (kalau ada)

- Daftar mapel default — saya pakai 12 mapel kurikulum MTs standar; user bisa edit di pengaturan.
- Verifikasi publik: NISN saja, atau NISN + tanggal lahir? Saya default ke **NISN + tanggal lahir** untuk privasi (mencegah orang random cek status siswa lain).
