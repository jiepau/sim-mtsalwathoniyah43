import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHariLibur } from '@/hooks/useHariLibur';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, CalendarDays } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type StatusAbsensi = 'hadir' | 'sakit' | 'izin' | 'alfa' | '';

const STATUS_OPTS: { value: Exclude<StatusAbsensi, ''>; label: string; color: string }[] = [
  { value: 'hadir', label: 'H', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-300' },
  { value: 'sakit', label: 'S', color: 'bg-amber-500/15 text-amber-700 border-amber-300' },
  { value: 'izin', label: 'I', color: 'bg-blue-500/15 text-blue-700 border-blue-300' },
  { value: 'alfa', label: 'A', color: 'bg-red-500/15 text-red-700 border-red-300' },
];

interface Siswa { id: string; nis: string; nama: string; }
interface Kelas { id: string; nama_kelas: string; tingkat: number; }
interface TahunAjaran { id: string; nama_ta: string; is_active: boolean; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function InputAbsensiSiswaBulananDialog({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isHoliday } = useHariLibur();

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [taList, setTaList] = useState<TahunAjaran[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedTA, setSelectedTA] = useState('');
  const [bulan, setBulan] = useState(format(new Date(), 'yyyy-MM'));
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<number, StatusAbsensi>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const year = parseInt(bulan.split('-')[0]);
  const month = parseInt(bulan.split('-')[1]);
  const monthDate = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const daysInMonth = getDaysInMonth(monthDate);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const dayMeta = useMemo(() => {
    return days.map((d) => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = new Date(year, month - 1, d);
      const dow = dt.getDay();
      const hol = isHoliday(dateStr);
      return { day: d, dateStr, dow, isWeekend: dow === 0, isHoliday: hol.isLibur, label: format(dt, 'EEE', { locale: idLocale }) };
    });
  }, [days, year, month, isHoliday]);

  // Load kelas + tahun ajaran on open
  useEffect(() => {
    if (!open) return;
    const init = async () => {
      const [kRes, tRes] = await Promise.all([
        supabase.from('kelas').select('*').order('tingkat').order('nama_kelas'),
        supabase.from('tahun_ajaran').select('*').order('nama_ta', { ascending: false }),
      ]);
      if (kRes.data) setKelasList(kRes.data);
      if (tRes.data) {
        setTaList(tRes.data);
        const active = tRes.data.find(t => t.is_active);
        if (active && !selectedTA) setSelectedTA(active.id);
      }
    };
    init();
  }, [open]);

  // Load siswa + existing entries when filters change
  useEffect(() => {
    if (!open || !selectedKelas || !selectedTA) {
      setSiswaList([]);
      setMatrix({});
      return;
    }
    const load = async () => {
      setLoading(true);
      const { data: ss } = await supabase
        .from('siswa')
        .select('id, nis, nama')
        .eq('kelas_id', selectedKelas)
        .eq('ta_id', selectedTA)
        .eq('status', 'aktif')
        .order('nama');
      setSiswaList(ss || []);

      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const { data: ab } = await supabase
        .from('absensi_siswa')
        .select('siswa_id, tanggal, status')
        .eq('kelas_id', selectedKelas)
        .eq('ta_id', selectedTA)
        .gte('tanggal', startStr)
        .lte('tanggal', endStr);

      const mtx: Record<string, Record<number, StatusAbsensi>> = {};
      (ss || []).forEach(s => { mtx[s.id] = {}; });
      (ab || []).forEach(a => {
        const d = parseInt(a.tanggal.split('-')[2]);
        if (!mtx[a.siswa_id]) mtx[a.siswa_id] = {};
        mtx[a.siswa_id][d] = a.status as StatusAbsensi;
      });
      setMatrix(mtx);
      setLoading(false);
    };
    load();
  }, [open, selectedKelas, selectedTA, bulan, year, month, daysInMonth]);

  const setCell = (siswaId: string, day: number, status: StatusAbsensi) => {
    setMatrix(prev => ({
      ...prev,
      [siswaId]: { ...(prev[siswaId] || {}), [day]: status },
    }));
  };

  const fillRow = (siswaId: string, status: Exclude<StatusAbsensi, ''>) => {
    const row: Record<number, StatusAbsensi> = {};
    dayMeta.forEach(dm => {
      if (!dm.isWeekend && !dm.isHoliday) row[dm.day] = status;
    });
    setMatrix(prev => ({ ...prev, [siswaId]: { ...(prev[siswaId] || {}), ...row } }));
  };

  const fillAll = (status: Exclude<StatusAbsensi, ''>) => {
    setMatrix(prev => {
      const next = { ...prev };
      siswaList.forEach(s => {
        const row: Record<number, StatusAbsensi> = { ...(next[s.id] || {}) };
        dayMeta.forEach(dm => {
          if (!dm.isWeekend && !dm.isHoliday) row[dm.day] = status;
        });
        next[s.id] = row;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedKelas || !selectedTA) {
      toast({ title: 'Pilih kelas dan tahun ajaran', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const entries: any[] = [];
      Object.entries(matrix).forEach(([siswaId, daysMap]) => {
        Object.entries(daysMap).forEach(([d, status]) => {
          if (!status) return;
          const day = parseInt(d);
          entries.push({
            siswa_id: siswaId,
            kelas_id: selectedKelas,
            ta_id: selectedTA,
            tanggal: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            status,
            created_by: user?.id || null,
          });
        });
      });
      if (entries.length === 0) {
        toast({ title: 'Tidak ada data untuk disimpan', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from('absensi_siswa')
        .upsert(entries, { onConflict: 'siswa_id,tanggal' });
      if (error) throw error;
      toast({ title: `Tersimpan ${entries.length} entri presensi` });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Input Absensi Siswa Per Bulan
          </DialogTitle>
          <DialogDescription>
            Isi presensi semua siswa dalam satu kelas untuk satu bulan penuh. Klik sel untuk siklus status: H → S → I → A → kosong.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tahun Ajaran</label>
            <Select value={selectedTA || 'none'} onValueChange={v => setSelectedTA(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Pilih —</SelectItem>
                {taList.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nama_ta} {t.is_active && '(Aktif)'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Kelas</label>
            <Select value={selectedKelas || 'none'} onValueChange={v => setSelectedKelas(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Pilih —</SelectItem>
                {kelasList.map(k => (
                  <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bulan</label>
            <Input type="month" value={bulan} onChange={e => setBulan(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {STATUS_OPTS.map(o => (
            <span key={o.value} className={`px-2 py-0.5 rounded border ${o.color}`}>{o.label}={o.value}</span>
          ))}
          {siswaList.length > 0 && (
            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => fillAll('hadir')}>
              Isi semua = Hadir
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : selectedKelas && selectedTA ? (
          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="text-xs border-collapse">
              <thead className="sticky top-0 bg-muted z-10">
                <tr>
                  <th className="sticky left-0 bg-muted p-2 text-left font-semibold border-r min-w-[180px]">Nama</th>
                  <th className="p-1 font-semibold border-r w-12">Aksi</th>
                  {dayMeta.map(dm => (
                    <th
                      key={dm.day}
                      className={`p-1 text-center font-semibold border-r min-w-[36px] ${
                        dm.isWeekend || dm.isHoliday ? 'bg-red-50 text-red-700' : ''
                      }`}
                      title={dm.isHoliday ? 'Hari Libur' : dm.label}
                    >
                      <div>{dm.day}</div>
                      <div className="text-[10px] font-normal opacity-70">{dm.label.slice(0, 3)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siswaList.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="sticky left-0 bg-background p-2 border-r font-medium">
                      <div className="truncate max-w-[200px]" title={s.nama}>{s.nama}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{s.nis}</div>
                    </td>
                    <td className="p-1 border-r text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => fillRow(s.id, 'hadir')}
                        title="Isi semua hari kerja = Hadir"
                      >
                        H all
                      </Button>
                    </td>
                    {dayMeta.map(dm => {
                      const cur = matrix[s.id]?.[dm.day] || '';
                      const opt = STATUS_OPTS.find(o => o.value === cur);
                      const cycle = () => {
                        const order: StatusAbsensi[] = ['hadir', 'sakit', 'izin', 'alfa', ''];
                        const idx = order.indexOf(cur);
                        const next = order[(idx + 1) % order.length];
                        setCell(s.id, dm.day, next);
                      };
                      return (
                        <td
                          key={dm.day}
                          className={`p-0 border-r text-center ${
                            dm.isWeekend || dm.isHoliday ? 'bg-red-50/40' : ''
                          }`}
                        >
                          <button
                            onClick={cycle}
                            className={`w-full h-8 text-xs font-bold transition-colors ${
                              opt ? opt.color : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {opt?.label || '·'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {siswaList.length === 0 && (
                  <tr><td colSpan={daysInMonth + 2} className="p-6 text-center text-muted-foreground">Tidak ada siswa.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm min-h-[200px]">
            Pilih tahun ajaran dan kelas terlebih dahulu.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || loading || !selectedKelas}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="h-4 w-4 mr-2" />Simpan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
