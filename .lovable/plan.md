

## Rencana: Cetak KTA GTK/PTK

### Ringkasan
Menambahkan fitur cetak Kartu Tanda Anggota (KTA) untuk GTK/PTK dalam format kartu ID ukuran KTP (85.6 x 53.98 mm). Mendukung cetak per individu maupun massal. Informasi yang ditampilkan: Nama, NIP/NUPTK, Jabatan, dan logo madrasah.

### Desain Kartu

```text
┌─────────────────────────────────┐
│  [Logo]  MTs Al-Wathoniyah 43   │
│          KARTU TANDA ANGGOTA    │
│                                 │
│  ┌──────┐  Nama : Fulan         │
│  │ FOTO │  NIP  : 1234567890    │
│  │      │  NUPTK: 9876543210    │
│  └──────┘  Jabatan: Guru        │
│                                 │
│          Berlaku s/d: ........  │
└─────────────────────────────────┘
```

Karena belum ada kolom foto di tabel `gtk_ptk`, akan ditampilkan placeholder foto. Fitur upload foto bisa ditambahkan nanti.

### Perubahan Teknis

1. **Buat komponen `GtkKtaCard.tsx`**
   - Komponen React yang merender kartu ID ukuran KTP (85.6mm x 53.98mm)
   - Mengambil data madrasah dari `madrasah_settings` untuk nama & logo
   - Menampilkan: Logo, Nama Madrasah, Nama GTK, NIP, NUPTK, Jabatan
   - Styling khusus `@media print` agar ukuran kartu tepat saat dicetak

2. **Buat halaman/dialog cetak `GtkKtaPrint.tsx`**
   - Menerima array GTK yang dipilih
   - Merender beberapa kartu dalam grid untuk cetak massal
   - Trigger `window.print()` untuk cetak

3. **Update `GtkPtk.tsx`**
   - Tambah tombol "Cetak KTA" di action per baris (dialog detail / dropdown)
   - Tambah checkbox multi-select + tombol "Cetak KTA Terpilih" di header untuk cetak massal
   - Integrasi dengan komponen cetak

### Tidak Ada Perubahan Database
Tidak diperlukan migrasi database. Semua data yang dibutuhkan (nama, NIP, NUPTK, jabatan) sudah tersedia di tabel `gtk_ptk`, dan data madrasah ada di `madrasah_settings`.

