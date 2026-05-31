import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/supabase-helpers';

interface DetailRow {
  id?: string;
  nama_komponen: string;
  kategori: 'pendapatan' | 'potongan';
  nominal: number;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  periodeId: string | null;
  onSaved: () => void;
}

export function EditGajiDialog({ open, onOpenChange, periodeId, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [namaGuru, setNamaGuru] = useState('');
  const [header, setHeader] = useState({
    jumlah_hadir: 0, jumlah_izin: 0, jumlah_sakit: 0, jumlah_alpa: 0, hari_kerja: 0,
    catatan: '', tanggal_bayar: '',
  });
  const [details, setDetails] = useState<DetailRow[]>([]);

  useEffect(() => {
    if (!open || !periodeId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: periode } = await supabase.from('gaji_periode').select('*').eq('id', periodeId).maybeSingle();
        if (cancelled || !periode) return;
        const { data: guru } = await supabase.from('gtk_ptk').select('nama').eq('id', periode.gtk_id).maybeSingle();
        const { data: dets } = await supabase.from('gaji_detail').select('*').eq('gaji_periode_id', periodeId).order('urutan');
        if (cancelled) return;
        setNamaGuru(guru?.nama || '');
        setHeader({
          jumlah_hadir: periode.jumlah_hadir,
          jumlah_izin: periode.jumlah_izin,
          jumlah_sakit: periode.jumlah_sakit,
          jumlah_alpa: periode.jumlah_alpa,
          hari_kerja: periode.hari_kerja,
          catatan: periode.catatan || '',
          tanggal_bayar: periode.tanggal_bayar || '',
        });
        setDetails((dets || []).map((d) => ({
          id: d.id, nama_komponen: d.nama_komponen,
          kategori: d.kategori as 'pendapatan' | 'potongan', nominal: Number(d.nominal),
        })));
      } catch (err) {
        toast.error('Gagal memuat: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, periodeId]);

  const addRow = (kategori: 'pendapatan' | 'potongan') => {
    setDetails([...details, { nama_komponen: '', kategori, nominal: 0 }]);
  };
  const removeRow = (i: number) => setDetails(details.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<DetailRow>) => {
    setDetails(details.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  };

  const totalPendapatan = details.filter((d) => d.kategori === 'pendapatan').reduce((a, b) => a + Number(b.nominal || 0), 0);
  const totalPotongan = details.filter((d) => d.kategori === 'potongan').reduce((a, b) => a + Number(b.nominal || 0), 0);
  const totalBersih = totalPendapatan - totalPotongan;

  const handleSave = async () => {
    if (!periodeId) return;
    setSaving(true);
    try {
      const { error: e1 } = await supabase.from('gaji_periode').update({
        jumlah_hadir: Number(header.jumlah_hadir) || 0,
        jumlah_izin: Number(header.jumlah_izin) || 0,
        jumlah_sakit: Number(header.jumlah_sakit) || 0,
        jumlah_alpa: Number(header.jumlah_alpa) || 0,
        hari_kerja: Number(header.hari_kerja) || 0,
        catatan: header.catatan || null,
        tanggal_bayar: header.tanggal_bayar || null,
        total_pendapatan: totalPendapatan,
        total_potongan: totalPotongan,
        total_bersih: totalBersih,
      }).eq('id', periodeId);
      if (e1) throw e1;

      // Replace detail rows
      const { error: e2 } = await supabase.from('gaji_detail').delete().eq('gaji_periode_id', periodeId);
      if (e2) throw e2;
      const validDetails = details.filter((d) => d.nama_komponen.trim());
      if (validDetails.length > 0) {
        const { error: e3 } = await supabase.from('gaji_detail').insert(validDetails.map((d, i) => ({
          gaji_periode_id: periodeId,
          nama_komponen: d.nama_komponen.trim(),
          kategori: d.kategori,
          nominal: Number(d.nominal) || 0,
          urutan: i,
        })));
        if (e3) throw e3;
      }
      toast.success('Slip diperbarui');
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error('Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Gaji — {namaGuru}</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Kehadiran</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { k: 'hari_kerja', l: 'Hari Kerja' },
                  { k: 'jumlah_hadir', l: 'Hadir' },
                  { k: 'jumlah_izin', l: 'Izin' },
                  { k: 'jumlah_sakit', l: 'Sakit' },
                  { k: 'jumlah_alpa', l: 'Alpa' },
                ].map(({ k, l }) => (
                  <div key={k} className="space-y-1">
                    <Label className="text-xs">{l}</Label>
                    <Input type="number" value={(header as never)[k]} onChange={(e) => setHeader({ ...header, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Rincian Komponen</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => addRow('pendapatan')}><Plus className="h-3.5 w-3.5 mr-1" /> Pendapatan</Button>
                  <Button size="sm" variant="outline" onClick={() => addRow('potongan')}><Plus className="h-3.5 w-3.5 mr-1" /> Potongan</Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead className="w-32">Kategori</TableHead><TableHead>Komponen</TableHead><TableHead className="w-40 text-right">Nominal</TableHead><TableHead className="w-12"></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground italic">Belum ada komponen</TableCell></TableRow>
                  ) : details.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={d.kategori} onValueChange={(v: 'pendapatan' | 'potongan') => updateRow(i, { kategori: v })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendapatan">Pendapatan</SelectItem>
                            <SelectItem value="potongan">Potongan</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input value={d.nama_komponen} onChange={(e) => updateRow(i, { nama_komponen: e.target.value })} className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={d.nominal} onChange={(e) => updateRow(i, { nominal: Number(e.target.value) || 0 })} className="h-8 text-right" /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => removeRow(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-md border bg-muted/30 text-sm">
              <div><div className="text-xs text-muted-foreground">Total Pendapatan</div><div className="font-bold text-success">{formatCurrency(totalPendapatan)}</div></div>
              <div><div className="text-xs text-muted-foreground">Total Potongan</div><div className="font-bold text-destructive">{formatCurrency(totalPotongan)}</div></div>
              <div><div className="text-xs text-muted-foreground">Gaji Bersih</div><div className="font-bold text-primary">{formatCurrency(totalBersih)}</div></div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tanggal Bayar</Label>
                <Input type="date" value={header.tanggal_bayar} onChange={(e) => setHeader({ ...header, tanggal_bayar: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Textarea rows={2} value={header.catatan} onChange={(e) => setHeader({ ...header, catatan: e.target.value })} />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
