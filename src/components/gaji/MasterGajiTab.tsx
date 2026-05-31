import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/supabase-helpers';

interface Komponen {
  id: string;
  gtk_id: string;
  nama_komponen: string;
  kategori: 'pendapatan' | 'potongan';
  nominal: number;
  urutan: number;
  is_active: boolean;
}

export function MasterGajiTab() {
  const qc = useQueryClient();
  const [selectedGtk, setSelectedGtk] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Komponen | null>(null);
  const [form, setForm] = useState({ nama_komponen: '', kategori: 'pendapatan' as 'pendapatan' | 'potongan', nominal: '' });

  const { data: gtkList = [] } = useQuery({
    queryKey: ['gtk-list-aktif'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gtk_ptk').select('id,nama,jabatan').eq('status_aktif', 'aktif').order('nama');
      if (error) throw error;
      return data as { id: string; nama: string; jabatan: string | null }[];
    },
  });

  const { data: komponen = [], isLoading } = useQuery({
    queryKey: ['gaji-komponen', selectedGtk],
    queryFn: async () => {
      if (!selectedGtk) return [];
      const { data, error } = await supabase
        .from('gaji_komponen_master').select('*').eq('gtk_id', selectedGtk).order('kategori').order('urutan');
      if (error) throw error;
      return data as Komponen[];
    },
    enabled: !!selectedGtk,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ nama_komponen: '', kategori: 'pendapatan', nominal: '' });
    setDialogOpen(true);
  };
  const openEdit = (k: Komponen) => {
    setEditing(k);
    setForm({ nama_komponen: k.nama_komponen, kategori: k.kategori, nominal: String(k.nominal) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedGtk) return;
    if (!form.nama_komponen.trim()) return toast.error('Nama komponen wajib diisi');
    const nominal = Number(form.nominal) || 0;
    try {
      if (editing) {
        const { error } = await supabase.from('gaji_komponen_master').update({
          nama_komponen: form.nama_komponen.trim(), kategori: form.kategori, nominal,
        }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Komponen diperbarui');
      } else {
        const { error } = await supabase.from('gaji_komponen_master').insert({
          gtk_id: selectedGtk, nama_komponen: form.nama_komponen.trim(), kategori: form.kategori, nominal,
        });
        if (error) throw error;
        toast.success('Komponen ditambahkan');
      }
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['gaji-komponen', selectedGtk] });
    } catch (err) {
      toast.error('Gagal: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus komponen ini?')) return;
    const { error } = await supabase.from('gaji_komponen_master').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Komponen dihapus');
    qc.invalidateQueries({ queryKey: ['gaji-komponen', selectedGtk] });
  };

  const pendapatan = komponen.filter((k) => k.kategori === 'pendapatan');
  const potongan = komponen.filter((k) => k.kategori === 'potongan');
  const totalP = pendapatan.reduce((a, b) => a + Number(b.nominal), 0);
  const totalPot = potongan.reduce((a, b) => a + Number(b.nominal), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Komponen Gaji per Guru</CardTitle>
        <p className="text-sm text-muted-foreground">
          Isi gaji pokok + tunjangan tetap & potongan rutin per guru. Komponen ini akan otomatis dipakai saat generate gaji bulanan.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Pilih Guru / Tenaga Kependidikan</Label>
            <Select value={selectedGtk || 'none'} onValueChange={(v) => setSelectedGtk(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="-- Pilih guru --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Pilih guru --</SelectItem>
                {gtkList.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nama}{g.jabatan ? ` — ${g.jabatan}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate} disabled={!selectedGtk}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Komponen
          </Button>
        </div>

        {!selectedGtk ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Pilih guru untuk menampilkan komponen gaji.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Pendapatan</span>
                  <Badge variant="secondary">{formatCurrency(totalP)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Komponen</TableHead><TableHead className="text-right">Nominal</TableHead><TableHead className="w-20"></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendapatan.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground italic">Belum ada</TableCell></TableRow>
                    ) : pendapatan.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell>{k.nama_komponen}</TableCell>
                        <TableCell className="text-right">{formatCurrency(k.nominal)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(k)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(k.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Potongan</span>
                  <Badge variant="secondary">{formatCurrency(totalPot)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Komponen</TableHead><TableHead className="text-right">Nominal</TableHead><TableHead className="w-20"></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {potongan.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground italic">Belum ada</TableCell></TableRow>
                    ) : potongan.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell>{k.nama_komponen}</TableCell>
                        <TableCell className="text-right">{formatCurrency(k.nominal)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(k)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(k.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Komponen Gaji</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={(v: 'pendapatan' | 'potongan') => setForm({ ...form, kategori: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendapatan">Pendapatan</SelectItem>
                    <SelectItem value="potongan">Potongan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nama Komponen *</Label>
                <Input value={form.nama_komponen} onChange={(e) => setForm({ ...form, nama_komponen: e.target.value })}
                  placeholder="Gaji Pokok / Tunjangan Wali Kelas / Ekskul / Dansos / Piket" />
              </div>
              <div className="space-y-1.5">
                <Label>Nominal (Rp)</Label>
                <Input type="number" value={form.nominal} onChange={(e) => setForm({ ...form, nominal: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
