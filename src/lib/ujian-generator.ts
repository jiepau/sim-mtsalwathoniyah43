/**
 * Logika auto-generate nomor peserta dan distribusi ruang ujian.
 * - Nomor peserta: {prefix}-{NNNN} (4 digit) urut: tingkat kelas (7→9) → nama.
 * - Distribusi ruang: isi tiap ruang sampai kapasitas penuh, lanjut ruang berikutnya.
 * - Override manual (is_manual_override=true) tidak ditimpa saat regenerate.
 */

export interface SiswaInput {
  id: string;
  nama: string;
  kelas_id: string | null;
  tingkat: number; // 7|8|9
  nama_kelas?: string | null;
}

/**
 * Ambil kode kelas numerik 2 digit dari nama kelas.
 * "8-1" → "81", "VIII-2" → "82" (pakai tingkat + paralel),
 * "7A" → "71" (A=1), fallback "{tingkat}0".
 */
export function kodeKelasFromNama(namaKelas: string | null | undefined, tingkat: number): string {
  const t = String(tingkat || 0);
  if (!namaKelas) return `${t}0`;
  // Coba ambil digit terakhir sebagai paralel
  const digits = namaKelas.replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-2);
  if (digits.length === 1) return `${t}${digits}`;
  // Tidak ada digit → coba huruf paralel (A=1, B=2, ...)
  const m = namaKelas.match(/[A-Za-z]$/);
  if (m) {
    const idx = m[0].toUpperCase().charCodeAt(0) - 64; // A=1
    if (idx >= 1 && idx <= 9) return `${t}${idx}`;
  }
  return `${t}0`;
}

export interface RuangInput {
  id: string;
  kapasitas: number;
  urutan: number;
}

export interface PesertaOutput {
  siswa_id: string;
  kelas_asal_id: string | null;
  nomor_peserta: string;
  ruang_id: string | null;
  nomor_kursi: number | null;
}

export interface ExistingPeserta {
  siswa_id: string;
  nomor_peserta: string;
  ruang_id: string | null;
  nomor_kursi: number | null;
  is_manual_override: boolean;
}

/** Generate nomor peserta dan tempatkan ke ruang. */
export function generatePesertaDistribusi(
  siswa: SiswaInput[],
  ruang: RuangInput[],
  prefix: string,
  existing: ExistingPeserta[] = [],
): PesertaOutput[] {
  // Sortir siswa: tingkat → nama
  const sorted = [...siswa].sort(
    (a, b) => a.tingkat - b.tingkat || a.nama.localeCompare(b.nama, 'id'),
  );

  const existingMap = new Map(existing.map((e) => [e.siswa_id, e]));
  const sortedRuang = [...ruang].sort((a, b) => a.urutan - b.urutan);

  // Track seat occupancy untuk override manual
  const seatTaken = new Set<string>(); // key: ruangId:seat
  const numbersTaken = new Set<string>();
  for (const e of existing) {
    if (e.is_manual_override) {
      if (e.ruang_id && e.nomor_kursi) seatTaken.add(`${e.ruang_id}:${e.nomor_kursi}`);
      if (e.nomor_peserta) numbersTaken.add(e.nomor_peserta);
    }
  }

  // Pointer ruang aktif (untuk auto-assign)
  let ruangIdx = 0;
  let kursiNext = 1;

  const result: PesertaOutput[] = [];
  let seq = 1;

  for (const s of sorted) {
    const ex = existingMap.get(s.id);

    // Pakai nomor peserta lama jika manual override atau jika tersedia
    let nomor: string;
    if (ex?.is_manual_override) {
      nomor = ex.nomor_peserta;
    } else {
      // Cari nomor berikutnya yang belum dipakai
      do {
        nomor = `${prefix}-${String(seq).padStart(4, '0')}`;
        seq++;
      } while (numbersTaken.has(nomor));
    }

    // Tempatkan ke ruang
    let ruang_id: string | null = null;
    let nomor_kursi: number | null = null;

    if (ex?.is_manual_override && ex.ruang_id) {
      ruang_id = ex.ruang_id;
      nomor_kursi = ex.nomor_kursi;
    } else {
      // Cari kursi kosong di ruang aktif
      while (ruangIdx < sortedRuang.length) {
        const r = sortedRuang[ruangIdx];
        // Skip kursi yang sudah ditempati manual
        while (kursiNext <= r.kapasitas && seatTaken.has(`${r.id}:${kursiNext}`)) {
          kursiNext++;
        }
        if (kursiNext <= r.kapasitas) {
          ruang_id = r.id;
          nomor_kursi = kursiNext;
          kursiNext++;
          break;
        }
        ruangIdx++;
        kursiNext = 1;
      }
    }

    result.push({
      siswa_id: s.id,
      kelas_asal_id: s.kelas_id,
      nomor_peserta: nomor,
      ruang_id,
      nomor_kursi,
    });
  }

  return result;
}

export function defaultPrefix(jenis: string, tahun: number): string {
  const yy = String(tahun).slice(-2);
  return `${jenis.toUpperCase()}${yy}`;
}

export const JENIS_UJIAN_LABEL: Record<string, string> = {
  pts: 'PTS (Penilaian Tengah Semester)',
  pas: 'PAS (Penilaian Akhir Semester)',
  pat: 'PAT (Penilaian Akhir Tahun)',
  um: 'UM (Ujian Madrasah)',
};

export const JENIS_UJIAN_SHORT: Record<string, string> = {
  pts: 'PTS',
  pas: 'PAS',
  pat: 'PAT',
  um: 'UM',
};
