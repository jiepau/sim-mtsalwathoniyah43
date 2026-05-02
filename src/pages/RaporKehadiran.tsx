import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHariLibur } from '@/hooks/useHariLibur';
import { ClipboardList, Users, FileText } from 'lucide-react';
import { PrintPreviewToolbar, PrintPreviewFrame, type PrintOrientation } from '@/components/print/PrintPreviewToolbar';
import { PrintKopMadrasah, PrintTtdKepala } from '@/components/print/PrintKopMadrasah';
import { getDaysInMonth } from 'date-fns';

interface Kelas { id: string; nama_kelas: string; tingkat: number; }
interface TahunAjaran { id: string; nama_ta: string; is_active: boolean; semester: string | null; }
interface Siswa { id: string; nis: string; nama: string; jenis_kelamin: string | null; }
interface Madrasah { nama_madrasah: string; alamat: string | null; nsm: string | null; npsn: string | null; kepala_madrasah: string | null; nip_kepala: string | null; }

const BULAN_LABEL: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
  7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
};

// Semester ganjil: Juli-Desember (bulan 7-12), Genap: Januari-Juni (1-6)
const SEMESTER_BULAN: Record<string, number[]> = {
  ganjil: [7, 8, 9, 10, 11, 12],
  genap: [1, 2, 3, 4, 5, 6],
};

