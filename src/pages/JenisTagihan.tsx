import { useEffect, useState } from 'react';
import { Receipt, Plus, Pencil, Trash2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/supabase-helpers';

interface JenisTagihan {
  id: string;
  nama_tagihan: string;
  nominal: number;
  is_active: boolean;
}

export default function JenisTagihanPage() {
  const [jenisTagihan, setJenisTagihan] = useState<JenisTagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisTagihan | null>(null);
  const [formData, setFormData] = useState({
    nama_tagihan: '',
    nominal: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jenis_tagihan')
        .select('*')
        .order('nama_tagihan');

      if (error) throw error;
      setJenisTagihan(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: JenisTagihan) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nama_tagihan: item.nama_tagihan,
        nominal: String(item.nominal),
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({ nama_tagihan: '', nominal: '', is_active: true });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        nama_tagihan: formData.nama_tagihan,
        nominal: parseFloat(formData.nominal) || 0,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('jenis_tagihan')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Jenis Tagihan berhasil diupdate');
      } else {
        const { error } = await supabase.from('jenis_tagihan').insert(payload);
        if (error) throw error;
        toast.success('Jenis Tagihan berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jenis tagihan ini?')) return;
    
    try {
      const { error } = await supabase.from('jenis_tagihan').delete().eq('id', id);
      if (error) throw error;
      toast.success('Jenis Tagihan berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const columns = [
    { 
      header: 'Nama Tagihan', 
      cell: (item: JenisTagihan) => <span className="font-medium">{item.nama_tagihan}</span>
    },
    { 
      header: 'Nominal', 
      cell: (item: JenisTagihan) => (
        <span className="font-semibold text-primary">{formatCurrency(item.nominal)}</span>
      )
    },
    { 
      header: 'Status', 
      cell: (item: JenisTagihan) => item.is_active ? (
        <Badge className="bg-success/15 text-success border-success/30">Aktif</Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">Tidak Aktif</Badge>
      )
    },
    { 
      header: 'Aksi', 
      cell: (item: JenisTagihan) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-24'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Jenis Tagihan" 
        description={`Total ${jenisTagihan.length} jenis tagihan`}
        icon={<Receipt className="h-6 w-6" />}
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jenis Tagihan
          </Button>
        }
      />

      <DataTable 
        data={jenisTagihan} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada jenis tagihan"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Jenis Tagihan' : 'Tambah Jenis Tagihan Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_tagihan">Nama Tagihan</Label>
              <Input
                id="nama_tagihan"
                value={formData.nama_tagihan}
                onChange={(e) => setFormData({ ...formData, nama_tagihan: e.target.value })}
                placeholder="Contoh: SPP, Uang Gedung, Seragam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal (Rp)</Label>
              <Input
                id="nominal"
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                placeholder="100000"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Status Aktif</Label>
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
                {editingItem ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
