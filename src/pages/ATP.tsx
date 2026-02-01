import { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight, Target, Sparkles } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDatabaseError } from '@/lib/error-mapper';
import { useNavigate } from 'react-router-dom';

interface GtkPtk {
  id: string;
  nama: string;
  mapel: string | null;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
  is_active: boolean | null;
}

interface ATP {
  id: string;
  guru_id: string | null;
  ta_id: string | null;
  mapel: string;
  fase: string;
  kelas: number | null;
  semester: string | null;
  elemen: string | null;
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string[];
  alokasi_waktu: string | null;
  keterangan: string | null;
  created_at: string;
  guru?: GtkPtk;
  tahun_ajaran?: TahunAjaran;
}

interface CPTemplate {
  id: string;
  mapel: string;
  fase: string;
  elemen: string[];
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string[];
  sumber: string | null;
}

const FASE_OPTIONS = [
  { value: 'A', label: 'Fase A (Kelas 1-2 SD)' },
  { value: 'B', label: 'Fase B (Kelas 3-4 SD)' },
  { value: 'C', label: 'Fase C (Kelas 5-6 SD)' },
  { value: 'D', label: 'Fase D (Kelas 7-9 SMP/MTs)' },
  { value: 'E', label: 'Fase E (Kelas 10 SMA/MA)' },
  { value: 'F', label: 'Fase F (Kelas 11-12 SMA/MA)' },
];

const KELAS_OPTIONS = [
  { value: '7', label: 'Kelas 7' },
  { value: '8', label: 'Kelas 8' },
  { value: '9', label: 'Kelas 9' },
];

const SEMESTER_OPTIONS = [
  { value: 'ganjil', label: 'Ganjil' },
  { value: 'genap', label: 'Genap' },
];

