
# Modul PDUM (Pengolah Data Ujian Madrasah) & Pengumuman Kelulusan

Modul ini melengkapi halaman **E-Ijazah** yang sudah ada — bukan menggantinya. Fokus: mengolah nilai rapor 5 semester + UM menjadi Nilai Akhir Ijazah, lalu menghasilkan file Excel siap upload ke aplikasi PDUM Kemenag, plus rekap & SKL.

## Alur Pengguna

1. Admin/Operator buka menu **Olah Nilai Ijazah (PDUM)**.
2. Pilih Tahun Ajaran (default TA aktif) → sistem otomatis tarik semua siswa kelas 9.
3. (Opsional) Klik **Import Excel PDUM** untuk override / isi kolom Nomor Peserta, Kelas Ujian, Nama Ayah/Ibu sekaligus (cocok via NISN).
4. Buka tab per semester (7-Ganjil, 7-Genap, 8-Ganjil, 8-Genap, 9-Ganjil) → input manual ATAU import Excel per semester.
5. Buka tab **UM** → input nilai Ujian Madrasah per mapel.
6. Tab **Nilai Akhir** menampilkan otomatis: `NA = (rata 5 sem × 60%) + (UM × 40%)`. Bobot bisa diubah di Pengaturan.
7. Klik **Tandai Lulus** (bulk) → otomatis isi tabel `kelulusan` yang sudah ada.
8. Klik **Export Excel PDUM Kemenag** → file siap upload.
9. Aktifkan pengumuman di tab Pengumuman → siswa cek di `/kelulusan` pakai NISN, bisa download SKL.

## Cakupan

**Yang dibangun:**
- Tabel input nilai 5 semester + UM per siswa per mapel
- Pengaturan bobot global (default 60/40)
- Daftar mapel khusus PDUM (terpisah dari ijazah_mapel_settings agar tidak mengganggu)
- Import Excel: daftar siswa PDUM (override), nilai per semester
- Export Excel format DNT-PDUM Kemenag (kolom persis: No, Nomor Peserta, NISN, NAMA, JK, TTL, Kelas, Jurusan, dst + kolom nilai)
- Rekap Nilai Akhir per kelas (PDF print + Excel)
- Integrasi ke halaman SKL & Pengumuman Publik yang sudah ada

**Yang TIDAK dibangun (sesuai permintaan):**
- Tidak menggantikan workflow Excel yang sudah berjalan untuk siswa kelas 7-8
- Tidak generate ijazah cetak (blanko dari Kemenag)
- Tidak otomatis impor rapor dari E-Learning

## Perubahan Database

**Tabel baru:**

- `pdum_mapel` — daftar mapel PDUM (kode, nama, urutan, kelompok: agama/umum/mulok, kkm, is_aktif). Terpisah dari `ijazah_mapel_settings` agar bisa berbeda dengan SKL.
- `pdum_nilai_rapor` — nilai per (siswa_id, ta_id, kode_mapel, semester) di mana semester ∈ {7g, 7n, 8g, 8n, 9g}.
- `pdum_nilai_um` — nilai UM per (siswa_id, ta_id, kode_mapel).
- `pdum_peserta` — data tambahan peserta UM: (siswa_id, ta_id, nomor_peserta, kelas_ujian, jurusan default 'UMUM', no_absen). Override-able via import.
- `pdum_settings` — (ta_id, bobot_rapor default 60, bobot_um default 40, nsm, nama_madrasah_pdum, provinsi, kabupaten — cache dari madrasah_settings).

**RLS:** Admin & Operator full manage; Guru/Bendahara read-only via `has_any_role`.

**Tabel existing yang dipakai ulang (tanpa perubahan):**
- `siswa` (sumber data dasar), `kelas`, `tahun_ajaran`
- `kelulusan` & `kelulusan_settings` (sudah ada → status lulus + pengumuman publik)
- `ijazah_mapel_settings` & `ijazah_nilai` (tetap untuk SKL sederhana / nilai legacy)

## Perubahan Kode

**Halaman & komponen baru:**
- `src/pages/PDUM.tsx` — halaman utama dengan tabs: Peserta · Nilai Rapor (5 sub-tab) · Nilai UM · Nilai Akhir · Pengaturan
- `src/components/pdum/PdumImportPesertaDialog.tsx` — import Excel DNT-PDUM (override kolom peserta)
- `src/components/pdum/PdumImportNilaiDialog.tsx` — import nilai per semester
- `src/components/pdum/PdumExportKemenag.tsx` — generator Excel format Kemenag
- `src/components/pdum/PdumRekapPrint.tsx` — print rekap nilai akhir per kelas
- `src/lib/pdum-calc.ts` — fungsi perhitungan NA (rata-rata 5 sem × bobot_rapor + UM × bobot_um)

**Routing & navigasi:**
- `src/App.tsx` — tambah route `/pdum`
- `src/components/layout/Sidebar.tsx` — tambah menu "Olah Nilai PDUM" di grup Akademik / E-Ijazah, role: admin & operator

**Reuse:**
- `src/components/ijazah/CetakSKLDialog.tsx` — diperluas untuk membaca Nilai Akhir PDUM bila tersedia, fallback ke `ijazah_nilai`
- `src/pages/KelulusanPublik.tsx` — tidak berubah (tetap pakai edge function `cek-kelulusan` & tabel `kelulusan`)

## Catatan Teknis

- **Excel parsing:** pakai library `xlsx` yang sudah ada di project (dipakai untuk EMIS Import siswa).
- **Format Nomor Peserta:** otomatis di-generate `{NSM-pendek}-{kelas}-{urut4digit}` mengikuti pola contoh `26-09-02-2-0180-0001`, NSM/prefix diambil dari `pdum_settings`. Bisa di-override via import.
- **Default mapel PDUM** akan di-seed mengikuti standar MTs Kemenag (Quran-Hadis, Aqidah-Akhlak, Fiqih, SKI, Bahasa Arab, PPKn, Bahasa Indonesia, Bahasa Inggris, Matematika, IPA, IPS, Penjasorkes, Seni Budaya, Informatika, Mulok).
- **Validasi:** nilai 0–100, NA dibulatkan 2 desimal sesuai PDUM.
- **Tidak ada perubahan auth/RLS untuk tabel publik** — halaman pengumuman tetap pakai edge function yang ada.
