import { useEffect, useState } from 'react';
import { CreditCard, Search, Check, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/supabase-helpers';

interface Pembayaran {
  id: string;
  siswa_id: string;
  jenis_tagihan_id: string;
  ta_id: string | null;
  bulan: number | null;
  tahun: number | null;
  nominal: number;
  nominal_bayar: number;
  tanggal_bayar: string | null;
  status: string;
  keterangan: string | null;
  siswa?: { nama: string; nis: string };
  jenis_tagihan?: { nama_tagihan: string };
}

interface Siswa {
  id: string;
  nama: string;
  nis: string;
}

interface JenisTagihan {
  id: string;
  nama_tagihan: string;
  nominal: number;
}

export default function PembayaranPage() {
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [jenisTagihan, setJenisTagihan] = useState<JenisTagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    siswa_id: '',
    jenis_tagihan_id: '',
    bulan: '',
    tahun: new Date().getFullYear().toString(),
    nominal_bayar: '',
    keterangan: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pembayaranRes, siswaRes, tagihanRes] = await Promise.all([
        supabase
          .from('pembayaran')
          .select(`*, siswa(nama, nis), jenis_tagihan(nama_tagihan)`)
          .order('created_at', { ascending: false }),
        supabase.from('siswa').select('id, nama, nis').order('nama'),
        supabase.from('jenis_tagihan').select('*').eq('is_active', true),
      ]);

      if (pembayaranRes.data) setPembayaran(pembayaranRes.data);
      if (siswaRes.data) setSiswa(siswaRes.data);
      if (tagihanRes.data) setJenisTagihan(tagihanRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      siswa_id: '',
      jenis_tagihan_id: '',
      bulan: (new Date().getMonth() + 1).toString(),
      tahun: new Date().getFullYear().toString(),
      nominal_bayar: '',
      keterangan: '',
    });
    setDialogOpen(true);
  };

  const handleTagihanChange = (tagihanId: string) => {
    const tagihan = jenisTagihan.find(t => t.id === tagihanId);
    setFormData({ 
      ...formData, 
      jenis_tagihan_id: tagihanId,
      nominal_bayar: tagihan ? String(tagihan.nominal) : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tagihan = jenisTagihan.find(t => t.id === formData.jenis_tagihan_id);
    if (!tagihan) {
      toast.error('Pilih jenis tagihan');
      return;
    }

    const nominalBayar = parseFloat(formData.nominal_bayar) || 0;
    const status = nominalBayar >= tagihan.nominal ? 'lunas' : nominalBayar > 0 ? 'cicil' : 'belum_lunas';

    try {
      const payload = {
        siswa_id: formData.siswa_id,
        jenis_tagihan_id: formData.jenis_tagihan_id,
        bulan: parseInt(formData.bulan) || null,
        tahun: parseInt(formData.tahun) || null,
        nominal: tagihan.nominal,
        nominal_bayar: nominalBayar,
        tanggal_bayar: nominalBayar > 0 ? new Date().toISOString() : null,
        status,
        keterangan: formData.keterangan || null,
      };

      const { error } = await supabase.from('pembayaran').insert(payload);
      if (error) throw error;
      toast.success('Pembayaran berhasil diproses');

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleBayar = async (item: Pembayaran) => {
    const sisa = item.nominal - item.nominal_bayar;
    const bayar = prompt(`Sisa tagihan: ${formatCurrency(sisa)}\nMasukkan jumlah bayar:`);
    
    if (!bayar) return;
    const nominalBayar = parseFloat(bayar);
    if (isNaN(nominalBayar) || nominalBayar <= 0) {
      toast.error('Nominal tidak valid');
      return;
    }

    const totalBayar = item.nominal_bayar + nominalBayar;
    const status = totalBayar >= item.nominal ? 'lunas' : 'cicil';

    try {
      const { error } = await supabase
        .from('pembayaran')
        .update({
          nominal_bayar: totalBayar,
          tanggal_bayar: new Date().toISOString(),
          status,
        })
        .eq('id', item.id);

      if (error) throw error;
      toast.success('Pembayaran berhasil diupdate');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses pembayaran');
    }
  };

  const filteredData = pembayaran.filter(p => 
    p.siswa?.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.siswa?.nis.toLowerCase().includes(search.toLowerCase())
  );

  const bulanOptions = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'lunas':
        return <Badge className="bg-success/15 text-success border-success/30"><Check className="h-3 w-3 mr-1" />Lunas</Badge>;
      case 'cicil':
        return <Badge className="bg-warning/15 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Cicil</Badge>;
      default:
        return <Badge className="bg-destructive/15 text-destructive border-destructive/30">Belum Bayar</Badge>;
    }
  };

  const columns = [
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
      cell: (item: Pembayaran) => item.jenis_tagihan?.nama_tagihan || '-'
    },
    { 
      header: 'Periode', 
      cell: (item: Pembayaran) => item.bulan && item.tahun ? (
        <span>{bulanOptions.find(b => b.value === String(item.bulan))?.label} {item.tahun}</span>
      ) : '-'
    },
    { 
      header: 'Nominal', 
      cell: (item: Pembayaran) => formatCurrency(item.nominal)
    },
    { 
      header: 'Dibayar', 
      cell: (item: Pembayaran) => (
        <span className="font-semibold text-success">{formatCurrency(item.nominal_bayar)}</span>
      )
    },
    { 
      header: 'Status', 
      cell: (item: Pembayaran) => getStatusBadge(item.status)
    },
    { 
      header: 'Aksi', 
      cell: (item: Pembayaran) => item.status !== 'lunas' && (
        <Button size="sm" variant="outline" onClick={() => handleBayar(item)}>
          Bayar
        </Button>
      ),
      className: 'w-24'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Pembayaran" 
        description="Kelola pembayaran tagihan siswa"
        icon={<CreditCard className="h-6 w-6" />}
        actions={
          <Button onClick={handleOpenDialog}>
            <CreditCard className="h-4 w-4 mr-2" />
            Proses Pembayaran
          </Button>
        }
      />

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
        emptyMessage="Belum ada data pembayaran"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Proses Pembayaran Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siswa">Siswa</Label>
              <Select value={formData.siswa_id} onValueChange={(v) => setFormData({ ...formData, siswa_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Siswa" />
                </SelectTrigger>
                <SelectContent>
                  {siswa.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nis} - {s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagihan">Jenis Tagihan</Label>
              <Select value={formData.jenis_tagihan_id} onValueChange={handleTagihanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis Tagihan" />
                </SelectTrigger>
                <SelectContent>
                  {jenisTagihan.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nama_tagihan} - {formatCurrency(t.nominal)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulan">Bulan</Label>
                <Select value={formData.bulan} onValueChange={(v) => setFormData({ ...formData, bulan: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulanOptions.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun">Tahun</Label>
                <Input
                  id="tahun"
                  type="number"
                  value={formData.tahun}
                  onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nominal_bayar">Jumlah Bayar (Rp)</Label>
              <Input
                id="nominal_bayar"
                type="number"
                value={formData.nominal_bayar}
                onChange={(e) => setFormData({ ...formData, nominal_bayar: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
              <Input
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Proses Pembayaran</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
