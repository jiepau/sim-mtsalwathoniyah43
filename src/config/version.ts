// Centralized version configuration
// Update this file when releasing new versions

export const APP_VERSION = "3.0.0";
export const APP_BUILD_DATE = "2026-04-29";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.0.0",
    date: "2026-04-29",
    changes: [
      "Pratinjau Cetak A4: lihat tampilan halaman persis seperti hasil cetak sebelum klik Cetak / PDF",
      "Toggle orientasi Portrait / Landscape langsung di halaman cetak (Laporan Keuangan, Rapor Kehadiran, Kartu SPP)",
      "Konsolidasi semua kontrol cetak ke dalam satu komponen toolbar reusable agar konsisten",
      "Penyempurnaan kerangka cetak — tampilan layar dan hasil cetak kini benar-benar identik",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-04-26",
    changes: [
      "Kartu SPP siswa: matriks 12 bulan (Juli–Juni) dengan status Lunas / Cicil / Belum Bayar berwarna",
      "Reminder WhatsApp tunggakan massal — kirim ke seluruh wali murid sesuai filter aktif via Fonnte",
      "Aggregasi tunggakan per siswa menjadi satu pesan ringkas (mengurangi spam WA)",
      "Tombol cepat 'Kartu SPP' di setiap baris tabel Tunggakan",
    ],
  },
  {
    version: "2.4.0",
    date: "2026-04-22",
    changes: [
      "Laporan Keuangan bulanan & tahunan dengan tampilan siap cetak A4 + tanda tangan Kepala Madrasah",
      "Ringkasan pemasukan vs pengeluaran beserta saldo (surplus/defisit) otomatis",
      "Lampiran detail transaksi pengeluaran lengkap dengan tanggal, kategori, dan deskripsi",
      "Menu baru 'Laporan Keuangan' di sidebar untuk Admin & Bendahara",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-04-18",
    changes: [
      "Grafik Tren Ketidakhadiran: visualisasi bulanan absensi siswa & GTK menggunakan recharts",
      "Top 10 siswa & GTK dengan tingkat ketidakhadiran tertinggi",
      "Tab baru 'Tren Absensi' di halaman Rekap Absensi",
      "Membantu Kepala Madrasah memantau pola kehadiran sepanjang semester",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-04-14",
    changes: [
      "Rapor Kehadiran Semester: rekap H/S/I/A per bulan untuk dilampirkan ke rapor siswa",
      "Perhitungan otomatis hari efektif (mengecualikan akhir pekan & hari libur)",
      "Persentase kehadiran per siswa dengan kode warna (≥80% hijau, 60-79% kuning, <60% merah)",
      "Halaman cetak A4 landscape lengkap dengan kop madrasah dan kolom tanda tangan",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-04-10",
    changes: [
      "Notifikasi WhatsApp otomatis ke wali murid saat siswa Alfa, Sakit, atau Izin",
      "Tombol 'Kirim Notif Wali' di halaman Absensi Siswa untuk pengiriman manual",
      "Kategori notifikasi baru 'absensi_siswa_alfa' dengan template pesan custom",
      "Edge function notify-absensi-siswa terintegrasi dengan Fonnte",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-04-06",
    changes: [
      "Input Absensi Massal: Per Hari (semua sekaligus), Per Bulan (kalender), atau Per GTK/Siswa (riwayat)",
      "Dialog input absensi bulanan untuk mengisi 1 bulan penuh dalam satu form",
      "Dialog input per orang untuk koreksi cepat absensi individual",
      "UI Absensi GTK & Siswa diseragamkan dengan 3 mode input yang konsisten",
      "Peningkatan signifikan kecepatan input absensi harian sekolah",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-04",
    changes: [
      "Modul E-Learning lengkap untuk Guru (kelola materi, tugas, penilaian) dan Siswa (akses materi, kerjakan tugas, lihat nilai)",
      "Forum Diskusi realtime dengan Supabase Realtime untuk interaksi kelas",
      "Dashboard Siswa dengan statistik materi, tugas, dan nilai",
      "Role Siswa baru dengan akses khusus E-Learning",
      "Fitur auto-generate akun siswa massal dari data siswa yang sudah ada (NIS sebagai username)",
      "Storage bucket E-Learning untuk upload materi dan tugas",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-03-15",
    changes: [
      "Notifikasi WhatsApp pengingat absensi GTK (pagi & siang) via Fonnte",
      "Statistik gender GTK/PTK di Dashboard (Admin & Bendahara)",
      "Modul Absensi Siswa & GTK dengan deteksi hari libur otomatis",
      "Kalender Akademik untuk pengelolaan hari libur nasional & cuti bersama",
      "Rekap Absensi bulanan dengan ekspor CSV",
      "Absensi mandiri (Self-attendance) untuk role Guru",
      "Activity Log realtime di Dashboard (khusus Admin)",
      "Sistem Changelog untuk semua role (What's New popup + halaman Riwayat Pembaruan)",
      "Perbaikan stabilitas login Google Sign-In (race condition & redirect)",
    ],
  },
  {
    version: "1.3.1",
    date: "2026-03-08",
    changes: [
      "Dropdown lulusan GTK/PTK (SMA/MA, D1-D4, S1-S3)",
      "Field pendidikan manual untuk detail jurusan & universitas",
      "Password awal user dapat dilihat & di-export oleh Admin",
      "Approval otomatis untuk user Google Sign-In oleh Admin",
      "Export daftar user ke CSV",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-03-01",
    changes: [
      "Perbaikan refresh otomatis saat pindah tab browser (React Query & Auth)",
      "Statistik GTK/PTK: jenis kelamin, jabatan, dan pendidikan",
      "Dropdown jabatan GTK: Jabatan Utama (Kepala Madrasah/Guru/Tendik) + Jabatan Tambahan multi-select (Wakil Kurikulum, Wakil Kesiswaan, Mengajar)",
      "Input tanggal lahir GTK/PTK dan Siswa menggunakan native date picker",
      "Fitur edit data pembayaran untuk koreksi nominal",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-02-06",
    changes: [
      "Generator Modul Ajar dengan pendekatan Deep Learning (5 model pembelajaran)",
      "Integrasi Profil Pelajar Pancasila (P5) dalam perencanaan pembelajaran",
      "Asesmen berbasis HOTS (Higher Order Thinking Skills) dengan rubrik",
      "Integrasi otomatis data KKTP (Kriteria Ketercapaian TP) dari ATP",
      "Diferensiasi Pembelajaran (konten, proses, produk)",
      "Fitur simpan Modul Ajar ke database untuk review dan edit",
      "UI collapsible untuk form generator yang lebih terorganisir",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-02-04",
    changes: [
      "Penambahan role Guru dengan akses Kurikulum dan Profil Saya",
      "Halaman Profil Saya untuk guru melihat/edit data GTK pribadi",
      "Halaman Buku Induk untuk Admin dan Bendahara",
      "Penambahan field Akreditasi, No. SK Pendirian, dan Tanggal SK di Pengaturan Madrasah",
      "Kolom user_id di GTK untuk menghubungkan dengan akun autentikasi",
      "RLS policies baru untuk role Guru (akses kurikulum dan data keuangan read-only)",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-02-03",
    changes: [
      "Integrasi Kurikulum Berbasis Cinta (KBC) di ATP dan KKTP",
      "Mapping otomatis Nilai Karakter ke Materi Insersi di Generator RPP",
      "Penambahan field NISN di data siswa (ditampilkan di tabel)",
      "Penambahan field Nama Ayah Kandung dan Ibu Kandung di data siswa",
      "Tampilan detail siswa menampilkan data orang tua lengkap",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-02-03",
    changes: [
      "Rilis awal Sistem Informasi Madrasah",
      "Manajemen Data Siswa dengan import/export Excel",
      "Manajemen Kelas dan Tahun Ajaran",
      "Manajemen GTK/PTK",
      "Sistem Pembayaran dan Keuangan",
      "Manajemen Tunggakan",
      "Proses Kenaikan Kelas dan Alumni",
      "ATP (Alur Tujuan Pembelajaran)",
      "KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)",
      "Template CP (Capaian Pembelajaran)",
      "Multi-role: Admin, Bendahara, Operator",
      "Setup Wizard untuk konfigurasi awal",
    ],
  },
];

// GitHub repository for checking updates (optional - can be configured later)
export const GITHUB_REPO = "jiepau/sim-mtsalwathoniyah43"; // e.g., "username/repo-name"
export const GITHUB_API_URL = GITHUB_REPO ? `https://api.github.com/repos/${GITHUB_REPO}/releases/latest` : "";
