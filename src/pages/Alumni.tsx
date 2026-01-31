import { useState, useEffect } from 'react';
import { GraduationCap, Search, Phone, Loader2, AlertCircle, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/supabase-helpers';
import { mapDatabaseError } from '@/lib/error-mapper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Alumni {
  id: string;
  nis: string;
  nama: string;
  alamat: string | null;
  wa_ortu: string | null;
  kelas_terakhir: string | null;
  tahun_lulus: string | null;
  created_at: string;
  original_siswa_id: string | null;
}

interface Tunggakan {
  id: string;
  jenis_tagihan: string;
  nominal: number;
  nominal_bayar: number;
  sisa: number;
  bulan: number | null;
  tahun: number | null;
}

export default function AlumniPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tunggakanMap, setTunggakanMap] = useState<Record<string, number>>({});
  
  // Dialog state
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [tunggakanList, setTunggakanList] = useState<Tunggakan[]>([]);
  const [loadingTunggakan, setLoadingTunggakan] = useState(false);

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

      // Fetch tunggakan for each alumni
      if (data && data.length > 0) {
        const siswaIds = data
          .filter(a => a.original_siswa_id)
          .map(a => a.original_siswa_id);
        
        if (siswaIds.length > 0) {
          const { data: pembayaranData } = await supabase
            .from('pembayaran')
            .select('siswa_id, nominal, nominal_bayar')
            .in('siswa_id', siswaIds)
            .eq('status', 'belum_lunas');

          if (pembayaranData) {
            const map: Record<string, number> = {};
            pembayaranData.forEach(p => {
              const sisa = p.nominal - p.nominal_bayar;
              map[p.siswa_id] = (map[p.siswa_id] || 0) + sisa;
            });
            setTunggakanMap(map);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
      toast({ title: 'Error', description: mapDatabaseError(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTunggakanDetail = async (alumni: Alumni) => {
    if (!alumni.original_siswa_id) return;
    
    setLoadingTunggakan(true);
    setSelectedAlumni(alumni);
    
    try {
      const { data, error } = await supabase
        .from('pembayaran')
        .select('id, nominal, nominal_bayar, bulan, tahun, jenis_tagihan:jenis_tagihan_id(nama_tagihan)')
        .eq('siswa_id', alumni.original_siswa_id)
        .eq('status', 'belum_lunas');

      if (error) throw error;

      const list: Tunggakan[] = (data || []).map((p: any) => ({
        id: p.id,
        jenis_tagihan: p.jenis_tagihan?.nama_tagihan || 'Unknown',
        nominal: p.nominal,
        nominal_bayar: p.nominal_bayar,
        sisa: p.nominal - p.nominal_bayar,
        bulan: p.bulan,
        tahun: p.tahun,
      }));

      setTunggakanList(list);
    } catch (error) {
      console.error('Error fetching tunggakan:', error);
      toast({ title: 'Error', description: mapDatabaseError(error), variant: 'destructive' });
    } finally {
      setLoadingTunggakan(false);
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
      header: 'Tunggakan', 
      cell: (item: Alumni) => {
        const total = item.original_siswa_id ? tunggakanMap[item.original_siswa_id] || 0 : 0;
        if (total > 0) {
          return (
            <Badge variant="destructive" className="cursor-pointer" onClick={() => fetchTunggakanDetail(item)}>
              <AlertCircle className="h-3 w-3 mr-1" />
              {formatCurrency(total)}
            </Badge>
          );
        }
        return <Badge variant="outline" className="text-muted-foreground">Lunas</Badge>;
      }
    },
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

  const totalTunggakan = Object.values(tunggakanMap).reduce((sum, val) => sum + val, 0);
  const alumniWithTunggakan = alumni.filter(a => a.original_siswa_id && tunggakanMap[a.original_siswa_id] > 0).length;

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

      {/* Summary Cards */}
      {totalTunggakan > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalTunggakan)}</p>
                  <p className="text-sm text-muted-foreground">Total Tunggakan Alumni</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{alumniWithTunggakan}</p>
                  <p className="text-sm text-muted-foreground">Alumni dengan Tunggakan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Tunggakan Detail Dialog */}
      <Dialog open={!!selectedAlumni} onOpenChange={() => setSelectedAlumni(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Tunggakan Alumni</DialogTitle>
            <DialogDescription>
              {selectedAlumni?.nama} ({selectedAlumni?.nis}) - {selectedAlumni?.kelas_terakhir}
            </DialogDescription>
          </DialogHeader>

          {loadingTunggakan ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tunggakanList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada tunggakan
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tunggakanList.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{t.jenis_tagihan}</p>
                    {t.bulan && t.tahun && (
                      <p className="text-sm text-muted-foreground">
                        {t.bulan}/{t.tahun}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">{formatCurrency(t.sisa)}</p>
                    <p className="text-xs text-muted-foreground">
                      dari {formatCurrency(t.nominal)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-destructive">
                  {formatCurrency(tunggakanList.reduce((sum, t) => sum + t.sisa, 0))}
                </span>
              </div>
            </div>
          )}

          {selectedAlumni?.wa_ortu && (
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => {
                const phone = formatPhoneNumber(selectedAlumni.wa_ortu!);
                const total = tunggakanList.reduce((sum, t) => sum + t.sisa, 0);
                const message = encodeURIComponent(
                  `Assalamualaikum, ini dari MTs AL WATHONIYAH.\n\nKami ingin mengingatkan bahwa ${selectedAlumni.nama} masih memiliki tunggakan sebesar ${formatCurrency(total)}.\n\nMohon untuk segera melunasi. Terima kasih.`
                );
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
              }}
            >
              <Phone className="h-4 w-4 mr-2" />
              Kirim Pengingat via WhatsApp
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
