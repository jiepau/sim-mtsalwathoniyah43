import { useEffect, useState } from 'react';
import { Calendar, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TahunAjaran {
  id: string;
  nama_ta: string;
  is_active: boolean;
}

export default function TahunAjaranPage() {
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTa, setEditingTa] = useState<TahunAjaran | null>(null);
  const [formData, setFormData] = useState({
    nama_ta: '',
    is_active: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tahun_ajaran')
        .select('*')
        .order('nama_ta', { ascending: false });

      if (error) throw error;
      setTahunAjaran(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ta?: TahunAjaran) => {
    if (ta) {
      setEditingTa(ta);
      setFormData({
        nama_ta: ta.nama_ta,
        is_active: ta.is_active,
      });
    } else {
      setEditingTa(null);
      setFormData({ nama_ta: '', is_active: false });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // If setting as active, deactivate others first
      if (formData.is_active) {
        await supabase
          .from('tahun_ajaran')
          .update({ is_active: false })
          .neq('id', editingTa?.id || '');
      }

      const payload = {
        nama_ta: formData.nama_ta,
        is_active: formData.is_active,
      };

      if (editingTa) {
        const { error } = await supabase
          .from('tahun_ajaran')
          .update(payload)
          .eq('id', editingTa.id);
        if (error) throw error;
        toast.success('Tahun Ajaran berhasil diupdate');
      } else {
        const { error } = await supabase.from('tahun_ajaran').insert(payload);
        if (error) throw error;
        toast.success('Tahun Ajaran berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tahun ajaran ini?')) return;
    
    try {
      const { error } = await supabase.from('tahun_ajaran').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tahun Ajaran berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const toggleActive = async (ta: TahunAjaran) => {
    try {
      // Deactivate all
      await supabase
        .from('tahun_ajaran')
        .update({ is_active: false })
        .neq('id', '');
      
      // Activate selected
      const { error } = await supabase
        .from('tahun_ajaran')
        .update({ is_active: true })
        .eq('id', ta.id);
      
      if (error) throw error;
      toast.success(`${ta.nama_ta} diaktifkan`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah status');
    }
  };

  const columns = [
    { 
      header: 'Nama Tahun Ajaran', 
      cell: (item: TahunAjaran) => <span className="font-medium">{item.nama_ta}</span>
    },
    { 
      header: 'Status', 
      cell: (item: TahunAjaran) => item.is_active ? (
        <Badge className="bg-success text-success-foreground">
          <Check className="h-3 w-3 mr-1" />
          Aktif
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">Tidak Aktif</Badge>
      )
    },
    { 
      header: 'Aksi', 
      cell: (item: TahunAjaran) => (
        <div className="flex items-center gap-1">
          {!item.is_active && (
            <Button size="sm" variant="outline" onClick={() => toggleActive(item)}>
              Aktifkan
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-48'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Tahun Ajaran" 
        description={`Total ${tahunAjaran.length} tahun ajaran`}
        icon={<Calendar className="h-6 w-6" />}
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tahun Ajaran
          </Button>
        }
      />

      <DataTable 
        data={tahunAjaran} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada data tahun ajaran"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTa ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_ta">Nama Tahun Ajaran</Label>
              <Input
                id="nama_ta"
                value={formData.nama_ta}
                onChange={(e) => setFormData({ ...formData, nama_ta: e.target.value })}
                placeholder="Contoh: 2024/2025"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Set sebagai aktif</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingTa ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
