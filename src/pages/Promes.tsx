import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Search, Pencil, Trash2, Eye, Database } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDatabaseError } from '@/lib/error-mapper';
import type { Database as DbTypes } from '@/integrations/supabase/types';

type FasePembelajaran = DbTypes['public']['Enums']['fase_pembelajaran'];

interface ATP {
  id: string;
  mapel: string;
  fase: FasePembelajaran;
  kelas: number | null;
  semester: string | null;
  tujuan_pembelajaran: string[] | null;
  capaian_pembelajaran: string;
  alokasi_waktu: string | null;
  ta_id: string | null;
  guru_id: string | null;
  guru?: { nama: string } | null;
  tahun_ajaran?: { nama_ta: string } | null;
}

interface Promes {
  id: string;
  mapel: string;
  fase: FasePembelajaran;
  kelas: number | null;
  semester: string;
  keterangan: string | null;
  created_at: string;
  guru?: { nama: string } | null;
  tahun_ajaran?: { nama_ta: string } | null;
}

interface PromesDetail {
  id: string;
  promes_id: string;
  bulan: number;
  minggu: number;
  tema: string | null;
  sub_tema: string | null;
  tujuan_pembelajaran: string | null;
  alokasi_waktu: string | null;
  keterangan: string | null;
}

// Bulan per semester
const BULAN_GANJIL = [
  { bulan: 7, nama: 'Juli' },
  { bulan: 8, nama: 'Agustus' },
  { bulan: 9, nama: 'September' },
  { bulan: 10, nama: 'Oktober' },
  { bulan: 11, nama: 'November' },
  { bulan: 12, nama: 'Desember' },
];

const BULAN_GENAP = [
  { bulan: 1, nama: 'Januari' },
  { bulan: 2, nama: 'Februari' },
  { bulan: 3, nama: 'Maret' },
  { bulan: 4, nama: 'April' },
  { bulan: 5, nama: 'Mei' },
  { bulan: 6, nama: 'Juni' },
];

