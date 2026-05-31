import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Wallet, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/supabase-helpers';
import { NAMA_BULAN } from '@/lib/terbilang';
import { SlipGajiDialog } from '@/components/gaji/SlipGajiDialog';

export function SlipGajiSayaTab() {
  const { user } = useAuth();
  const [slipId, setSlipId] = useState<string | null>(null);

  const { data: gtk } = useQuery({
    queryKey: ['gtk-self', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('gtk_ptk').select('id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['gaji-saya', gtk?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gaji_periode').select('*').eq('gtk_id', gtk!.id)
        .in('status', ['final', 'dibayar']).order('tahun', { ascending: false }).order('bulan', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!gtk?.id,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Slip Gaji Saya</CardTitle>
        <CardDescription>Slip gaji yang sudah difinalisasi oleh Bendahara.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Belum ada slip gaji.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead><TableHead>No. Slip</TableHead>
                <TableHead className="text-right">Bersih</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{NAMA_BULAN[r.bulan - 1]} {r.tahun}</TableCell>
                  <TableCell className="text-xs">{r.nomor_slip}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(r.total_bersih))}</TableCell>
                  <TableCell className="text-center">
                    {r.status === 'dibayar'
                      ? <Badge className="bg-success text-success-foreground">Dibayar</Badge>
                      : <Badge className="bg-blue-600 text-white">Final</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSlipId(r.id)}>
                      <Printer className="h-3.5 w-3.5 mr-1" /> Slip
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <SlipGajiDialog open={!!slipId} onOpenChange={(o) => !o && setSlipId(null)} periodeId={slipId} />
      </CardContent>
    </Card>
  );
}
