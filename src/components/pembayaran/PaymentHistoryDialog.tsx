import { useState, useEffect } from 'react';
import { History, Calendar, CreditCard, Check, Clock, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/supabase-helpers';

interface PaymentRecord {
  id: string;
  nominal: number;
  nominal_bayar: number;
  status: string;
  tanggal_bayar: string | null;
  bulan: number | null;
  tahun: number | null;
  keterangan: string | null;
  created_at: string;
  jenis_tagihan?: { nama_tagihan: string };
}

interface SiswaInfo {
  id: string;
  nama: string;
  nis: string;
}

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siswaId: string | null;
  siswaInfo?: SiswaInfo;
}

const bulanOptions = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

export function PaymentHistoryDialog({ 
  open, 
  onOpenChange, 
  siswaId,
  siswaInfo 
}: PaymentHistoryDialogProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && siswaId) {
      fetchPaymentHistory();
    }
  }, [open, siswaId]);

  const fetchPaymentHistory = async () => {
    if (!siswaId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pembayaran')
        .select(`*, jenis_tagihan(nama_tagihan)`)
        .eq('siswa_id', siswaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'lunas':
        return <Badge className="bg-success/15 text-success border-success/30"><Check className="h-3 w-3 mr-1" />Lunas</Badge>;
      case 'cicil':
        return <Badge className="bg-warning/15 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Cicil</Badge>;
      default:
        return <Badge className="bg-destructive/15 text-destructive border-destructive/30"><X className="h-3 w-3 mr-1" />Belum Bayar</Badge>;
    }
  };

  const getPeriode = (bulan: number | null, tahun: number | null) => {
    if (!bulan || !tahun) return '-';
    const bulanLabel = bulanOptions.find(b => b.value === bulan)?.label || '';
    return `${bulanLabel} ${tahun}`;
  };

  // Calculate summary
  const totalTagihan = payments.reduce((acc, p) => acc + Number(p.nominal), 0);
  const totalDibayar = payments.reduce((acc, p) => acc + Number(p.nominal_bayar), 0);
  const totalSisa = totalTagihan - totalDibayar;
  const lunasCount = payments.filter(p => p.status === 'lunas').length;
  const cicilCount = payments.filter(p => p.status === 'cicil').length;
  const belumBayarCount = payments.filter(p => p.status === 'belum_lunas').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Pembayaran
          </DialogTitle>
        </DialogHeader>

        {siswaInfo && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="font-semibold text-lg">{siswaInfo.nama}</p>
            <p className="text-sm text-muted-foreground">NIS: {siswaInfo.nis}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Tagihan</p>
            <p className="font-bold text-primary">{formatCurrency(totalTagihan)}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
            <p className="font-bold text-success">{formatCurrency(totalDibayar)}</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Sisa Tunggakan</p>
            <p className="font-bold text-destructive">{formatCurrency(totalSisa)}</p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex gap-2 mb-4 text-sm">
          <Badge variant="outline" className="bg-success/10">
            {lunasCount} Lunas
          </Badge>
          <Badge variant="outline" className="bg-warning/10">
            {cicilCount} Cicil
          </Badge>
          <Badge variant="outline" className="bg-destructive/10">
            {belumBayarCount} Belum Bayar
          </Badge>
        </div>

        <Separator />

        {/* Payment List */}
        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data pembayaran
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const sisa = Number(payment.nominal) - Number(payment.nominal_bayar);
                return (
                  <div 
                    key={payment.id} 
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{payment.jenis_tagihan?.nama_tagihan}</p>
                        <p className="text-sm text-muted-foreground">
                          Periode: {getPeriode(payment.bulan, payment.tahun)}
                        </p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                      <div>
                        <p className="text-muted-foreground">Tagihan</p>
                        <p className="font-medium">{formatCurrency(payment.nominal)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dibayar</p>
                        <p className="font-medium text-success">{formatCurrency(payment.nominal_bayar)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sisa</p>
                        <p className={`font-medium ${sisa > 0 ? 'text-destructive' : 'text-success'}`}>
                          {formatCurrency(sisa)}
                        </p>
                      </div>
                    </div>

                    {payment.tanggal_bayar && (
                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Terakhir bayar: {formatDate(payment.tanggal_bayar)}
                      </div>
                    )}

                    {payment.keterangan && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Catatan: {payment.keterangan}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
