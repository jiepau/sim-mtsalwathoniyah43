// Centralized version configuration
// Update this file when releasing new versions

export const APP_VERSION = "1.0.0";
export const APP_BUILD_DATE = "2026-02-03";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
export const GITHUB_API_URL = GITHUB_REPO 
  ? `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
  : "";
