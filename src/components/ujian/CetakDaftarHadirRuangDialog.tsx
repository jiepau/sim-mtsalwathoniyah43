import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { PrintPreviewToolbar, PrintPreviewFrame, type PrintOrientation } from '@/components/print/PrintPreviewToolbar';
import { useUjianRuang, useUjianPeserta, type UjianSesi } from '@/hooks/useUjianSesi';
import { JENIS_UJIAN_SHORT } from '@/lib/ujian-generator';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; sesi: UjianSesi; }

interface MadrasahData {
  nama_madrasah: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
}

const sesiLabels = ['I', 'II', 'III', 'IV'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCityDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildDateRange(start: string, end: string) {
  if (!start) return [];
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end || start);
  if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime())) return [];
  while (current <= last && dates.length < 14) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function CetakDaftarHadirRuangDialog({ open, onOpenChange, sesi }: Props) {
  const [preview, setPreview] = useState(true);
  const [orientation, setOrientation] = useState<PrintOrientation>('landscape');
  const [filterRuang, setFilterRuang] = useState<string>('all');
  const [startDate, setStartDate] = useState(sesi.tanggal_mulai || '');
  const [endDate, setEndDate] = useState(sesi.tanggal_selesai || sesi.tanggal_mulai || '');
  const [sesiPerHari, setSesiPerHari] = useState(3);
  const [ketuaPelaksana, setKetuaPelaksanaState] = useState(() => localStorage.getItem('ujian.ketuaPelaksana') || '');
  const [nipKetua, setNipKetuaState] = useState(() => localStorage.getItem('ujian.nipKetua') || '');
  const setKetuaPelaksana = (v: string) => { setKetuaPelaksanaState(v); localStorage.setItem('ujian.ketuaPelaksana', v); };
  const setNipKetua = (v: string) => { setNipKetuaState(v); localStorage.setItem('ujian.nipKetua', v); };

  const { data: ruang = [] } = useUjianRuang(sesi.id);
  const { data: peserta = [] } = useUjianPeserta(sesi.id);

  const { data: siswaList = [] } = useQuery({
    queryKey: ['siswa-daftar-hadir-ruang', sesi.id, peserta.length],
    queryFn: async () => {
      const ids = peserta.map((p) => p.siswa_id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from('siswa')
        .select('id, nama, kelas:kelas_id(nama_kelas)')
        .in('id', ids);
      return data || [];
    },
    enabled: open,
  });

  const { data: madrasah } = useQuery({
    queryKey: ['madrasah-daftar-hadir-ruang', open],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('nama_madrasah, kepala_madrasah, nip_kepala').maybeSingle();
      return data as MadrasahData | null;
    },
    enabled: open,
  });

  const { data: ta } = useQuery({
    queryKey: ['ta-daftar-hadir-ruang', sesi.ta_id],
    queryFn: async () => {
      if (!sesi.ta_id) return null;
      const { data } = await supabase.from('tahun_ajaran').select('nama_ta').eq('id', sesi.ta_id).maybeSingle();
      return data;
    },
    enabled: !!sesi.ta_id && open,
  });

  const ruangFiltered = useMemo(
    () => (filterRuang === 'all' ? ruang : ruang.filter((r) => r.id === filterRuang)),
    [ruang, filterRuang],
  );

  const pesertaPerRuang = useMemo(() => {
    const sMap = new Map(siswaList.map((s: any) => [s.id, s]));
    const m = new Map<string, any[]>();
    peserta.forEach((p) => {
      if (!p.ruang_id) return;
      const s = sMap.get(p.siswa_id);
      if (!s) return;
      const arr = m.get(p.ruang_id) || [];
      arr.push({ ...p, siswa: s });
      m.set(p.ruang_id, arr);
    });
    m.forEach((arr) => arr.sort((a, b) => (a.nomor_kursi || 0) - (b.nomor_kursi || 0) || a.siswa.nama.localeCompare(b.siswa.nama, 'id')));
    return m;
  }, [peserta, siswaList]);

  const tanggalUjian = useMemo(() => buildDateRange(startDate, endDate), [startDate, endDate]);
  const activeSesiLabels = sesiLabels.slice(0, sesiPerHari);
  const colSpan = 3 + tanggalUjian.length * activeSesiLabels.length;
  const judul = `DAFTAR HADIR PESERTA ${JENIS_UJIAN_SHORT[sesi.jenis] || 'UJIAN'} ${sesi.semester ? sesi.semester.toUpperCase() : ''}`.trim();
  const tahunAjaran = ta?.nama_ta ? `TAHUN AJARAN ${ta.nama_ta}` : '';
  const todayText = formatCityDate(new Date().toISOString().slice(0, 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daftar Hadir per Ruang — {sesi.nama}</DialogTitle>
        </DialogHeader>

        <div className="no-print grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 p-3 rounded-lg border bg-card">
          <div>
            <Label className="text-xs">Ruang</Label>
            <select className="h-9 w-full border rounded-md px-2 text-sm" value={filterRuang} onChange={(e) => setFilterRuang(e.target.value)}>
              <option value="all">Semua Ruang</option>
              {ruang.map((r) => <option key={r.id} value={r.id}>{r.nama_ruang}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Tanggal Mulai</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Tanggal Selesai</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Sesi per Hari</Label>
            <select className="h-9 w-full border rounded-md px-2 text-sm" value={sesiPerHari} onChange={(e) => setSesiPerHari(Number(e.target.value))}>
              <option value={1}>1 sesi</option>
              <option value={2}>2 sesi</option>
              <option value={3}>3 sesi</option>
              <option value={4}>4 sesi</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Ketua Pelaksana</Label>
            <Input value={ketuaPelaksana} onChange={(e) => setKetuaPelaksana(e.target.value)} placeholder="Nama ketua" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">NIP Ketua</Label>
            <Input value={nipKetua} onChange={(e) => setNipKetua(e.target.value)} placeholder="Opsional" className="h-9" />
          </div>
        </div>

        <div className="no-print flex items-center justify-between gap-2 flex-wrap">
          <PrintPreviewToolbar
            preview={preview}
            onTogglePreview={setPreview}
            orientation={orientation}
            onOrientationChange={setOrientation}
            onPrint={() => window.print()}
            disabled={tanggalUjian.length === 0}
            hint="Format mengikuti lampiran: 1 ruang per halaman, kolom tanggal dan sesi untuk tanda hadir."
          />
          <Button variant="outline" size="sm" disabled={tanggalUjian.length === 0} onClick={() => {
            const wb = XLSX.utils.book_new();
            ruangFiltered.forEach((r) => {
              const list = pesertaPerRuang.get(r.id) || [];
              const header1: string[] = ['No', 'Nama', 'Kelas'];
              const header2: string[] = ['', '', ''];
              tanggalUjian.forEach((tgl) => {
                activeSesiLabels.forEach((label, i) => {
                  header1.push(i === 0 ? formatDate(tgl) : '');
                  header2.push(label);
                });
              });
              const aoa: (string | number)[][] = [
                [judul], [madrasah?.nama_madrasah || ''], [tahunAjaran],
                [`Ruang: ${r.nama_ruang}`], [], header1, header2,
                ...list.map((p: any, i: number) => {
                  const row: (string | number)[] = [i + 1, p.siswa.nama, p.siswa.kelas?.nama_kelas || '-'];
                  tanggalUjian.forEach(() => activeSesiLabels.forEach(() => row.push('')));
                  return row;
                }),
              ];
              const ws = XLSX.utils.aoa_to_sheet(aoa);
              ws['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 10 }, ...header1.slice(3).map(() => ({ wch: 6 }))];
              XLSX.utils.book_append_sheet(wb, ws, r.nama_ruang.slice(0, 31));
            });
            XLSX.writeFile(wb, `Daftar-Hadir-${sesi.nama.replace(/\s+/g, '_')}.xlsx`);
          }}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />Download Excel
          </Button>
        </div>

        <PrintPreviewFrame preview={preview} orientation={orientation}>
          <div className="space-y-6" style={{ color: '#000', fontFamily: 'Arial, sans-serif' }}>
            {ruangFiltered.map((r, idx) => {
              const list = pesertaPerRuang.get(r.id) || [];
              return (
                <section key={r.id} style={{ pageBreakAfter: idx < ruangFiltered.length - 1 ? 'always' : 'auto' }}>
                  <table className="w-full border-collapse text-[8pt]" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr><th colSpan={colSpan} className="text-center font-bold text-[12pt] py-0.5 uppercase">{judul}</th></tr>
                      <tr><th colSpan={colSpan} className="text-center font-bold text-[11pt] py-0.5 uppercase">{madrasah?.nama_madrasah || 'MTs Al Wathoniyah 43 Jakarta'}</th></tr>
                      {tahunAjaran && <tr><th colSpan={colSpan} className="text-center font-bold text-[10pt] py-0.5 uppercase">{tahunAjaran}</th></tr>}
                      <tr><th colSpan={colSpan} className="border border-black text-center font-bold text-[10pt] py-1 uppercase">{r.nama_ruang}</th></tr>
                      <tr>
                        <th rowSpan={2} className="border border-black w-[9mm]">NO</th>
                        <th rowSpan={2} className="border border-black w-[52mm]">NAMA</th>
                        <th rowSpan={2} className="border border-black w-[18mm]">KELAS</th>
                        {tanggalUjian.map((tgl) => (
                          <th key={tgl} colSpan={activeSesiLabels.length} className="border border-black h-[8mm] text-center">{formatDate(tgl)}</th>
                        ))}
                      </tr>
                      <tr>
                        {tanggalUjian.flatMap((tgl) => activeSesiLabels.map((label) => (
                          <th key={`${tgl}-${label}`} className="border border-black h-[7mm] text-center w-[11mm]">{label}</th>
                        )))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr><td colSpan={colSpan} className="border border-black text-center h-[12mm]">Belum ada peserta</td></tr>
                      ) : list.map((p: any, i: number) => (
                        <tr key={p.id}>
                          <td className="border border-black text-center h-[8mm]">{i + 1}</td>
                          <td className="border border-black px-1 font-semibold uppercase leading-tight">{p.siswa.nama}</td>
                          <td className="border border-black text-center">{p.siswa.kelas?.nama_kelas || '-'}</td>
                          {tanggalUjian.flatMap((tgl) => activeSesiLabels.map((label) => (
                            <td key={`${p.id}-${tgl}-${label}`} className="border border-black" />
                          )))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="grid grid-cols-2 gap-10 mt-5 text-[9pt]">
                    <div className="text-center">
                      <p>Kepala Madrasah</p>
                      <div className="h-[18mm]" />
                      <p className="font-bold underline">{madrasah?.kepala_madrasah || '.................................'}</p>
                      <p>{madrasah?.nip_kepala ? `NIP. ${madrasah.nip_kepala}` : ''}</p>
                    </div>
                    <div className="text-center">
                      <p>Jakarta, {todayText}</p>
                      <p>Ketua Pelaksana</p>
                      <div className="h-[14mm]" />
                      <p className="font-bold underline">{ketuaPelaksana || '.................................'}</p>
                      <p>{nipKetua ? `NIP. ${nipKetua}` : ''}</p>
                    </div>
                  </div>
                </section>
              );
            })}
            {ruangFiltered.length === 0 && <p className="text-center text-sm py-12">Belum ada ruang.</p>}
          </div>
        </PrintPreviewFrame>
      </DialogContent>
    </Dialog>
  );
}