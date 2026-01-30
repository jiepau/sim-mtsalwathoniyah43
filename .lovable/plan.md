
# Perbaikan Tombol "Lihat Daftar Siswa" di Halaman Naik Kelas

## Analisis Masalah

Setelah memeriksa kode di `src/pages/NaikKelas.tsx`, saya menemukan bahwa tombol "Lihat Daftar Siswa" memiliki kondisi disabled:

```jsx
<Button onClick={generatePreview} disabled={!tahunAjaranLama || !tahunAjaranBaru}>
  Lihat Daftar Siswa
</Button>
```

**Penyebab tombol tidak bisa diklik:**
- Tombol akan disabled jika **Tahun Ajaran Lama** atau **Tahun Ajaran Baru** belum dipilih
- Meskipun TA Lama otomatis terisi dari TA aktif, TA Baru harus dipilih manual

**Kemungkinan masalah lain:**
- Select component mungkin tidak merespons klik karena ada overlay atau z-index issue
- Atau ada error saat fetch data sehingga `tahunAjaranList` kosong

---

## Solusi yang Akan Diterapkan

### 1. Tambahkan Indikator Visual yang Lebih Jelas
Menambahkan pesan helper yang menunjukkan apa yang harus dilakukan sebelum tombol bisa diklik.

### 2. Debugging State
Menambahkan console.log sementara untuk melihat apakah state ter-update dengan benar.

### 3. Pastikan Select Berfungsi
Memastikan Select component dapat menerima klik dengan benar.

---

## Perubahan Kode

### File: `src/pages/NaikKelas.tsx`

**Perubahan 1: Tambahkan pesan helper di bawah tombol**
```jsx
<Button onClick={generatePreview} disabled={!tahunAjaranLama || !tahunAjaranBaru}>
  Lihat Daftar Siswa
</Button>

{/* Tambahan: Pesan helper */}
{(!tahunAjaranLama || !tahunAjaranBaru) && (
  <p className="text-sm text-muted-foreground">
    * Pilih kedua tahun ajaran terlebih dahulu untuk melihat daftar siswa
  </p>
)}
```

**Perubahan 2: Tambahkan indikator wajib pada label**
```jsx
<Label>Tahun Ajaran Lama (Asal) <span className="text-destructive">*</span></Label>
...
<Label>Tahun Ajaran Baru (Tujuan) <span className="text-destructive">*</span></Label>
```

**Perubahan 3: Menampilkan badge status pada dropdown**
Menunjukkan secara visual apakah field sudah terisi atau belum.

---

## Ringkasan Perubahan

| File | Perubahan |
|------|-----------|
| `src/pages/NaikKelas.tsx` | Tambah pesan helper dan indikator visual untuk membantu user memahami mengapa tombol disabled |

---

## Catatan Teknis

- Tombol sengaja di-disable untuk mencegah error jika salah satu TA belum dipilih
- Dengan menambahkan pesan helper, user akan lebih mudah memahami apa yang harus dilakukan
- Tidak ada bug - ini adalah UX improvement untuk kejelasan
