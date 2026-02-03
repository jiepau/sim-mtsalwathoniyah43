import { useEffect, useState } from 'react';
import { Target, Plus, Search, Pencil, Trash2, ArrowLeft, FileDown } from 'lucide-react';
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exportKKTPToWord } from '@/lib/atp-kktp-export';

interface ATP {
  id: string;
  mapel: string;
  fase: string;
  kelas: number | null;
  semester: string | null;
  elemen: string | null;
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string[];
  alokasi_waktu: string | null;
  nilai_karakter?: string[];
  keterangan: string | null;
  guru?: { nama: string } | null;
  tahun_ajaran?: { nama_ta: string } | null;
}

interface MadrasahSettings {
  nama_madrasah: string;
  alamat: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
}

interface KKTP {
  id: string;
  atp_id: string;
  tujuan_pembelajaran: string;
  kriteria_ketercapaian: string[];
  teknik_penilaian: string | null;
  bentuk_instrumen: string | null;
  keterangan: string | null;
  created_at: string;
  atp?: ATP;
}

const TEKNIK_PENILAIAN_OPTIONS = [
  'Tes Tertulis',
  'Tes Lisan',
  'Penugasan',
  'Praktik/Kinerja',
  'Proyek',
  'Portofolio',
  'Observasi',
];

const BENTUK_INSTRUMEN_OPTIONS = [
  'Pilihan Ganda',
  'Isian Singkat',
  'Uraian',
  'Lembar Observasi',
  'Rubrik',
  'Daftar Cek',
  'Skala Penilaian',
];

