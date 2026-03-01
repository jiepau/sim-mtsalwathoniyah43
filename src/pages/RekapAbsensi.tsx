import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportButton } from '@/components/export/ExportButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useHariLibur } from '@/hooks/useHariLibur';
import { BarChart3, Users, CalendarDays, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { format, getDaysInMonth, getDay, startOfMonth, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  jenis_kelamin: string | null;
}

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
  is_active: boolean;
}

interface AbsensiRecord {
  siswa_id: string;
  tanggal: string;
  status: string;
}

const BULAN_LIST = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const TAHUN_LIST = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

const RekapAbsensi = () => {
  const { isHoliday } = useHariLibur();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absensiRecords, setAbsensiRecords] = useState<AbsensiRecord[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedBulan, setSelectedBulan] = useState(String(new Date().getMonth() + 1));
  const [selectedTahun, setSelectedTahun] = useState(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchInitial = async () => {
      const [kelasRes, taRes] = await Promise.all([
        supabase.from('kelas').select('*').order('tingkat').order('nama_kelas'),
        supabase.from('tahun_ajaran').select('*').order('nama_ta', { ascending: false }),
      ]);
      if (kelasRes.data) setKelasList(kelasRes.data);
      if (taRes.data) {
        setTahunAjaranList(taRes.data);
        const active = taRes.data.find(t => t.is_active);
        if (active) setSelectedTA(active.id);
      }
      setLoading(false);
    };
    fetchInitial();
  }, []);

  // Fetch siswa
  useEffect(() => {
    if (!selectedKelas || !selectedTA) { setSiswaList([]); return; }
    const fetchSiswa = async () => {
      const { data } = await supabase
        .from('siswa')
        .select('id, nis, nama, jenis_kelamin')
        .eq('kelas_id', selectedKelas)
        .eq('ta_id', selectedTA)
        .eq('status', 'aktif')
        .order('nama');
      if (data) setSiswaList(data);
    };
    fetchSiswa();
  }, [selectedKelas, selectedTA]);

  // Fetch absensi records for the month
  useEffect(() => {
    if (!selectedKelas || !selectedTA || siswaList.length === 0) {
      setAbsensiRecords([]);
      return;
    }
    const fetchAbsensi = async () => {
      setFetching(true);
      const bulan = parseInt(selectedBulan);
      const tahun = parseInt(selectedTahun);
      const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
      const daysInMonth = getDaysInMonth(new Date(tahun, bulan - 1));
      const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      const { data } = await supabase
        .from('absensi_siswa')
        .select('siswa_id, tanggal, status')
        .eq('kelas_id', selectedKelas)
        .eq('ta_id', selectedTA)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (data) setAbsensiRecords(data);
      setFetching(false);
    };
    fetchAbsensi();
  }, [selectedKelas, selectedTA, selectedBulan, selectedTahun, siswaList]);

  // Calculate effective school days (excluding weekends & holidays)
  const hariEfektif = useMemo(() => {
    const bulan = parseInt(selectedBulan);
    const tahun = parseInt(selectedTahun);
    const daysInMonth = getDaysInMonth(new Date(tahun, bulan - 1));
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const { isLibur } = isHoliday(dateStr);
      if (!isLibur) count++;
    }
    return count;
  }, [selectedBulan, selectedTahun, isHoliday]);

  // Build per-student summary
  const rekapData = useMemo(() => {
    return siswaList.map(siswa => {
      const records = absensiRecords.filter(r => r.siswa_id === siswa.id);
      const hadir = records.filter(r => r.status === 'hadir').length;
      const sakit = records.filter(r => r.status === 'sakit').length;
      const izin = records.filter(r => r.status === 'izin').length;
      const alfa = records.filter(r => r.status === 'alfa').length;
      const totalRecorded = hadir + sakit + izin + alfa;
      const persentase = hariEfektif > 0 ? Math.round((hadir / hariEfektif) * 100) : 0;

      return {
        id: siswa.id,
        nis: siswa.nis,
        nama: siswa.nama,
        jk: siswa.jenis_kelamin === 'Laki-laki' ? 'L' : 'P',
        hadir, sakit, izin, alfa,
        totalRecorded,
        belumDiisi: hariEfektif - totalRecorded,
        persentase,
      };
    });
  }, [siswaList, absensiRecords, hariEfektif]);

  // Grand totals
  const grandTotal = useMemo(() => {
    const t = { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
    rekapData.forEach(r => {
      t.hadir += r.hadir;
      t.sakit += r.sakit;
      t.izin += r.izin;
      t.alfa += r.alfa;
    });
    return t;
  }, [rekapData]);

  const avgPersentase = useMemo(() => {
    if (rekapData.length === 0) return 0;
    return Math.round(rekapData.reduce((sum, r) => sum + r.persentase, 0) / rekapData.length);
  }, [rekapData]);

  // Export
  const selectedKelasName = kelasList.find(k => k.id === selectedKelas)?.nama_kelas || '';
  const bulanLabel = BULAN_LIST.find(b => b.value === selectedBulan)?.label || '';
  const exportFilename = `Rekap_Absensi_${selectedKelasName}_${bulanLabel}_${selectedTahun}`;

  const exportData = useMemo(() => {
    return rekapData.map((r, idx) => ({
      no: idx + 1,
      nis: r.nis,
      nama: r.nama,
      jk: r.jk,
      hadir: r.hadir,
      sakit: r.sakit,
      izin: r.izin,
      alfa: r.alfa,
      hari_efektif: hariEfektif,
      persentase: `${r.persentase}%`,
    }));
  }, [rekapData, hariEfektif]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rekap Absensi Bulanan" description="Ringkasan kehadiran siswa per bulan" icon={<BarChart3 className="h-6 w-6" />} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Absensi Bulanan"
        description="Ringkasan total kehadiran per siswa selama satu bulan penuh"
        icon={<BarChart3 className="h-6 w-6" />}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tahun Ajaran</label>
          <Select value={selectedTA} onValueChange={setSelectedTA}>
            <SelectTrigger><SelectValue placeholder="Pilih Tahun Ajaran" /></SelectTrigger>
            <SelectContent>
              {tahunAjaranList.map(ta => (
                <SelectItem key={ta.id} value={ta.id}>
                  {ta.nama_ta} {ta.is_active && '(Aktif)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Kelas</label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
            <SelectContent>
              {kelasList.map(k => (
                <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Bulan</label>
          <Select value={selectedBulan} onValueChange={setSelectedBulan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BULAN_LIST.map(b => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tahun</label>
          <Select value={selectedTahun} onValueChange={setSelectedTahun}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TAHUN_LIST.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedKelas && selectedTA && rekapData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <CalendarDays className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{hariEfektif}</p>
              <p className="text-xs text-muted-foreground">Hari Efektif</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{rekapData.length}</p>
              <p className="text-xs text-muted-foreground">Total Siswa</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
              <p className="text-2xl font-bold text-foreground">{grandTotal.hadir}</p>
              <p className="text-xs text-muted-foreground">Total Hadir</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold text-foreground">{grandTotal.sakit}</p>
              <p className="text-xs text-muted-foreground">Total Sakit</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold text-foreground">{grandTotal.izin}</p>
              <p className="text-xs text-muted-foreground">Total Izin</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
              <p className="text-2xl font-bold text-foreground">{grandTotal.alfa}</p>
              <p className="text-xs text-muted-foreground">Total Alfa</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rekap Table */}
      {selectedKelas && selectedTA ? (
        rekapData.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg">
                    Rekap {bulanLabel} {selectedTahun} — {selectedKelasName}
                  </CardTitle>
                  <CardDescription>
                    Rata-rata kehadiran: <strong>{avgPersentase}%</strong> · Hari efektif: <strong>{hariEfektif} hari</strong>
                  </CardDescription>
                </div>
                <ExportButton
                  data={exportData}
                  columns={[
                    { header: 'No', accessor: d => d.no },
                    { header: 'NIS', accessor: d => d.nis },
                    { header: 'Nama Siswa', accessor: d => d.nama },
                    { header: 'L/P', accessor: d => d.jk },
                    { header: 'Hadir', accessor: d => d.hadir },
                    { header: 'Sakit', accessor: d => d.sakit },
                    { header: 'Izin', accessor: d => d.izin },
                    { header: 'Alfa', accessor: d => d.alfa },
                    { header: 'Hari Efektif', accessor: d => d.hari_efektif },
                    { header: 'Persentase', accessor: d => d.persentase },
                  ]}
                  filename={exportFilename}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-semibold w-12">No</th>
                      <th className="p-3 text-left font-semibold">NIS</th>
                      <th className="p-3 text-left font-semibold">Nama Siswa</th>
                      <th className="p-3 text-left font-semibold w-10">L/P</th>
                      <th className="p-3 text-center font-semibold">Hadir</th>
                      <th className="p-3 text-center font-semibold">Sakit</th>
                      <th className="p-3 text-center font-semibold">Izin</th>
                      <th className="p-3 text-center font-semibold">Alfa</th>
                      <th className="p-3 text-center font-semibold w-32">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.map((r, idx) => (
                      <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-mono text-xs">{r.nis}</td>
                        <td className="p-3 font-medium">{r.nama}</td>
                        <td className="p-3">{r.jk}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">{r.hadir}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">{r.sakit}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">{r.izin}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">{r.alfa}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress value={r.persentase} className="h-2 flex-1" />
                            <span className={`text-xs font-semibold min-w-[3rem] text-right ${
                              r.persentase >= 80 ? 'text-emerald-600' :
                              r.persentase >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {r.persentase}%
                            </span>
                          </div>
                          {r.belumDiisi > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{r.belumDiisi} hari belum diisi</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/50 font-semibold">
                      <td className="p-3" colSpan={4}>Total</td>
                      <td className="p-3 text-center">{grandTotal.hadir}</td>
                      <td className="p-3 text-center">{grandTotal.sakit}</td>
                      <td className="p-3 text-center">{grandTotal.izin}</td>
                      <td className="p-3 text-center">{grandTotal.alfa}</td>
                      <td className="p-3 text-center text-sm">Rata-rata: {avgPersentase}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{fetching ? 'Memuat data...' : 'Tidak ada siswa aktif di kelas ini.'}</p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Pilih tahun ajaran dan kelas untuk melihat rekap absensi.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RekapAbsensi;
