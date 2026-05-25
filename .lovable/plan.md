
# Modul Kartu Ujian & Denah Ruang

Menu baru: **Akademik → Kartu Ujian**. Memanfaatkan data `siswa` + `kelas` + `madrasah_settings` yang sudah ada. Tidak menyentuh modul PDUM/SKL.

## Alur singkat

1. Admin/operator buat **Sesi Ujian** (jenis PTS/PAS/PAT/UM, TA, nama, tanggal mulai–selesai, kelas peserta).
2. Sistem auto-generate **nomor peserta** & auto-bagi ke **ruang** sesuai kapasitas. Admin bisa edit per-siswa.
3. Cetak: **Kartu Peserta** (per siswa / massal), **Daftar Peserta per Ruang** (tempel pintu), **Layout Tempat Duduk** (grid kursi).

## Database (3 tabel baru)

**`ujian_sesi`** — header sesi
- jenis (`pts`|`pas`|`pat`|`um`), nama, ta_id, semester (`ganjil`|`genap`), tanggal_mulai, tanggal_selesai, status (`draft`|`aktif`|`selesai`), nomor_peserta_prefix, kelas_ids (array uuid)

**`ujian_ruang`** — ruang yang dipakai sesi
- sesi_id, nama_ruang (mis. "R-01"), lokasi (opsional), kapasitas, baris, kolom, urutan

**`ujian_peserta`** — penempatan + nomor peserta
- sesi_id, siswa_id, kelas_asal_id, nomor_peserta (text, unik per sesi), ruang_id, nomor_kursi (int), is_manual_override (boolean)
- unique(sesi_id, siswa_id), unique(sesi_id, nomor_peserta)

RLS: admin+operator manage, semua authenticated view (mengikuti pola `pdum_*`).

## UI / Halaman

**`/kartu-ujian`** — daftar sesi (card per sesi: jenis, periode, jumlah peserta, jumlah ruang). Tombol **+ Sesi Baru**.

**Detail Sesi** (dialog/halaman) dengan 4 tab:
1. **Pengaturan** — edit header sesi, prefix nomor peserta, regenerate.
2. **Ruang** — CRUD ruang (nama, kapasitas, grid baris×kolom). Tombol "Auto-buat dari kelas" (1 ruang per kelas).
3. **Peserta** — tabel siswa (No Peserta, Nama, NIS, Kelas Asal, Ruang, Kursi). Inline-edit Ruang & Kursi. Tombol "Distribusi Otomatis".
4. **Cetak** — 3 pilihan output (lihat di bawah).

## Logika auto-generate

**Nomor peserta**: `{prefix}-{NNNN}`, default prefix `PTS25` / `PAS25` / `UM25` (turunan jenis+tahun). Urut: kelas (7→9) → nomor absen/nama. Disimpan ke kolom `nomor_peserta`. Admin edit manual → set `is_manual_override=true` agar regenerate tidak menimpa.

**Penempatan ruang**: ambil semua peserta urut, isi ruang berurutan sampai kapasitas penuh, lanjut ruang berikutnya. Kursi 1..kapasitas. Override manual juga dihormati saat regenerate.

## Cetak (pakai `PrintPreviewToolbar` + `PrintKopMadrasah` yang sudah ada)

1. **Kartu Peserta** — A4 portrait, 4 kartu per halaman. Tiap kartu: kop kecil, foto siswa, Nama, NIS, Kelas Asal, **No Peserta** (besar), **Ruang**, jadwal singkat, TTD kepala. Pilih single/multi siswa.
2. **Daftar Peserta per Ruang** — A4 portrait, 1 halaman per ruang: kop + judul ruang + tabel (No Peserta, Nama, Kelas Asal, Tanda Tangan). Untuk tempel pintu/absensi.
3. **Denah/Layout Tempat Duduk** — A4 landscape: kop + grid baris×kolom, tiap sel = kotak berisi No Peserta + Nama (font kecil) + kursi #. 1 halaman per ruang.

## File yang akan dibuat

```
src/pages/KartuUjian.tsx                        # daftar sesi
src/components/ujian/SesiFormDialog.tsx
src/components/ujian/SesiDetailDialog.tsx       # 4 tab
src/components/ujian/RuangTab.tsx
src/components/ujian/PesertaTab.tsx
src/components/ujian/CetakTab.tsx
src/components/ujian/CetakKartuPesertaDialog.tsx
src/components/ujian/CetakDaftarRuangDialog.tsx
src/components/ujian/CetakDenahRuangDialog.tsx
src/hooks/useUjianSesi.ts
src/lib/ujian-generator.ts                      # logika nomor + distribusi
```

## Integrasi

- Sidebar **Akademik**: tambah item "Kartu Ujian" (icon `IdCard` / `ClipboardList`), akses `admin`, `operator`.
- Route di `App.tsx` di group ProtectedRoute.
- Menyimpan memori baru: `mem://features/kartu-ujian`.

## Catatan

- Tidak mengubah modul PDUM/SKL. Sesi UM di sini hanya kartu+denah, nilai tetap di PDUM.
- Jika siswa pindah/keluar setelah generate, hapus dari tab Peserta lalu klik "Rapatkan kursi" (opsional).
