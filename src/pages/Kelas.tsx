import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Plus, Pencil, Trash2, Users, TrendingUp, BarChart3 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
  siswa_count?: number;
  wali_kelas_id: string | null;
  wali_kelas?: GtkPtk | null;
}

interface GtkPtk {
  id: string;
  nama: string;
  jabatan: string | null;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
  semester: string | null;
  is_active: boolean | null;
}

interface Siswa {
  id: string;
  kelas_id: string | null;
  ta_id: string | null;
}

interface TASummary {
  ta_name: string;
  total: number;
  kelas7: number;
  kelas8: number;
  kelas9: number;
}

export default function KelasPage() {
  const navigate = useNavigate();
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [gtkList, setGtkList] = useState<GtkPtk[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedTA, setSelectedTA] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: '7',
    wali_kelas_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Set default TA to active one after data loads
  useEffect(() => {
    if (tahunAjaranList.length > 0 && selectedTA === 'all') {
      const activeTA = tahunAjaranList.find(ta => ta.is_active);
      if (activeTA) {
        setSelectedTA(activeTA.id);
      }
    }
  }, [tahunAjaranList]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kelasRes, taRes, siswaRes, gtkRes] = await Promise.all([
        supabase.from('kelas').select('*, wali_kelas:gtk_ptk!wali_kelas_id(id, nama, jabatan)').order('tingkat').order('nama_kelas'),
        supabase.from('tahun_ajaran').select('*').order('nama_ta', { ascending: false }),
        supabase.from('siswa').select('id, kelas_id, ta_id'),
        supabase.from('gtk_ptk').select('id, nama, jabatan').order('nama'),
      ]);

      if (kelasRes.error) throw kelasRes.error;
      if (taRes.error) throw taRes.error;
      if (siswaRes.error) throw siswaRes.error;
      if (gtkRes.error) throw gtkRes.error;

      setKelas(kelasRes.data || []);
      setTahunAjaranList(taRes.data || []);
      setSiswaList(siswaRes.data || []);
      setGtkList(gtkRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate siswa count per kelas based on selected TA
  const kelasWithCount = useMemo(() => {
    const filteredSiswa = selectedTA === 'all' 
      ? siswaList 
      : siswaList.filter(s => s.ta_id === selectedTA);

    const siswaCount = new Map<string, number>();
    filteredSiswa.forEach(s => {
      if (s.kelas_id) {
        siswaCount.set(s.kelas_id, (siswaCount.get(s.kelas_id) || 0) + 1);
      }
    });

    return kelas.map(k => ({
      ...k,
      siswa_count: siswaCount.get(k.id) || 0,
    }));
  }, [kelas, siswaList, selectedTA]);

  // Calculate total siswa for selected TA
  const totalSiswa = useMemo(() => {
    return kelasWithCount.reduce((sum, k) => sum + (k.siswa_count || 0), 0);
  }, [kelasWithCount]);

  // Calculate summary per tingkat
  const tingkatSummary = useMemo(() => {
    const summary = { 7: 0, 8: 0, 9: 0 };
    kelasWithCount.forEach(k => {
      if (k.tingkat in summary) {
        summary[k.tingkat as 7 | 8 | 9] += k.siswa_count || 0;
      }
    });
    return summary;
  }, [kelasWithCount]);

  // Generate chart data comparing all TAs
  const chartData = useMemo(() => {
    const data: TASummary[] = tahunAjaranList.map(ta => {
      const taSiswa = siswaList.filter(s => s.ta_id === ta.id);
      
      let kelas7 = 0, kelas8 = 0, kelas9 = 0;
      taSiswa.forEach(s => {
        const kelasData = kelas.find(k => k.id === s.kelas_id);
        if (kelasData) {
          if (kelasData.tingkat === 7) kelas7++;
          else if (kelasData.tingkat === 8) kelas8++;
          else if (kelasData.tingkat === 9) kelas9++;
        }
      });

      const semesterLabel = ta.semester === 'genap' ? 'Genap' : 'Ganjil';
      return {
        ta_name: `${ta.nama_ta} ${semesterLabel}`,
        total: taSiswa.length,
        kelas7,
        kelas8,
        kelas9,
      };
    }).reverse(); // Show oldest first

    return data;
  }, [tahunAjaranList, siswaList, kelas]);

  const handleOpenDialog = (kelasData?: Kelas) => {
    if (kelasData) {
      setEditingKelas(kelasData);
      setFormData({
        nama_kelas: kelasData.nama_kelas,
        tingkat: String(kelasData.tingkat),
        wali_kelas_id: kelasData.wali_kelas_id || '',
      });
    } else {
      setEditingKelas(null);
      setFormData({ nama_kelas: '', tingkat: '7', wali_kelas_id: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        nama_kelas: formData.nama_kelas,
        tingkat: parseInt(formData.tingkat),
        wali_kelas_id: formData.wali_kelas_id || null,
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

  const getSelectedTAName = () => {
    if (selectedTA === 'all') return 'Semua Tahun Ajaran';
    const ta = tahunAjaranList.find(ta => ta.id === selectedTA);
    if (!ta) return '';
    const semesterLabel = ta.semester === 'genap' ? 'Genap' : 'Ganjil';
    return `${ta.nama_ta} - ${semesterLabel}`;
  };

  const selectedTAName = getSelectedTAName();

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
      header: 'Wali Kelas', 
      cell: (item: Kelas) => (
        item.wali_kelas ? (
          <div>
            <span className="font-medium">{item.wali_kelas.nama}</span>
            {item.wali_kelas.jabatan && (
              <span className="text-xs text-muted-foreground block">{item.wali_kelas.jabatan}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
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
            const params = new URLSearchParams();
            params.set('kelas', item.id);
            if (selectedTA !== 'all') params.set('ta', selectedTA);
            navigate(`/siswa?${params.toString()}`);
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

  const chartConfig = {
    kelas7: { label: 'Kelas VII', color: 'hsl(var(--chart-1))' },
    kelas8: { label: 'Kelas VIII', color: 'hsl(var(--chart-2))' },
    kelas9: { label: 'Kelas IX', color: 'hsl(var(--chart-3))' },
  };

  return (
    <div className="animate-fadeIn space-y-6">
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

      {/* Filter & Stats Section */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Filter TA */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Filter Tahun Ajaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTA} onValueChange={setSelectedTA}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                {tahunAjaranList.map(ta => {
                  const semesterLabel = ta.semester === 'genap' ? 'Genap' : 'Ganjil';
                  return (
                    <SelectItem key={ta.id} value={ta.id}>
                      {ta.nama_ta} - {semesterLabel} {ta.is_active && '(Aktif)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalSiswa}</div>
            <p className="text-xs text-muted-foreground">{selectedTAName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kelas VII</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tingkatSummary[7]}</div>
            <p className="text-xs text-muted-foreground">siswa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kelas VIII & IX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tingkatSummary[8] + tingkatSummary[9]}</div>
            <p className="text-xs text-muted-foreground">{tingkatSummary[8]} + {tingkatSummary[9]} siswa</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tren Jumlah Siswa per Tahun Ajaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="ta_name" 
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="kelas7" name="Kelas VII" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kelas8" name="Kelas VIII" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kelas9" name="Kelas IX" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            
            {/* Summary Table */}
            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Tahun Ajaran</th>
                    <th className="px-4 py-2 text-center font-medium">Kelas VII</th>
                    <th className="px-4 py-2 text-center font-medium">Kelas VIII</th>
                    <th className="px-4 py-2 text-center font-medium">Kelas IX</th>
                    <th className="px-4 py-2 text-center font-medium">Total</th>
                    <th className="px-4 py-2 text-center font-medium">Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    const prevTotal = index > 0 ? chartData[index - 1].total : null;
                    const change = prevTotal !== null ? item.total - prevTotal : null;
                    
                    return (
                      <tr key={item.ta_name} className="border-t">
                        <td className="px-4 py-2 font-medium">{item.ta_name}</td>
                        <td className="px-4 py-2 text-center">{item.kelas7}</td>
                        <td className="px-4 py-2 text-center">{item.kelas8}</td>
                        <td className="px-4 py-2 text-center">{item.kelas9}</td>
                        <td className="px-4 py-2 text-center font-semibold">{item.total}</td>
                        <td className="px-4 py-2 text-center">
                          {change !== null ? (
                            <Badge variant={change > 0 ? 'default' : change < 0 ? 'destructive' : 'secondary'}>
                              {change > 0 ? '+' : ''}{change}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Kelas - {selectedTAName}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={kelasWithCount} 
            columns={columns} 
            loading={loading}
            emptyMessage="Belum ada data kelas"
          />
        </CardContent>
      </Card>

      {/* Dialog Form */}
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
            <div className="space-y-2">
              <Label htmlFor="wali_kelas">Wali Kelas</Label>
              <Select value={formData.wali_kelas_id} onValueChange={(v) => setFormData({ ...formData, wali_kelas_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Wali Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {gtkList.map(gtk => (
                    <SelectItem key={gtk.id} value={gtk.id}>
                      {gtk.nama} {gtk.jabatan && `(${gtk.jabatan})`}
                    </SelectItem>
                  ))}
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
