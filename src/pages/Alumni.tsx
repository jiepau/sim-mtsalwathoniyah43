import { useState, useEffect } from 'react';
import { GraduationCap, Search, Phone, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Alumni {
  id: string;
  nis: string;
  nama: string;
  alamat: string | null;
  wa_ortu: string | null;
  kelas_terakhir: string | null;
  tahun_lulus: string | null;
  created_at: string;
}

export default function AlumniPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .order('tahun_lulus', { ascending: false })
        .order('nama');

      if (error) throw error;
      setAlumni(data || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      toast({ title: 'Error', description: 'Gagal memuat data alumni', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

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

  const filteredAlumni = alumni.filter(a => 
    a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.tahun_lulus && a.tahun_lulus.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    { header: 'NIS', accessorKey: 'nis' as const },
    { header: 'Nama', accessorKey: 'nama' as const },
    { header: 'Kelas Terakhir', accessorKey: 'kelas_terakhir' as const },
    { header: 'Tahun Lulus', accessorKey: 'tahun_lulus' as const },
    { 
      header: 'WA Ortu', 
      cell: (item: Alumni) => {
        if (!item.wa_ortu) return '-';
        const phone = formatPhoneNumber(item.wa_ortu);
        return (
          <a 
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
          >
            <Phone className="h-3 w-3" />
            {item.wa_ortu}
          </a>
        );
      }
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <PageHeader 
        title="Data Alumni" 
        description="Daftar siswa yang telah lulus"
        icon={<GraduationCap className="h-6 w-6" />}
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIS, atau tahun lulus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filteredAlumni}
            columns={columns}
            emptyMessage="Belum ada data alumni"
          />
        </CardContent>
      </Card>
    </div>
  );
}
