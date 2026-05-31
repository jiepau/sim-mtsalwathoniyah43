import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Printer, RefreshCw, CheckCircle2, Wallet, Loader2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/supabase-helpers';
import { NAMA_BULAN } from '@/lib/terbilang';
import { generateGajiBulanan } from '@/lib/gaji-generator';
import { toast } from 'sonner';
import { EditGajiDialog } from './EditGajiDialog';
import { SlipGajiDialog } from './SlipGajiDialog';

interface Row {
  id: string; gtk_id: string; bulan: number; tahun: number;
  jumlah_hadir: number; jumlah_izin: number; jumlah_sakit: number; jumlah_alpa: number;
  total_pendapatan: number; total_potongan: number; total_bersih: number;
  status: 'draft' | 'final' | 'dibayar'; nomor_slip: string | null;
  gtk_ptk?: { nama: string; jabatan: string | null } | null;
}

const tahunOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);

export function DaftarGajiTab() {
  const qc = useQueryClient();
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);
  const [confirmGen, setConfirmGen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [slipId, setSlipId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['gaji-periode', bulan, tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gaji_periode').select('*')
        .eq('bulan', bulan).eq('tahun', tahun).order('nomor_slip');
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((r) => r.gtk_id)));
      if (ids.length === 0) return [] as Row[];
      const { data: gtk } = await supabase.from('gtk_ptk').select('id,nama,jabatan').in('id', ids);
      const m = new Map((gtk || []).map((g) => [g.id, g]));
      return (data || []).map((r) => ({ ...r, gtk_ptk: m.get(r.gtk_id) || null })) as Row[];
    },
  });

  const handleGenerate = async (overwrite: boolean) => {
    setGenerating(true);
    try {
      const res = await generateGajiBulanan({ bulan, tahun, overwrite });
      toast.success(`${res.label}: ${res.created} dibuat, ${res.updated} diperbarui, ${res.skipped} dilewati`);
      qc.invalidateQueries({ queryKey: ['gaji-periode', bulan, tahun] });
    } catch (err) {
      toast.error('Gagal generate: ' + (err as Error).message);
    } finally {
      setGenerating(false);
      setConfirmGen(false);
    }
  };

  const setStatus = async (id: string, status: 'draft' | 'final' | 'dibayar') => {
    const patch: { status: string; tanggal_bayar?: string } = { status };
    if (status === 'dibayar') patch.tanggal_bayar = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('gaji_periode').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(`Status diubah ke ${status}`);
    qc.invalidateQueries({ queryKey: ['gaji-periode', bulan, tahun] });
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Hapus slip gaji ini? Aksi ini tidak bisa dibatalkan.')) return;
    const { error } = await supabase.from('gaji_periode').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Slip dihapus');
    qc.invalidateQueries({ queryKey: ['gaji-periode', bulan, tahun] });
  };

  const totalBersih = rows.reduce((a, b) => a + Number(b.total_bersih), 0);

  const statusBadge = (s: Row['status']) => {
    if (s === 'draft') return <Badge variant="outline">Draft</Badge>;
    if (s === 'final') return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Final</Badge>;
    return <Badge className="bg-success text-success-foreground">Dibayar</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-3 md:items-end justify-between">
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-xs">Bulan</Label>
              <Select value={String(bulan)} onValueChange={(v) => setBulan(Number(v))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NAMA_BULAN.map((n, i) => <SelectItem key={i + 1} value={String(i + 1)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tahun</Label>
              <Select value={String(tahun)} onValueChange={(v) => setTahun(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tahunOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Bersih Bulan Ini</Label>
              <div className="h-10 flex items-center px-3 rounded-md border bg-primary/5 font-bold text-primary">{formatCurrency(totalBersih)}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setConfirmGen(true)} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Generate Gaji
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto opacity-30 mb-3" />
              <p>Belum ada slip gaji untuk {NAMA_BULAN[bulan - 1]} {tahun}.</p>
              <p className="text-xs mt-1">Klik <span className="font-semibold">Generate Gaji</span> untuk membuat otomatis.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Slip</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="text-center">H / I / S / A</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                  <TableHead className="text-right">Potongan</TableHead>
                  <TableHead className="text-right">Bersih</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-44">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.nomor_slip}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.gtk_ptk?.nama}</div>
                      {r.gtk_ptk?.jabatan && <div className="text-xs text-muted-foreground">{r.gtk_ptk.jabatan}</div>}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {r.jumlah_hadir}/{r.jumlah_izin}/{r.jumlah_sakit}/{r.jumlah_alpa}
                    </TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(r.total_pendapatan)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(r.total_potongan)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(r.total_bersih)}</TableCell>
                    <TableCell className="text-center">{statusBadge(r.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {r.status === 'draft' && (
                          <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditId(r.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                        )}
                        <Button size="icon" variant="ghost" title="Cetak Slip" onClick={() => setSlipId(r.id)}><Printer className="h-3.5 w-3.5" /></Button>
                        {r.status === 'draft' && (
                          <Button size="icon" variant="ghost" title="Finalkan" onClick={() => setStatus(r.id, 'final')}><CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /></Button>
                        )}
                        {r.status === 'final' && (
                          <>
                            <Button size="icon" variant="ghost" title="Tandai Dibayar" onClick={() => setStatus(r.id, 'dibayar')}><Wallet className="h-3.5 w-3.5 text-success" /></Button>
                            <Button size="icon" variant="ghost" title="Batal Final" onClick={() => setStatus(r.id, 'draft')}><RefreshCw className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                        {r.status === 'dibayar' && (
                          <Button size="icon" variant="ghost" title="Batal Dibayar" onClick={() => setStatus(r.id, 'final')}><RefreshCw className="h-3.5 w-3.5" /></Button>
                        )}
                        <Button size="icon" variant="ghost" title="Hapus" onClick={() => deleteRow(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmGen} onOpenChange={setConfirmGen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Gaji {NAMA_BULAN[bulan - 1]} {tahun}?</AlertDialogTitle>
            <AlertDialogDescription>
              Sistem akan membuat slip gaji draft untuk semua GTK aktif berdasarkan komponen master + data Absensi GTK bulan ini.
              Slip yang sudah berstatus <b>final</b> atau <b>dibayar</b> tidak akan diubah, kecuali Anda memilih "Timpa".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button variant="outline" onClick={() => handleGenerate(true)} disabled={generating}>Timpa Semua (termasuk final)</Button>
            <AlertDialogAction onClick={() => handleGenerate(false)} disabled={generating}>Generate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditGajiDialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)} periodeId={editId}
        onSaved={() => qc.invalidateQueries({ queryKey: ['gaji-periode', bulan, tahun] })} />
      <SlipGajiDialog open={!!slipId} onOpenChange={(o) => !o && setSlipId(null)} periodeId={slipId} />
    </div>
  );
}
