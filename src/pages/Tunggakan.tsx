import { useEffect, useState } from 'react';
import { AlertTriangle, Search, Phone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';

interface Tunggakan {
  id: string;
  siswa_id: string;
  nominal: number;
  nominal_bayar: number;
  bulan: number | null;
  tahun: number | null;
  siswa?: { 
    nama: string; 
    nis: string; 
    wa_ortu: string | null;
    kelas?: { nama_kelas: string };
  };
  jenis_tagihan?: { nama_tagihan: string };
}

export default function TunggakanPage() {
  const [tunggakan, setTunggakan] = useState<Tunggakan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalTunggakan, setTotalTunggakan] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pembayaran')
        .select(`*, siswa(nama, nis, wa_ortu, kelas(nama_kelas)), jenis_tagihan(nama_tagihan)`)
        .or('status.eq.belum_lunas,status.eq.cicil')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const total = data?.reduce((acc, p) => acc + (Number(p.nominal) - Number(p.nominal_bayar)), 0) || 0;
      setTunggakan(data || []);
      setTotalTunggakan(total);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = tunggakan.filter(t => 
    t.siswa?.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.siswa?.nis.toLowerCase().includes(search.toLowerCase())
  );

  const bulanOptions = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const sendWhatsApp = (wa: string, nama: string, sisa: number) => {
    const message = encodeURIComponent(
      `Assalamu'alaikum Bapak/Ibu Wali dari ${nama},\n\nKami ingin menginformasikan bahwa terdapat tunggakan pembayaran sebesar ${formatCurrency(sisa)}.\n\nMohon segera melakukan pembayaran. Terima kasih.\n\nWassalamu'alaikum`
    );
    window.open(`https://wa.me/${wa.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const columns = [
    { 
      header: 'Siswa', 
      cell: (item: Tunggakan) => (
        <div>
          <p className="font-medium">{item.siswa?.nama || '-'}</p>
          <p className="text-xs text-muted-foreground">{item.siswa?.nis}</p>
        </div>
      )
    },
    { 
      header: 'Kelas', 
      cell: (item: Tunggakan) => (
        <Badge variant="outline">{item.siswa?.kelas?.nama_kelas || '-'}</Badge>
      )
    },
    { 
      header: 'Tagihan', 
      cell: (item: Tunggakan) => item.jenis_tagihan?.nama_tagihan || '-'
    },
    { 
      header: 'Periode', 
      cell: (item: Tunggakan) => item.bulan && item.tahun ? (
        <span>{bulanOptions[item.bulan - 1]} {item.tahun}</span>
      ) : '-'
    },
    { 
      header: 'Sisa Tunggakan', 
      cell: (item: Tunggakan) => (
        <span className="font-semibold text-destructive">
          {formatCurrency(item.nominal - item.nominal_bayar)}
        </span>
      )
    },
    { 
      header: 'Hubungi Ortu', 
      cell: (item: Tunggakan) => item.siswa?.wa_ortu && (
        <Button 
          size="sm" 
          variant="outline" 
          className="text-success"
          onClick={() => sendWhatsApp(
            item.siswa!.wa_ortu!, 
            item.siswa!.nama, 
            item.nominal - item.nominal_bayar
          )}
        >
          <Phone className="h-3 w-3 mr-1" />
          WA
        </Button>
      ),
      className: 'w-24'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Tunggakan" 
        description="Daftar siswa dengan tunggakan pembayaran"
        icon={<AlertTriangle className="h-6 w-6" />}
      />

      <Card className="mb-6 shadow-card border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Total Tunggakan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">{formatCurrency(totalTunggakan)}</p>
          <p className="text-sm text-muted-foreground mt-1">{tunggakan.length} tagihan belum lunas</p>
        </CardContent>
      </Card>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable 
        data={filteredData} 
        columns={columns} 
        loading={loading}
        emptyMessage="Tidak ada tunggakan"
      />
    </div>
  );
}
