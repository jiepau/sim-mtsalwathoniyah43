// Centralized version configuration
// Update this file when releasing new versions

export const APP_VERSION = "1.3.0";
export const APP_BUILD_DATE = "2026-03-01";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
