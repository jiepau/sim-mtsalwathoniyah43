import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Plus, Trash2, Edit, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface HariLibur {
  id: string;
  tanggal: string;
  nama_libur: string;
  keterangan: string | null;
  created_at: string;
}

const KalenderAkademik = () => {
  const { toast } = useToast();
  const [data, setData] = useState<HariLibur[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<HariLibur | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tanggal: '', nama_libur: '', keterangan: '' });

  const fetchData = async () => {
    const { data: res } = await supabase
      .from('hari_libur')
      .select('*')
      .order('tanggal');
    if (res) setData(res);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openDialog = (item?: HariLibur) => {
    if (item) {
      setEditItem(item);
      setForm({ tanggal: item.tanggal, nama_libur: item.nama_libur, keterangan: item.keterangan || '' });
    } else {
      setEditItem(null);
      setForm({ tanggal: '', nama_libur: '', keterangan: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.tanggal || !form.nama_libur) {
      toast({ title: 'Tanggal dan nama libur wajib diisi', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tanggal: form.tanggal,
        nama_libur: form.nama_libur,
        keterangan: form.keterangan || null,
      };
      if (editItem) {
        const { error } = await supabase.from('hari_libur').update(payload).eq('id', editItem.id);
        if (error) throw error;
        toast({ title: 'Hari libur berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('hari_libur').insert(payload);
        if (error) throw error;
        toast({ title: 'Hari libur berhasil ditambahkan' });
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.message?.includes('hari_libur_tanggal_unique')
        ? 'Tanggal tersebut sudah terdaftar sebagai hari libur'
        : err.message;
      toast({ title: 'Gagal menyimpan', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('hari_libur').delete().eq('id', id);
    if (error) {
      toast({ title: 'Gagal menghapus', variant: 'destructive' });
    } else {
      toast({ title: 'Hari libur berhasil dihapus' });
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kalender Akademik"
          description="Kelola hari libur nasional dan cuti bersama"
          icon={<CalendarDays className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender Akademik"
        description="Kelola hari libur nasional dan cuti bersama. Sabtu & Minggu otomatis dianggap libur."
        icon={<CalendarDays className="h-6 w-6" />}
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Hari Libur
          </Button>
        }
      />

      {/* Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Sabtu & Minggu</strong> otomatis dianggap hari libur dan tidak perlu ditambahkan di sini. 
            Halaman ini khusus untuk hari libur nasional, cuti bersama, dan libur khusus madrasah.
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Hari Libur ({data.length})</CardTitle>
          <CardDescription>Hari-hari yang ditandai libur akan otomatis mengunci input absensi</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-semibold w-12">No</th>
                    <th className="p-3 text-left font-semibold">Tanggal</th>
                    <th className="p-3 text-left font-semibold">Hari</th>
                    <th className="p-3 text-left font-semibold">Nama Libur</th>
                    <th className="p-3 text-left font-semibold">Keterangan</th>
                    <th className="p-3 text-center font-semibold w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-mono text-xs">{format(parseISO(item.tanggal), 'd MMM yyyy', { locale: idLocale })}</td>
                      <td className="p-3">{format(parseISO(item.tanggal), 'EEEE', { locale: idLocale })}</td>
                      <td className="p-3 font-medium">{item.nama_libur}</td>
                      <td className="p-3 text-muted-foreground">{item.keterangan || '-'}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada hari libur yang ditambahkan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Hari Libur' : 'Tambah Hari Libur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nama Libur *</Label>
              <Input
                placeholder="Contoh: Hari Raya Idul Fitri"
                value={form.nama_libur}
                onChange={e => setForm({ ...form, nama_libur: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                placeholder="Opsional..."
                value={form.keterangan}
                onChange={e => setForm({ ...form, keterangan: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KalenderAkademik;
