/**
 * Mapping field database (ppdb_pendaftar) ↔ kolom EMIS 4.0
 * Setiap entry: { db: kolom di database, emis: nama kolom EMIS 4.0, section: bagian form }
 */

export interface EmisFieldMapping {
  db: string;
  emis: string;
  section: 'siswa' | 'ayah' | 'ibu' | 'wali' | 'meta';
}

export const EMIS_FIELD_MAP: EmisFieldMapping[] = [
  // ── Meta / Sistem ──
  { db: 'nomor_pendaftaran', emis: 'NOMOR PENDAFTARAN', section: 'meta' },
  { db: 'status', emis: 'STATUS SELEKSI', section: 'meta' },

  // ── Data Siswa ──
  { db: 'nama', emis: 'NAMA LENGKAP', section: 'siswa' },
  { db: 'nik', emis: 'NIK', section: 'siswa' },
  { db: 'nisn', emis: 'NISN', section: 'siswa' },
  { db: 'kip', emis: 'KIP', section: 'siswa' },
  { db: 'tempat_lahir', emis: 'TEMPAT LAHIR', section: 'siswa' },
  { db: 'tanggal_lahir', emis: 'TANGGAL LAHIR', section: 'siswa' },
  { db: 'jenis_kelamin', emis: 'JENIS KELAMIN', section: 'siswa' },
  { db: 'agama', emis: 'AGAMA', section: 'siswa' },
  { db: 'jumlah_saudara', emis: 'JUMLAH SAUDARA', section: 'siswa' },
  { db: 'anak_ke', emis: 'ANAK KE', section: 'siswa' },
  { db: 'hobi', emis: 'HOBI', section: 'siswa' },
  { db: 'cita_cita', emis: 'CITA-CITA', section: 'siswa' },
  { db: 'prestasi', emis: 'PRESTASI YANG DIRAIH', section: 'siswa' },
  { db: 'no_hp', emis: 'NO. HANDPHONE', section: 'siswa' },
  { db: 'email_siswa', emis: 'ALAMAT EMAIL SISWA', section: 'siswa' },
  { db: 'asal_sekolah', emis: 'ASAL SEKOLAH', section: 'siswa' },
  { db: 'npsn_asal_sekolah', emis: 'NPSN ASAL SEKOLAH', section: 'siswa' },
  { db: 'nsm_asal_sekolah', emis: 'NSM ASAL SEKOLAH', section: 'siswa' },
  { db: 'yang_membiayai', emis: 'YANG MEMBIAYAI SEKOLAH', section: 'siswa' },
  { db: 'kebutuhan_disabilitas', emis: 'KEBUTUHAN DISABILITAS', section: 'siswa' },
  { db: 'kebutuhan_khusus', emis: 'KEBUTUHAN KHUSUS', section: 'siswa' },
  { db: 'alamat', emis: 'ALAMAT', section: 'siswa' },
  { db: 'status_tempat_tinggal', emis: 'STATUS TEMPAT TINGGAL', section: 'siswa' },
  { db: 'jarak_ke_madrasah', emis: 'JARAK TEMPAT TINGGAL - MADRASAH', section: 'siswa' },
  { db: 'waktu_tempuh', emis: 'WAKTU TEMPUH', section: 'siswa' },
  { db: 'transportasi', emis: 'TRANSPORTASI KE SEKOLAH', section: 'siswa' },
  { db: 'wa_ortu', emis: 'NO. WA ORANG TUA/WALI', section: 'siswa' },

  // ── Ayah Kandung ──
  { db: 'nama_ayah', emis: 'AYAH - NAMA LENGKAP', section: 'ayah' },
  { db: 'ayah_nik', emis: 'AYAH - NIK', section: 'ayah' },
  { db: 'ayah_tempat_lahir', emis: 'AYAH - TEMPAT LAHIR', section: 'ayah' },
  { db: 'ayah_tanggal_lahir', emis: 'AYAH - TANGGAL LAHIR', section: 'ayah' },
  { db: 'ayah_status', emis: 'AYAH - STATUS', section: 'ayah' },
  { db: 'ayah_pendidikan', emis: 'AYAH - PENDIDIKAN TERAKHIR', section: 'ayah' },
  { db: 'ayah_pekerjaan', emis: 'AYAH - PEKERJAAN UTAMA', section: 'ayah' },
  { db: 'ayah_domisili', emis: 'AYAH - DOMISILI', section: 'ayah' },
  { db: 'ayah_no_hp', emis: 'AYAH - NO HANDPHONE', section: 'ayah' },
  { db: 'ayah_penghasilan', emis: 'AYAH - PENGHASILAN RATA-RATA PER BULAN (Rp)', section: 'ayah' },
  { db: 'ayah_alamat', emis: 'AYAH - ALAMAT', section: 'ayah' },
  { db: 'ayah_status_tempat_tinggal', emis: 'AYAH - STATUS TEMPAT TINGGAL', section: 'ayah' },

  // ── Ibu Kandung ──
  { db: 'ibu_nama', emis: 'IBU - NAMA LENGKAP', section: 'ibu' },
  { db: 'ibu_nik', emis: 'IBU - NIK', section: 'ibu' },
  { db: 'ibu_tempat_lahir', emis: 'IBU - TEMPAT LAHIR', section: 'ibu' },
  { db: 'ibu_tanggal_lahir', emis: 'IBU - TANGGAL LAHIR', section: 'ibu' },
  { db: 'ibu_status', emis: 'IBU - STATUS', section: 'ibu' },
  { db: 'ibu_pendidikan', emis: 'IBU - PENDIDIKAN TERAKHIR', section: 'ibu' },
  { db: 'ibu_pekerjaan', emis: 'IBU - PEKERJAAN UTAMA', section: 'ibu' },
  { db: 'ibu_domisili', emis: 'IBU - DOMISILI', section: 'ibu' },
  { db: 'ibu_no_hp', emis: 'IBU - NO HANDPHONE', section: 'ibu' },
  { db: 'ibu_penghasilan', emis: 'IBU - PENGHASILAN RATA-RATA PER BULAN (Rp)', section: 'ibu' },
  { db: 'ibu_alamat', emis: 'IBU - ALAMAT', section: 'ibu' },
  { db: 'ibu_status_tempat_tinggal', emis: 'IBU - STATUS TEMPAT TINGGAL', section: 'ibu' },

  // ── Wali ──
  { db: 'wali_nama', emis: 'WALI - NAMA LENGKAP', section: 'wali' },
  { db: 'wali_nik', emis: 'WALI - NIK', section: 'wali' },
  { db: 'wali_tempat_lahir', emis: 'WALI - TEMPAT LAHIR', section: 'wali' },
  { db: 'wali_tanggal_lahir', emis: 'WALI - TANGGAL LAHIR', section: 'wali' },
  { db: 'wali_status', emis: 'WALI - STATUS', section: 'wali' },
  { db: 'wali_pendidikan', emis: 'WALI - PENDIDIKAN TERAKHIR', section: 'wali' },
  { db: 'wali_pekerjaan', emis: 'WALI - PEKERJAAN UTAMA', section: 'wali' },
  { db: 'wali_domisili', emis: 'WALI - DOMISILI', section: 'wali' },
  { db: 'wali_no_hp', emis: 'WALI - NO HANDPHONE', section: 'wali' },
  { db: 'wali_penghasilan', emis: 'WALI - PENGHASILAN RATA-RATA PER BULAN (Rp)', section: 'wali' },
  { db: 'wali_alamat', emis: 'WALI - ALAMAT', section: 'wali' },
  { db: 'wali_status_tempat_tinggal', emis: 'WALI - STATUS TEMPAT TINGGAL', section: 'wali' },
];

/** Export data pendaftar ke CSV dengan header EMIS 4.0 */
export function exportEmisCSV(data: Record<string, unknown>[], filename = 'spmb-emis4.csv') {
  const headers = EMIS_FIELD_MAP.map((f) => f.emis);
  const rows = data.map((row) =>
    EMIS_FIELD_MAP.map((f) => {
      const val = row[f.db];
      return val != null ? String(val) : '';
    })
  );
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse CSV EMIS 4.0 ke array of db-keyed objects */
export function parseEmisCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Parse CSV line respecting quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headerRow = parseLine(lines[0]);
  // Build reverse map: EMIS header → db field
  const emisToDb = new Map<string, string>();
  EMIS_FIELD_MAP.forEach((f) => emisToDb.set(f.emis.toUpperCase(), f.db));

  const colMap: (string | null)[] = headerRow.map((h) => emisToDb.get(h.toUpperCase().trim()) ?? null);

  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const row: Record<string, string> = {};
    colMap.forEach((dbKey, idx) => {
      if (dbKey && vals[idx]) row[dbKey] = vals[idx];
    });
    if (Object.keys(row).length > 0) results.push(row);
  }
  return results;
}
