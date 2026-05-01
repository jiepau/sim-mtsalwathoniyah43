import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { PPDBSettingsPanel } from '@/components/ppdb/PPDBSettingsPanel';
import { PPDBKonversiDialog } from '@/components/ppdb/PPDBKonversiDialog';
import { PPDBInputOfflineDialog } from '@/components/ppdb/PPDBInputOfflineDialog';
import { PPDBRekapPrintDialog } from '@/components/ppdb/PPDBRekapPrintDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Search, Download, Upload, ArrowRightCircle, Check, X, ClipboardList, UserCheck, FileSpreadsheet, ChevronRight, Printer } from 'lucide-react';
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
  const [showInputOffline, setShowInputOffline] = useState(false);
  const [showRekap, setShowRekap] = useState(false);
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

  const { data: spmbSettings } = useQuery({
    queryKey: ['ppdb-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('ppdb_settings').select('*').maybeSingle();
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

  const handleExportEmis = () => {
    exportEmisCSV(filtered as Record<string, unknown>[], 'spmb-emis4.csv');
    toast.success(`${filtered.length} data diekspor format EMIS 4.0`);
  };

  const handleImportEmis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const text = await file.text();
      const rows = parseEmisCSV(text);
      if (!rows.length) { toast.error('File CSV kosong atau format tidak sesuai'); return; }

      let inserted = 0;
      for (const row of rows) {
        if (!row.nama) continue;
        // Generate nomor
        const { data: nomor, error: rpcErr } = await supabase.rpc('generate_nomor_ppdb');
        if (rpcErr) throw rpcErr;

        const payload: Record<string, unknown> = { nomor_pendaftaran: nomor, status: 'baru', ...row };
        // Convert numeric fields
        if (payload.jumlah_saudara) payload.jumlah_saudara = parseInt(String(payload.jumlah_saudara)) || null;
        if (payload.anak_ke) payload.anak_ke = parseInt(String(payload.anak_ke)) || null;

        const { error } = await supabase.from('ppdb_pendaftar').insert(payload as any);
        if (error) { console.error('Import row error:', error); continue; }
        inserted++;
      }

      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
      toast.success(`${inserted} dari ${rows.length} data berhasil diimport`);
    } catch (err: any) {
      toast.error('Gagal import: ' + err.message);
    }
  };

  const countByStatus = (s: string) => pendaftar.filter((p) => p.status === s).length;
  const selectedDiterima = selected.filter((id) => pendaftar.find((p) => p.id === id)?.status === 'diterima');

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="SPMB"
        description="Sistem Penerimaan Murid Baru"
        icon={<UserPlus className="h-5 w-5" />}
      />

      {/* Wizard Alur Kerja SPMB */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Alur Kerja SPMB
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
            {[
              { step: 1, label: 'Buka Pendaftaran', desc: 'Aktifkan form di panel Pengaturan', icon: UserPlus, done: spmbSettings?.is_open === true },
              { step: 2, label: 'Calon Siswa Mendaftar', desc: 'Form publik diisi oleh pendaftar', icon: ClipboardList, done: pendaftar.length > 0 },
              { step: 3, label: 'Verifikasi & Seleksi', desc: 'Terima atau tolak pendaftar', icon: UserCheck, done: countByStatus('diterima') > 0 || countByStatus('ditolak') > 0 },
              { step: 4, label: 'Export EMIS 4.0', desc: 'Download CSV untuk import ke EMIS', icon: FileSpreadsheet, done: false },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center gap-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${item.done ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground'}`}>
                  <div className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold shrink-0 ${item.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {item.done ? <Check className="h-3 w-3" /> : item.step}
                  </div>
                  <div>
                    <p className="font-medium leading-tight">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                  </div>
                </div>
                {idx < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 hidden sm:block shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

          <div className="mt-4">
            <PPDBAsalSekolahDonut {...asalBreakdown} />
          </div>
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
            <Button size="sm" variant="outline" onClick={handleExportEmis}>
              <Download className="h-4 w-4 mr-1" /> Export EMIS
            </Button>
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImportEmis} />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Import EMIS
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowRekap(true)}>
              <Printer className="h-4 w-4 mr-1" /> Cetak Rekap
            </Button>
            <Button size="sm" onClick={() => setShowInputOffline(true)}>
              <UserPlus className="h-4 w-4 mr-1" /> Tambah Pendaftar
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
      <PPDBInputOfflineDialog open={showInputOffline} onOpenChange={setShowInputOffline} />
      <PPDBRekapPrintDialog open={showRekap} onOpenChange={setShowRekap} pendaftar={filtered} />
    </div>
  );
}
