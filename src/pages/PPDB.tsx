import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { PPDBSettingsPanel } from '@/components/ppdb/PPDBSettingsPanel';
import { PPDBKonversiDialog } from '@/components/ppdb/PPDBKonversiDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Search, Download, Upload, ArrowRightCircle, Check, X } from 'lucide-react';
import { formatDate } from '@/lib/supabase-helpers';
import { exportEmisCSV, parseEmisCSV } from '@/lib/emis-field-map';

const statusColors: Record<string, string> = {
  baru: 'bg-blue-100 text-blue-800 border-blue-200',
  diterima: 'bg-green-100 text-green-800 border-green-200',
  ditolak: 'bg-red-100 text-red-800 border-red-200',
};

export default function PPDB() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [selected, setSelected] = useState<string[]>([]);
  const [showKonversi, setShowKonversi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pendaftar = [], isLoading } = useQuery({
    queryKey: ['ppdb-pendaftar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ppdb_pendaftar')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('ppdb-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ppdb_pendaftar' },
        () => {
          qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('ppdb_pendaftar')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
      setSelected([]);
      toast.success('Status pendaftar diperbarui');
    },
    onError: () => toast.error('Gagal mengubah status'),
  });

  const filtered = pendaftar.filter((p) => {
    const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.nomor_pendaftaran.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'semua' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((p) => p.id));
  };

  const exportCSV = () => {
    const headers = ['No Pendaftaran', 'Nama', 'NISN', 'NIK', 'L/P', 'Agama', 'Tempat Lahir', 'Tgl Lahir', 'Alamat', 'Asal Sekolah', 'Ayah', 'Ibu', 'WA Ortu', 'Status'];
    const rows = filtered.map((p) => [
      p.nomor_pendaftaran, p.nama, p.nisn ?? '', p.nik ?? '', p.jenis_kelamin ?? '', p.agama ?? '',
      p.tempat_lahir ?? '', p.tanggal_lahir ?? '', p.alamat ?? '', p.asal_sekolah ?? '',
      p.nama_ayah ?? '', p.nama_ibu ?? p.ibu_nama ?? '', p.wa_ortu ?? '', p.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spmb-pendaftar.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const countByStatus = (s: string) => pendaftar.filter((p) => p.status === s).length;
  const selectedDiterima = selected.filter((id) => pendaftar.find((p) => p.id === id)?.status === 'diterima');

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="SPMB"
        description="Seleksi Penerimaan Murid Baru"
        icon={<UserPlus className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <PPDBSettingsPanel />

          <Card className="mt-4">
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Pendaftar</span>
                <Badge variant="secondary">{pendaftar.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Baru</span>
                <Badge className="bg-blue-100 text-blue-800">{countByStatus('baru')}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Diterima</span>
                <Badge className="bg-green-100 text-green-800">{countByStatus('diterima')}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ditolak</span>
                <Badge className="bg-red-100 text-red-800">{countByStatus('ditolak')}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama / no pendaftaran..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                <SelectItem value="baru">Baru</SelectItem>
                <SelectItem value="diterima">Diterima</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>

          {selected.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
              <span>{selected.length} dipilih</span>
              <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ ids: selected, status: 'diterima' })}>
                <Check className="h-3.5 w-3.5 mr-1" /> Terima
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ ids: selected, status: 'ditolak' })}>
                <X className="h-3.5 w-3.5 mr-1" /> Tolak
              </Button>
              {selectedDiterima.length > 0 && (
                <Button size="sm" onClick={() => setShowKonversi(true)}>
                  <ArrowRightCircle className="h-3.5 w-3.5 mr-1" /> Konversi ke Siswa ({selectedDiterima.length})
                </Button>
              )}
            </div>
          )}

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead className="text-xs">No. Daftar</TableHead>
                    <TableHead className="text-xs">Nama</TableHead>
                    <TableHead className="text-xs">NISN</TableHead>
                    <TableHead className="text-xs">L/P</TableHead>
                    <TableHead className="text-xs">Asal Sekolah</TableHead>
                    <TableHead className="text-xs">WA Ortu</TableHead>
                    <TableHead className="text-xs">Tanggal Daftar</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Belum ada pendaftar</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                        </TableCell>
                        <TableCell className="text-xs font-mono">{p.nomor_pendaftaran}</TableCell>
                        <TableCell className="text-sm font-medium">{p.nama}</TableCell>
                        <TableCell className="text-xs">{p.nisn ?? '-'}</TableCell>
                        <TableCell className="text-xs">{p.jenis_kelamin ?? '-'}</TableCell>
                        <TableCell className="text-xs">{p.asal_sekolah ?? '-'}</TableCell>
                        <TableCell className="text-xs">{p.wa_ortu ?? '-'}</TableCell>
                        <TableCell className="text-xs">{formatDate(p.created_at)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${statusColors[p.status] ?? ''}`}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      <PPDBKonversiDialog
        open={showKonversi}
        onOpenChange={setShowKonversi}
        pendaftarIds={selectedDiterima}
      />
    </div>
  );
}
