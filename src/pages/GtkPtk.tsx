import { useEffect, useState } from 'react';
import { UserCog, Plus, Search, Upload, Pencil, Trash2, Phone, Mail } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GtkPtk {
  id: string;
  nip: string | null;
  nama: string;
  jabatan: string | null;
  no_hp: string | null;
  alamat: string | null;
  nuptk: string | null;
  nik: string | null;
  lulusan: string | null;
  email: string | null;
}

export default function GtkPtkPage() {
  const [gtkPtk, setGtkPtk] = useState<GtkPtk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGtk, setEditingGtk] = useState<GtkPtk | null>(null);
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    jabatan: '',
    no_hp: '',
    alamat: '',
    nuptk: '',
    nik: '',
    lulusan: '',
    email: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gtk_ptk')
        .select('*')
        .order('nama');

      if (error) throw error;
      setGtkPtk(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (gtk?: GtkPtk) => {
    if (gtk) {
      setEditingGtk(gtk);
      setFormData({
        nip: gtk.nip || '',
        nama: gtk.nama,
        jabatan: gtk.jabatan || '',
        no_hp: gtk.no_hp || '',
        alamat: gtk.alamat || '',
        nuptk: gtk.nuptk || '',
        nik: gtk.nik || '',
        lulusan: gtk.lulusan || '',
        email: gtk.email || '',
      });
    } else {
      setEditingGtk(null);
      setFormData({ nip: '', nama: '', jabatan: '', no_hp: '', alamat: '', nuptk: '', nik: '', lulusan: '', email: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        nip: formData.nip || null,
        nama: formData.nama,
        jabatan: formData.jabatan || null,
        no_hp: formData.no_hp || null,
        alamat: formData.alamat || null,
        nuptk: formData.nuptk || null,
        nik: formData.nik || null,
        lulusan: formData.lulusan || null,
        email: formData.email || null,
      };

      if (editingGtk) {
        const { error } = await supabase
          .from('gtk_ptk')
          .update(payload)
          .eq('id', editingGtk.id);
        if (error) throw error;
        toast.success('Data berhasil diupdate');
      } else {
        const { error } = await supabase.from('gtk_ptk').insert(payload);
        if (error) throw error;
        toast.success('Data berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    
    try {
      const { error } = await supabase.from('gtk_ptk').delete().eq('id', id);
      if (error) throw error;
      toast.success('Data berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const filteredData = gtkPtk.filter(g => 
    g.nama.toLowerCase().includes(search.toLowerCase()) ||
    (g.nip && g.nip.toLowerCase().includes(search.toLowerCase())) ||
    (g.nuptk && g.nuptk.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    { 
      header: 'NUPTK/NIP', 
      cell: (item: GtkPtk) => (
        <div className="space-y-0.5">
          {item.nuptk && <div className="font-mono text-sm">{item.nuptk}</div>}
          {item.nip && <div className="text-xs text-muted-foreground">NIP: {item.nip}</div>}
          {!item.nuptk && !item.nip && <span className="text-muted-foreground">-</span>}
        </div>
      ),
      className: 'w-44'
    },
    { header: 'Nama', cell: (item: GtkPtk) => <span className="font-medium">{item.nama}</span> },
    { 
      header: 'Jabatan', 
      cell: (item: GtkPtk) => item.jabatan ? (
        <Badge variant="secondary">{item.jabatan}</Badge>
      ) : '-'
    },
    { 
      header: 'Lulusan', 
      cell: (item: GtkPtk) => item.lulusan || '-'
    },
    { 
      header: 'Kontak', 
      cell: (item: GtkPtk) => (
        <div className="space-y-1">
          {item.no_hp && (
            <a 
              href={`tel:${item.no_hp}`}
              className="flex items-center gap-1 text-primary hover:underline text-sm"
            >
              <Phone className="h-3 w-3" />
              {item.no_hp}
            </a>
          )}
          {item.email && (
            <a 
              href={`mailto:${item.email}`}
              className="flex items-center gap-1 text-primary hover:underline text-sm"
            >
              <Mail className="h-3 w-3" />
              {item.email}
            </a>
          )}
          {!item.no_hp && !item.email && '-'}
        </div>
      )
    },
    { 
      header: 'Aksi', 
      cell: (item: GtkPtk) => (
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
        title="GTK/PTK" 
        description={`Total ${gtkPtk.length} GTK/PTK terdaftar`}
        icon={<UserCog className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah GTK/PTK
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari NUPTK, NIP atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable 
        data={filteredData} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada data GTK/PTK"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGtk ? 'Edit GTK/PTK' : 'Tambah GTK/PTK Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nuptk">NUPTK/PegID</Label>
                <Input
                  id="nuptk"
                  value={formData.nuptk}
                  onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                  placeholder="Contoh: 1234567890123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (Opsional)</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="16 digit NIK"
                  maxLength={16}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lulusan">Lulusan</Label>
                <Input
                  id="lulusan"
                  value={formData.lulusan}
                  onChange={(e) => setFormData({ ...formData, lulusan: e.target.value })}
                  placeholder="Contoh: S1 Pendidikan"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input
                id="jabatan"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Contoh: Guru, Kepala Sekolah, TU"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="no_hp">No. HP</Label>
                <Input
                  id="no_hp"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@domain.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingGtk ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
