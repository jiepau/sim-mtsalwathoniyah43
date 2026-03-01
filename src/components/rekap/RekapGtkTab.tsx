import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExportButton } from '@/components/export/ExportButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserCog, CalendarDays, CheckCircle, XCircle, AlertCircle, Clock, Briefcase, PalmtreeIcon } from 'lucide-react';
import { getDaysInMonth } from 'date-fns';

interface GtkPtk {
  id: string;
  nama: string;
  jabatan: string | null;
  nip: string | null;
}

type StatusGtk = 'hadir' | 'sakit' | 'izin' | 'alfa' | 'dinas_luar' | 'cuti';

const STATUS_LABELS: Record<StatusGtk, string> = {
  hadir: 'Hadir', sakit: 'Sakit', izin: 'Izin', alfa: 'Alfa', dinas_luar: 'Dinas Luar', cuti: 'Cuti',
};

interface Props {
  selectedBulan: string;
  selectedTahun: string;
  hariEfektif: number;
  bulanLabel: string;
}

export function RekapGtkTab({ selectedBulan, selectedTahun, hariEfektif, bulanLabel }: Props) {
  const [gtkList, setGtkList] = useState<GtkPtk[]>([]);
  const [absensiRecords, setAbsensiRecords] = useState<{ gtk_id: string; status: string }[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const fetchGtk = async () => {
      const { data } = await supabase.from('gtk_ptk').select('id, nama, jabatan, nip').order('nama');
      if (data) setGtkList(data);
    };
    fetchGtk();
  }, []);

  useEffect(() => {
    if (gtkList.length === 0) { setAbsensiRecords([]); return; }
    const fetchAbsensi = async () => {
      setFetching(true);
      const bulan = parseInt(selectedBulan);
      const tahun = parseInt(selectedTahun);
      const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
      const daysInMonth = getDaysInMonth(new Date(tahun, bulan - 1));
      const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const { data } = await supabase
        .from('absensi_gtk')
        .select('gtk_id, status')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);
      if (data) setAbsensiRecords(data);
      setFetching(false);
    };
    fetchAbsensi();
  }, [selectedBulan, selectedTahun, gtkList]);

  const rekapData = useMemo(() => {
    return gtkList.map(gtk => {
      const records = absensiRecords.filter(r => r.gtk_id === gtk.id);
      const counts: Record<StatusGtk, number> = { hadir: 0, sakit: 0, izin: 0, alfa: 0, dinas_luar: 0, cuti: 0 };
      records.forEach(r => { if (r.status in counts) counts[r.status as StatusGtk]++; });
      const totalRecorded = Object.values(counts).reduce((a, b) => a + b, 0);
      const persentase = hariEfektif > 0 ? Math.round((counts.hadir / hariEfektif) * 100) : 0;
      return { id: gtk.id, nama: gtk.nama, nip: gtk.nip || '-', jabatan: gtk.jabatan || '-', ...counts, totalRecorded, belumDiisi: hariEfektif - totalRecorded, persentase };
    });
  }, [gtkList, absensiRecords, hariEfektif]);

  const grandTotal = useMemo(() => {
    const t: Record<StatusGtk, number> = { hadir: 0, sakit: 0, izin: 0, alfa: 0, dinas_luar: 0, cuti: 0 };
    rekapData.forEach(r => { (Object.keys(t) as StatusGtk[]).forEach(k => { t[k] += r[k]; }); });
    return t;
  }, [rekapData]);

  const avgPersentase = useMemo(() => {
    if (rekapData.length === 0) return 0;
    return Math.round(rekapData.reduce((sum, r) => sum + r.persentase, 0) / rekapData.length);
  }, [rekapData]);

  const exportData = useMemo(() => rekapData.map((r, idx) => ({
    no: idx + 1, nama: r.nama, nip: r.nip, jabatan: r.jabatan, hadir: r.hadir, sakit: r.sakit, izin: r.izin, alfa: r.alfa, dinas_luar: r.dinas_luar, cuti: r.cuti, hari_efektif: hariEfektif, persentase: `${r.persentase}%`,
  })), [rekapData, hariEfektif]);

  if (gtkList.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <UserCog className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>{fetching ? 'Memuat data...' : 'Belum ada data GTK/PTK.'}</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="border-border/50"><CardContent className="p-4 text-center"><CalendarDays className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><p className="text-2xl font-bold text-foreground">{hariEfektif}</p><p className="text-xs text-muted-foreground">Hari Efektif</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><UserCog className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><p className="text-2xl font-bold text-foreground">{rekapData.length}</p><p className="text-xs text-muted-foreground">Total GTK</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto mb-1 text-emerald-600" /><p className="text-2xl font-bold text-foreground">{grandTotal.hadir}</p><p className="text-xs text-muted-foreground">Hadir</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-600" /><p className="text-2xl font-bold text-foreground">{grandTotal.sakit}</p><p className="text-xs text-muted-foreground">Sakit</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold text-foreground">{grandTotal.izin}</p><p className="text-xs text-muted-foreground">Izin</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" /><p className="text-2xl font-bold text-foreground">{grandTotal.alfa}</p><p className="text-xs text-muted-foreground">Alfa</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><Briefcase className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold text-foreground">{grandTotal.dinas_luar}</p><p className="text-xs text-muted-foreground">Dinas</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><PalmtreeIcon className="h-5 w-5 mx-auto mb-1 text-gray-600" /><p className="text-2xl font-bold text-foreground">{grandTotal.cuti}</p><p className="text-xs text-muted-foreground">Cuti</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg">Rekap GTK — {bulanLabel} {selectedTahun}</CardTitle>
              <CardDescription>Rata-rata kehadiran: <strong>{avgPersentase}%</strong> · Hari efektif: <strong>{hariEfektif} hari</strong></CardDescription>
            </div>
            <ExportButton
              data={exportData}
              columns={[
                { header: 'No', accessor: d => d.no }, { header: 'Nama', accessor: d => d.nama }, { header: 'NIP', accessor: d => d.nip },
                { header: 'Jabatan', accessor: d => d.jabatan }, { header: 'Hadir', accessor: d => d.hadir }, { header: 'Sakit', accessor: d => d.sakit },
                { header: 'Izin', accessor: d => d.izin }, { header: 'Alfa', accessor: d => d.alfa }, { header: 'Dinas Luar', accessor: d => d.dinas_luar },
                { header: 'Cuti', accessor: d => d.cuti }, { header: 'Hari Efektif', accessor: d => d.hari_efektif }, { header: 'Persentase', accessor: d => d.persentase },
              ]}
              filename={`Rekap_GTK_${bulanLabel}_${selectedTahun}`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-semibold w-12">No</th>
                  <th className="p-3 text-left font-semibold">Nama</th>
                  <th className="p-3 text-left font-semibold">Jabatan</th>
                  <th className="p-3 text-center font-semibold">Hadir</th>
                  <th className="p-3 text-center font-semibold">Sakit</th>
                  <th className="p-3 text-center font-semibold">Izin</th>
                  <th className="p-3 text-center font-semibold">Alfa</th>
                  <th className="p-3 text-center font-semibold">Dinas</th>
                  <th className="p-3 text-center font-semibold">Cuti</th>
                  <th className="p-3 text-center font-semibold w-32">Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {rekapData.map((r, idx) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{idx + 1}</td>
                    <td className="p-3 font-medium">{r.nama}</td>
                    <td className="p-3 text-muted-foreground text-xs">{r.jabatan}</td>
                    <td className="p-3 text-center"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">{r.hadir}</Badge></td>
                    <td className="p-3 text-center"><Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">{r.sakit}</Badge></td>
                    <td className="p-3 text-center"><Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">{r.izin}</Badge></td>
                    <td className="p-3 text-center"><Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">{r.alfa}</Badge></td>
                    <td className="p-3 text-center"><Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200">{r.dinas_luar}</Badge></td>
                    <td className="p-3 text-center"><Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-200">{r.cuti}</Badge></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Progress value={r.persentase} className="h-2 flex-1" />
                        <span className={`text-xs font-semibold min-w-[3rem] text-right ${r.persentase >= 80 ? 'text-emerald-600' : r.persentase >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{r.persentase}%</span>
                      </div>
                      {r.belumDiisi > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{r.belumDiisi} hari belum diisi</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-semibold">
                  <td className="p-3" colSpan={3}>Total</td>
                  <td className="p-3 text-center">{grandTotal.hadir}</td>
                  <td className="p-3 text-center">{grandTotal.sakit}</td>
                  <td className="p-3 text-center">{grandTotal.izin}</td>
                  <td className="p-3 text-center">{grandTotal.alfa}</td>
                  <td className="p-3 text-center">{grandTotal.dinas_luar}</td>
                  <td className="p-3 text-center">{grandTotal.cuti}</td>
                  <td className="p-3 text-center text-sm">Rata-rata: {avgPersentase}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
