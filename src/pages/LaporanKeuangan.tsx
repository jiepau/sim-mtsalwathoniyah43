import { useEffect, useMemo, useState } from 'react';
import { FileBarChart, Printer, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';

interface MadrasahSettings {
  nama_madrasah: string;
  alamat: string | null;
  npsn: string | null;
  nsm: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
}

interface PembayaranRow {
  tanggal_bayar: string | null;
  nominal_bayar: number;
  jenis_tagihan: { nama_tagihan: string } | null;
}

interface PengeluaranRow {
  tanggal: string;
  kategori: string;
  deskripsi: string;
  nominal: number;
}

const BULAN_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function LaporanKeuangan() {
  const now = new Date();
  const [periode, setPeriode] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [bulan, setBulan] = useState<number>(now.getMonth() + 1);
  const [tahun, setTahun] = useState<number>(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [pemasukan, setPemasukan] = useState<PembayaranRow[]>([]);
  const [pengeluaran, setPengeluaran] = useState<PengeluaranRow[]>([]);
  const [madrasah, setMadrasah] = useState<MadrasahSettings | null>(null);

  useEffect(() => {
    supabase.from('madrasah_settings').select('*').maybeSingle()
      .then(({ data }) => { if (data) setMadrasah(data as any); });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let startDate: string, endDate: string;
      if (periode === 'bulanan') {
        const start = new Date(tahun, bulan - 1, 1);
        const end = new Date(tahun, bulan, 0, 23, 59, 59);
        startDate = start.toISOString();
        endDate = end.toISOString();
      } else {
        startDate = new Date(tahun, 0, 1).toISOString();
        endDate = new Date(tahun, 11, 31, 23, 59, 59).toISOString();
      }

      const [pRes, kRes] = await Promise.all([
        supabase.from('pembayaran')
          .select('tanggal_bayar, nominal_bayar, jenis_tagihan(nama_tagihan)')
          .not('tanggal_bayar', 'is', null)
          .gte('tanggal_bayar', startDate)
          .lte('tanggal_bayar', endDate),
        supabase.from('pengeluaran')
          .select('tanggal, kategori, deskripsi, nominal')
          .gte('tanggal', startDate.slice(0, 10))
          .lte('tanggal', endDate.slice(0, 10))
          .order('tanggal'),
      ]);

      setPemasukan((pRes.data || []) as any);
      setPengeluaran((kRes.data || []) as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [periode, bulan, tahun]);

  // Group pemasukan by jenis_tagihan
  const pemasukanGrouped = useMemo(() => {
    const map = new Map<string, number>();
    pemasukan.forEach(p => {
      const key = p.jenis_tagihan?.nama_tagihan || 'Lainnya';
      map.set(key, (map.get(key) || 0) + Number(p.nominal_bayar || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [pemasukan]);

  // Group pengeluaran by kategori
  const pengeluaranGrouped = useMemo(() => {
    const map = new Map<string, number>();
    pengeluaran.forEach(p => {
      map.set(p.kategori, (map.get(p.kategori) || 0) + Number(p.nominal || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [pengeluaran]);

  const totalPemasukan = pemasukanGrouped.reduce((s, [, v]) => s + v, 0);
  const totalPengeluaran = pengeluaranGrouped.reduce((s, [, v]) => s + v, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  const periodeLabel = periode === 'bulanan'
    ? `${BULAN_LABELS[bulan - 1]} ${tahun}`
    : `Tahun ${tahun}`;

  const handlePrint = () => window.print();

  const tahunOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="no-print">
        <PageHeader
          title="Laporan Keuangan"
          description="Laporan pemasukan vs pengeluaran (bulanan / tahunan)"
          icon={<FileBarChart className="h-6 w-6" />}
          actions={
            <Button onClick={handlePrint} disabled={loading}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak / PDF
            </Button>
          }
        />
      </div>

      {/* Filter */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Jenis Periode</Label>
              <Select value={periode} onValueChange={(v: any) => setPeriode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {periode === 'bulanan' && (
              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select value={String(bulan)} onValueChange={(v) => setBulan(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BULAN_LABELS.map((b, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={String(tahun)} onValueChange={(v) => setTahun(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tahunOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pemasukan</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totalPemasukan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalPengeluaran)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={saldo >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${saldo >= 0 ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                <Wallet className={`h-6 w-6 ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(saldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 no-print">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* PRINT AREA */}
      <div className="print-area bg-white text-black p-6 rounded-lg border">
        {/* Header Madrasah */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <h1 className="text-lg font-bold uppercase">{madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'}</h1>
          {madrasah?.alamat && <p className="text-xs">{madrasah.alamat}</p>}
          <p className="text-[11px]">
            {madrasah?.npsn && `NPSN: ${madrasah.npsn}`}
            {madrasah?.nsm && ` · NSM: ${madrasah.nsm}`}
          </p>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-base font-bold underline">LAPORAN KEUANGAN</h2>
          <p className="text-sm font-semibold">{periode === 'bulanan' ? 'Bulanan' : 'Tahunan'} — {periodeLabel}</p>
        </div>

        {/* Pemasukan */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2 bg-emerald-100 px-2 py-1 border border-black">A. PEMASUKAN</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1 text-center w-10">No</th>
                <th className="border border-black px-2 py-1 text-left">Jenis Tagihan</th>
                <th className="border border-black px-2 py-1 text-right w-40">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {pemasukanGrouped.length === 0 ? (
                <tr><td colSpan={3} className="border border-black px-2 py-3 text-center italic">Tidak ada data</td></tr>
              ) : pemasukanGrouped.map(([nama, val], i) => (
                <tr key={nama}>
                  <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                  <td className="border border-black px-2 py-1">{nama}</td>
                  <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(val)}</td>
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold">
                <td colSpan={2} className="border border-black px-2 py-1 text-right">TOTAL PEMASUKAN</td>
                <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(totalPemasukan)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pengeluaran */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2 bg-rose-100 px-2 py-1 border border-black">B. PENGELUARAN</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1 text-center w-10">No</th>
                <th className="border border-black px-2 py-1 text-left">Kategori</th>
                <th className="border border-black px-2 py-1 text-right w-40">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {pengeluaranGrouped.length === 0 ? (
                <tr><td colSpan={3} className="border border-black px-2 py-3 text-center italic">Tidak ada data</td></tr>
              ) : pengeluaranGrouped.map(([nama, val], i) => (
                <tr key={nama}>
                  <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                  <td className="border border-black px-2 py-1">{nama}</td>
                  <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(val)}</td>
                </tr>
              ))}
              <tr className="bg-rose-50 font-bold">
                <td colSpan={2} className="border border-black px-2 py-1 text-right">TOTAL PENGELUARAN</td>
                <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(totalPengeluaran)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Saldo */}
        <div className="mb-6">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className={`font-bold ${saldo >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <td className="border-2 border-black px-3 py-2 w-1/2">SALDO ({saldo >= 0 ? 'SURPLUS' : 'DEFISIT'})</td>
                <td className="border-2 border-black px-3 py-2 text-right tabular-nums">{formatCurrency(Math.abs(saldo))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detail Pengeluaran (transaksi) */}
        {pengeluaran.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-2 underline">Lampiran: Detail Transaksi Pengeluaran</h3>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1 w-8">No</th>
                  <th className="border border-black px-2 py-1 w-24">Tanggal</th>
                  <th className="border border-black px-2 py-1">Kategori</th>
                  <th className="border border-black px-2 py-1">Deskripsi</th>
                  <th className="border border-black px-2 py-1 text-right w-32">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {pengeluaran.map((p, i) => (
                  <tr key={i}>
                    <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                    <td className="border border-black px-2 py-1">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="border border-black px-2 py-1">{p.kategori}</td>
                    <td className="border border-black px-2 py-1">{p.deskripsi}</td>
                    <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(p.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TTD */}
        <div className="grid grid-cols-2 gap-8 mt-12 text-xs">
          <div></div>
          <div className="text-center">
            <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-semibold">Kepala Madrasah,</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{madrasah?.kepala_madrasah || '...........................'}</p>
            {madrasah?.nip_kepala && <p>NIP. {madrasah.nip_kepala}</p>}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print, .sidebar-aside, header, nav, footer { display: none !important; }
          .print-area { border: none !important; padding: 0 !important; }
          @page { size: A4; margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
