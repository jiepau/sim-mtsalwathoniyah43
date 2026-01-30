import { useEffect, useState } from 'react';
import { TrendingDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/supabase-helpers';

interface Pengeluaran {
  id: string;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  nominal: number;
}

export default function PengeluaranPage() {
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengeluaran | null>(null);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: '',
    deskripsi: '',
    nominal: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengeluaran')
        .select('*')
        .order('tanggal', { ascending: false });

      if (error) throw error;
      
      const total = data?.reduce((acc, p) => acc + Number(p.nominal), 0) || 0;
      setPengeluaran(data || []);
      setTotalPengeluaran(total);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: Pengeluaran) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        tanggal: item.tanggal,
        kategori: item.kategori,
        deskripsi: item.deskripsi,
        nominal: String(item.nominal),
      });
    } else {
      setEditingItem(null);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        nominal: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        tanggal: formData.tanggal,
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        nominal: parseFloat(formData.nominal) || 0,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('pengeluaran')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Pengeluaran berhasil diupdate');
      } else {
        const { error } = await supabase.from('pengeluaran').insert(payload);
        if (error) throw error;
        toast.success('Pengeluaran berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return;
    
    try {
      const { error } = await supabase.from('pengeluaran').delete().eq('id', id);
      if (error) throw error;
      toast.success('Pengeluaran berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const columns = [
    { 
      header: 'Tanggal', 
      cell: (item: Pengeluaran) => formatDate(item.tanggal)
    },
    { 
      header: 'Kategori', 
      cell: (item: Pengeluaran) => (
        <Badge variant="secondary">{item.kategori}</Badge>
      )
    },
    { 
      header: 'Deskripsi', 
      accessorKey: 'deskripsi' as keyof Pengeluaran
    },
    { 
      header: 'Nominal', 
      cell: (item: Pengeluaran) => (
        <span className="font-semibold text-destructive">{formatCurrency(item.nominal)}</span>
      )
    },
    { 
      header: 'Aksi', 
      cell: (item: Pengeluaran) => (
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
        title="Pengeluaran" 
        description="Kelola pengeluaran madrasah"
        icon={<TrendingDown className="h-6 w-6" />}
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengeluaran
          </Button>
        }
      />

      <Card className="mb-6 shadow-card border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-destructive">Total Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">{formatCurrency(totalPengeluaran)}</p>
        </CardContent>
      </Card>

      <DataTable 
        data={pengeluaran} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada pengeluaran"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Input
                id="kategori"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                placeholder="Contoh: Operasional, Gaji, ATK"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Keterangan pengeluaran"
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
                required
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
