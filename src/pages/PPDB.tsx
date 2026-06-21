import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { PPDBSettingsPanel } from '@/components/ppdb/PPDBSettingsPanel';
import { PPDBLandingContentPanel } from '@/components/ppdb/PPDBLandingContentPanel';
import { PPDBKonversiDialog } from '@/components/ppdb/PPDBKonversiDialog';
import { PPDBInputOfflineDialog } from '@/components/ppdb/PPDBInputOfflineDialog';
import { PPDBRekapPrintDialog } from '@/components/ppdb/PPDBRekapPrintDialog';
import { PPDBAsalSekolahDonut, useAsalSekolahBreakdown } from '@/components/ppdb/PPDBAsalSekolahChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { UserPlus, Search, Download, Upload, ArrowRightCircle, Check, X, ClipboardList, UserCheck, FileSpreadsheet, ChevronRight, Printer, UserX, Clock, Trash2, Settings, LayoutTemplate } from 'lucide-react';
import { formatDate } from '@/lib/supabase-helpers';
import { exportEmisCSV, parseEmisCSV } from '@/lib/emis-field-map';

const statusColors: Record<string, string> = {
  baru: 'bg-blue-100 text-blue-800 border-blue-200',
  diterima: 'bg-green-100 text-green-800 border-green-200',
  ditolak: 'bg-red-100 text-red-800 border-red-200',
  batal: 'bg-amber-100 text-amber-800 border-amber-200',
};

const statusLabels: Record<string, string> = {
  baru: 'Baru',
  diterima: 'Diterima',
  ditolak: 'Ditolak',
  batal: 'Mengundurkan Diri',
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
    // Polling 30s — realtime dimatikan untuk privasi data pendaftar
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
    }, 30000);
    return () => clearInterval(interval);
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

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('ppdb_pendaftar')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
      setSelected([]);
      toast.success('Data pendaftar dihapus');
    },
    onError: () => toast.error('Gagal menghapus data pendaftar'),
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
  const asalBreakdown = useAsalSekolahBreakdown(pendaftar);
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

      {/* Ringkasan statistik + chart asal sekolah dalam baris kompak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Statistik SPMB</span>
              <Badge variant="outline" className="text-xs">{spmbSettings?.tahun_ajaran ?? '-'}</Badge>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <div className="rounded-md border bg-background p-2 text-center">
                <div className="text-[11px] text-muted-foreground">Total</div>
                <div className="text-base sm:text-lg font-semibold">{pendaftar.length}</div>
              </div>
              <div className="rounded-md border bg-blue-50 p-2 text-center">
                <div className="text-[11px] text-blue-700">📥 Baru</div>
                <div className="text-base sm:text-lg font-semibold text-blue-800">{countByStatus('baru')}</div>
              </div>
              <div className="rounded-md border bg-green-50 p-2 text-center">
                <div className="text-[11px] text-green-700">✅ Diterima</div>
                <div className="text-base sm:text-lg font-semibold text-green-800">{countByStatus('diterima')}</div>
              </div>
              <div className="rounded-md border bg-red-50 p-2 text-center">
                <div className="text-[11px] text-red-700">❌ Ditolak</div>
                <div className="text-base sm:text-lg font-semibold text-red-800">{countByStatus('ditolak')}</div>
              </div>
              <div className="rounded-md border bg-amber-50 p-2 text-center col-span-3 sm:col-span-1">
                <div className="text-[11px] text-amber-700">🚪 Mundur</div>
                <div className="text-base sm:text-lg font-semibold text-amber-800">{countByStatus('batal')}</div>
              </div>
            </div>
            {pendaftar.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs text-muted-foreground">
                <div className="flex justify-between border-t pt-2">
                  <span>Tingkat Penerimaan</span>
                  <span className="font-medium text-foreground">{Math.round((countByStatus('diterima') / pendaftar.length) * 100)}%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Aktif Diproses</span>
                  <span className="font-medium text-foreground">{pendaftar.length - countByStatus('batal')}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="lg:col-span-1">
          <PPDBAsalSekolahDonut {...asalBreakdown} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative w-full sm:flex-1 sm:w-auto sm:min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama / no pendaftaran..."
              className="pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-[130px] min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="baru">Baru</SelectItem>
              <SelectItem value="diterima">Diterima</SelectItem>
              <SelectItem value="ditolak">Ditolak</SelectItem>
              <SelectItem value="batal">Mengundurkan Diri</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" title="Pengaturan SPMB">
                <Settings className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Pengaturan</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Pengaturan SPMB</SheetTitle>
                <SheetDescription>Atur status pendaftaran, tahun ajaran, dan finalisasi.</SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <PPDBSettingsPanel />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" title="Konten Landing">
                <LayoutTemplate className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Konten Landing</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Konten Landing SPMB</SheetTitle>
                <SheetDescription>Edit info yang tampil di halaman publik /spmb.</SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <PPDBLandingContentPanel />
              </div>
            </SheetContent>
          </Sheet>

          <Button size="sm" variant="outline" onClick={handleExportEmis} title="Export EMIS">
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Export EMIS</span>
          </Button>
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImportEmis} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} title="Import EMIS">
            <Upload className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Import EMIS</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRekap(true)} title="Cetak Rekap">
            <Printer className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Cetak Rekap</span>
          </Button>
          <Button size="sm" onClick={() => setShowInputOffline(true)} className="ml-auto sm:ml-0">
            <UserPlus className="h-4 w-4 mr-1" />
            <span>Tambah</span><span className="hidden sm:inline">&nbsp;Pendaftar</span>
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-md text-sm">
            <span>{selected.length} dipilih</span>
            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ ids: selected, status: 'baru' })}>
              <Clock className="h-3.5 w-3.5 mr-1" /> Set Baru
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ ids: selected, status: 'diterima' })}>
              <Check className="h-3.5 w-3.5 mr-1" /> Terima
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ ids: selected, status: 'ditolak' })}>
              <X className="h-3.5 w-3.5 mr-1" /> Tolak
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => {
                if (confirm(`Tandai ${selected.length} pendaftar sebagai MENGUNDURKAN DIRI?\n\nData tetap tersimpan, hanya statusnya yang berubah.`)) {
                  updateStatusMutation.mutate({ ids: selected, status: 'batal' });
                }
              }}
            >
              <UserX className="h-3.5 w-3.5 mr-1" /> Mengundurkan Diri
            </Button>
            {selectedDiterima.length > 0 && (
              <Button size="sm" onClick={() => setShowKonversi(true)}>
                <ArrowRightCircle className="h-3.5 w-3.5 mr-1" /> Konversi ke Siswa ({selectedDiterima.length})
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`Hapus permanen ${selected.length} data pendaftar SPMB?\n\nAksi ini tidak bisa dibatalkan.`)) {
                  deleteMutation.mutate(selected);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
            </Button>
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
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Belum ada pendaftar</TableCell>
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
                        <Badge className={`text-xs ${statusColors[p.status] ?? ''}`}>{statusLabels[p.status] ?? p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Hapus permanen data pendaftar ${p.nama}?\n\nAksi ini tidak bisa dibatalkan.`)) {
                              deleteMutation.mutate([p.id]);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          title="Hapus pendaftar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
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
