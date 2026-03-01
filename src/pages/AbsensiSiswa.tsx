import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Save, Calendar, Users, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
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

type StatusAbsensi = 'hadir' | 'sakit' | 'izin' | 'alfa';

interface AbsensiEntry {
  siswa_id: string;
  status: StatusAbsensi;
  keterangan: string;
}

const STATUS_CONFIG: Record<StatusAbsensi, { label: string; color: string; icon: React.ElementType }> = {
  hadir: { label: 'Hadir', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', icon: CheckCircle },
  sakit: { label: 'Sakit', color: 'bg-amber-500/10 text-amber-700 border-amber-200', icon: AlertCircle },
  izin: { label: 'Izin', color: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: Clock },
  alfa: { label: 'Alfa', color: 'bg-red-500/10 text-red-700 border-red-200', icon: XCircle },
};

const AbsensiSiswa = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absensiData, setAbsensiData] = useState<Record<string, AbsensiEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingIds, setExistingIds] = useState<Record<string, string>>({});

  // Fetch kelas & tahun ajaran
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

  // Fetch siswa when kelas & TA selected
  useEffect(() => {
    if (!selectedKelas || !selectedTA) {
      setSiswaList([]);
      return;
    }
    const fetchSiswa = async () => {
      const { data } = await supabase
        .from('siswa')
        .select('id, nis, nama, jenis_kelamin')
        .eq('kelas_id', selectedKelas)
        .eq('ta_id', selectedTA)
        .eq('status', 'aktif')
        .order('nama');
      if (data) {
        setSiswaList(data);
        // Initialize default absensi
        const defaults: Record<string, AbsensiEntry> = {};
        data.forEach(s => {
          defaults[s.id] = { siswa_id: s.id, status: 'hadir', keterangan: '' };
        });
        setAbsensiData(defaults);
      }
    };
    fetchSiswa();
  }, [selectedKelas, selectedTA]);

  // Fetch existing absensi for selected date
  useEffect(() => {
    if (!selectedKelas || !selectedTA || !selectedDate || siswaList.length === 0) return;
    const fetchExisting = async () => {
      const { data } = await supabase
        .from('absensi_siswa')
        .select('*')
        .eq('kelas_id', selectedKelas)
        .eq('ta_id', selectedTA)
        .eq('tanggal', selectedDate);
      if (data && data.length > 0) {
        const mapped: Record<string, AbsensiEntry> = {};
        const ids: Record<string, string> = {};
        data.forEach(d => {
          mapped[d.siswa_id] = {
            siswa_id: d.siswa_id,
            status: d.status as StatusAbsensi,
            keterangan: d.keterangan || '',
          };
          ids[d.siswa_id] = d.id;
        });
        // Merge with defaults for siswa not yet recorded
        setAbsensiData(prev => {
          const merged = { ...prev };
          Object.keys(mapped).forEach(k => { merged[k] = mapped[k]; });
          return merged;
        });
        setExistingIds(ids);
      } else {
        setExistingIds({});
        // Reset to hadir
        const defaults: Record<string, AbsensiEntry> = {};
        siswaList.forEach(s => {
          defaults[s.id] = { siswa_id: s.id, status: 'hadir', keterangan: '' };
        });
        setAbsensiData(defaults);
      }
    };
    fetchExisting();
  }, [selectedDate, selectedKelas, selectedTA, siswaList]);

  const updateStatus = (siswaId: string, status: StatusAbsensi) => {
    setAbsensiData(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], status },
    }));
  };

  const updateKeterangan = (siswaId: string, keterangan: string) => {
    setAbsensiData(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], keterangan },
    }));
  };

  const handleSave = async () => {
    if (!selectedKelas || !selectedTA || !selectedDate) {
      toast({ title: 'Pilih kelas, tahun ajaran, dan tanggal terlebih dahulu', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const entries = Object.values(absensiData).map(e => ({
        siswa_id: e.siswa_id,
        kelas_id: selectedKelas,
        ta_id: selectedTA,
        tanggal: selectedDate,
        status: e.status,
        keterangan: e.keterangan || null,
        created_by: user?.id || null,
      }));

      // Upsert - update if exists, insert if not
      const { error } = await supabase
        .from('absensi_siswa')
        .upsert(entries, { onConflict: 'siswa_id,tanggal' });

      if (error) throw error;
      toast({ title: 'Absensi berhasil disimpan!' });
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan absensi', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Summary stats
  const summary = useMemo(() => {
    const values = Object.values(absensiData);
    return {
      hadir: values.filter(v => v.status === 'hadir').length,
      sakit: values.filter(v => v.status === 'sakit').length,
      izin: values.filter(v => v.status === 'izin').length,
      alfa: values.filter(v => v.status === 'alfa').length,
      total: values.length,
    };
  }, [absensiData]);

  const hasData = Object.keys(existingIds).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Absensi Siswa"
        description="Rekap presensi harian siswa per kelas"
        icon={<ClipboardCheck className="h-6 w-6" />}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tanggal</label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {/* Summary Cards */}
      {siswaList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total Siswa</p>
            </CardContent>
          </Card>
          {(Object.entries(STATUS_CONFIG) as [StatusAbsensi, typeof STATUS_CONFIG[StatusAbsensi]][]).map(([key, cfg]) => (
            <Card key={key} className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{summary[key]}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Absensi Table */}
      {selectedKelas && selectedTA ? (
        siswaList.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Daftar Hadir — {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                  {hasData && <Badge variant="outline" className="ml-2 text-xs">Sudah diisi</Badge>}
                </CardTitle>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                </Button>
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
                      <th className="p-3 text-left font-semibold">L/P</th>
                      <th className="p-3 text-center font-semibold">Status</th>
                      <th className="p-3 text-left font-semibold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaList.map((siswa, idx) => {
                      const entry = absensiData[siswa.id];
                      return (
                        <tr key={siswa.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-mono text-xs">{siswa.nis}</td>
                          <td className="p-3 font-medium">{siswa.nama}</td>
                          <td className="p-3">{siswa.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              {(Object.entries(STATUS_CONFIG) as [StatusAbsensi, typeof STATUS_CONFIG[StatusAbsensi]][]).map(([key, cfg]) => (
                                <button
                                  key={key}
                                  onClick={() => updateStatus(siswa.id, key)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                                    entry?.status === key
                                      ? cfg.color + ' ring-1 ring-offset-1 ring-current'
                                      : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted'
                                  }`}
                                >
                                  {cfg.label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              placeholder="Keterangan..."
                              className="h-8 text-xs"
                              value={entry?.keterangan || ''}
                              onChange={e => updateKeterangan(siswa.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada siswa aktif di kelas ini untuk tahun ajaran yang dipilih.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Pilih tahun ajaran dan kelas untuk mulai mengisi absensi.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AbsensiSiswa;
