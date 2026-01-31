import { useEffect, useState } from 'react';
import { AlertTriangle, Search, Phone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';

interface TunggakanItem {
  jenis_tagihan: string;
  bulan: number | null;
  tahun: number | null;
  sisa: number;
}

interface SiswaTunggakan {
  id: string;
  siswa_id: string;
  nama: string;
  nis: string;
  kelas: string;
  wa_ortu: string | null;
  total_tunggakan: number;
  items: TunggakanItem[];
}

export default function TunggakanPage() {
  const [tunggakanData, setTunggakanData] = useState<SiswaTunggakan[]>([]);
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
        .select(`*, siswa(id, nama, nis, wa_ortu, kelas(nama_kelas)), jenis_tagihan(nama_tagihan)`)
        .or('status.eq.belum_lunas,status.eq.cicil')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Group by siswa
      const grouped: Record<string, SiswaTunggakan> = {};
      
      data?.forEach(p => {
        const siswaId = p.siswa?.id || p.siswa_id;
        const sisa = Number(p.nominal) - Number(p.nominal_bayar);
        
        if (!grouped[siswaId]) {
          grouped[siswaId] = {
            id: siswaId,
            siswa_id: siswaId,
            nama: p.siswa?.nama || '-',
            nis: p.siswa?.nis || '-',
            kelas: p.siswa?.kelas?.nama_kelas || '-',
            wa_ortu: p.siswa?.wa_ortu || null,
            total_tunggakan: 0,
            items: [],
          };
        }
        
        grouped[siswaId].total_tunggakan += sisa;
        grouped[siswaId].items.push({
          jenis_tagihan: p.jenis_tagihan?.nama_tagihan || '-',
          bulan: p.bulan,
          tahun: p.tahun,
          sisa: sisa,
        });
      });
      
      const groupedArray = Object.values(grouped).sort((a, b) => b.total_tunggakan - a.total_tunggakan);
      const total = groupedArray.reduce((acc, s) => acc + s.total_tunggakan, 0);
      
      setTunggakanData(groupedArray);
      setTotalTunggakan(total);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = tunggakanData.filter(t => 
    t.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.nis.toLowerCase().includes(search.toLowerCase())
  );

  const bulanOptions = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const getWhatsAppUrl = (siswa: SiswaTunggakan): string => {
    if (!siswa.wa_ortu) return '#';
    
    const phone = formatPhoneNumber(siswa.wa_ortu);
    
    // Build detailed message with all tunggakan
    let itemsText = siswa.items.map(item => {
      const periode = item.bulan && item.tahun 
        ? ` (${bulanOptions[item.bulan - 1]} ${item.tahun})`
        : '';
      return `• ${item.jenis_tagihan}${periode}: ${formatCurrency(item.sisa)}`;
    }).join('\n');
    
    const message = encodeURIComponent(
      `Assalamu'alaikum Bapak/Ibu Wali dari ${siswa.nama},\n\n` +
      `Kami ingin menginformasikan bahwa terdapat tunggakan pembayaran sebagai berikut:\n\n` +
      `${itemsText}\n\n` +
      `Total Tunggakan: ${formatCurrency(siswa.total_tunggakan)}\n\n` +
      `Mohon segera melakukan pembayaran. Terima kasih.\n\nWassalamu'alaikum`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const columns = [
    { 
      header: 'Siswa', 
      cell: (item: SiswaTunggakan) => (
        <div>
          <p className="font-medium">{item.nama}</p>
          <p className="text-xs text-muted-foreground">{item.nis}</p>
        </div>
      )
    },
    { 
      header: 'Kelas', 
      cell: (item: SiswaTunggakan) => (
        <Badge variant="outline">{item.kelas}</Badge>
      )
    },
    { 
      header: 'Rincian Tunggakan', 
      cell: (item: SiswaTunggakan) => (
        <div className="space-y-1">
          {item.items.slice(0, 3).map((t, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium">{t.jenis_tagihan}</span>
              {t.bulan && t.tahun && (
                <span className="text-muted-foreground"> ({bulanOptions[t.bulan - 1]} {t.tahun})</span>
              )}
              <span className="text-destructive ml-2">{formatCurrency(t.sisa)}</span>
            </div>
          ))}
          {item.items.length > 3 && (
            <p className="text-xs text-muted-foreground">+{item.items.length - 3} tagihan lainnya</p>
          )}
        </div>
      )
    },
    { 
      header: 'Total Tunggakan', 
      cell: (item: SiswaTunggakan) => (
        <div className="text-right">
          <span className="font-bold text-lg text-destructive">
            {formatCurrency(item.total_tunggakan)}
          </span>
          <p className="text-xs text-muted-foreground">{item.items.length} tagihan</p>
        </div>
      )
    },
    { 
      header: 'Hubungi Ortu', 
      cell: (item: SiswaTunggakan) => item.wa_ortu && (
        <a 
          href={getWhatsAppUrl(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
        >
          <Phone className="h-4 w-4" />
          Kirim WA
        </a>
      ),
      className: 'w-32'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Tunggakan" 
        description="Daftar siswa dengan tunggakan pembayaran (dikelompokkan per siswa)"
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
          <p className="text-sm text-muted-foreground mt-1">{tunggakanData.length} siswa memiliki tunggakan</p>
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
