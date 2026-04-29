import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';
import { PrintPreviewToolbar, PrintPreviewFrame, type PrintOrientation } from '@/components/print/PrintPreviewToolbar';

interface KartuSppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siswaId: string;
  siswaNama: string;
  siswaNis: string;
  kelasNama?: string;
}

interface PembayaranItem {
  bulan: number | null;
  tahun: number | null;
  nominal: number;
  nominal_bayar: number;
  status: string;
  tanggal_bayar: string | null;
  jenis_tagihan: { nama_tagihan: string } | null;
  jenis_tagihan_id: string;
}

interface JenisTagihan { id: string; nama_tagihan: string; nominal: number; }
interface Madrasah { nama_madrasah: string; alamat: string | null; npsn: string | null; nsm: string | null; }
interface TaOption { id: string; nama_ta: string; semester: string; is_active: boolean; }

const BULAN = ['Jul','Agu','Sep','Okt','Nov','Des','Jan','Feb','Mar','Apr','Mei','Jun'];
const BULAN_NUM = [7,8,9,10,11,12,1,2,3,4,5,6];

export function KartuSppPrintDialog({ open, onOpenChange, siswaId, siswaNama, siswaNis, kelasNama }: KartuSppDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pembayaran, setPembayaran] = useState<PembayaranItem[]>([]);
  const [jenisTagihan, setJenisTagihan] = useState<JenisTagihan[]>([]);
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [taList, setTaList] = useState<TaOption[]>([]);
  const [selectedTaId, setSelectedTaId] = useState<string>('');
  const [preview, setPreview] = useState(false);
  const [orientation, setOrientation] = useState<PrintOrientation>('landscape');

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [taRes, mRes, jRes] = await Promise.all([
        supabase.from('tahun_ajaran').select('id, nama_ta, semester, is_active').order('nama_ta', { ascending: false }),
        supabase.from('madrasah_settings').select('nama_madrasah, alamat, npsn, nsm').maybeSingle(),
        supabase.from('jenis_tagihan').select('id, nama_tagihan, nominal').eq('is_active', true),
      ]);
      if (taRes.data) {
        setTaList(taRes.data as any);
        const active = taRes.data.find(t => t.is_active);
        if (active) setSelectedTaId(active.id);
      }
      if (mRes.data) setMadrasah(mRes.data as any);
      if (jRes.data) setJenisTagihan(jRes.data as any);
    })();
  }, [open]);

  useEffect(() => {
    if (!selectedTaId) return;
    setLoading(true);
    supabase.from('pembayaran')
      .select('bulan, tahun, nominal, nominal_bayar, status, tanggal_bayar, jenis_tagihan_id, jenis_tagihan(nama_tagihan)')
      .eq('siswa_id', siswaId)
      .eq('ta_id', selectedTaId)
      .then(({ data }) => {
        setPembayaran((data || []) as any);
        setLoading(false);
      });
  }, [selectedTaId, siswaId]);

  const ta = taList.find(t => t.id === selectedTaId);
  const tahunAjaranLabel = ta?.nama_ta || '-';

  // Find SPP-like jenis tagihan (any tagihan that has bulan)
  const sppTagihan = jenisTagihan.filter(jt =>
    pembayaran.some(p => p.jenis_tagihan_id === jt.id && p.bulan !== null)
  );

  // Build matrix: rows = jenis tagihan, columns = 12 bulan (Jul-Jun)
  const getCellData = (jenisId: string, bulanNum: number): PembayaranItem | null => {
    return pembayaran.find(p => p.jenis_tagihan_id === jenisId && p.bulan === bulanNum) || null;
  };

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cetak Kartu SPP — {siswaNama}</DialogTitle>
        </DialogHeader>

        <div className="no-print space-y-3 mb-4">
          <div className="space-y-2">
            <Label>Tahun Ajaran</Label>
            <Select value={selectedTaId} onValueChange={setSelectedTaId}>
              <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
              <SelectContent>
                {taList.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama_ta} — {t.semester}{t.is_active ? ' (Aktif)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PrintPreviewToolbar
            preview={preview}
            onTogglePreview={setPreview}
            orientation={orientation}
            onOrientationChange={setOrientation}
            onPrint={handlePrint}
            disabled={loading || sppTagihan.length === 0}
            hint="Kartu SPP biasanya pas di landscape. Aktifkan pratinjau untuk melihat hasil sebelum cetak."
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <PrintPreviewFrame preview={preview} orientation={orientation}>
          <div className={`kartu-spp-print ${preview ? '' : 'bg-white text-black p-6 border rounded-lg'}`}>
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-3">
              <h1 className="text-base font-bold uppercase">{madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'}</h1>
              {madrasah?.alamat && <p className="text-[11px]">{madrasah.alamat}</p>}
              <p className="text-[10px]">
                {madrasah?.npsn && `NPSN: ${madrasah.npsn}`}
                {madrasah?.nsm && ` · NSM: ${madrasah.nsm}`}
              </p>
            </div>

            <div className="text-center mb-3">
              <h2 className="text-sm font-bold underline">KARTU PEMBAYARAN SPP</h2>
              <p className="text-xs">Tahun Ajaran: <strong>{tahunAjaranLabel}</strong></p>
            </div>

            {/* Identitas Siswa */}
            <table className="text-xs mb-3">
              <tbody>
                <tr>
                  <td className="pr-2">Nama</td><td className="pr-2">:</td>
                  <td className="font-semibold pr-8">{siswaNama}</td>
                  <td className="pr-2">NIS</td><td className="pr-2">:</td>
                  <td className="font-semibold">{siswaNis}</td>
                </tr>
                <tr>
                  <td className="pr-2">Kelas</td><td className="pr-2">:</td>
                  <td className="font-semibold pr-8">{kelasNama || '-'}</td>
                  <td className="pr-2">TA</td><td className="pr-2">:</td>
                  <td className="font-semibold">{tahunAjaranLabel}</td>
                </tr>
              </tbody>
            </table>

            {/* Matrix Tagihan */}
            {sppTagihan.length === 0 ? (
              <p className="text-xs italic text-center py-4">
                Belum ada data pembayaran berbasis bulanan untuk TA ini.
              </p>
            ) : (
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-emerald-100">
                    <th className="border border-black px-1 py-1 text-left">Jenis Tagihan</th>
                    {BULAN.map(b => (
                      <th key={b} className="border border-black px-1 py-1 text-center w-[7%]">{b}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sppTagihan.map(jt => (
                    <tr key={jt.id}>
                      <td className="border border-black px-2 py-1">
                        <div className="font-semibold">{jt.nama_tagihan}</div>
                        <div className="text-[9px] text-gray-600">{formatCurrency(jt.nominal)}</div>
                      </td>
                      {BULAN_NUM.map(bn => {
                        const cell = getCellData(jt.id, bn);
                        if (!cell) {
                          return <td key={bn} className="border border-black h-12 text-center align-middle text-gray-400">-</td>;
                        }
                        const lunas = cell.status === 'lunas';
                        const cicil = cell.status === 'cicil';
                        return (
                          <td key={bn} className={`border border-black h-12 text-center align-middle text-[9px] ${lunas ? 'bg-emerald-50' : cicil ? 'bg-yellow-50' : 'bg-rose-50'}`}>
                            {lunas ? (
                              <div>
                                <div className="font-bold text-emerald-700">LUNAS</div>
                                {cell.tanggal_bayar && (
                                  <div className="text-[8px]">{new Date(cell.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</div>
                                )}
                              </div>
                            ) : cicil ? (
                              <div>
                                <div className="font-bold text-yellow-700">Cicil</div>
                                <div className="text-[8px]">{formatCurrency(cell.nominal_bayar)}</div>
                              </div>
                            ) : (
                              <div className="text-rose-600 font-semibold">Belum</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-3 text-[10px] flex gap-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-emerald-50 border border-black"></span> Lunas</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-yellow-50 border border-black"></span> Cicil</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-rose-50 border border-black"></span> Belum Bayar</span>
            </div>

            {/* TTD */}
            <div className="grid grid-cols-2 gap-8 mt-8 text-[10px]">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p>Wali Murid</p>
                <div className="h-12"></div>
                <p className="font-semibold">(.................................)</p>
              </div>
              <div className="text-center">
                <p>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Bendahara</p>
                <div className="h-12"></div>
                <p className="font-semibold">(.................................)</p>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .kartu-spp-print, .kartu-spp-print * { visibility: visible; }
            .kartu-spp-print { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
            .no-print { display: none !important; }
            @page { size: A4 landscape; margin: 1cm; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
