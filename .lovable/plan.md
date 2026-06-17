# Audit SPMB & Rencana Perbaikan

## Hasil Audit

Saya cek menyeluruh: tabel `ppdb_settings`, RLS, halaman admin (`PPDB.tsx`, `PPDBSettingsPanel.tsx`), halaman publik (`SPMBLanding.tsx`, `PPDBDaftar.tsx`, `PPDBCekStatus.tsx`), dan edge function `cek-status-ppdb`.

**Status DB saat ini**: `is_open = true`, `tahun_ajaran = 2026/2027`. Policy `Anyone can view ppdb_settings` aktif untuk `anon` + `authenticated` (sudah saya verifikasi via curl pakai anon key → data terbaca, `is_open: true`). Jadi backend & policy sudah benar.

### Bug yang ditemukan

**1. Kolom finalisasi tidak ada di tabel (CRITICAL)**
`PPDBSettingsPanel` mengirim `update({ is_finalized, finalized_at, finalized_by })` saat tombol *Finalisasi* ditekan, tapi 3 kolom itu **tidak ada** di tabel `ppdb_settings`. Akibatnya: tombol Finalisasi error 400, dan UI badge "Finalized" tidak pernah aktif. Tipe `is_finalized?` di interface hanya menutupi error TypeScript, bukan menyelesaikan masalah DB.

**2. Halaman publik fragile saat query error**
- `PPDBDaftar.tsx:129` pakai `.limit(1).single()` — kalau Supabase melempar error (sekecil apapun, mis. timeout/cors transien), `settings` jadi `undefined`, `isOpen = false`, dan langsung tampil **"Pendaftaran Ditutup"** padahal pendaftaran DIBUKA di DB. Ini paling mungkin penyebab keluhan Anda.
- `SPMBLanding.tsx` punya pola serupa: error → badge "DITUTUP" + tombol Daftar disabled. Tidak ada state "gagal memuat" yang membedakan "benar-benar tutup" vs "gagal fetch".

**3. Tombol Simpan Tahun Ajaran bisa kirim nilai kosong**
`editTA` mulai `""`. Kalau user clear field lalu klik Simpan, `if (editTA)` skip — tidak ada feedback. Minor.

**4. Edge function `cek-status-ppdb`** — sudah benar (service role + filter ketat). Tidak diubah.

---

## Rencana Perbaikan

### A. Migration: lengkapi kolom finalisasi

Tambah ke `public.ppdb_settings`:
- `is_finalized boolean NOT NULL DEFAULT false`
- `finalized_at timestamptz NULL`
- `finalized_by uuid NULL` (no FK ke `auth.users`)

Tidak perlu policy baru (kolom ikut policy SELECT/UPDATE existing).

### B. Hardening halaman publik

**`src/pages/PPDBDaftar.tsx`**
- Ganti `.limit(1).single()` → `.maybeSingle()`.
- Tambah state `errorSettings`: jika query error, tampilkan panel "Gagal memuat status pendaftaran. Muat ulang halaman." dengan tombol retry — **bukan** "Pendaftaran Ditutup".
- Hanya tampilkan "Ditutup" jika `settings` ada DAN `is_open === false`.

**`src/pages/SPMBLanding.tsx`**
- `useQuery` tambahkan `retry: 2` (saat ini `retry: false`) supaya tahan blip.
- Saat `isError`, badge & tombol Daftar pakai state "memuat ulang" (skeleton) — tidak ngunci "DITUTUP".
- Hormati `is_finalized` baru dari DB (hapus cast `as { is_finalized?: boolean }` jadi tipe langsung dari `settings`).

### C. Polish `PPDBSettingsPanel`

- Pakai `value` controlled untuk input Tahun Ajaran (bukan `defaultValue`) supaya tombol Simpan selalu kirim nilai field saat ini, dan validasi format `YYYY/YYYY` sederhana.
- Tampilkan toast error spesifik dari Supabase (`error.message`) agar issue serupa di masa depan ketahuan.

### D. Verifikasi

Setelah migration & code update:
- Buka `/spmb` di anonymous browser via Playwright → pastikan badge "DIBUKA" dan tombol Daftar aktif.
- Toggle admin → pastikan publik ikut berubah.
- Klik Finalisasi (setelah is_open=false) → pastikan kolom terisi & badge "Finalized" muncul.

## Catatan Teknis

- Tidak menambah RLS policy baru; policy existing sudah benar.
- Tidak menyentuh edge function (sudah aman pakai service role).
- Perubahan UI terbatas pada handling state error/loading — tidak mengubah desain landing.
