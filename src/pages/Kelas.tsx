import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
  siswa_count?: number;
}

export default function KelasPage() {
  const navigate = useNavigate();
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: '7',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get kelas with siswa count
      const { data: kelasData, error: kelasError } = await supabase
        .from('kelas')
        .select('*')
        .order('tingkat')
        .order('nama_kelas');

      if (kelasError) throw kelasError;

      // Get siswa count per kelas
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('kelas_id');

      const siswaCount = new Map<string, number>();
      siswaData?.forEach(s => {
        if (s.kelas_id) {
          siswaCount.set(s.kelas_id, (siswaCount.get(s.kelas_id) || 0) + 1);
        }
      });

      const kelasWithCount = kelasData?.map(k => ({
        ...k,
        siswa_count: siswaCount.get(k.id) || 0,
      })) || [];

      setKelas(kelasWithCount);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (kelasData?: Kelas) => {
    if (kelasData) {
      setEditingKelas(kelasData);
      setFormData({
        nama_kelas: kelasData.nama_kelas,
        tingkat: String(kelasData.tingkat),
      });
    } else {
      setEditingKelas(null);
      setFormData({ nama_kelas: '', tingkat: '7' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        nama_kelas: formData.nama_kelas,
        tingkat: parseInt(formData.tingkat),
      };

      if (editingKelas) {
        const { error } = await supabase
          .from('kelas')
          .update(payload)
          .eq('id', editingKelas.id);
        if (error) throw error;
        toast.success('Kelas berhasil diupdate');
      } else {
        const { error } = await supabase.from('kelas').insert(payload);
        if (error) throw error;
        toast.success('Kelas berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kelas ini?')) return;
    
    try {
      const { error } = await supabase.from('kelas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Kelas berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const columns = [
    { 
      header: 'Nama Kelas', 
      cell: (item: Kelas) => <span className="font-medium">{item.nama_kelas}</span>
    },
    { 
      header: 'Tingkat', 
      cell: (item: Kelas) => (
        <Badge variant="secondary">Kelas {item.tingkat}</Badge>
      )
    },
    { 
      header: 'Jumlah Siswa', 
      cell: (item: Kelas) => (
        <Button 
          variant="outline" 
          size="sm"
          className="gap-1 cursor-pointer hover:bg-primary hover:text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/siswa?kelas=${item.id}`);
          }}
        >
          <Users className="h-4 w-4" />
          <span>{item.siswa_count || 0} siswa</span>
        </Button>
      )
    },
    { 
      header: 'Aksi', 
      cell: (item: Kelas) => (
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
        title="Data Kelas" 
        description={`Total ${kelas.length} kelas`}
        icon={<School className="h-6 w-6" />}
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kelas
          </Button>
        }
      />

      <DataTable 
        data={kelas} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada data kelas"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKelas ? 'Edit Kelas' : 'Tambah Kelas Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_kelas">Nama Kelas</Label>
              <Input
                id="nama_kelas"
                value={formData.nama_kelas}
                onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                placeholder="Contoh: VII A, VIII B"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat</Label>
              <Select value={formData.tingkat} onValueChange={(v) => setFormData({ ...formData, tingkat: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Kelas VII</SelectItem>
                  <SelectItem value="8">Kelas VIII</SelectItem>
                  <SelectItem value="9">Kelas IX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingKelas ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
