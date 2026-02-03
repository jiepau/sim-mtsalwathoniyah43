import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, FileOutput, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface SuratKeluar {
  id: string;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  klasifikasi: string;
  keterangan: string | null;
  created_at: string;
}

interface FormData {
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  klasifikasi: string;
  keterangan: string;
}

const initialFormData: FormData = {
  nomor_surat: '',
  tanggal_surat: new Date().toISOString().split('T')[0],
  tujuan: '',
  perihal: '',
  klasifikasi: 'biasa',
  keterangan: '',
};

export default function SuratKeluar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch surat keluar
  const { data: suratList, isLoading } = useQuery({
    queryKey: ['surat-keluar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surat_keluar')
        .select('*')
        .order('tanggal_surat', { ascending: false });
      
      if (error) throw error;
      return data as SuratKeluar[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingId) {
        const { error } = await supabase
          .from('surat_keluar')
          .update(data)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('surat_keluar')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-keluar'] });
      toast({
        title: 'Berhasil',
        description: editingId ? 'Surat berhasil diperbarui' : 'Surat berhasil ditambahkan',
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('surat_keluar')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-keluar'] });
      toast({
        title: 'Berhasil',
        description: 'Surat berhasil dihapus',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate nomor surat otomatis
  const generateNomorSurat = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_nomor_surat', { p_jenis: 'keluar' });
      if (error) throw error;
      setFormData({ ...formData, nomor_surat: data });
      toast({
        title: 'Berhasil',
        description: 'Nomor surat berhasil di-generate',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleEdit = (surat: SuratKeluar) => {
    setEditingId(surat.id);
    setFormData({
      nomor_surat: surat.nomor_surat,
      tanggal_surat: surat.tanggal_surat,
      tujuan: surat.tujuan,
      perihal: surat.perihal,
      klasifikasi: surat.klasifikasi || 'biasa',
      keterangan: surat.keterangan || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const filteredSurat = suratList?.filter(surat =>
    surat.nomor_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surat.tujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surat.perihal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getKlasifikasiBadge = (klasifikasi: string) => {
    switch (klasifikasi) {
      case 'rahasia':
        return <Badge variant="destructive">Rahasia</Badge>;
      case 'penting':
        return <Badge variant="default">Penting</Badge>;
      default:
        return <Badge variant="secondary">Biasa</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Keluar"
        description="Kelola data surat keluar"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            Daftar Surat Keluar
          </CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Surat
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor surat, tujuan, atau perihal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Surat</TableHead>
                    <TableHead>Tgl Surat</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Perihal</TableHead>
                    <TableHead>Klasifikasi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurat?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Belum ada data surat keluar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSurat?.map((surat) => (
                      <TableRow key={surat.id}>
                        <TableCell className="font-medium">{surat.nomor_surat}</TableCell>
                        <TableCell>
                          {format(new Date(surat.tanggal_surat), 'dd MMM yyyy', { locale: localeId })}
                        </TableCell>
                        <TableCell>{surat.tujuan}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{surat.perihal}</TableCell>
                        <TableCell>{getKlasifikasiBadge(surat.klasifikasi)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(surat)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMutation.mutate(surat.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Surat Keluar' : 'Tambah Surat Keluar'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomor_surat">Nomor Surat</Label>
              <div className="flex gap-2">
                <Input
                  id="nomor_surat"
                  value={formData.nomor_surat}
                  onChange={(e) => setFormData({ ...formData, nomor_surat: e.target.value })}
                  required
                  className="flex-1"
                />
                {!editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateNomorSurat}
                    disabled={isGenerating}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Auto'}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_surat">Tanggal Surat</Label>
                <Input
                  id="tanggal_surat"
                  type="date"
                  value={formData.tanggal_surat}
                  onChange={(e) => setFormData({ ...formData, tanggal_surat: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="klasifikasi">Klasifikasi</Label>
                <Select
                  value={formData.klasifikasi}
                  onValueChange={(value) => setFormData({ ...formData, klasifikasi: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biasa">Biasa</SelectItem>
                    <SelectItem value="penting">Penting</SelectItem>
                    <SelectItem value="rahasia">Rahasia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tujuan">Tujuan</Label>
              <Input
                id="tujuan"
                value={formData.tujuan}
                onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perihal">Perihal</Label>
              <Textarea
                id="perihal"
                value={formData.perihal}
                onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
