/** Konversi angka ke kata bahasa Indonesia (untuk slip gaji/kwitansi). */
const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function helper(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return helper(n - 10) + ' belas';
  if (n < 100) return helper(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + helper(n % 10) : '');
  if (n < 200) return 'seratus' + (n - 100 ? ' ' + helper(n - 100) : '');
  if (n < 1000) return helper(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + helper(n % 100) : '');
  if (n < 2000) return 'seribu' + (n - 1000 ? ' ' + helper(n - 1000) : '');
  if (n < 1_000_000) return helper(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + helper(n % 1000) : '');
  if (n < 1_000_000_000) return helper(Math.floor(n / 1_000_000)) + ' juta' + (n % 1_000_000 ? ' ' + helper(n % 1_000_000) : '');
  return helper(Math.floor(n / 1_000_000_000)) + ' miliar' + (n % 1_000_000_000 ? ' ' + helper(n % 1_000_000_000) : '');
}

export function terbilang(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'nol rupiah';
  const result = helper(n).trim().replace(/\s+/g, ' ') + ' rupiah';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