export default function PromesPage() {
  const [data, setData] = useState<Promes[]>([]);
  const [atpList, setAtpList] = useState<ATP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Promes | null>(null);
  const [selectedPromes, setSelectedPromes] = useState<Promes | null>(null);
  const [promesDetails, setPromesDetails] = useState<PromesDetail[]>([]);
  const [guruList, setGuruList] = useState<{ id: string; nama: string }[]>([]);
  const [taList, setTaList] = useState<{ id: string; nama_ta: string }[]>([]);
  const [selectedAtpId, setSelectedAtpId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    mapel: '',
    fase: 'D' as FasePembelajaran,
    kelas: '',
    semester: 'ganjil',
    ta_id: '',
    guru_id: '',
    keterangan: '',
  });

  type DetailFormKey = `${number}-${number}`;
  const [detailForm, setDetailForm] = useState<Record<DetailFormKey, {
    tema: string;
    sub_tema: string;
    tujuan_pembelajaran: string;
    alokasi_waktu: string;
    keterangan: string;
  }>>({});

  useEffect(() => {
    fetchData();
    fetchGuru();
    fetchTahunAjaran();
    fetchAtpList();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: promesData, error } = await supabase
        .from('promes')
        .select(`
          *,
          guru:gtk_ptk(nama),
          tahun_ajaran(nama_ta)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(promesData || []);
    } catch (error) {
      console.error('Error fetching promes:', error);
      toast.error('Gagal memuat data Promes');
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

  const fetchAtpList = async () => {
    const { data } = await supabase
      .from('atp')
      .select(`
        id, mapel, fase, kelas, semester, tujuan_pembelajaran, capaian_pembelajaran, alokasi_waktu, ta_id, guru_id,
        guru:gtk_ptk(nama),
        tahun_ajaran(nama_ta)
      `)
      .order('mapel');
    setAtpList(data || []);
  };

  const fetchPromesDetails = async (promesId: string) => {
    const { data, error } = await supabase
      .from('promes_detail')
      .select('*')
      .eq('promes_id', promesId)
      .order('bulan')
      .order('minggu');
    
    if (error) {
      console.error('Error fetching promes details:', error);
      return [];
    }
    return data || [];
  };

  // Filter ATP based on selected semester
  const filteredAtpList = atpList.filter(atp => {
    if (!formData.semester) return true;
    return atp.semester === formData.semester || !atp.semester;
  });

  const handleSelectAtp = (atpId: string) => {
    setSelectedAtpId(atpId);
    const atp = atpList.find(a => a.id === atpId);
    if (atp) {
      setFormData(prev => ({
        ...prev,
        mapel: atp.mapel,
        fase: atp.fase,
        kelas: atp.kelas?.toString() || '',
        semester: atp.semester || prev.semester,
        ta_id: atp.ta_id || '',
        guru_id: atp.guru_id || '',
      }));

      // Auto-fill detail form with TP from ATP
      if (atp.tujuan_pembelajaran && atp.tujuan_pembelajaran.length > 0) {
        const bulanList = (atp.semester || formData.semester) === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;
        const totalSlots = bulanList.length * 4; // 4 minggu efektif per bulan
        const tpPerSlot = Math.ceil(atp.tujuan_pembelajaran.length / totalSlots);
        
        const newDetailForm: Record<DetailFormKey, any> = {};
        let tpIndex = 0;

        bulanList.forEach(b => {
          for (let minggu = 1; minggu <= 5; minggu++) {
            const key = `${b.bulan}-${minggu}` as DetailFormKey;
            
            if (minggu <= 4 && tpIndex < atp.tujuan_pembelajaran!.length) {
              const startIdx = tpIndex;
              const endIdx = Math.min(tpIndex + tpPerSlot, atp.tujuan_pembelajaran!.length);
              const tpForSlot = atp.tujuan_pembelajaran!.slice(startIdx, endIdx);
              
              newDetailForm[key] = {
                tema: atp.mapel,
                sub_tema: '',
                tujuan_pembelajaran: tpForSlot.join('\n'),
                alokasi_waktu: atp.alokasi_waktu || '',
                keterangan: '',
              };
              tpIndex = endIdx;
            } else {
              newDetailForm[key] = {
                tema: '',
                sub_tema: '',
                tujuan_pembelajaran: '',
                alokasi_waktu: '',
                keterangan: '',
              };
            }
          }
        });
        setDetailForm(newDetailForm);
      }

      toast.success(`Data dari ATP "${atp.mapel}" berhasil diambil`);
    }
  };

  const handleOpenDialog = (item?: Promes) => {
    setSelectedAtpId('');
    if (item) {
      setEditingItem(item);
      setFormData({
        mapel: item.mapel,
        fase: item.fase,
        kelas: item.kelas?.toString() || '',
        semester: item.semester,
        ta_id: '',
        guru_id: '',
        keterangan: item.keterangan || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        mapel: '',
        fase: 'D',
        kelas: '',
        semester: 'ganjil',
        ta_id: '',
        guru_id: '',
        keterangan: '',
      });
    }
    // Reset detail form
    const emptyDetailForm: Record<DetailFormKey, any> = {};
    [...BULAN_GANJIL, ...BULAN_GENAP].forEach(b => {
      for (let minggu = 1; minggu <= 5; minggu++) {
        const key = `${b.bulan}-${minggu}` as DetailFormKey;
        emptyDetailForm[key] = { tema: '', sub_tema: '', tujuan_pembelajaran: '', alokasi_waktu: '', keterangan: '' };
      }
    });
    setDetailForm(emptyDetailForm);
    setDialogOpen(true);
  };

  const handleOpenDetailDialog = async (item: Promes) => {
    setSelectedPromes(item);
    const details = await fetchPromesDetails(item.id);
    setPromesDetails(details);
    
    // Initialize form based on semester
    const bulanList = item.semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;
    const formInit: Record<DetailFormKey, any> = {};
    
    bulanList.forEach(b => {
      for (let minggu = 1; minggu <= 5; minggu++) {
        const key = `${b.bulan}-${minggu}` as DetailFormKey;
        const existing = details.find(d => d.bulan === b.bulan && d.minggu === minggu);
        formInit[key] = {
          tema: existing?.tema || '',
          sub_tema: existing?.sub_tema || '',
          tujuan_pembelajaran: existing?.tujuan_pembelajaran || '',
          alokasi_waktu: existing?.alokasi_waktu || '',
          keterangan: existing?.keterangan || '',
        };
      }
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
        semester: formData.semester,
        ta_id: formData.ta_id || null,
        guru_id: formData.guru_id || null,
        keterangan: formData.keterangan || null,
      };

      let promesId: string;

      if (editingItem) {
        const { error } = await supabase
          .from('promes')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        promesId = editingItem.id;
        toast.success('Promes berhasil diupdate');
      } else {
        const { data: insertedData, error } = await supabase
          .from('promes')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        promesId = insertedData.id;

        // If we have detail form data (from ATP), save it too
        const bulanList = formData.semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;
        const detailsToInsert: any[] = [];

        bulanList.forEach(b => {
          for (let minggu = 1; minggu <= 5; minggu++) {
            const key = `${b.bulan}-${minggu}` as DetailFormKey;
            const detail = detailForm[key];
            
            if (detail?.tema?.trim() || detail?.tujuan_pembelajaran?.trim()) {
              detailsToInsert.push({
                promes_id: promesId,
                bulan: b.bulan,
                minggu,
                tema: detail.tema || null,
                sub_tema: detail.sub_tema || null,
                tujuan_pembelajaran: detail.tujuan_pembelajaran || null,
                alokasi_waktu: detail.alokasi_waktu || null,
                keterangan: detail.keterangan || null,
              });
            }
          }
        });

        if (detailsToInsert.length > 0) {
          await supabase.from('promes_detail').insert(detailsToInsert);
        }

        toast.success('Promes berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedPromes) return;

    try {
      // Delete existing details first
      await supabase.from('promes_detail').delete().eq('promes_id', selectedPromes.id);

      // Insert new details
      const bulanList = selectedPromes.semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;
      const detailsToInsert: any[] = [];

      bulanList.forEach(b => {
        for (let minggu = 1; minggu <= 5; minggu++) {
          const key = `${b.bulan}-${minggu}` as DetailFormKey;
          const detail = detailForm[key];
          
          // Only insert if at least tema or TP is filled
          if (detail?.tema?.trim() || detail?.tujuan_pembelajaran?.trim()) {
            detailsToInsert.push({
              promes_id: selectedPromes.id,
              bulan: b.bulan,
              minggu,
              tema: detail.tema || null,
              sub_tema: detail.sub_tema || null,
              tujuan_pembelajaran: detail.tujuan_pembelajaran || null,
              alokasi_waktu: detail.alokasi_waktu || null,
              keterangan: detail.keterangan || null,
            });
          }
        }
      });

      if (detailsToInsert.length > 0) {
        const { error } = await supabase.from('promes_detail').insert(detailsToInsert);
        if (error) throw error;
      }

      toast.success('Detail Promes berhasil disimpan');
      setDetailDialogOpen(false);
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus Promes ini?')) return;
    
    try {
      const { error } = await supabase.from('promes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Promes berhasil dihapus');
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
      cell: (item: Promes) => (
        <div>
          <p className="font-medium">{item.mapel}</p>
          <p className="text-xs text-muted-foreground">Fase {item.fase}{item.kelas ? ` / Kelas ${item.kelas}` : ''}</p>
        </div>
      ),
    },
    {
      header: 'Semester',
      cell: (item: Promes) => (
        <Badge variant={item.semester === 'ganjil' ? 'default' : 'secondary'}>
          {item.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
        </Badge>
      ),
      className: 'w-28'
    },
    {
      header: 'Guru',
      cell: (item: Promes) => item.guru?.nama || '-',
    },
    {
      header: 'Tahun Ajaran',
      cell: (item: Promes) => item.tahun_ajaran?.nama_ta || '-',
    },
    {
      header: 'Aksi',
      cell: (item: Promes) => (
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

  const bulanList = selectedPromes?.semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Program Semester (Promes)"
        description="Rencana pembelajaran per semester dengan detail mingguan"
        icon={<CalendarDays className="h-6 w-6" />}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari promes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Promes
        </Button>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada data Promes"
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Promes' : 'Tambah Promes Baru'}
            </DialogTitle>
          </DialogHeader>

          {/* ATP Integration Section */}
          {!editingItem && atpList.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Ambil Data dari ATP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAtpId} onValueChange={handleSelectAtp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ATP untuk auto-fill data..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAtpList.map(atp => (
                      <SelectItem key={atp.id} value={atp.id}>
                        {atp.mapel} - Fase {atp.fase} {atp.kelas ? `Kelas ${atp.kelas}` : ''} 
                        {atp.semester ? ` (${atp.semester === 'ganjil' ? 'Ganjil' : 'Genap'})` : ''} 
                        ({atp.guru?.nama || 'Tanpa guru'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Data mapel, fase, kelas, semester, dan TP akan otomatis terisi dari ATP yang dipilih
                </p>
              </CardContent>
            </Card>
          )}

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
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ganjil">Ganjil</SelectItem>
                    <SelectItem value="genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                rows={2}
              />
            </div>

            {/* Preview detail from ATP */}
            {!editingItem && selectedAtpId && (
              <div className="space-y-2">
                <Label>Preview TP per Minggu (dari ATP)</Label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-muted/30 text-xs">
                  {(formData.semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP).map(b => {
                    const hasContent = [1, 2, 3, 4].some(m => {
                      const key = `${b.bulan}-${m}` as DetailFormKey;
                      return detailForm[key]?.tujuan_pembelajaran;
                    });
                    if (!hasContent) return null;
                    return (
                      <div key={b.bulan} className="mb-2">
                        <div className="font-medium text-foreground">{b.nama}</div>
                        {[1, 2, 3, 4].map(minggu => {
                          const key = `${b.bulan}-${minggu}` as DetailFormKey;
                          const tp = detailForm[key]?.tujuan_pembelajaran;
                          if (!tp) return null;
                          return (
                            <div key={minggu} className="pl-2 text-muted-foreground">
                              Minggu {minggu}: {tp.substring(0, 80)}...
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detail Promes: {selectedPromes?.mapel} - Semester {selectedPromes?.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-2 text-left w-28">Bulan</th>
                  {[1, 2, 3, 4, 5].map(w => (
                    <th key={w} className="border p-2 text-center">Minggu {w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulanList.map(b => (
                  <tr key={b.bulan}>
                    <td className="border p-2 font-medium bg-muted/50">{b.nama}</td>
                    {[1, 2, 3, 4, 5].map(minggu => {
                      const key = `${b.bulan}-${minggu}` as DetailFormKey;
                      return (
                        <td key={minggu} className="border p-1">
                          <div className="space-y-1">
                            <Input
                              value={detailForm[key]?.tema || ''}
                              onChange={(e) => setDetailForm(prev => ({
                                ...prev,
                                [key]: { ...prev[key], tema: e.target.value }
                              }))}
                              placeholder="Tema/Materi"
                              className="text-xs h-8"
                            />
                            <Textarea
                              value={detailForm[key]?.tujuan_pembelajaran || ''}
                              onChange={(e) => setDetailForm(prev => ({
                                ...prev,
                                [key]: { ...prev[key], tujuan_pembelajaran: e.target.value }
                              }))}
                              placeholder="Tujuan Pembelajaran"
                              className="text-xs min-h-[60px]"
                            />
                            <Input
                              value={detailForm[key]?.alokasi_waktu || ''}
                              onChange={(e) => setDetailForm(prev => ({
                                ...prev,
                                [key]: { ...prev[key], alokasi_waktu: e.target.value }
                              }))}
                              placeholder="JP"
                              className="text-xs h-8 w-16"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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