export default function ATPPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ATP[]>([]);
  const [gurus, setGurus] = useState<GtkPtk[]>([]);
  const [tahunAjarans, setTahunAjarans] = useState<TahunAjaran[]>([]);
  const [cpTemplates, setCpTemplates] = useState<CPTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ATP | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  type FaseType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  
  const [formData, setFormData] = useState<{
    guru_id: string;
    ta_id: string;
    mapel: string;
    fase: FaseType;
    kelas: string;
    semester: string;
    elemen: string;
    capaian_pembelajaran: string;
    tujuan_pembelajaran: string[];
    alokasi_waktu: string;
    keterangan: string;
  }>({
    guru_id: '',
    ta_id: '',
    mapel: '',
    fase: 'D',
    kelas: '',
    semester: '',
    elemen: '',
    capaian_pembelajaran: '',
    tujuan_pembelajaran: [''],
    alokasi_waktu: '',
    keterangan: '',
  });

  useEffect(() => {
    fetchData();
    fetchGurus();
    fetchTahunAjaran();
    fetchCpTemplates();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: atpData, error } = await supabase
        .from('atp')
        .select(`
          *,
          guru:gtk_ptk(id, nama, mapel),
          tahun_ajaran(id, nama_ta, is_active)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(atpData || []);
    } catch (error) {
      console.error('Error fetching ATP:', error);
      toast.error('Gagal memuat data ATP');
    } finally {
      setLoading(false);
    }
  };

  const fetchGurus = async () => {
    try {
      const { data, error } = await supabase
        .from('gtk_ptk')
        .select('id, nama, mapel')
        .order('nama');
      if (error) throw error;
      setGurus(data || []);
    } catch (error) {
      console.error('Error fetching gurus:', error);
    }
  };

  const fetchTahunAjaran = async () => {
    try {
      const { data, error } = await supabase
        .from('tahun_ajaran')
        .select('id, nama_ta, is_active')
        .order('nama_ta', { ascending: false });
      if (error) throw error;
      setTahunAjarans(data || []);
    } catch (error) {
      console.error('Error fetching tahun ajaran:', error);
    }
  };

  const fetchCpTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_templates')
        .select('*')
        .order('mapel');
      if (error) throw error;
      setCpTemplates(data || []);
    } catch (error) {
      console.error('Error fetching CP templates:', error);
    }
  };

  // Get available templates for current mapel selection
  const getAvailableMapels = () => {
    const templateMapels = [...new Set(cpTemplates.map(t => t.mapel))];
    return templateMapels;
  };

  // Load template when mapel and fase are selected
  const loadTemplate = () => {
    const template = cpTemplates.find(
      t => t.mapel === formData.mapel && t.fase === formData.fase
    );
    
    if (template) {
      setFormData(prev => ({
        ...prev,
        elemen: template.elemen.join(', '),
        capaian_pembelajaran: template.capaian_pembelajaran,
        tujuan_pembelajaran: template.tujuan_pembelajaran.length > 0 ? template.tujuan_pembelajaran : [''],
      }));
      toast.success('Template CP berhasil dimuat!');
    } else {
      toast.info('Template tidak tersedia untuk kombinasi mapel dan fase ini');
    }
  };

  // Check if template is available for current selection
  const hasTemplate = cpTemplates.some(
    t => t.mapel === formData.mapel && t.fase === formData.fase
  );

  const handleOpenDialog = (item?: ATP) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        guru_id: item.guru_id || '',
        ta_id: item.ta_id || '',
        mapel: item.mapel,
        fase: item.fase as FaseType,
        kelas: item.kelas?.toString() || '',
        semester: item.semester || '',
        elemen: item.elemen || '',
        capaian_pembelajaran: item.capaian_pembelajaran,
        tujuan_pembelajaran: item.tujuan_pembelajaran.length > 0 ? item.tujuan_pembelajaran : [''],
        alokasi_waktu: item.alokasi_waktu || '',
        keterangan: item.keterangan || '',
      });
    } else {
      setEditingItem(null);
      const activeTa = tahunAjarans.find(ta => ta.is_active);
      setFormData({
        guru_id: '',
        ta_id: activeTa?.id || '',
        mapel: '',
        fase: 'D' as FaseType,
        kelas: '',
        semester: '',
        elemen: '',
        capaian_pembelajaran: '',
        tujuan_pembelajaran: [''],
        alokasi_waktu: '',
        keterangan: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter empty tujuan pembelajaran
    const filteredTP = formData.tujuan_pembelajaran.filter(tp => tp.trim() !== '');
    
    if (filteredTP.length === 0) {
      toast.error('Minimal 1 Tujuan Pembelajaran harus diisi');
      return;
    }

    try {
      const payload = {
        guru_id: formData.guru_id || null,
        ta_id: formData.ta_id || null,
        mapel: formData.mapel,
        fase: formData.fase,
        kelas: formData.kelas ? parseInt(formData.kelas) : null,
        semester: formData.semester || null,
        elemen: formData.elemen || null,
        capaian_pembelajaran: formData.capaian_pembelajaran,
        tujuan_pembelajaran: filteredTP,
        alokasi_waktu: formData.alokasi_waktu || null,
        keterangan: formData.keterangan || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('atp')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('ATP berhasil diupdate');
      } else {
        const { error } = await supabase.from('atp').insert(payload);
        if (error) throw error;
        toast.success('ATP berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus ATP ini? KKTP yang terkait juga akan terhapus.')) return;
    
    try {
      const { error } = await supabase.from('atp').delete().eq('id', id);
      if (error) throw error;
      toast.success('ATP berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const addTujuanPembelajaran = () => {
    setFormData(prev => ({
      ...prev,
      tujuan_pembelajaran: [...prev.tujuan_pembelajaran, '']
    }));
  };

  const removeTujuanPembelajaran = (index: number) => {
    if (formData.tujuan_pembelajaran.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      tujuan_pembelajaran: prev.tujuan_pembelajaran.filter((_, i) => i !== index)
    }));
  };

  const updateTujuanPembelajaran = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tujuan_pembelajaran: prev.tujuan_pembelajaran.map((tp, i) => i === index ? value : tp)
    }));
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredData = data.filter(item =>
    item.mapel.toLowerCase().includes(search.toLowerCase()) ||
    item.capaian_pembelajaran.toLowerCase().includes(search.toLowerCase()) ||
    (item.guru?.nama && item.guru.nama.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      header: '',
      cell: (item: ATP) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            toggleRow(item.id);
          }}
        >
          {expandedRows.has(item.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      className: 'w-10'
    },
    {
      header: 'Mapel',
      cell: (item: ATP) => (
        <div>
          <span className="font-medium">{item.mapel}</span>
          <div className="text-xs text-muted-foreground">
            {item.guru?.nama || 'Belum ada guru'}
          </div>
        </div>
      ),
    },
    {
      header: 'Kelas/Smt',
      cell: (item: ATP) => (
        <div className="text-sm">
          {item.kelas ? (
            <Badge variant="outline">
              Kelas {item.kelas}{item.semester ? ` / ${item.semester === 'ganjil' ? 'Ganjil' : 'Genap'}` : ''}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
      className: 'w-32'
    },
    {
      header: 'Fase',
      cell: (item: ATP) => (
        <Badge variant="secondary">{item.fase}</Badge>
      ),
      className: 'w-16'
    },
    {
      header: 'Tahun Ajaran',
      cell: (item: ATP) => (
        <div className="text-sm">
          {item.tahun_ajaran?.nama_ta || '-'}
          {item.tahun_ajaran?.is_active && (
            <Badge variant="default" className="ml-2 text-xs">Aktif</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'TP',
      cell: (item: ATP) => (
        <div className="text-sm">
          {item.tujuan_pembelajaran.length}
        </div>
      ),
      className: 'w-16'
    },
    {
      header: 'Aksi',
      cell: (item: ATP) => (
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/kktp?atp_id=${item.id}`)}
            title="Kelola KKTP"
          >
            <Target className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-36'
    },
  ];

  // Expanded row content is rendered inline after DataTable

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Alur Tujuan Pembelajaran (ATP)"
        description={`Total ${data.length} ATP terdaftar`}
        icon={<BookOpen className="h-6 w-6" />}
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah ATP
          </Button>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mapel, guru, atau capaian..."
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
        emptyMessage="Belum ada data ATP"
      />
      
      {/* Expanded rows rendered separately */}
      {filteredData.map(item => expandedRows.has(item.id) && (
        <div key={`expanded-${item.id}`} className="bg-muted/30 border border-border/50 rounded-lg p-4 -mt-1 mb-2">
          <div className="space-y-3">
            {item.elemen && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Elemen:</span>
                <p className="text-sm">{item.elemen}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-muted-foreground">Capaian Pembelajaran:</span>
              <p className="text-sm whitespace-pre-wrap">{item.capaian_pembelajaran}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Tujuan Pembelajaran:</span>
              <ol className="list-decimal list-inside text-sm space-y-1 mt-1">
                {item.tujuan_pembelajaran.map((tp, idx) => (
                  <li key={idx}>{tp}</li>
                ))}
              </ol>
            </div>
            {item.alokasi_waktu && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Alokasi Waktu:</span>
                <p className="text-sm">{item.alokasi_waktu}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit ATP' : 'Tambah ATP Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Template loader */}
            {!editingItem && cpTemplates.length > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Template Tersedia</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={!hasTemplate}
                    onClick={loadTemplate}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Muat Template
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pilih mapel dan fase, lalu klik "Muat Template" untuk mengisi CP & TP secara otomatis
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mapel">Mata Pelajaran *</Label>
                {cpTemplates.length > 0 ? (
                  <Select
                    value={formData.mapel}
                    onValueChange={(value) => setFormData({ ...formData, mapel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mapel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableMapels().map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                      <div className="border-t my-1" />
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        Atau ketik mapel lain:
                      </div>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="mapel"
                    value={formData.mapel}
                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                    placeholder="Contoh: Matematika"
                    required
                  />
                )}
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
                    {FASE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas Target</Label>
                <Select
                  value={formData.kelas}
                  onValueChange={(value) => setFormData({ ...formData, kelas: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {KELAS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guru_id">Guru Pengampu</Label>
                <Select
                  value={formData.guru_id}
                  onValueChange={(value) => setFormData({ ...formData, guru_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih guru..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gurus.map(guru => (
                      <SelectItem key={guru.id} value={guru.id}>
                        {guru.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ta_id">Tahun Ajaran</Label>
                <Select
                  value={formData.ta_id}
                  onValueChange={(value) => setFormData({ ...formData, ta_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun ajaran..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tahunAjarans.map(ta => (
                      <SelectItem key={ta.id} value={ta.id}>
                        {ta.nama_ta} {ta.is_active && '(Aktif)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elemen">Elemen</Label>
              <Input
                id="elemen"
                value={formData.elemen}
                onChange={(e) => setFormData({ ...formData, elemen: e.target.value })}
                placeholder="Contoh: Bilangan, Aljabar, Geometri"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capaian_pembelajaran">Capaian Pembelajaran (CP) *</Label>
              <Textarea
                id="capaian_pembelajaran"
                value={formData.capaian_pembelajaran}
                onChange={(e) => setFormData({ ...formData, capaian_pembelajaran: e.target.value })}
                placeholder="Salin dari dokumen CP Kemdikbud..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tujuan Pembelajaran (TP) *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTujuanPembelajaran}>
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
                      onChange={(e) => updateTujuanPembelajaran(index, e.target.value)}
                      placeholder={`Tujuan Pembelajaran ${index + 1}`}
                    />
                    {formData.tujuan_pembelajaran.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeTujuanPembelajaran(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alokasi_waktu">Alokasi Waktu</Label>
                <Input
                  id="alokasi_waktu"
                  value={formData.alokasi_waktu}
                  onChange={(e) => setFormData({ ...formData, alokasi_waktu: e.target.value })}
                  placeholder="Contoh: 4 JP/minggu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Input
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                />
              </div>
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