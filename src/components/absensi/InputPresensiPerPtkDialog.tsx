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

type StatusAbsensiGtk = 'hadir' | 'sakit' | 'izin' | 'alfa' | 'dinas_luar' | 'cuti' | '';

const STATUS_LABEL: Record<Exclude<StatusAbsensiGtk, ''>, string> = {
  hadir: 'Hadir', sakit: 'Sakit', izin: 'Izin', alfa: 'Alfa', dinas_luar: 'Dinas Luar', cuti: 'Cuti',
};

interface Gtk { id: string; nama: string; jabatan: string | null; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function InputPresensiPerPtkDialog({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isHoliday } = useHariLibur();

  const [gtkList, setGtkList] = useState<Gtk[]>([]);
  const [selectedGtk, setSelectedGtk] = useState<string>('');
  const [bulan, setBulan] = useState(format(new Date(), 'yyyy-MM'));
  const [entries, setEntries] = useState<Record<number, { status: StatusAbsensiGtk; keterangan: string }>>({});
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

  // Load GTK list once when open
  useEffect(() => {
    if (!open) return;
    supabase.from('gtk_ptk').select('id, nama, jabatan').order('nama').then(({ data }) => {
      setGtkList(data || []);
    });
  }, [open]);

  // Load existing entries when GTK or month changes
  useEffect(() => {
    if (!open || !selectedGtk) {
      setEntries({});
      return;
    }
    const load = async () => {
      setLoading(true);
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const { data } = await supabase
        .from('absensi_gtk')
        .select('tanggal, status, keterangan')
        .eq('gtk_id', selectedGtk)
        .gte('tanggal', startStr)
        .lte('tanggal', endStr);
      const map: Record<number, { status: StatusAbsensiGtk; keterangan: string }> = {};
      (data || []).forEach(d => {
        const day = parseInt(d.tanggal.split('-')[2]);
        map[day] = { status: d.status as StatusAbsensiGtk, keterangan: d.keterangan || '' };
      });
      setEntries(map);
      setLoading(false);
    };
    load();
  }, [open, selectedGtk, bulan, year, month, daysInMonth]);

  const setDay = (day: number, status: StatusAbsensiGtk) => {
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
    if (!selectedGtk) {
      toast({ title: 'Pilih GTK terlebih dahulu', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any[] = [];
      Object.entries(entries).forEach(([d, e]) => {
        if (!e.status) return;
        const day = parseInt(d);
        payload.push({
          gtk_id: selectedGtk,
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
        .from('absensi_gtk')
        .upsert(payload, { onConflict: 'gtk_id,tanggal' });
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
            Input Presensi Per GTK/PTK
          </DialogTitle>
          <DialogDescription>
            Pilih GTK dan bulan, lalu isi presensi untuk setiap hari.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pilih GTK/PTK</label>
            <Select value={selectedGtk || 'none'} onValueChange={(v) => setSelectedGtk(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Pilih GTK..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Pilih —</SelectItem>
                {gtkList.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.nama}{g.jabatan ? ` · ${g.jabatan}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bulan</label>
            <Input type="month" value={bulan} onChange={e => setBulan(e.target.value)} />
          </div>
        </div>

        {selectedGtk && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fillAllHadir}>Isi semua hari kerja = Hadir</Button>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : selectedGtk ? (
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
                          onValueChange={(v) => setDay(d.day, v === 'none' ? '' : v as StatusAbsensiGtk)}
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
            Pilih GTK terlebih dahulu untuk mulai input.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || !selectedGtk}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="h-4 w-4 mr-2" />Simpan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
