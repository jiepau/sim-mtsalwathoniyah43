// Centralized version configuration
// Update this file when releasing new versions

export const APP_VERSION = "3.5.0";
export const APP_BUILD_DATE = "2026-06-05";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.5.0",
    date: "2026-06-05",
    changes: [
      "🎟️ Modul Kartu Ujian: pengelolaan Sesi Ujian (PTS/PAS/PAT/UM) lengkap dengan peserta, ruang, dan jadwal",
      "Distribusi peserta ke ruang otomatis dengan nomor peserta berurutan",
      "Cetak Kartu Peserta Ujian, Daftar Hadir per Ruang, Daftar Ruang, dan Denah Ruang siap pakai",
      "Kartu Meja Siswa baru — ditempel di meja, berisi nama ruang, nama siswa, dan nomor peserta",
      "Opsi ukuran & margin Kartu Meja fleksibel (lebar/tinggi/padding/jarak) dengan font auto-scale mengikuti ukuran kartu",
      "Pengaturan cetak (orientasi, ukuran kertas) tersimpan otomatis — tidak perlu mengatur ulang setiap kali mencetak",
      "Perbaikan keamanan: penguatan RLS dan policy pada tabel ujian",
    ],
  },
  {
    version: "3.4.0",
    date: "2026-05-28",
    changes: [
      "📜 Modul PDUM Pengolah Nilai Ijazah: olah nilai rapor 6 semester + Ujian Madrasah dengan bobot 60/40",
      "Export Excel format resmi Kemenag siap unggah ke aplikasi PDUM",
      "Cetak SKL (Surat Keterangan Lulus) 2 halaman gaya Kemenag — surat resmi + daftar nilai Kelompok A/B/Mulok",
      "QR Code validasi & foto siswa otomatis pada SKL",
      "Halaman publik cek kelulusan untuk siswa/wali murid",
      "Halaman Validasi GTK publik dengan scan QR pada Kartu Tanda Anggota",
    ],
  },
  {
    version: "3.3.0",
    date: "2026-05-20",
    changes: [
      "🎓 Modul SPMB (sebelumnya PPDB): pendaftaran peserta didik baru dengan field EMIS 4.0 lengkap",
      "Form pendaftaran online publik untuk calon siswa/wali",
      "Halaman cek status pendaftaran mandiri menggunakan nomor pendaftaran",
      "Input offline oleh panitia + konversi otomatis ke data Siswa setelah diterima",
      "Rekap pendaftar dengan grafik asal sekolah dan cetak laporan",
      "Pengaturan SPMB (kuota, tanggal, biaya pendaftaran) per tahun ajaran",
    ],
  },
  {
    version: "3.2.0",
    date: "2026-05-12",
    changes: [
      "✉️ Modul Surat Menyurat: pengelolaan Surat Masuk dan Surat Keluar lengkap dengan lampiran",
      "Penomoran surat otomatis sesuai format madrasah",
      "Export surat ke Word (.docx) dengan kop madrasah resmi",
      "Upload lampiran ke storage privat (surat-lampiran) dengan kontrol akses",
      "Pencarian & filter surat berdasarkan tanggal, perihal, dan pengirim/penerima",
    ],
  },
  {
    version: "3.1.0",
    date: "2026-05-05",
    changes: [
      "💰 Modul Gaji Guru: master gaji, pengaturan komponen (gaji pokok, tunjangan, potongan)",
      "Generator gaji bulanan otomatis berdasarkan kehadiran dan jam mengajar",
      "Cetak Slip Gaji per GTK dengan format profesional siap print A4/A5",
      "Tab Slip Gaji Saya untuk guru melihat & cetak slip pribadi",
      "Rekap gaji bulanan/tahunan dengan ringkasan total per kategori",
    ],
  },
  {
    version: "3.0.0",
    date: "2026-04-29",
    changes: [
      "🎨 Pembaruan UI menyeluruh — tampilan baru bertema Hijau Islami yang lebih bersih, modern, dan kontras tinggi",
      "Sidebar, header, dan kartu didesain ulang agar lebih ringkas dan mudah dibaca di layar kecil maupun besar",
      "Penyempurnaan tipografi, spasi, dan ikon di seluruh halaman untuk pengalaman yang lebih konsisten",
      "Penyesuaian semantic color tokens — siap untuk dukungan tema gelap di rilis mendatang",
      "Animasi halus saat berpindah halaman dan membuka dialog",
    ],
  },
  {
    version: "2.6.0",
    date: "2026-04-28",
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
