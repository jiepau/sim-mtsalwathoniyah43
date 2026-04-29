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
import { Loader2, Save, UserCog } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type StatusAbsensi = 'hadir' | 'sakit' | 'izin' | 'alfa' | '';

const STATUS_LABEL: Record<Exclude<StatusAbsensi, ''>, string> = {
  hadir: 'Hadir', sakit: 'Sakit', izin: 'Izin', alfa: 'Alfa',
};

interface Siswa { id: string; nis: string; nama: string; kelas_id: string | null; ta_id: string | null; }
interface Kelas { id: string; nama_kelas: string; }
interface TahunAjaran { id: string; nama_ta: string; is_active: boolean; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function InputAbsensiPerSiswaDialog({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isHoliday } = useHariLibur();

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [taList, setTaList] = useState<TahunAjaran[]>([]);
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState('');
  const [bulan, setBulan] = useState(format(new Date(), 'yyyy-MM'));
  const [entries, setEntries] = useState<Record<number, { status: StatusAbsensi; keterangan: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const year = parseInt(bulan.split('-')[0]);
  const month = parseInt(bulan.split('-')[1]);
  const monthDate = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const daysInMonth = getDaysInMonth(monthDate);

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dt = new Date(year, month - 1, d);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = dt.getDay();
      const hol = isHoliday(dateStr);
      return {
        day: d, dateStr, dow,
        isWeekend: dow === 0,
        isHoliday: hol.isLibur,
        holidayName: hol.reason,
        label: format(dt, 'EEEE', { locale: idLocale }),
      };
    });
  }, [year, month, daysInMonth, isHoliday]);

  // Load TA + kelas
  useEffect(() => {
    if (!open) return;
    const init = async () => {
      const [kRes, tRes] = await Promise.all([
        supabase.from('kelas').select('id, nama_kelas').order('tingkat').order('nama_kelas'),
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

  // Load siswa
  useEffect(() => {
    if (!selectedKelas || !selectedTA) {
      setSiswaList([]);
      setSelectedSiswa('');
      return;
    }
    supabase.from('siswa')
      .select('id, nis, nama, kelas_id, ta_id')
      .eq('kelas_id', selectedKelas)
      .eq('ta_id', selectedTA)
      .eq('status', 'aktif')
      .order('nama')
      .then(({ data }) => setSiswaList(data || []));
    setSelectedSiswa('');
  }, [selectedKelas, selectedTA]);

  // Load entries
  useEffect(() => {
    if (!open || !selectedSiswa) {
      setEntries({});
      return;
    }
    const load = async () => {
      setLoading(true);
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const { data } = await supabase
        .from('absensi_siswa')
        .select('tanggal, status, keterangan')
        .eq('siswa_id', selectedSiswa)
        .gte('tanggal', startStr)
        .lte('tanggal', endStr);
      const map: Record<number, { status: StatusAbsensi; keterangan: string }> = {};
      (data || []).forEach(d => {
        const day = parseInt(d.tanggal.split('-')[2]);
        map[day] = { status: d.status as StatusAbsensi, keterangan: d.keterangan || '' };
      });
      setEntries(map);
      setLoading(false);
    };
    load();
  }, [open, selectedSiswa, bulan, year, month, daysInMonth]);

  const setDay = (day: number, status: StatusAbsensi) => {
    setEntries(prev => ({
      ...prev,
      [day]: { status, keterangan: prev[day]?.keterangan || '' },
    }));
  };

  const setKet = (day: number, keterangan: string) => {
    setEntries(prev => ({
      ...prev,
      [day]: { status: prev[day]?.status || 'hadir', keterangan },
    }));
  };

  const fillAllHadir = () => {
    const next: typeof entries = { ...entries };
    days.forEach(d => {
      if (!d.isWeekend && !d.isHoliday) {
        next[d.day] = { status: 'hadir', keterangan: next[d.day]?.keterangan || '' };
      }
    });
    setEntries(next);
  };

  const handleSave = async () => {
    if (!selectedSiswa) {
      toast({ title: 'Pilih siswa terlebih dahulu', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any[] = [];
      Object.entries(entries).forEach(([d, e]) => {
        if (!e.status) return;
        const day = parseInt(d);
        payload.push({
          siswa_id: selectedSiswa,
          kelas_id: selectedKelas,
          ta_id: selectedTA,
          tanggal: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          status: e.status,
          keterangan: e.keterangan || null,
          created_by: user?.id || null,
        });
      });
      if (payload.length === 0) {
        toast({ title: 'Tidak ada data', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from('absensi_siswa')
        .upsert(payload, { onConflict: 'siswa_id,tanggal' });
      if (error) throw error;
      toast({ title: `Tersimpan ${payload.length} entri` });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Input Presensi Per Siswa
          </DialogTitle>
          <DialogDescription>
            Pilih siswa dan bulan, lalu isi presensi untuk setiap hari.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tahun Ajaran</label>
            <Select value={selectedTA || 'none'} onValueChange={v => setSelectedTA(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Pilih —</SelectItem>
                {taList.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nama_ta}</SelectItem>
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
            <label className="text-xs font-medium text-muted-foreground">Siswa</label>
            <Select value={selectedSiswa || 'none'} onValueChange={v => setSelectedSiswa(v === 'none' ? '' : v)} disabled={!selectedKelas}>
              <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Pilih —</SelectItem>
                {siswaList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nama} · {s.nis}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bulan</label>
            <Input type="month" value={bulan} onChange={e => setBulan(e.target.value)} />
          </div>
        </div>

        {selectedSiswa && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fillAllHadir}>Isi semua hari kerja = Hadir</Button>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : selectedSiswa ? (
          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-2 text-left font-semibold w-16">Tgl</th>
                  <th className="p-2 text-left font-semibold w-24">Hari</th>
                  <th className="p-2 text-left font-semibold w-40">Status</th>
                  <th className="p-2 text-left font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {days.map(d => {
                  const isLibur = d.isWeekend || d.isHoliday;
                  const e = entries[d.day];
                  return (
                    <tr key={d.day} className={`border-b ${isLibur ? 'bg-red-50/50' : 'hover:bg-muted/30'}`}>
                      <td className="p-2 font-medium">{d.day}</td>
                      <td className="p-2 text-muted-foreground">
                        {d.label}
                        {d.isHoliday && <div className="text-[10px] text-red-600 truncate">{d.holidayName}</div>}
                      </td>
                      <td className="p-2">
                        <Select
                          value={e?.status || 'none'}
                          onValueChange={(v) => setDay(d.day, v === 'none' ? '' : v as StatusAbsensi)}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Kosong —</SelectItem>
                            {Object.entries(STATUS_LABEL).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 text-xs"
                          placeholder="Keterangan..."
                          value={e?.keterangan || ''}
                          onChange={ev => setKet(d.day, ev.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm min-h-[200px]">
            Pilih TA, kelas, dan siswa untuk mulai input.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || !selectedSiswa}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="h-4 w-4 mr-2" />Simpan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
