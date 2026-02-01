import { useEffect, useState } from 'react';
import { FileText, Plus, Search, Pencil, Trash2, BookOpen } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDatabaseError } from '@/lib/error-mapper';

interface CPTemplate {
  id: string;
  mapel: string;
  fase: string;
  elemen: string[];
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string[];
  sumber: string | null;
  created_at: string;
}

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const MAPEL_AGAMA = [
  'Al-Qur\'an Hadis',
  'Akidah Akhlak',
  'Fiqih',
  'Sejarah Kebudayaan Islam',
  'Bahasa Arab',
];

const MAPEL_UMUM = [
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'IPA',
  'IPS',
  'Bahasa Inggris',
  'PJOK',
  'Seni Budaya',
  'Prakarya',
  'Informatika',
];

export default function CPTemplatesPage() {
  const [data, setData] = useState<CPTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CPTemplate | null>(null);
  
  type FaseType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  
  const [formData, setFormData] = useState<{
    mapel: string;
    fase: FaseType;
    elemen: string[];
    capaian_pembelajaran: string;
    tujuan_pembelajaran: string[];
    sumber: string;
  }>({
    mapel: '',
    fase: 'D',
    elemen: [''],
    capaian_pembelajaran: '',
    tujuan_pembelajaran: [''],
    sumber: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: templates, error } = await supabase
        .from('cp_templates')
        .select('*')
        .order('mapel')
        .order('fase');

      if (error) throw error;
      setData(templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Gagal memuat template CP');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: CPTemplate) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        mapel: item.mapel,
        fase: item.fase as FaseType,
        elemen: item.elemen.length > 0 ? item.elemen : [''],
        capaian_pembelajaran: item.capaian_pembelajaran,
        tujuan_pembelajaran: item.tujuan_pembelajaran.length > 0 ? item.tujuan_pembelajaran : [''],
        sumber: item.sumber || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        mapel: '',
        fase: 'D',
        elemen: [''],
        capaian_pembelajaran: '',
        tujuan_pembelajaran: [''],
        sumber: 'SK Dirjen Pendis 3211/2022',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredElemen = formData.elemen.filter(el => el.trim() !== '');
    const filteredTP = formData.tujuan_pembelajaran.filter(tp => tp.trim() !== '');
    
    if (filteredTP.length === 0) {
      toast.error('Minimal 1 Tujuan Pembelajaran harus diisi');
      return;
    }

    try {
      const payload = {
        mapel: formData.mapel,
        fase: formData.fase,
        elemen: filteredElemen,
        capaian_pembelajaran: formData.capaian_pembelajaran,
        tujuan_pembelajaran: filteredTP,
        sumber: formData.sumber || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('cp_templates')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Template CP berhasil diupdate');
      } else {
        const { error } = await supabase.from('cp_templates').insert(payload);
        if (error) throw error;
        toast.success('Template CP berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus template CP ini?')) return;
    
    try {
      const { error } = await supabase.from('cp_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template CP berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const addElemen = () => {
    setFormData(prev => ({
      ...prev,
      elemen: [...prev.elemen, '']
    }));
  };

  const removeElemen = (index: number) => {
    if (formData.elemen.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      elemen: prev.elemen.filter((_, i) => i !== index)
    }));
  };

  const updateElemen = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      elemen: prev.elemen.map((el, i) => i === index ? value : el)
    }));
  };

  const addTP = () => {
    setFormData(prev => ({
      ...prev,
      tujuan_pembelajaran: [...prev.tujuan_pembelajaran, '']
    }));
  };

  const removeTP = (index: number) => {
    if (formData.tujuan_pembelajaran.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      tujuan_pembelajaran: prev.tujuan_pembelajaran.filter((_, i) => i !== index)
    }));
  };

  const updateTP = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tujuan_pembelajaran: prev.tujuan_pembelajaran.map((tp, i) => i === index ? value : tp)
    }));
  };

  const filteredData = data.filter(item =>
    item.mapel.toLowerCase().includes(search.toLowerCase()) ||
    item.capaian_pembelajaran.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Mapel',
      cell: (item: CPTemplate) => (
        <div>
          <span className="font-medium">{item.mapel}</span>
        </div>
      ),
    },
    {
      header: 'Fase',
      cell: (item: CPTemplate) => (
        <Badge variant="secondary">{item.fase}</Badge>
      ),
      className: 'w-20'
    },
    {
      header: 'Elemen',
      cell: (item: CPTemplate) => (
        <div className="text-sm">
          {item.elemen.length > 0 ? item.elemen.slice(0, 2).join(', ') : '-'}
          {item.elemen.length > 2 && ` +${item.elemen.length - 2}`}
        </div>
      ),
    },
    {
      header: 'TP',
      cell: (item: CPTemplate) => (
        <Badge variant="outline">{item.tujuan_pembelajaran.length} TP</Badge>
      ),
      className: 'w-20'
    },
    {
      header: 'Sumber',
      cell: (item: CPTemplate) => (
        <span className="text-xs text-muted-foreground">{item.sumber || '-'}</span>
      ),
    },
    {
      header: 'Aksi',
      cell: (item: CPTemplate) => (
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
        title="Template Capaian Pembelajaran"
        description={`${data.length} template tersedia untuk pengisian otomatis ATP`}
        icon={<FileText className="h-6 w-6" />}
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Template
          </Button>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mapel atau CP..."
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
        emptyMessage="Belum ada template CP"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Template CP' : 'Tambah Template CP Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mapel">Mata Pelajaran *</Label>
                <Select
                  value={formData.mapel}
                  onValueChange={(value) => setFormData({ ...formData, mapel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mapel..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Mapel Agama</div>
                    {MAPEL_AGAMA.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">Mapel Umum</div>
                    {MAPEL_UMUM.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fase">Fase *</Label>
                <Select
                  value={formData.fase}
                  onValueChange={(value) => setFormData({ ...formData, fase: value as FaseType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FASE_OPTIONS.map(f => (
                      <SelectItem key={f} value={f}>Fase {f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Elemen</Label>
                <Button type="button" variant="outline" size="sm" onClick={addElemen}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah
                </Button>
              </div>
              <div className="space-y-2">
                {formData.elemen.map((el, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={el}
                      onChange={(e) => updateElemen(index, e.target.value)}
                      placeholder={`Elemen ${index + 1}`}
                    />
                    {formData.elemen.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeElemen(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capaian_pembelajaran">Capaian Pembelajaran *</Label>
              <Textarea
                id="capaian_pembelajaran"
                value={formData.capaian_pembelajaran}
                onChange={(e) => setFormData({ ...formData, capaian_pembelajaran: e.target.value })}
                placeholder="Pada akhir fase ini, peserta didik mampu..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tujuan Pembelajaran *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTP}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah TP
                </Button>
              </div>
              <div className="space-y-2">
                {formData.tujuan_pembelajaran.map((tp, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex items-center text-sm text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={tp}
                      onChange={(e) => updateTP(index, e.target.value)}
                      placeholder={`Tujuan Pembelajaran ${index + 1}`}
                    />
                    {formData.tujuan_pembelajaran.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeTP(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sumber">Sumber</Label>
              <Input
                id="sumber"
                value={formData.sumber}
                onChange={(e) => setFormData({ ...formData, sumber: e.target.value })}
                placeholder="SK Dirjen Pendis 3211/2022"
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
