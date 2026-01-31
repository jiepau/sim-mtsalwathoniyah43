import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Search, Upload, Pencil, Trash2, Phone, X } from 'lucide-react';
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
import { ImportDialog, ImportResult } from '@/components/import/ImportDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDatabaseError } from '@/lib/error-mapper';

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string | null;
  ta_id: string | null;
  wa_ortu: string | null;
  alamat: string | null;
  kelas?: { nama_kelas: string };
  tahun_ajaran?: { nama_ta: string };
}

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
}

export default function SiswaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kelasFilter = searchParams.get('kelas');
  
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas_id: '',
    ta_id: '',
    wa_ortu: '',
    alamat: '',
  });

  // Import configuration
  const importHeaders = ['NIS', 'Nama', 'Kelas', 'Tahun Ajaran', 'WA Ortu', 'Alamat'];
  const importSampleData = [
    ['001', 'Ahmad Fauzi', '7A', '2024/2025', '081234567890', 'Jl. Merdeka No. 1'],
    ['002', 'Siti Aminah', '7B', '2024/2025', '081234567891', 'Jl. Sudirman No. 2'],
  ];

  const handleImport = async (data: Record<string, string>[]): Promise<ImportResult> => {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        const nis = row['NIS']?.trim();
        const nama = row['Nama']?.trim();
        const kelasNama = row['Kelas']?.trim();
        const taNama = row['Tahun Ajaran']?.trim();
        const waOrtu = row['WA Ortu']?.trim();
        const alamat = row['Alamat']?.trim();

        if (!nis || !nama) {
          throw new Error('NIS dan Nama harus diisi');
        }

        // Find kelas_id by name
        let kelasId: string | null = null;
        if (kelasNama) {
          const foundKelas = kelas.find(k => k.nama_kelas.toLowerCase() === kelasNama.toLowerCase());
          if (foundKelas) kelasId = foundKelas.id;
        }

        // Find ta_id by name
        let taId: string | null = null;
        if (taNama) {
          const foundTa = tahunAjaran.find(ta => ta.nama_ta.toLowerCase() === taNama.toLowerCase());
          if (foundTa) taId = foundTa.id;
        }

        const { error } = await supabase.from('siswa').insert({
          nis,
          nama,
          kelas_id: kelasId,
          ta_id: taId,
          wa_ortu: waOrtu || null,
          alamat: alamat || null,
        });

        if (error) throw error;
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Baris ${row['NIS'] || '?'}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [siswaRes, kelasRes, taRes] = await Promise.all([
        supabase
          .from('siswa')
          .select(`*, kelas(nama_kelas), tahun_ajaran(nama_ta)`)
          .order('nama'),
        supabase.from('kelas').select('*').order('nama_kelas'),
        supabase.from('tahun_ajaran').select('*').order('nama_ta'),
      ]);

      if (siswaRes.data) setSiswa(siswaRes.data);
      if (kelasRes.data) setKelas(kelasRes.data);
      if (taRes.data) setTahunAjaran(taRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (siswaData?: Siswa) => {
    if (siswaData) {
      setEditingSiswa(siswaData);
      setFormData({
        nis: siswaData.nis,
        nama: siswaData.nama,
        kelas_id: siswaData.kelas_id || '',
        ta_id: siswaData.ta_id || '',
        wa_ortu: siswaData.wa_ortu || '',
        alamat: siswaData.alamat || '',
      });
    } else {
      setEditingSiswa(null);
      setFormData({ nis: '', nama: '', kelas_id: '', ta_id: '', wa_ortu: '', alamat: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        nis: formData.nis,
        nama: formData.nama,
        kelas_id: formData.kelas_id || null,
        ta_id: formData.ta_id || null,
        wa_ortu: formData.wa_ortu || null,
        alamat: formData.alamat || null,
      };

      if (editingSiswa) {
        const { error } = await supabase
          .from('siswa')
          .update(payload)
          .eq('id', editingSiswa.id);
        if (error) throw error;
        toast.success('Siswa berhasil diupdate');
      } else {
        const { error } = await supabase.from('siswa').insert(payload);
        if (error) throw error;
        toast.success('Siswa berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;
    
    try {
      const { error } = await supabase.from('siswa').delete().eq('id', id);
      if (error) throw error;
      toast.success('Siswa berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  // Filter by search and kelas from URL
  const filteredSiswa = siswa.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.toLowerCase().includes(search.toLowerCase());
    const matchesKelas = !kelasFilter || s.kelas_id === kelasFilter;
    return matchesSearch && matchesKelas;
  });

  const filterKelasName = kelasFilter ? kelas.find(k => k.id === kelasFilter)?.nama_kelas : null;

  const clearKelasFilter = () => {
    setSearchParams({});
  };

  const columns = [
    { 
      header: 'NIS', 
      cell: (item: Siswa) => <span className="font-mono font-medium">{item.nis}</span>,
      className: 'w-24'
    },
    { header: 'Nama Siswa', accessorKey: 'nama' as keyof Siswa },
    { 
      header: 'Kelas', 
      cell: (item: Siswa) => item.kelas ? (
        <Badge variant="secondary">{item.kelas.nama_kelas}</Badge>
      ) : '-'
    },
    { 
      header: 'Tahun Ajaran', 
      cell: (item: Siswa) => item.tahun_ajaran ? (
        <Badge variant="outline">{item.tahun_ajaran.nama_ta}</Badge>
      ) : '-'
    },
    { 
      header: 'WA Ortu', 
      cell: (item: Siswa) => {
        if (!item.wa_ortu) return '-';
        // Convert 08xx to 628xx format
        let phone = item.wa_ortu.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1);
        } else if (!phone.startsWith('62')) {
          phone = '62' + phone;
        }
        return (
          <a 
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
          >
            <Phone className="h-3 w-3" />
            {item.wa_ortu}
          </a>
        );
      }
    },
    { 
      header: 'Aksi', 
      cell: (item: Siswa) => (
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
        title="Data Siswa" 
        description={`Total ${siswa.length} siswa terdaftar`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        }
      />

      {/* Search & Filter */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari NIS atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {filterKelasName && (
          <Badge variant="secondary" className="gap-1 py-1.5">
            Filter: {filterKelasName}
            <button onClick={clearKelasFilter} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Table */}
      <DataTable 
        data={filteredSiswa} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada data siswa"
      />

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nis">NIS</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                required
                maxLength={20}
              />
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
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={formData.kelas_id} onValueChange={(v) => setFormData({ ...formData, kelas_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelas.map(k => (
                    <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ta">Tahun Ajaran</Label>
              <Select value={formData.ta_id} onValueChange={(v) => setFormData({ ...formData, ta_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tahun Ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaran.map(ta => (
                    <SelectItem key={ta.id} value={ta.id}>{ta.nama_ta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa_ortu">No. WA Orang Tua</Label>
              <Input
                id="wa_ortu"
                value={formData.wa_ortu}
                onChange={(e) => setFormData({ ...formData, wa_ortu: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
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
                {editingSiswa ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Import Data Siswa"
        templateHeaders={importHeaders}
        templateFileName="template_siswa.csv"
        templateSampleData={importSampleData}
        onImport={handleImport}
        onSuccess={fetchData}
      />
    </div>
  );
}
