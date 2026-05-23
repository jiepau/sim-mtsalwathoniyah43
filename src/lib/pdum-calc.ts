import * as XLSX from 'xlsx';

// ============ Terbilang per-digit (gaya SKL Kemenag) ============
const _DIGIT_WORD = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];

/** 85 → "Delapan Lima"; 100 → "Satu Nol Nol". */
export function terbilangPerDigit(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '';
  return String(Math.round(Number(n))).split('').map(d => _DIGIT_WORD[Number(d)]).join(' ');
}

/** 83.60 → "Delapan Tiga Koma Enam Nol". */
export function terbilangDesimalPerDigit(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(Number(n))) return '';
  const num = Number(n);
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * Math.pow(10, decimals));
  const intWords = terbilangPerDigit(intPart);
  if (decPart === 0) return intWords;
  const decStr = String(decPart).padStart(decimals, '0');
  const decWords = decStr.split('').map(d => _DIGIT_WORD[Number(d)]).join(' ');
  return `${intWords} Koma ${decWords}`;
}


export const SEMESTER_LIST = [
  { kode: '7g', label: 'Kelas 7 Ganjil' },
  { kode: '7n', label: 'Kelas 7 Genap' },
  { kode: '8g', label: 'Kelas 8 Ganjil' },
  { kode: '8n', label: 'Kelas 8 Genap' },
  { kode: '9g', label: 'Kelas 9 Ganjil' },
] as const;

export type SemesterKode = typeof SEMESTER_LIST[number]['kode'];

export interface RaporRow { siswa_id: string; kode_mapel: string; semester: string; nilai: number | null; }
export interface UmRow { siswa_id: string; kode_mapel: string; nilai: number | null; }

export function rataRapor(rows: RaporRow[], siswa_id: string, kode_mapel: string): number | null {
  const nilais = rows
    .filter(r => r.siswa_id === siswa_id && r.kode_mapel === kode_mapel && r.nilai != null)
    .map(r => Number(r.nilai));
  if (!nilais.length) return null;
  return nilais.reduce((a, b) => a + b, 0) / nilais.length;
}

export function nilaiAkhir(
  rata: number | null,
  um: number | null,
  bobotRapor: number,
  bobotUm: number,
): number | null {
  if (rata == null && um == null) return null;
  const totalBobot = bobotRapor + bobotUm;
  if (totalBobot === 0) return null;
  // Bila salah satu null, pakai yang ada
  if (rata == null) return Number(um);
  if (um == null) return Number(rata);
  return Math.round(((rata * bobotRapor + um * bobotUm) / totalBobot) * 100) / 100;
}

