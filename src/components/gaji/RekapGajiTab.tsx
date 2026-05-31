import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/supabase-helpers';
import { NAMA_BULAN } from '@/lib/terbilang';
import { Loader2 } from 'lucide-react';

const tahunOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);

export function RekapGajiTab() {
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['gaji-rekap', tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gaji_periode')
        .select('bulan,status,total_pendapatan,total_potongan,total_bersih')
        .eq('tahun', tahun);
      if (error) throw error;
      return data || [];
    },
  });

  const perBulan = Array.from({ length: 12 }, (_, i) => {
    const b = i + 1;
    const items = rows.filter((r) => r.bulan === b);
    return {
      bulan: b,
      jumlah: items.length,
      pendapatan: items.reduce((a, b) => a + Number(b.total_pendapatan), 0),
      potongan: items.reduce((a, b) => a + Number(b.total_potongan), 0),
      bersih: items.reduce((a, b) => a + Number(b.total_bersih), 0),
      dibayar: items.filter((r) => r.status === 'dibayar').length,
    };
  });

  const total = perBulan.reduce(
    (a, b) => ({ pendapatan: a.pendapatan + b.pendapatan, potongan: a.potongan + b.potongan, bersih: a.bersih + b.bersih }),
    { pendapatan: 0, potongan: 0, bersih: 0 },
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-end gap-3">
          <CardTitle>Rekap Tahunan</CardTitle>
          <div className="space-y-1.5">
            <Label className="text-xs">Tahun</Label>
            <Select value={String(tahun)} onValueChange={(v) => setTahun(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tahunOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bulan</TableHead>
                <TableHead className="text-center">Slip</TableHead>
                <TableHead className="text-center">Dibayar</TableHead>
                <TableHead className="text-right">Pendapatan</TableHead>
                <TableHead className="text-right">Potongan</TableHead>
                <TableHead className="text-right">Bersih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perBulan.map((r) => (
                <TableRow key={r.bulan} className={r.jumlah === 0 ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{NAMA_BULAN[r.bulan - 1]}</TableCell>
                  <TableCell className="text-center">{r.jumlah}</TableCell>
                  <TableCell className="text-center">{r.dibayar}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(r.pendapatan)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(r.potongan)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(r.bersih)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-primary/10 font-bold">
                <TableCell>Total Tahun {tahun}</TableCell>
                <TableCell></TableCell><TableCell></TableCell>
                <TableCell className="text-right text-success">{formatCurrency(total.pendapatan)}</TableCell>
                <TableCell className="text-right text-destructive">{formatCurrency(total.potongan)}</TableCell>
                <TableCell className="text-right text-primary">{formatCurrency(total.bersih)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
