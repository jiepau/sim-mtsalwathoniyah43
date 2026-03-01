import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportButton } from '@/components/export/ExportButton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useHariLibur } from '@/hooks/useHariLibur';
import { ClipboardList, Save, Calendar, CheckCircle, XCircle, AlertCircle, Clock, Briefcase, PalmtreeIcon, CalendarOff } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface GtkPtk {
  id: string;
  nama: string;
  jabatan: string | null;
  nip: string | null;
}

type StatusAbsensiGtk = 'hadir' | 'sakit' | 'izin' | 'alfa' | 'dinas_luar' | 'cuti';

interface AbsensiEntry {
  gtk_id: string;
  status: StatusAbsensiGtk;
  keterangan: string;
}

const STATUS_CONFIG: Record<StatusAbsensiGtk, { label: string; color: string }> = {
  hadir: { label: 'Hadir', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  sakit: { label: 'Sakit', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  izin: { label: 'Izin', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  alfa: { label: 'Alfa', color: 'bg-red-500/10 text-red-700 border-red-200' },
  dinas_luar: { label: 'Dinas', color: 'bg-purple-500/10 text-purple-700 border-purple-200' },
  cuti: { label: 'Cuti', color: 'bg-gray-500/10 text-gray-700 border-gray-200' },
};

const AbsensiGtk = () => {
  const { toast } = useToast();
  const { user, isAdmin, hasRole } = useAuth();
  const isOperator = hasRole('operator');
  const isGuru = hasRole('guru');
  const canManageAll = isAdmin || isOperator;
  const { isHoliday } = useHariLibur();
  const [gtkList, setGtkList] = useState<GtkPtk[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absensiData, setAbsensiData] = useState<Record<string, AbsensiEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingIds, setExistingIds] = useState<Record<string, string>>({});

  // Fetch GTK list - Guru only sees themselves
  useEffect(() => {
    const fetchGtk = async () => {
      let query = supabase
        .from('gtk_ptk')
        .select('id, nama, jabatan, nip')
        .order('nama');
      
      // Guru only sees their own GTK record
      if (isGuru && !canManageAll) {
        query = query.eq('user_id', user?.id);
      }

      const { data } = await query;
      if (data) {
        setGtkList(data);
        const defaults: Record<string, AbsensiEntry> = {};
        data.forEach(g => {
          defaults[g.id] = { gtk_id: g.id, status: 'hadir', keterangan: '' };
        });
        setAbsensiData(defaults);
      }
      setLoading(false);
    };
    fetchGtk();
  }, [user, isGuru, canManageAll]);

  // Fetch existing absensi for selected date
  useEffect(() => {
    if (gtkList.length === 0) return;
    const fetchExisting = async () => {
      const { data } = await supabase
        .from('absensi_gtk')
        .select('*')
        .eq('tanggal', selectedDate);
      if (data && data.length > 0) {
        const mapped: Record<string, AbsensiEntry> = {};
        const ids: Record<string, string> = {};
        data.forEach(d => {
          mapped[d.gtk_id] = {
            gtk_id: d.gtk_id,
            status: d.status as StatusAbsensiGtk,
            keterangan: d.keterangan || '',
          };
          ids[d.gtk_id] = d.id;
        });
        setAbsensiData(prev => {
          const merged: Record<string, AbsensiEntry> = {};
          gtkList.forEach(g => {
            merged[g.id] = mapped[g.id] || { gtk_id: g.id, status: 'hadir', keterangan: '' };
          });
          return merged;
        });
        setExistingIds(ids);
      } else {
        setExistingIds({});
        const defaults: Record<string, AbsensiEntry> = {};
        gtkList.forEach(g => {
          defaults[g.id] = { gtk_id: g.id, status: 'hadir', keterangan: '' };
        });
        setAbsensiData(defaults);
      }
    };
    fetchExisting();
  }, [selectedDate, gtkList]);

  const updateStatus = (gtkId: string, status: StatusAbsensiGtk) => {
    setAbsensiData(prev => ({
      ...prev,
      [gtkId]: { ...prev[gtkId], status },
    }));
  };

  const updateKeterangan = (gtkId: string, keterangan: string) => {
    setAbsensiData(prev => ({
      ...prev,
      [gtkId]: { ...prev[gtkId], keterangan },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.values(absensiData).map(e => ({
        gtk_id: e.gtk_id,
        tanggal: selectedDate,
        status: e.status,
        keterangan: e.keterangan || null,
        created_by: user?.id || null,
      }));

      const { error } = await supabase
        .from('absensi_gtk')
        .upsert(entries, { onConflict: 'gtk_id,tanggal' });

      if (error) throw error;
      toast({ title: 'Absensi GTK berhasil disimpan!' });
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan absensi', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const values = Object.values(absensiData);
    return {
      hadir: values.filter(v => v.status === 'hadir').length,
      sakit: values.filter(v => v.status === 'sakit').length,
      izin: values.filter(v => v.status === 'izin').length,
      alfa: values.filter(v => v.status === 'alfa').length,
      dinas_luar: values.filter(v => v.status === 'dinas_luar').length,
      cuti: values.filter(v => v.status === 'cuti').length,
      total: values.length,
    };
  }, [absensiData]);

  const hasData = Object.keys(existingIds).length > 0;

  // Holiday check
  const holidayInfo = useMemo(() => isHoliday(selectedDate), [selectedDate, isHoliday]);

  // Export data
  const exportData = useMemo(() => {
    const formattedDate = format(new Date(selectedDate), 'd MMMM yyyy', { locale: idLocale });
    const dayName = format(new Date(selectedDate), 'EEEE', { locale: idLocale });
    return gtkList.map((g, idx) => ({
      no: idx + 1,
      tanggal: formattedDate,
      hari: dayName,
      nama: g.nama,
      nip: g.nip || '-',
      jabatan: g.jabatan || '-',
      status: holidayInfo.isLibur ? 'Libur' : STATUS_CONFIG[absensiData[g.id]?.status || 'hadir'].label,
      keterangan: holidayInfo.isLibur ? holidayInfo.reason : (absensiData[g.id]?.keterangan || ''),
    }));
  }, [gtkList, absensiData, holidayInfo, selectedDate]);

  const exportFilename = `Absensi_GTK_${selectedDate}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isGuru && !canManageAll ? "Absensi Saya" : "Absensi GTK/PTK"}
        description={isGuru && !canManageAll ? "Isi presensi harian Anda" : "Rekap presensi harian guru dan tenaga kependidikan"}
        icon={<ClipboardList className="h-6 w-6" />}
      />

      {/* Date Filter */}
      <div className="max-w-xs">
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tanggal</label>
        <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
      </div>

      {/* Holiday Banner */}
      {holidayInfo.isLibur && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarOff className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">Hari Libur — {holidayInfo.reason}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Input absensi tidak tersedia untuk tanggal ini.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {!holidayInfo.isLibur && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total GTK</p>
            </CardContent>
          </Card>
          {(Object.entries(STATUS_CONFIG) as [StatusAbsensiGtk, typeof STATUS_CONFIG[StatusAbsensiGtk]][]).map(([key, cfg]) => (
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
      {gtkList.length > 0 && !holidayInfo.isLibur ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Daftar Hadir GTK — {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                {hasData && <Badge variant="outline" className="ml-2 text-xs">Sudah diisi</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2">
                <ExportButton
                  data={exportData}
                  columns={[
                    { header: 'No', accessor: (d) => d.no },
                    { header: 'Tanggal', accessor: (d) => d.tanggal },
                    { header: 'Hari', accessor: (d) => d.hari },
                    { header: 'Nama', accessor: (d) => d.nama },
                    { header: 'NIP', accessor: (d) => d.nip },
                    { header: 'Jabatan', accessor: (d) => d.jabatan },
                    { header: 'Status', accessor: (d) => d.status },
                    { header: 'Keterangan', accessor: (d) => d.keterangan },
                  ]}
                  filename={exportFilename}
                  disabled={gtkList.length === 0}
                />
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                </Button>
              </div>
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
                    <th className="p-3 text-center font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {gtkList.map((gtk, idx) => {
                    const entry = absensiData[gtk.id];
                    return (
                      <tr key={gtk.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-medium">{gtk.nama}</td>
                        <td className="p-3 text-muted-foreground text-xs">{gtk.jabatan || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {(Object.entries(STATUS_CONFIG) as [StatusAbsensiGtk, typeof STATUS_CONFIG[StatusAbsensiGtk]][]).map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => updateStatus(gtk.id, key)}
                                className={`px-2 py-1 rounded-md text-xs font-medium border transition-all ${
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
                            onChange={e => updateKeterangan(gtk.id, e.target.value)}
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
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada data GTK/PTK.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AbsensiGtk;
