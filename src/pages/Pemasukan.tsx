import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/supabase-helpers';

interface Pembayaran {
  id: string;
  nominal_bayar: number;
  tanggal_bayar: string | null;
  siswa?: { nama: string; nis: string };
  jenis_tagihan?: { nama_tagihan: string };
}

export default function PemasukanPage() {
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPemasukan, setTotalPemasukan] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pembayaran')
        .select(`*, siswa(nama, nis), jenis_tagihan(nama_tagihan)`)
        .gt('nominal_bayar', 0)
        .order('tanggal_bayar', { ascending: false });

      if (error) throw error;
      
      const total = data?.reduce((acc, p) => acc + Number(p.nominal_bayar), 0) || 0;
      setPembayaran(data || []);
      setTotalPemasukan(total);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      header: 'Tanggal', 
      cell: (item: Pembayaran) => item.tanggal_bayar ? formatDate(item.tanggal_bayar) : '-'
    },
    { 
      header: 'Siswa', 
      cell: (item: Pembayaran) => (
        <div>
          <p className="font-medium">{item.siswa?.nama || '-'}</p>
          <p className="text-xs text-muted-foreground">{item.siswa?.nis}</p>
        </div>
      )
    },
    { 
      header: 'Tagihan', 
      cell: (item: Pembayaran) => (
        <Badge variant="secondary">{item.jenis_tagihan?.nama_tagihan || '-'}</Badge>
      )
    },
    { 
      header: 'Jumlah', 
      cell: (item: Pembayaran) => (
        <span className="font-semibold text-success">{formatCurrency(item.nominal_bayar)}</span>
      )
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Pemasukan" 
        description="Rekap pemasukan dari pembayaran siswa"
        icon={<TrendingUp className="h-6 w-6" />}
      />

      <Card className="mb-6 shadow-card border-success/20 bg-success/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-success">Total Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-success">{formatCurrency(totalPemasukan)}</p>
        </CardContent>
      </Card>

      <DataTable 
        data={pembayaran} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada pemasukan"
      />
    </div>
  );
}