export function formatDateDDMMYYYY(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export interface ExportPDUMArgs {
  nsm: string;
  namaMadrasah: string;
  provinsi: string;
  kabupaten: string;
  siswaList: Array<{
    id: string;
    nama: string;
    nisn: string | null;
    jenis_kelamin: string | null;
    tempat_lahir: string | null;
    tanggal_lahir: string | null;
    nama_ayah_kandung: string | null;
    nama_ibu_kandung: string | null;
  }>;
  pesertaMap: Record<string, { nomor_peserta: string | null; kelas_ujian: number | null; jurusan: string | null; no_absen: number | null; nama_ayah_override: string | null; nama_ibu_override: string | null; }>;
  mapelList: Array<{ kode_mapel: string; nama_mapel: string; urutan: number }>;
  rapor: RaporRow[];
  um: UmRow[];
  bobotRapor: number;
  bobotUm: number;
}

export function exportPDUMExcel(args: ExportPDUMArgs) {
  const { nsm, namaMadrasah, provinsi, kabupaten, siswaList, pesertaMap, mapelList, rapor, um, bobotRapor, bobotUm } = args;

  const sortedMapel = [...mapelList].sort((a, b) => a.urutan - b.urutan);
  const header1: any[] = ['Template Siswa PDUM'];
  const header2: any[] = ['NSM :', nsm || '', '', '', 'Prov:', provinsi || ''];
  const header3: any[] = ['Nama :', namaMadrasah || '', '', '', 'Kab :', kabupaten || ''];
  const blank: any[] = [];

  const cols = ['No', 'Nomor Peserta', 'NISN', 'NAMA', 'JENIS KELAMIN', 'Tempat Lahir', 'Tgl Lahir (dd-mm-yyyy)', 'Kelas', 'Jurusan', 'No Absen', 'Nama Ayah', 'Nama Ibu'];
  // Tambah kolom nilai akhir per mapel
  sortedMapel.forEach(m => cols.push(m.nama_mapel));

  const rows: any[][] = [header1, header2, header3, blank, cols];

  siswaList.forEach((s, idx) => {
    const p = pesertaMap[s.id] || ({} as any);
    const row: any[] = [
      idx + 1,
      p.nomor_peserta || '',
      s.nisn || '',
      s.nama,
      s.jenis_kelamin === 'Laki-laki' ? 'L' : s.jenis_kelamin === 'Perempuan' ? 'P' : (s.jenis_kelamin || ''),
      s.tempat_lahir || '',
      formatDateDDMMYYYY(s.tanggal_lahir),
      p.kelas_ujian ?? 1,
      p.jurusan || 'UMUM',
      p.no_absen ?? 0,
      p.nama_ayah_override || s.nama_ayah_kandung || '',
      p.nama_ibu_override || s.nama_ibu_kandung || '',
    ];
    sortedMapel.forEach(m => {
      const rata = rataRapor(rapor, s.id, m.kode_mapel);
      const umVal = um.find(u => u.siswa_id === s.id && u.kode_mapel === m.kode_mapel)?.nilai ?? null;
      const na = nilaiAkhir(rata, umVal as number | null, bobotRapor, bobotUm);
      row.push(na ?? '');
    });
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DNT-PDUM');
  XLSX.writeFile(wb, `DNT-PDUM-${namaMadrasah.replace(/\s+/g, '_')}.xlsx`);
}

export function exportRekapNilaiAkhir(args: Omit<ExportPDUMArgs, 'nsm' | 'provinsi' | 'kabupaten' | 'pesertaMap'> & { kelasNama?: string }) {
  const { namaMadrasah, siswaList, mapelList, rapor, um, bobotRapor, bobotUm, kelasNama } = args;
  const sortedMapel = [...mapelList].sort((a, b) => a.urutan - b.urutan);
  const cols = ['No', 'NISN', 'NIS', 'NAMA', ...sortedMapel.map(m => m.nama_mapel), 'Rata-rata NA'];
  const rows: any[][] = [
    [`Rekap Nilai Akhir Ijazah - ${namaMadrasah}${kelasNama ? ' - ' + kelasNama : ''}`],
    [`Bobot: Rapor ${bobotRapor}% + UM ${bobotUm}%`],
    [],
    cols,
  ];
  siswaList.forEach((s: any, idx) => {
    const naList: number[] = [];
    const row: any[] = [idx + 1, s.nisn || '', s.nis || '', s.nama];
    sortedMapel.forEach(m => {
      const rata = rataRapor(rapor, s.id, m.kode_mapel);
      const umVal = um.find(u => u.siswa_id === s.id && u.kode_mapel === m.kode_mapel)?.nilai ?? null;
      const na = nilaiAkhir(rata, umVal as number | null, bobotRapor, bobotUm);
      if (na != null) naList.push(na);
      row.push(na ?? '');
    });
    const avg = naList.length ? Math.round((naList.reduce((a, b) => a + b, 0) / naList.length) * 100) / 100 : '';
    row.push(avg);
    rows.push(row);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
  XLSX.writeFile(wb, `Rekap-NA-PDUM-${(kelasNama || 'semua').replace(/\s+/g, '_')}.xlsx`);
}

export function parseNilaiExcel(file: File, mapelList: Array<{ kode_mapel: string; nama_mapel: string }>): Promise<{ rows: Array<{ nisn: string; nis: string; nilai: Record<string, number> }>; warnings: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        // Cari baris header (yang mengandung NISN atau NIS)
        let headerIdx = -1;
        for (let i = 0; i < Math.min(aoa.length, 15); i++) {
          const row = aoa[i].map((c: any) => String(c).trim().toUpperCase());
          if (row.includes('NISN') || row.includes('NIS')) { headerIdx = i; break; }
        }
        if (headerIdx < 0) { reject(new Error('Header NISN/NIS tidak ditemukan')); return; }
        const headers = aoa[headerIdx].map((c: any) => String(c).trim());
        const nisnIdx = headers.findIndex(h => h.toUpperCase() === 'NISN');
        const nisIdx = headers.findIndex(h => h.toUpperCase() === 'NIS');
        const mapelByName: Record<string, string> = {};
        mapelList.forEach(m => { mapelByName[m.nama_mapel.toLowerCase()] = m.kode_mapel; mapelByName[m.kode_mapel.toLowerCase()] = m.kode_mapel; });

        const warnings: string[] = [];
        const rows: Array<{ nisn: string; nis: string; nilai: Record<string, number> }> = [];
        for (let i = headerIdx + 1; i < aoa.length; i++) {
          const r = aoa[i];
          if (!r || r.every((c: any) => c === '' || c == null)) continue;
          const nisn = nisnIdx >= 0 ? String(r[nisnIdx] ?? '').trim() : '';
          const nis = nisIdx >= 0 ? String(r[nisIdx] ?? '').trim() : '';
          if (!nisn && !nis) continue;
          const nilai: Record<string, number> = {};
          headers.forEach((h, idx) => {
            const kode = mapelByName[h.toLowerCase()];
            if (!kode) return;
            const v = r[idx];
            if (v === '' || v == null) return;
            const num = Number(v);
            if (!isNaN(num)) nilai[kode] = num;
          });
          rows.push({ nisn, nis, nilai });
        }
        resolve({ rows, warnings });
      } catch (err: any) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Gagal baca file'));
    reader.readAsArrayBuffer(file);
  });
}
