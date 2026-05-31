import { PrintKopMadrasah, PrintTtdKepala } from '@/components/print/PrintKopMadrasah';
import { formatCurrency } from '@/lib/supabase-helpers';
import { terbilang, NAMA_BULAN } from '@/lib/terbilang';

export interface SlipGajiData {
  periode: {
    id: string;
    bulan: number;
    tahun: number;
    jumlah_hadir: number;
    jumlah_izin: number;
    jumlah_sakit: number;
    jumlah_alpa: number;
    hari_kerja: number;
    total_pendapatan: number;
    total_potongan: number;
    total_bersih: number;
    nomor_slip: string | null;
    tanggal_bayar: string | null;
    catatan: string | null;
    status: string;
  };
  guru: {
    nama: string;
    nip: string | null;
    nuptk: string | null;
    jabatan: string | null;
  };
  detail: { nama_komponen: string; kategori: 'pendapatan' | 'potongan'; nominal: number }[];
  judul: string;
  namaBendahara?: string | null;
}

export function SlipGajiPrint({ data }: { data: SlipGajiData }) {
  const { periode, guru, detail, judul, namaBendahara } = data;
  const pendapatan = detail.filter((d) => d.kategori === 'pendapatan');
  const potongan = detail.filter((d) => d.kategori === 'potongan');
  const periodeLabel = `${NAMA_BULAN[periode.bulan - 1]} ${periode.tahun}`;

  return (
    <div className="bg-white text-black p-6 print:p-4 mx-auto" style={{ width: '148mm', minHeight: '210mm', fontSize: 11 }}>
      <PrintKopMadrasah judul={judul} subjudul={`Periode: ${periodeLabel}`} />

      <table className="w-full mt-3 text-[11px]">
        <tbody>
          <tr>
            <td className="w-28">No. Slip</td><td className="w-2">:</td>
            <td className="font-semibold">{periode.nomor_slip || '-'}</td>
          </tr>
          <tr>
            <td>Nama</td><td>:</td><td className="font-semibold uppercase">{guru.nama}</td>
          </tr>
          <tr>
            <td>NIP / NUPTK</td><td>:</td><td>{guru.nip || '-'} {guru.nuptk ? `/ ${guru.nuptk}` : ''}</td>
          </tr>
          <tr>
            <td>Jabatan</td><td>:</td><td>{guru.jabatan || '-'}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-2 border border-black p-2 text-[10.5px]">
        <p className="font-semibold mb-1">Rekap Kehadiran (Hari Kerja: {periode.hari_kerja})</p>
        <div className="grid grid-cols-4 gap-1 text-center">
          <div><span className="font-semibold">Hadir:</span> {periode.jumlah_hadir}</div>
          <div><span className="font-semibold">Izin:</span> {periode.jumlah_izin}</div>
          <div><span className="font-semibold">Sakit:</span> {periode.jumlah_sakit}</div>
          <div><span className="font-semibold">Alpa:</span> {periode.jumlah_alpa}</div>
        </div>
      </div>

      <table className="w-full mt-3 border border-black text-[11px]">
        <thead>
          <tr className="border-b border-black bg-gray-100">
            <th className="text-left p-1.5 border-r border-black">PENDAPATAN</th>
            <th className="text-right p-1.5 w-32">Jumlah (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {pendapatan.length === 0 ? (
            <tr><td colSpan={2} className="p-1.5 text-center italic">Tidak ada</td></tr>
          ) : pendapatan.map((d, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="p-1.5 border-r border-black">{d.nama_komponen}</td>
              <td className="p-1.5 text-right">{formatCurrency(d.nominal)}</td>
            </tr>
          ))}
          <tr className="font-semibold border-t border-black">
            <td className="p-1.5 border-r border-black">Total Pendapatan</td>
            <td className="p-1.5 text-right">{formatCurrency(periode.total_pendapatan)}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full mt-2 border border-black text-[11px]">
        <thead>
          <tr className="border-b border-black bg-gray-100">
            <th className="text-left p-1.5 border-r border-black">POTONGAN</th>
            <th className="text-right p-1.5 w-32">Jumlah (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {potongan.length === 0 ? (
            <tr><td colSpan={2} className="p-1.5 text-center italic">Tidak ada</td></tr>
          ) : potongan.map((d, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="p-1.5 border-r border-black">{d.nama_komponen}</td>
              <td className="p-1.5 text-right">{formatCurrency(d.nominal)}</td>
            </tr>
          ))}
          <tr className="font-semibold border-t border-black">
            <td className="p-1.5 border-r border-black">Total Potongan</td>
            <td className="p-1.5 text-right">{formatCurrency(periode.total_potongan)}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full mt-2 border-2 border-black text-[12px]">
        <tbody>
          <tr className="font-bold bg-gray-100">
            <td className="p-2 border-r border-black">GAJI BERSIH DITERIMA</td>
            <td className="p-2 text-right w-32">{formatCurrency(periode.total_bersih)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-1 text-[10.5px] italic">
        Terbilang: <span className="font-semibold">{terbilang(periode.total_bersih)}</span>
      </p>

      {periode.catatan && (
        <p className="mt-2 text-[10.5px]"><span className="font-semibold">Catatan:</span> {periode.catatan}</p>
      )}

      <PrintTtdKepala
        kota="Jakarta"
        tanggal={periode.tanggal_bayar || new Date()}
        twoColumn
        kiri={{ jabatan: 'Bendahara', nama: namaBendahara || '...........................' }}
      />
    </div>
  );
}