export default function KKTPPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const atpIdFromUrl = searchParams.get('atp_id');
  
  const [data, setData] = useState<KKTP[]>([]);
  const [atpList, setAtpList] = useState<ATP[]>([]);
  const [selectedAtp, setSelectedAtp] = useState<ATP | null>(null);
  const [madrasah, setMadrasah] = useState<MadrasahSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KKTP | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [formData, setFormData] = useState({
    atp_id: '',
    tujuan_pembelajaran: '',
    kriteria_ketercapaian: [''],
    teknik_penilaian: '',
    bentuk_instrumen: '',
    keterangan: '',
  });

  useEffect(() => {
    fetchAtpList();
    fetchMadrasah();
  }, []);

  useEffect(() => {
    if (atpIdFromUrl && atpList.length > 0) {
      const atp = atpList.find(a => a.id === atpIdFromUrl);
      if (atp) {
        setSelectedAtp(atp);
      }
    }
  }, [atpIdFromUrl, atpList]);

  useEffect(() => {
    if (selectedAtp) {
      fetchData(selectedAtp.id);
    } else {
      setData([]);
      setLoading(false);
    }
  }, [selectedAtp]);

  const fetchAtpList = async () => {
    try {
      const { data, error } = await supabase
        .from('atp')
        .select(`
          id, mapel, fase, kelas, semester, elemen, capaian_pembelajaran, 
          tujuan_pembelajaran, alokasi_waktu, nilai_karakter, keterangan,
          guru:gtk_ptk(nama),
          tahun_ajaran(nama_ta)
        `)
        .order('mapel');
      if (error) throw error;
      setAtpList((data || []) as ATP[]);
    } catch (error) {
      console.error('Error fetching ATP list:', error);
      toast.error('Gagal memuat daftar ATP');
    }
  };

  const fetchMadrasah = async () => {
    try {
      const { data, error } = await supabase
        .from('madrasah_settings')
        .select('nama_madrasah, alamat, kepala_madrasah, nip_kepala')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setMadrasah(data);
    } catch (error) {
      console.error('Error fetching madrasah settings:', error);
    }
  };

  const fetchData = async (atpId: string) => {
    setLoading(true);
    try {
      const { data: kktpData, error } = await supabase
        .from('kktp')
        .select('*')
        .eq('atp_id', atpId)
        .order('created_at');

      if (error) throw error;
      setData(kktpData || []);
    } catch (error) {
      console.error('Error fetching KKTP:', error);
      toast.error('Gagal memuat data KKTP');
    } finally {
      setLoading(false);
    }
  };

  const handleExportKKTP = async () => {
    if (!selectedAtp || !madrasah) {
      toast.error('Pilih ATP dan pastikan pengaturan madrasah sudah dikonfigurasi');
      return;
    }
    
    setIsExporting(true);
    try {
      await exportKKTPToWord(
        { ...selectedAtp, nilai_karakter: selectedAtp.nilai_karakter || [] },
        data,
        madrasah
      );
      toast.success('Dokumen KKTP berhasil diunduh');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor dokumen');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenDialog = (item?: KKTP, tpFromAtp?: string) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        atp_id: item.atp_id,
        tujuan_pembelajaran: item.tujuan_pembelajaran,
        kriteria_ketercapaian: item.kriteria_ketercapaian.length > 0 ? item.kriteria_ketercapaian : [''],
        teknik_penilaian: item.teknik_penilaian || '',
        bentuk_instrumen: item.bentuk_instrumen || '',
        keterangan: item.keterangan || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        atp_id: selectedAtp?.id || '',
        tujuan_pembelajaran: tpFromAtp || '',
        kriteria_ketercapaian: [''],
        teknik_penilaian: '',
        bentuk_instrumen: '',
        keterangan: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredKriteria = formData.kriteria_ketercapaian.filter(k => k.trim() !== '');
    
    if (filteredKriteria.length === 0) {
      toast.error('Minimal 1 Kriteria Ketercapaian harus diisi');
      return;
    }

    try {
      const payload = {
        atp_id: formData.atp_id,
        tujuan_pembelajaran: formData.tujuan_pembelajaran,
        kriteria_ketercapaian: filteredKriteria,
        teknik_penilaian: formData.teknik_penilaian || null,
        bentuk_instrumen: formData.bentuk_instrumen || null,
        keterangan: formData.keterangan || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('kktp')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('KKTP berhasil diupdate');
      } else {
        const { error } = await supabase.from('kktp').insert(payload);
        if (error) throw error;
        toast.success('KKTP berhasil ditambahkan');
      }

      setDialogOpen(false);
      if (selectedAtp) fetchData(selectedAtp.id);
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus KKTP ini?')) return;
    
    try {
      const { error } = await supabase.from('kktp').delete().eq('id', id);
      if (error) throw error;
      toast.success('KKTP berhasil dihapus');
      if (selectedAtp) fetchData(selectedAtp.id);
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const addKriteria = () => {
    setFormData(prev => ({
      ...prev,
      kriteria_ketercapaian: [...prev.kriteria_ketercapaian, '']
    }));
  };

  const removeKriteria = (index: number) => {
    if (formData.kriteria_ketercapaian.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      kriteria_ketercapaian: prev.kriteria_ketercapaian.filter((_, i) => i !== index)
    }));
  };

  const updateKriteria = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      kriteria_ketercapaian: prev.kriteria_ketercapaian.map((k, i) => i === index ? value : k)
    }));
  };

  const filteredData = data.filter(item =>
    item.tujuan_pembelajaran.toLowerCase().includes(search.toLowerCase()) ||
    item.kriteria_ketercapaian.some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  // Find which TPs don't have KKTP yet
  const tpsWithoutKktp = selectedAtp?.tujuan_pembelajaran.filter(
    tp => !data.some(kktp => kktp.tujuan_pembelajaran === tp)
  ) || [];

  const columns = [
    {
      header: 'Tujuan Pembelajaran',
      cell: (item: KKTP) => (
        <div className="max-w-md">
          <p className="text-sm">{item.tujuan_pembelajaran}</p>
        </div>
      ),
    },
    {
      header: 'Kriteria Ketercapaian',
      cell: (item: KKTP) => (
        <div className="space-y-1">
          {item.kriteria_ketercapaian.slice(0, 2).map((k, idx) => (
            <div key={idx} className="text-sm">• {k}</div>
          ))}
          {item.kriteria_ketercapaian.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{item.kriteria_ketercapaian.length - 2} lainnya
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Teknik Penilaian',
      cell: (item: KKTP) => item.teknik_penilaian ? (
        <Badge variant="outline">{item.teknik_penilaian}</Badge>
      ) : '-',
      className: 'w-36'
    },
    {
      header: 'Instrumen',
      cell: (item: KKTP) => item.bentuk_instrumen ? (
        <Badge variant="secondary">{item.bentuk_instrumen}</Badge>
      ) : '-',
      className: 'w-36'
    },
    {
      header: 'Aksi',
      cell: (item: KKTP) => (
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
        title="Kriteria Ketercapaian TP (KKTP)"
        description="Kriteria untuk mengukur ketercapaian tujuan pembelajaran"
        icon={<Target className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            {selectedAtp && data.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleExportKKTP}
                disabled={isExporting}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isExporting ? 'Mengunduh...' : 'Export Word'}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/atp')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke ATP
            </Button>
          </div>
        }
      />

      {/* ATP Selector */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pilih ATP</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAtp?.id || ''}
            onValueChange={(value) => {
              const atp = atpList.find(a => a.id === value);
              setSelectedAtp(atp || null);
              // Update URL without navigation
              if (atp) {
                window.history.replaceState(null, '', `/kktp?atp_id=${atp.id}`);
              }
            }}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Pilih ATP untuk melihat KKTP..." />
            </SelectTrigger>
            <SelectContent>
              {atpList.map(atp => (
                <SelectItem key={atp.id} value={atp.id}>
                  {atp.mapel} - Fase {atp.fase} ({atp.guru?.nama || 'Tanpa guru'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAtp && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedAtp.mapel}</h4>
                  <p className="text-sm text-muted-foreground">
                    Fase {selectedAtp.fase} • {selectedAtp.guru?.nama || 'Belum ada guru'} • {selectedAtp.tahun_ajaran?.nama_ta || '-'}
                  </p>
                </div>
                <Badge>{selectedAtp.tujuan_pembelajaran.length} TP</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAtp && (
        <>
          {/* TPs without KKTP */}
          {tpsWithoutKktp.length > 0 && (
            <Card className="mb-6 border-warning/50 bg-warning/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-warning-foreground">
                  TP Belum Ada KKTP ({tpsWithoutKktp.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tpsWithoutKktp.map((tp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-sm">{tp}</span>
                      <Button size="sm" onClick={() => handleOpenDialog(undefined, tp)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Buat KKTP
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari KKTP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah KKTP
            </Button>
          </div>

          <DataTable
            data={filteredData}
            columns={columns}
            loading={loading}
            emptyMessage="Belum ada KKTP untuk ATP ini"
          />
        </>
      )}

      {!selectedAtp && (
        <div className="text-center py-12 text-muted-foreground">
          Pilih ATP terlebih dahulu untuk melihat dan mengelola KKTP
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit KKTP' : 'Tambah KKTP Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tujuan_pembelajaran">Tujuan Pembelajaran *</Label>
              {selectedAtp?.tujuan_pembelajaran && selectedAtp.tujuan_pembelajaran.length > 0 ? (
                <Select
                  value={formData.tujuan_pembelajaran}
                  onValueChange={(value) => setFormData({ ...formData, tujuan_pembelajaran: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih TP dari ATP..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAtp.tujuan_pembelajaran.map((tp, idx) => (
                      <SelectItem key={idx} value={tp}>
                        {idx + 1}. {tp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  id="tujuan_pembelajaran"
                  value={formData.tujuan_pembelajaran}
                  onChange={(e) => setFormData({ ...formData, tujuan_pembelajaran: e.target.value })}
                  placeholder="Masukkan tujuan pembelajaran..."
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Kriteria Ketercapaian *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addKriteria}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah
                </Button>
              </div>
              <div className="space-y-2">
                {formData.kriteria_ketercapaian.map((k, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex items-center text-sm text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={k}
                      onChange={(e) => updateKriteria(index, e.target.value)}
                      placeholder={`Kriteria ${index + 1}`}
                    />
                    {formData.kriteria_ketercapaian.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeKriteria(index)}
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
                <Label htmlFor="teknik_penilaian">Teknik Penilaian</Label>
                <Select
                  value={formData.teknik_penilaian}
                  onValueChange={(value) => setFormData({ ...formData, teknik_penilaian: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih teknik..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEKNIK_PENILAIAN_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bentuk_instrumen">Bentuk Instrumen</Label>
                <Select
                  value={formData.bentuk_instrumen}
                  onValueChange={(value) => setFormData({ ...formData, bentuk_instrumen: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih instrumen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BENTUK_INSTRUMEN_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
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
                placeholder="Catatan tambahan..."
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
    </div>
  );
}
