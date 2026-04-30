import { useEffect, useRef, useState } from 'react';
import { Printer, Loader2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/supabase-helpers';

interface KwitansiData {
  id: string;
  nominal: number;
  nominal_bayar: number;
  status: string;
  tanggal_bayar: string | null;
  bulan: number | null;
  tahun: number | null;
  keterangan: string | null;
  created_at: string;
  jenis_tagihan?: { nama_tagihan: string };
}

interface SiswaInfo {
  id: string;
  nama: string;
  nis: string;
}

interface KwitansiPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: KwitansiData[]; // 1+ transaksi
  siswaInfo?: SiswaInfo;
}

interface MadrasahInfo {
  nama_madrasah: string;
  alamat: string | null;
  npsn: string | null;
  nsm: string | null;
  no_telp: string | null;
}

type PaperSize = 'A4' | 'A5';
type Orientation = 'portrait' | 'landscape';

const BULAN_LABEL = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Page sizes in mm: [width, height] portrait
const PAGE_DIMS: Record<PaperSize, [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
};

function terbilang(n: number): string {
  const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (n < 0) return 'Minus ' + terbilang(-n);
  if (n < 12) return angka[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh' + (n % 10 ? ' ' + terbilang(n % 10) : '');
  if (n < 200) return 'Seratus' + (n - 100 ? ' ' + terbilang(n - 100) : '');
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'Seribu' + (n - 1000 ? ' ' + terbilang(n - 1000) : '');
  if (n < 1_000_000) return terbilang(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1_000_000_000) return terbilang(Math.floor(n / 1_000_000)) + ' Juta' + (n % 1_000_000 ? ' ' + terbilang(n % 1_000_000) : '');
  if (n < 1_000_000_000_000) return terbilang(Math.floor(n / 1_000_000_000)) + ' Miliar' + (n % 1_000_000_000 ? ' ' + terbilang(n % 1_000_000_000) : '');
  return String(n);
}

function buildNomor(p: KwitansiData) {
  const d = p.tanggal_bayar ? new Date(p.tanggal_bayar) : new Date(p.created_at);
  const last4 = p.id.replace(/-/g, '').slice(-4).toUpperCase();
  return `KW/${last4}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function KwitansiPrintDialog({ open, onOpenChange, payments, siswaInfo }: KwitansiPrintDialogProps) {
  const [madrasah, setMadrasah] = useState<MadrasahInfo | null>(null);
  const [kelasNama, setKelasNama] = useState<string>('-');
  const [bendaharaNama, setBendaharaNama] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>('A5');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [preview, setPreview] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !payments.length || !siswaInfo) return;
    setLoading(true);
    (async () => {
      const [mRes, kRes, bRes] = await Promise.all([
        supabase.from('madrasah_settings')
          .select('nama_madrasah, alamat, npsn, nsm, no_telp')
          .maybeSingle(),
        supabase.from('siswa')
          .select('kelas:kelas_id(nama_kelas)')
          .eq('id', siswaInfo.id)
          .maybeSingle(),
        supabase.from('user_roles')
          .select('user_id')
          .eq('role', 'bendahara')
          .limit(1)
          .maybeSingle(),
      ]);

      if (mRes.data) setMadrasah(mRes.data as any);
      const kData: any = kRes.data;
      if (kData?.kelas?.nama_kelas) setKelasNama(kData.kelas.nama_kelas);
      else setKelasNama('-');

      if (bRes.data?.user_id) {
        const { data: gtk } = await supabase
          .from('gtk_ptk')
          .select('nama')
          .eq('user_id', bRes.data.user_id)
          .maybeSingle();
        if (gtk?.nama) setBendaharaNama(gtk.nama);
        else setBendaharaNama('');
      }
      setLoading(false);
    })();
  }, [open, payments, siswaInfo]);

  if (!payments.length || !siswaInfo) return null;

  const handlePrint = () => window.print();

  const [pw, ph] = PAGE_DIMS[paperSize];
  const isLandscape = orientation === 'landscape';
  const pageW = isLandscape ? ph : pw;
  const pageH = isLandscape ? pw : ph;
  // Padding scales a bit for A4
  const pagePadding = paperSize === 'A4' ? '14mm' : '8mm';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Cetak Kwitansi {payments.length > 1 ? `(${payments.length} transaksi)` : ''}
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="no-print flex flex-wrap items-end justify-between gap-3 p-3 rounded-lg border bg-card mb-3">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-xs">Ukuran Kertas</Label>
              <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210×297)</SelectItem>
                  <SelectItem value="A5">A5 (148×210)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Orientasi</Label>
              <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait (tegak)</SelectItem>
                  <SelectItem value="landscape">Landscape (lebar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={preview ? 'secondary' : 'outline'}
              onClick={() => setPreview(!preview)}
              disabled={loading}
            >
              {preview ? <><EyeOff className="h-4 w-4 mr-2" /> Tutup Pratinjau</> : <><Eye className="h-4 w-4 mr-2" /> Pratinjau</>}
            </Button>
            <Button onClick={handlePrint} disabled={loading}>
              <Printer className="h-4 w-4 mr-2" /> Cetak / PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div ref={printRef} className="kwitansi-print-root">
            {payments.map((payment, idx) => {
              const sisa = Number(payment.nominal) - Number(payment.nominal_bayar);
              const periode = payment.bulan && payment.tahun
                ? `${BULAN_LABEL[payment.bulan]} ${payment.tahun}` : '-';
              const tanggalBayar = payment.tanggal_bayar
                ? formatDate(payment.tanggal_bayar)
                : formatDate(payment.created_at);

              return (
                <div
                  key={payment.id}
                  className={`kwitansi-page bg-white text-black ${preview ? 'shadow-lg mx-auto mb-4' : ''}`}
                  style={{
                    width: `${pageW}mm`,
                    minHeight: `${pageH}mm`,
                    padding: pagePadding,
                    boxSizing: 'border-box',
                    fontFamily: 'Arial, sans-serif',
                    pageBreakAfter: idx < payments.length - 1 ? 'always' : 'auto',
                  }}
                >
                  {/* Kop */}
                  <div className="flex items-center gap-3 border-b-2 border-black pb-2">
                    <img src="/logo-alwathoniyah.png" alt="Logo" className="h-14 w-14 object-contain" />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] leading-tight">PEMERINTAH KEMENTERIAN AGAMA</p>
                      <h1 className="text-base font-bold uppercase leading-tight">
                        {madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'}
                      </h1>
                      {madrasah?.alamat && (
                        <p className="text-[9px] leading-tight">{madrasah.alamat}</p>
                      )}
                      <p className="text-[9px] leading-tight">
                        {madrasah?.npsn && `NPSN: ${madrasah.npsn}`}
                        {madrasah?.nsm && ` · NSM: ${madrasah.nsm}`}
                        {madrasah?.no_telp && ` · Telp: ${madrasah.no_telp}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-center mt-3 mb-3">
                    <h2 className="text-sm font-bold underline tracking-wide">KWITANSI PEMBAYARAN</h2>
                    <p className="text-[10px]">No: <strong>{buildNomor(payment)}</strong></p>
                  </div>

                  <table className="text-[11px] w-full mb-3">
                    <tbody>
                      <tr>
                        <td className="w-32 align-top py-0.5">Telah diterima dari</td>
                        <td className="w-2 align-top">:</td>
                        <td className="font-semibold align-top">{siswaInfo.nama}</td>
                      </tr>
                      <tr>
                        <td className="align-top py-0.5">NIS / Kelas</td>
                        <td className="align-top">:</td>
                        <td className="align-top">{siswaInfo.nis} / {kelasNama}</td>
                      </tr>
                      <tr>
                        <td className="align-top py-0.5">Untuk pembayaran</td>
                        <td className="align-top">:</td>
                        <td className="align-top">
                          {payment.jenis_tagihan?.nama_tagihan || '-'}
                          {payment.bulan ? ` — Periode ${periode}` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="align-top py-0.5">Terbilang</td>
                        <td className="align-top">:</td>
                        <td className="align-top italic">
                          {terbilang(Number(payment.nominal_bayar))} Rupiah
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="grid grid-cols-3 gap-2 text-[10px] mb-3">
                    <div className="border border-black p-2 text-center">
                      <p className="text-[9px]">Tagihan</p>
                      <p className="font-bold">{formatCurrency(payment.nominal)}</p>
                    </div>
                    <div className="border border-black p-2 text-center bg-emerald-50">
                      <p className="text-[9px]">Dibayar</p>
                      <p className="font-bold text-emerald-700">{formatCurrency(payment.nominal_bayar)}</p>
                    </div>
                    <div className={`border border-black p-2 text-center ${sisa > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                      <p className="text-[9px]">Sisa</p>
                      <p className={`font-bold ${sisa > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {formatCurrency(sisa)}
                      </p>
                    </div>
                  </div>

                  {payment.keterangan && (
                    <p className="text-[10px] italic mb-2">Catatan: {payment.keterangan}</p>
                  )}

                  <div className="flex justify-between mt-6 text-[10px]">
                    <div className="text-center w-44">
                      <p>Penyetor,</p>
                      <div className="h-12"></div>
                      <p className="border-t border-black pt-0.5 font-semibold">{siswaInfo.nama}</p>
                    </div>
                    <div className="text-center w-52">
                      <p>{tanggalBayar}</p>
                      <p>Bendahara,</p>
                      <div className="h-12"></div>
                      <p className="border-t border-black pt-0.5 font-semibold">
                        {bendaharaNama || '(.............................)'}
                      </p>
                    </div>
                  </div>

                  <p className="text-[8px] text-center text-gray-500 mt-3 italic">
                    Kwitansi ini sah sebagai bukti pembayaran resmi.
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          @media print {
            @page { size: ${paperSize} ${orientation}; margin: 0; }
            body * { visibility: hidden; }
            .kwitansi-print-root, .kwitansi-print-root * { visibility: visible; }
            .kwitansi-print-root { position: absolute; left: 0; top: 0; width: 100%; }
            .kwitansi-page { box-shadow: none !important; margin: 0 !important; }
            .no-print { display: none !important; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
