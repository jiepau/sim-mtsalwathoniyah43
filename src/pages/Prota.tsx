import { useEffect, useState } from 'react';
import { Calendar, Plus, Search, Pencil, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
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
import type { Database } from '@/integrations/supabase/types';

type FasePembelajaran = Database['public']['Enums']['fase_pembelajaran'];

interface Prota {
  id: string;
  mapel: string;
  fase: FasePembelajaran;
  kelas: number | null;
  kompetensi_inti: string | null;
  alokasi_waktu_total: string | null;
  keterangan: string | null;
  created_at: string;
  guru?: { nama: string } | null;
  tahun_ajaran?: { nama_ta: string } | null;
}

interface ProtaDetail {
  id: string;
  prota_id: string;
  bulan: number;
  materi: string | null;
  alokasi_waktu: string | null;
  keterangan: string | null;
}

const BULAN_NAMES = [
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
];

const BULAN_ORDER = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]; // Tahun ajaran mulai Juli

export default function ProtaPage() {
  const [data, setData] = useState<Prota[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Prota | null>(null);
  const [selectedProta, setSelectedProta] = useState<Prota | null>(null);
  const [protaDetails, setProtaDetails] = useState<ProtaDetail[]>([]);
  const [guruList, setGuruList] = useState<{ id: string; nama: string }[]>([]);
  const [taList, setTaList] = useState<{ id: string; nama_ta: string }[]>([]);
  
  const [formData, setFormData] = useState({
    mapel: '',
    fase: 'D' as FasePembelajaran,
    kelas: '',
    ta_id: '',
    guru_id: '',
    kompetensi_inti: '',
    alokasi_waktu_total: '',
    keterangan: '',
  });

  const [detailForm, setDetailForm] = useState<Record<number, { materi: string; alokasi_waktu: string; keterangan: string }>>({});

  useEffect(() => {
    fetchData();
    fetchGuru();
    fetchTahunAjaran();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: protaData, error } = await supabase
        .from('prota')
        .select(`
          *,
          guru:gtk_ptk(nama),
          tahun_ajaran(nama_ta)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(protaData || []);
    } catch (error) {
      console.error('Error fetching prota:', error);
      toast.error('Gagal memuat data Prota');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuru = async () => {
    const { data } = await supabase.from('gtk_ptk').select('id, nama').order('nama');
    setGuruList(data || []);
  };

  const fetchTahunAjaran = async () => {
    const { data } = await supabase.from('tahun_ajaran').select('id, nama_ta').order('nama_ta', { ascending: false });
    setTaList(data || []);
  };

  const fetchProtaDetails = async (protaId: string) => {
    const { data, error } = await supabase
      .from('prota_detail')
      .select('*')
      .eq('prota_id', protaId)
      .order('bulan');
    
    if (error) {
      console.error('Error fetching prota details:', error);
      return [];
    }
    return data || [];
  };

  const handleOpenDialog = (item?: Prota) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        mapel: item.mapel,
        fase: item.fase,
        kelas: item.kelas?.toString() || '',
        ta_id: '',
        guru_id: '',
        kompetensi_inti: item.kompetensi_inti || '',
        alokasi_waktu_total: item.alokasi_waktu_total || '',
        keterangan: item.keterangan || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        mapel: '',
        fase: 'D',
        kelas: '',
        ta_id: '',
        guru_id: '',
        kompetensi_inti: '',
        alokasi_waktu_total: '',
        keterangan: '',
      });
    }
    setDialogOpen(true);
  };

  const handleOpenDetailDialog = async (item: Prota) => {
    setSelectedProta(item);
    const details = await fetchProtaDetails(item.id);
    setProtaDetails(details);
    
    // Initialize form with existing data
    const formInit: Record<number, { materi: string; alokasi_waktu: string; keterangan: string }> = {};
    BULAN_ORDER.forEach(bulan => {
      const existing = details.find(d => d.bulan === bulan);
      formInit[bulan] = {
        materi: existing?.materi || '',
        alokasi_waktu: existing?.alokasi_waktu || '',
        keterangan: existing?.keterangan || '',
      };
    });
    setDetailForm(formInit);
    setDetailDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        mapel: formData.mapel,
        fase: formData.fase,
        kelas: formData.kelas ? parseInt(formData.kelas) : null,
        ta_id: formData.ta_id || null,
        guru_id: formData.guru_id || null,
        kompetensi_inti: formData.kompetensi_inti || null,
        alokasi_waktu_total: formData.alokasi_waktu_total || null,
        keterangan: formData.keterangan || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('prota')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Prota berhasil diupdate');
      } else {
        const { error } = await supabase.from('prota').insert(payload);
        if (error) throw error;
        toast.success('Prota berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedProta) return;

    try {
      // Delete existing details first
      await supabase.from('prota_detail').delete().eq('prota_id', selectedProta.id);

      // Insert new details
      const detailsToInsert = BULAN_ORDER
        .filter(bulan => detailForm[bulan]?.materi?.trim())
        .map(bulan => ({
          prota_id: selectedProta.id,
          bulan,
          materi: detailForm[bulan].materi,
          alokasi_waktu: detailForm[bulan].alokasi_waktu || null,
          keterangan: detailForm[bulan].keterangan || null,
        }));

      if (detailsToInsert.length > 0) {
        const { error } = await supabase.from('prota_detail').insert(detailsToInsert);
        if (error) throw error;
      }

      toast.success('Detail Prota berhasil disimpan');
      setDetailDialogOpen(false);
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus Prota ini?')) return;
    
    try {
      const { error } = await supabase.from('prota').delete().eq('id', id);
      if (error) throw error;
      toast.success('Prota berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const filteredData = data.filter(item =>
    item.mapel.toLowerCase().includes(search.toLowerCase()) ||
    item.guru?.nama?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Mata Pelajaran',
      cell: (item: Prota) => (
        <div>
          <p className="font-medium">{item.mapel}</p>
          <p className="text-xs text-muted-foreground">Fase {item.fase}{item.kelas ? ` / Kelas ${item.kelas}` : ''}</p>
        </div>
      ),
    },
    {
      header: 'Guru',
      cell: (item: Prota) => item.guru?.nama || '-',
    },
    {
      header: 'Tahun Ajaran',
      cell: (item: Prota) => item.tahun_ajaran?.nama_ta || '-',
    },
    {
      header: 'Alokasi Waktu',
      cell: (item: Prota) => item.alokasi_waktu_total || '-',
      className: 'w-32'
    },
    {
      header: 'Aksi',
      cell: (item: Prota) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleOpenDetailDialog(item)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-32'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Program Tahunan (Prota)"
        description="Rencana pembelajaran selama satu tahun ajaran"
        icon={<Calendar className="h-6 w-6" />}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari prota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Prota
        </Button>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada data Prota"
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Prota' : 'Tambah Prota Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mapel">Mata Pelajaran *</Label>
                <Input
                  id="mapel"
                  value={formData.mapel}
                  onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fase">Fase</Label>
                <Select
                  value={formData.fase}
                  onValueChange={(value) => setFormData({ ...formData, fase: value as FasePembelajaran })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map(f => (
                      <SelectItem key={f} value={f}>Fase {f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas</Label>
                <Select
                  value={formData.kelas}
                  onValueChange={(value) => setFormData({ ...formData, kelas: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 8, 9].map(k => (
                      <SelectItem key={k} value={k.toString()}>Kelas {k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alokasi_waktu_total">Alokasi Waktu Total</Label>
                <Input
                  id="alokasi_waktu_total"
                  value={formData.alokasi_waktu_total}
                  onChange={(e) => setFormData({ ...formData, alokasi_waktu_total: e.target.value })}
                  placeholder="misal: 72 JP"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ta_id">Tahun Ajaran</Label>
                <Select
                  value={formData.ta_id}
                  onValueChange={(value) => setFormData({ ...formData, ta_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih TA" />
                  </SelectTrigger>
                  <SelectContent>
                    {taList.map(ta => (
                      <SelectItem key={ta.id} value={ta.id}>{ta.nama_ta}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guru_id">Guru Pengampu</Label>
                <Select
                  value={formData.guru_id}
                  onValueChange={(value) => setFormData({ ...formData, guru_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih guru" />
                  </SelectTrigger>
                  <SelectContent>
                    {guruList.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kompetensi_inti">Kompetensi Inti</Label>
              <Textarea
                id="kompetensi_inti"
                value={formData.kompetensi_inti}
                onChange={(e) => setFormData({ ...formData, kompetensi_inti: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                rows={2}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detail Prota: {selectedProta?.mapel}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {BULAN_ORDER.map((bulan, idx) => (
              <Collapsible key={bulan}>
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {BULAN_NAMES[idx]}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {detailForm[bulan]?.materi && (
                            <Badge variant="secondary" className="text-xs">
                              {detailForm[bulan].alokasi_waktu || 'Terisi'}
                            </Badge>
                          )}
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-1 border-l-4 border-l-primary">
                    <CardContent className="pt-4 space-y-3">
                      <div className="space-y-2">
                        <Label>Materi Pokok</Label>
                        <Textarea
                          value={detailForm[bulan]?.materi || ''}
                          onChange={(e) => setDetailForm(prev => ({
                            ...prev,
                            [bulan]: { ...prev[bulan], materi: e.target.value }
                          }))}
                          placeholder="Masukkan materi pembelajaran..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Alokasi Waktu</Label>
                          <Input
                            value={detailForm[bulan]?.alokasi_waktu || ''}
                            onChange={(e) => setDetailForm(prev => ({
                              ...prev,
                              [bulan]: { ...prev[bulan], alokasi_waktu: e.target.value }
                            }))}
                            placeholder="misal: 8 JP"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan</Label>
                          <Input
                            value={detailForm[bulan]?.keterangan || ''}
                            onChange={(e) => setDetailForm(prev => ({
                              ...prev,
                              [bulan]: { ...prev[bulan], keterangan: e.target.value }
                            }))}
                            placeholder="Catatan..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handleSaveDetails}>
              Simpan Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