const RaporKehadiran = () => {
  const { isHoliday, loading: loadingLibur } = useHariLibur();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [taList, setTaList] = useState<TahunAjaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absensi, setAbsensi] = useState<{ siswa_id: string; tanggal: string; status: string }[]>([]);
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>('ganjil');
  const [tahunBase, setTahunBase] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [preview, setPreview] = useState(false);
  const [orientation, setOrientation] = useState<PrintOrientation>('landscape');

  useEffect(() => {
    const init = async () => {
      const [kRes, tRes, mRes] = await Promise.all([
        supabase.from('kelas').select('*').order('tingkat').order('nama_kelas'),
        supabase.from('tahun_ajaran').select('*').order('nama_ta', { ascending: false }),
        supabase.from('madrasah_settings').select('*').maybeSingle(),
      ]);
      if (kRes.data) setKelasList(kRes.data);
      if (tRes.data) {
        setTaList(tRes.data);
        const active = tRes.data.find(t => t.is_active);
        if (active) {
          setSelectedTA(active.id);
          if (active.semester === 'genap' || active.semester === 'ganjil') {
            setSelectedSemester(active.semester as 'ganjil' | 'genap');
          }
        }
      }
      if (mRes.data) setMadrasah(mRes.data as any);
      setLoading(false);
    };
    init();
  }, []);

  // Determine year per month — for ganjil (Jul-Dec) use first year; for genap (Jan-Jun) use second year
  const taSelected = taList.find(t => t.id === selectedTA);
  const taYears = useMemo(() => {
    // nama_ta format usually "2024/2025"
    if (taSelected?.nama_ta) {
      const m = taSelected.nama_ta.match(/(\d{4})\s*[\/-]\s*(\d{4})/);
      if (m) return { y1: parseInt(m[1]), y2: parseInt(m[2]) };
    }
    const y = parseInt(tahunBase);
    return { y1: y, y2: y + 1 };
  }, [taSelected, tahunBase]);

  const bulanSemester = SEMESTER_BULAN[selectedSemester];
  const yearForMonth = (m: number) => (selectedSemester === 'ganjil' ? taYears.y1 : taYears.y2);

  // Compute hari efektif per bulan (excluding weekends/holidays)
  const hariEfektifPerBulan = useMemo(() => {
    if (loadingLibur) return {} as Record<number, number>;
    const map: Record<number, number> = {};
    bulanSemester.forEach(b => {
      const yr = yearForMonth(b);
      const days = getDaysInMonth(new Date(yr, b - 1));
      let count = 0;
      for (let d = 1; d <= days; d++) {
        const ds = `${yr}-${String(b).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!isHoliday(ds).isLibur) count++;
      }
      map[b] = count;
    });
    return map;
  }, [bulanSemester, taYears, isHoliday, loadingLibur, selectedSemester]);

  const totalHariEfektif = useMemo(
    () => Object.values(hariEfektifPerBulan).reduce((a, b) => a + b, 0),
    [hariEfektifPerBulan]
  );

  // Fetch siswa
  useEffect(() => {
    if (!selectedKelas || !selectedTA) { setSiswaList([]); return; }
    supabase.from('siswa')
      .select('id, nis, nama, jenis_kelamin')
      .eq('kelas_id', selectedKelas)
      .eq('ta_id', selectedTA)
      .eq('status', 'aktif')
      .order('nama')
      .then(({ data }) => setSiswaList(data || []));
  }, [selectedKelas, selectedTA]);

  // Fetch absensi for entire semester range
  useEffect(() => {
    if (!selectedKelas || !selectedTA || siswaList.length === 0) { setAbsensi([]); return; }
    const load = async () => {
      setFetching(true);
      const firstM = bulanSemester[0];
      const lastM = bulanSemester[bulanSemester.length - 1];
      const yFirst = yearForMonth(firstM);
      const yLast = yearForMonth(lastM);
      const startDate = `${yFirst}-${String(firstM).padStart(2, '0')}-01`;
      const lastDays = getDaysInMonth(new Date(yLast, lastM - 1));
      const endDate = `${yLast}-${String(lastM).padStart(2, '0')}-${String(lastDays).padStart(2, '0')}`;
      const { data } = await supabase
        .from('absensi_siswa')
        .select('siswa_id, tanggal, status')
        .eq('kelas_id', selectedKelas)
        .eq('ta_id', selectedTA)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);
      setAbsensi(data || []);
      setFetching(false);
    };
    load();
  }, [selectedKelas, selectedTA, selectedSemester, siswaList]);

  // Compute rekap per siswa per bulan
  const rekap = useMemo(() => {
    return siswaList.map(s => {
      const perBulan = bulanSemester.map(b => {
        const yr = yearForMonth(b);
        const prefix = `${yr}-${String(b).padStart(2, '0')}-`;
        const records = absensi.filter(r => r.siswa_id === s.id && r.tanggal.startsWith(prefix));
        const hadir = records.filter(r => r.status === 'hadir').length;
        const sakit = records.filter(r => r.status === 'sakit').length;
        const izin = records.filter(r => r.status === 'izin').length;
        const alfa = records.filter(r => r.status === 'alfa').length;
        return { bulan: b, hadir, sakit, izin, alfa };
      });
      const total = perBulan.reduce(
        (acc, m) => ({
          hadir: acc.hadir + m.hadir, sakit: acc.sakit + m.sakit,
          izin: acc.izin + m.izin, alfa: acc.alfa + m.alfa,
        }),
        { hadir: 0, sakit: 0, izin: 0, alfa: 0 }
      );
      const persen = totalHariEfektif > 0 ? Math.round((total.hadir / totalHariEfektif) * 100) : 0;
      return { siswa: s, perBulan, total, persen };
    });
  }, [siswaList, absensi, bulanSemester, totalHariEfektif]);

  const kelasName = kelasList.find(k => k.id === selectedKelas)?.nama_kelas || '';
  const taName = taSelected?.nama_ta || '-';

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapor Kehadiran Semester" description="Rekap kehadiran siswa per semester untuk lampiran rapor" icon={<ClipboardList className="h-6 w-6" />} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Rapor Kehadiran Semester"
          description="Rekap H/S/I/A per bulan dalam satu semester — siap dilampirkan ke rapor"
          icon={<ClipboardList className="h-6 w-6" />}
        />
      </div>

      <div className="print:hidden">
        <PrintPreviewToolbar
          preview={preview}
          onTogglePreview={setPreview}
          orientation={orientation}
          onOrientationChange={setOrientation}
          onPrint={() => window.print()}
          disabled={rekap.length === 0}
          hint="Untuk rekap dengan banyak bulan, gunakan landscape agar kolom muat dalam satu halaman."
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tahun Ajaran</label>
          <Select value={selectedTA} onValueChange={setSelectedTA}>
            <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
            <SelectContent>
              {taList.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nama_ta} {t.is_active && '(Aktif)'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Semester</label>
          <Select value={selectedSemester} onValueChange={(v) => setSelectedSemester(v as 'ganjil' | 'genap')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ganjil">Ganjil (Jul–Des)</SelectItem>
              <SelectItem value="genap">Genap (Jan–Jun)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Kelas</label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
            <SelectContent>
              {kelasList.map(k => (
                <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tahun Dasar (jika TA tidak terdeteksi)</label>
          <Select value={tahunBase} onValueChange={setTahunBase}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedKelas || !selectedTA ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Pilih tahun ajaran dan kelas untuk melihat rapor kehadiran semester.</p>
          </CardContent>
        </Card>
      ) : rekap.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{fetching ? 'Memuat data...' : 'Tidak ada siswa aktif di kelas ini.'}</p>
          </CardContent>
        </Card>
      ) : (
        <PrintPreviewFrame preview={preview} orientation={orientation}>
          <div className={preview ? 'space-y-3 text-black' : 'space-y-3 text-black bg-white p-4 rounded-lg border'}>
            <PrintKopMadrasah
              judul="Rekap Kehadiran Siswa"
              subjudul={`Semester ${selectedSemester === 'ganjil' ? 'Ganjil' : 'Genap'} — TA ${taName}`}
              periode={`Kelas: ${kelasName} • Total hari efektif: ${totalHariEfektif} hari`}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse print:text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th rowSpan={2} className="p-2 border border-black text-left">No</th>
                    <th rowSpan={2} className="p-2 border border-black text-left">NIS</th>
                    <th rowSpan={2} className="p-2 border border-black text-left">Nama Siswa</th>
                    <th rowSpan={2} className="p-2 border border-black text-center">L/P</th>
                    {bulanSemester.map(b => (
                      <th key={b} colSpan={4} className="p-1 border border-black text-center font-semibold">
                        {BULAN_LABEL[b]}
                        <div className="text-[9px] font-normal opacity-70">({hariEfektifPerBulan[b] || 0} hari)</div>
                      </th>
                    ))}
                    <th colSpan={4} className="p-1 border border-black text-center font-semibold">Total Semester</th>
                    <th rowSpan={2} className="p-2 border border-black text-center">% Hadir</th>
                  </tr>
                  <tr className="bg-gray-50">
                    {bulanSemester.map(b => (
                      <>
                        <th key={`h-${b}`} className="p-1 border border-black text-center w-7">H</th>
                        <th key={`s-${b}`} className="p-1 border border-black text-center w-7">S</th>
                        <th key={`i-${b}`} className="p-1 border border-black text-center w-7">I</th>
                        <th key={`a-${b}`} className="p-1 border border-black text-center w-7">A</th>
                      </>
                    ))}
                    <th className="p-1 border border-black text-center w-8">H</th>
                    <th className="p-1 border border-black text-center w-8">S</th>
                    <th className="p-1 border border-black text-center w-8">I</th>
                    <th className="p-1 border border-black text-center w-8">A</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((r, idx) => (
                    <tr key={r.siswa.id}>
                      <td className="p-1 border border-black text-center">{idx + 1}</td>
                      <td className="p-1 border border-black font-mono text-[10px]">{r.siswa.nis}</td>
                      <td className="p-1 border border-black font-medium">{r.siswa.nama}</td>
                      <td className="p-1 border border-black text-center">{r.siswa.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                      {r.perBulan.map(m => (
                        <>
                          <td key={`h-${m.bulan}`} className="p-1 border border-black text-center">{m.hadir || ''}</td>
                          <td key={`s-${m.bulan}`} className="p-1 border border-black text-center">{m.sakit || ''}</td>
                          <td key={`i-${m.bulan}`} className="p-1 border border-black text-center">{m.izin || ''}</td>
                          <td key={`a-${m.bulan}`} className="p-1 border border-black text-center">{m.alfa || ''}</td>
                        </>
                      ))}
                      <td className="p-1 border border-black text-center font-semibold">{r.total.hadir}</td>
                      <td className="p-1 border border-black text-center font-semibold">{r.total.sakit}</td>
                      <td className="p-1 border border-black text-center font-semibold">{r.total.izin}</td>
                      <td className="p-1 border border-black text-center font-semibold">{r.total.alfa}</td>
                      <td className="p-1 border border-black text-center font-bold">
                        {r.persen}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PrintTtdKepala
              twoColumn
              kiri={{ jabatan: 'Wali Kelas', nama: '..............................' }}
            />
          </div>
        </PrintPreviewFrame>
      )}
    </div>
  );
};

export default RaporKehadiran;
