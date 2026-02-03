# Rencana Aplikasi Surat Menyurat

## Overview
Aplikasi manajemen surat masuk dan surat keluar untuk madrasah/sekolah.

---

## FASE 1: Struktur Dasar (2-3 kredit)
**Prioritas: TINGGI**

### Database Tables
```sql
-- Tabel Surat Masuk
CREATE TABLE surat_masuk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_surat TEXT NOT NULL,
  tanggal_surat DATE NOT NULL,
  tanggal_terima DATE NOT NULL DEFAULT CURRENT_DATE,
  pengirim TEXT NOT NULL,
  perihal TEXT NOT NULL,
  klasifikasi TEXT, -- rahasia, biasa, penting
  disposisi TEXT,
  keterangan TEXT,
  file_path TEXT, -- untuk lampiran
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Surat Keluar
CREATE TABLE surat_keluar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_surat TEXT NOT NULL,
  tanggal_surat DATE NOT NULL DEFAULT CURRENT_DATE,
  tujuan TEXT NOT NULL,
  perihal TEXT NOT NULL,
  klasifikasi TEXT,
  keterangan TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Fitur
- [x] Halaman daftar surat masuk (tabel dengan search & filter)
- [x] Halaman daftar surat keluar (tabel dengan search & filter)
- [x] Form tambah/edit surat masuk
- [x] Form tambah/edit surat keluar
- [x] RLS policies untuk admin & operator

---

## FASE 2: Fitur Disposisi (1-2 kredit)
**Prioritas: SEDANG**

### Database Additions
```sql
-- Tabel Disposisi (untuk tracking)
CREATE TABLE disposisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_masuk_id UUID REFERENCES surat_masuk(id),
  dari TEXT NOT NULL, -- kepala madrasah
  kepada TEXT NOT NULL, -- guru/staff
  instruksi TEXT,
  tanggal_disposisi DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending', -- pending, proses, selesai
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Fitur
- [ ] Form disposisi surat
- [ ] Tracking status disposisi
- [ ] Notifikasi disposisi baru

---

## FASE 3: Penomoran Otomatis (1 kredit)
**Prioritas: SEDANG**

### Fitur
- [ ] Generate nomor surat otomatis berdasarkan format
- [ ] Format: XXX/MTs.AW43/[BULAN]/[TAHUN]
- [ ] Counter reset per tahun

---

## FASE 4: Upload Lampiran (1-2 kredit)
**Prioritas: RENDAH**

### Fitur
- [ ] Upload file PDF/gambar surat
- [ ] Preview dokumen
- [ ] Storage bucket untuk file surat

---

## FASE 5: Laporan & Export (1-2 kredit)
**Prioritas: RENDAH**

### Fitur
- [ ] Rekap surat masuk per periode
- [ ] Rekap surat keluar per periode
- [ ] Export ke Excel/PDF

---

## Navigasi
Tambahkan menu di sidebar:
- 📬 Surat Menyurat
  - Surat Masuk
  - Surat Keluar
  - (Disposisi - fase 2)

---

## Estimasi Total
- **Minimum (Fase 1)**: 2-3 kredit
- **Dengan Disposisi (Fase 1-2)**: 4-5 kredit
- **Lengkap (Fase 1-5)**: 8-12 kredit

---

## Catatan Implementasi
1. Gunakan komponen UI yang sudah ada (DataTable, Form, Dialog)
2. Ikuti pattern yang sama dengan modul siswa/pembayaran
3. RLS policies: admin & operator bisa CRUD
4. Reuse layout MainLayout yang sudah ada
