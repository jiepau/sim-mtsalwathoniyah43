import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHariLibur } from '@/hooks/useHariLibur';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Calendar } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type StatusAbsensiGtk = 'hadir' | 'sakit' | 'izin' | 'alfa' | 'dinas_luar' | 'cuti' | '';

const STATUS_OPTS: { value: Exclude<StatusAbsensiGtk, ''>; label: string; color: string }[] = [
  { value: 'hadir', label: 'H', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-300' },
  { value: 'sakit', label: 'S', color: 'bg-amber-500/15 text-amber-700 border-amber-300' },
  { value: 'izin', label: 'I', color: 'bg-blue-500/15 text-blue-700 border-blue-300' },
  { value: 'alfa', label: 'A', color: 'bg-red-500/15 text-red-700 border-red-300' },
  { value: 'dinas_luar', label: 'D', color: 'bg-purple-500/15 text-purple-700 border-purple-300' },
  { value: 'cuti', label: 'C', color: 'bg-gray-500/15 text-gray-700 border-gray-300' },
];

interface Gtk { id: string; nama: string; jabatan: string | null; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function InputPresensiBulananDialog({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isHoliday } = useHariLibur();
  const [bulan, setBulan] = useState(format(new Date(), 'yyyy-MM'));
  const [gtkList, setGtkList] = useState<Gtk[]>([]);
  // map[gtkId][day] => status
  const [matrix, setMatrix] = useState<Record<string, Record<number, StatusAbsensiGtk>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const year = parseInt(bulan.split('-')[0]);
  const month = parseInt(bulan.split('-')[1]); // 1-12
  const monthDate = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const daysInMonth = getDaysInMonth(monthDate);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // Holiday/weekend marker per day
  const dayMeta = useMemo(() => {
    return days.map((d) => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = new Date(year, month - 1, d);
      const dow = dt.getDay(); // 0=Sun, 6=Sat
      const hol = isHoliday(dateStr);
      return { day: d, dateStr, dow, isWeekend: dow === 0, isHoliday: hol.isLibur, label: format(dt, 'EEE', { locale: idLocale }) };
    });
  }, [days, year, month, isHoliday]);

  // Fetch GTK + existing absensi when month or open changes
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const { data: gtk } = await supabase.from('gtk_ptk').select('id, nama, jabatan').order('nama');
      setGtkList(gtk || []);

      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const { data: ab } = await supabase
        .from('absensi_gtk')
        .select('gtk_id, tanggal, status')
        .gte('tanggal', startStr)
        .lte('tanggal', endStr);

      const mtx: Record<string, Record<number, StatusAbsensiGtk>> = {};
      (gtk || []).forEach(g => { mtx[g.id] = {}; });
      (ab || []).forEach(a => {
        const d = parseInt(a.tanggal.split('-')[2]);
        if (!mtx[a.gtk_id]) mtx[a.gtk_id] = {};
        mtx[a.gtk_id][d] = a.status as StatusAbsensiGtk;
      });
      setMatrix(mtx);
      setLoading(false);
    };
    load();
  }, [open, bulan, year, month, daysInMonth]);

  const setCell = (gtkId: string, day: number, status: StatusAbsensiGtk) => {
    setMatrix(prev => ({
      ...prev,
      [gtkId]: { ...(prev[gtkId] || {}), [day]: status },
    }));
  };

  const fillRow = (gtkId: string, status: Exclude<StatusAbsensiGtk, ''>) => {
    const row: Record<number, StatusAbsensiGtk> = {};
    dayMeta.forEach(dm => {
      if (!dm.isWeekend && !dm.isHoliday) row[dm.day] = status;
    });
    setMatrix(prev => ({ ...prev, [gtkId]: { ...(prev[gtkId] || {}), ...row } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries: any[] = [];
      Object.entries(matrix).forEach(([gtkId, days]) => {
        Object.entries(days).forEach(([d, status]) => {
          if (!status) return;
          const day = parseInt(d);
          entries.push({
            gtk_id: gtkId,
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
        .from('absensi_gtk')
        .upsert(entries, { onConflict: 'gtk_id,tanggal' });
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
            <Calendar className="h-5 w-5" />
            Input Absensi Per Bulan
          </DialogTitle>
          <DialogDescription>
            Isi presensi semua GTK untuk satu bulan penuh. Klik sel untuk siklus status: H → S → I → A → D → C → kosong.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bulan</label>
            <Input type="month" value={bulan} onChange={e => setBulan(e.target.value)} className="w-44" />
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {STATUS_OPTS.map(o => (
              <span key={o.value} className={`px-2 py-0.5 rounded border ${o.color}`}>{o.label}={o.value}</span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
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
                      <div className="text-[10px] font-normal opacity-70">{dm.label.slice(0,3)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gtkList.map(g => (
                  <tr key={g.id} className="border-b hover:bg-muted/30">
                    <td className="sticky left-0 bg-background p-2 border-r font-medium">
                      <div className="truncate max-w-[200px]" title={g.nama}>{g.nama}</div>
                      {g.jabatan && <div className="text-[10px] text-muted-foreground truncate">{g.jabatan}</div>}
                    </td>
                    <td className="p-1 border-r text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => fillRow(g.id, 'hadir')}
                        title="Isi semua hari kerja = Hadir"
                      >
                        H all
                      </Button>
                    </td>
                    {dayMeta.map(dm => {
                      const cur = matrix[g.id]?.[dm.day] || '';
                      const opt = STATUS_OPTS.find(o => o.value === cur);
                      const cycle = () => {
                        const order: StatusAbsensiGtk[] = ['hadir','sakit','izin','alfa','dinas_luar','cuti',''];
                        const idx = order.indexOf(cur);
                        const next = order[(idx + 1) % order.length];
                        setCell(g.id, dm.day, next);
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
                {gtkList.length === 0 && (
                  <tr><td colSpan={daysInMonth + 2} className="p-6 text-center text-muted-foreground">Tidak ada GTK.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="h-4 w-4 mr-2" />Simpan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
