import { useEffect, useMemo, useState } from 'react';
import { BookCheck, Loader2, Lock, Eye, Trash2, Printer, AlertTriangle, FileArchive } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';
import { toast } from 'sonner';
import { PrintPreviewToolbar, PrintPreviewFrame, type PrintOrientation } from '@/components/print/PrintPreviewToolbar';

type PeriodeJenis = 'tahun_ajaran' | 'tahun_kalender';

interface TaOption { id: string; nama_ta: string; is_active: boolean | null; }

interface PreviewData {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  breakdownPemasukan: Array<{ nama: string; nominal: number }>;
  breakdownPengeluaran: Array<{ nama: string; nominal: number }>;
  daftarTunggakan: Array<{ siswa_id: string; nama: string; nis: string; kelas: string; total: number }>;
  totalTunggakan: number;
  jumlahSiswaNunggak: number;
}

interface ArsipRow {
  id: string;
  judul: string;
  periode_jenis: string;
  periode_label: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  total_pemasukan: number;
  total_pengeluaran: number;
  saldo: number;
  total_tunggakan: number;
  jumlah_siswa_nunggak: number;
  breakdown_pemasukan: any;
  breakdown_pengeluaran: any;
  daftar_tunggakan: any;
  catatan: string | null;
  tutup_oleh_nama: string | null;
  nama_bendahara: string | null;
  nama_kepala: string | null;
  nip_kepala: string | null;
  created_at: string;
}

interface MadrasahSettings {
  nama_madrasah: string;
  alamat: string | null;
  npsn: string | null;
  nsm: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
}

export default function TutupBuku() {
  const now = new Date();
  const [periodeJenis, setPeriodeJenis] = useState<PeriodeJenis>('tahun_ajaran');
  const [taList, setTaList] = useState<TaOption[]>([]);
  const [selectedTaId, setSelectedTaId] = useState<string>('');
  const [tahunKalender, setTahunKalender] = useState<number>(now.getFullYear());
  const [namaBendahara, setNamaBendahara] = useState('');
  const [catatan, setCatatan] = useState('');
  const [autoWarisan, setAutoWarisan] = useState(true);

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [arsipList, setArsipList] = useState<ArsipRow[]>([]);
  const [loadingArsip, setLoadingArsip] = useState(false);
  const [viewArsip, setViewArsip] = useState<ArsipRow | null>(null);
  const [deleteArsip, setDeleteArsip] = useState<ArsipRow | null>(null);
  const [deleteText, setDeleteText] = useState('');

  const [madrasah, setMadrasah] = useState<MadrasahSettings | null>(null);
  const [printPreview, setPrintPreview] = useState(false);
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait');

  // Init
  useEffect(() => {
    (async () => {
      const [taRes, msRes] = await Promise.all([
        supabase.from('tahun_ajaran').select('id, nama_ta, is_active').order('nama_ta', { ascending: false }),
        supabase.from('madrasah_settings').select('*').maybeSingle(),
      ]);
      const list = (taRes.data || []) as TaOption[];
      setTaList(list);
      const active = list.find(t => t.is_active);
      if (active) setSelectedTaId(active.id);
      else if (list[0]) setSelectedTaId(list[0].id);
      if (msRes.data) setMadrasah(msRes.data as any);
    })();
    fetchArsip();
  }, []);

  const fetchArsip = async () => {
    setLoadingArsip(true);
    const { data } = await supabase
      .from('laporan_tahunan')
      .select('*')
      .order('tanggal_mulai', { ascending: false });
    setArsipList((data || []) as ArsipRow[]);
    setLoadingArsip(false);
  };

  // Hitung rentang tanggal dari pilihan periode
  const rentang = useMemo(() => {
    if (periodeJenis === 'tahun_kalender') {
      return {
        start: `${tahunKalender}-01-01`,
        end: `${tahunKalender}-12-31`,
        label: `Tahun ${tahunKalender}`,
        judul: `Laporan Keuangan Tahun ${tahunKalender}`,
      };
    }
    // Tahun ajaran: parse "2025/2026" → 1 Juli 2025 - 30 Juni 2026
    const ta = taList.find(t => t.id === selectedTaId);
    if (!ta) return null;
    const match = ta.nama_ta.match(/(\d{4})\s*[\/\-]\s*(\d{4})/);
    let startYear = now.getFullYear();
    let endYear = now.getFullYear() + 1;
    if (match) {
      startYear = parseInt(match[1]);
      endYear = parseInt(match[2]);
    }
    return {
      start: `${startYear}-07-01`,
      end: `${endYear}-06-30`,
      label: `TA ${ta.nama_ta}`,
      judul: `Laporan Keuangan TA ${ta.nama_ta}`,
      taId: ta.id,
    };
  }, [periodeJenis, tahunKalender, selectedTaId, taList]);

  const handlePreview = async () => {
    if (!rentang) {
      toast.error('Pilih periode terlebih dahulu');
      return;
    }
    setLoadingPreview(true);
    try {
      const startISO = new Date(rentang.start).toISOString();
      const endISO = new Date(rentang.end + 'T23:59:59').toISOString();

      // Pemasukan & pengeluaran
      const [pRes, kRes, tunggakanRes] = await Promise.all([
        supabase.from('pembayaran')
          .select('nominal_bayar, jenis_tagihan(nama_tagihan)')
          .not('tanggal_bayar', 'is', null)
          .gte('tanggal_bayar', startISO)
          .lte('tanggal_bayar', endISO),
        supabase.from('pengeluaran')
          .select('kategori, nominal')
          .gte('tanggal', rentang.start)
          .lte('tanggal', rentang.end),
        // Tunggakan: ambil semua pembayaran yang belum lunas (sisa > 0)
        supabase.from('pembayaran')
          .select('siswa_id, nominal, nominal_bayar, status, siswa(nama, nis, kelas:kelas_id(nama_kelas))')
          .neq('status', 'lunas')
          .limit(5000),
      ]);

      const pemasukanMap = new Map<string, number>();
      (pRes.data || []).forEach((p: any) => {
        const k = p.jenis_tagihan?.nama_tagihan || 'Lainnya';
        pemasukanMap.set(k, (pemasukanMap.get(k) || 0) + Number(p.nominal_bayar || 0));
      });

      const pengeluaranMap = new Map<string, number>();
      (kRes.data || []).forEach((k: any) => {
        pengeluaranMap.set(k.kategori, (pengeluaranMap.get(k.kategori) || 0) + Number(k.nominal || 0));
      });

      const tunggakanMap = new Map<string, { nama: string; nis: string; kelas: string; total: number }>();
      (tunggakanRes.data || []).forEach((p: any) => {
        const sisa = Number(p.nominal || 0) - Number(p.nominal_bayar || 0);
        if (sisa <= 0 || !p.siswa) return;
        const key = p.siswa_id;
        const cur = tunggakanMap.get(key) || {
          nama: p.siswa.nama,
          nis: p.siswa.nis,
          kelas: p.siswa.kelas?.nama_kelas || '-',
          total: 0,
        };
        cur.total += sisa;
        tunggakanMap.set(key, cur);
      });

      const breakdownPemasukan = Array.from(pemasukanMap.entries())
        .map(([nama, nominal]) => ({ nama, nominal }))
        .sort((a, b) => b.nominal - a.nominal);
      const breakdownPengeluaran = Array.from(pengeluaranMap.entries())
        .map(([nama, nominal]) => ({ nama, nominal }))
        .sort((a, b) => b.nominal - a.nominal);
      const daftarTunggakan = Array.from(tunggakanMap.entries())
        .map(([siswa_id, v]) => ({ siswa_id, ...v }))
        .sort((a, b) => b.total - a.total);

      const totalPemasukan = breakdownPemasukan.reduce((s, x) => s + x.nominal, 0);
      const totalPengeluaran = breakdownPengeluaran.reduce((s, x) => s + x.nominal, 0);
      const totalTunggakan = daftarTunggakan.reduce((s, x) => s + x.total, 0);

      setPreview({
        totalPemasukan,
        totalPengeluaran,
        saldo: totalPemasukan - totalPengeluaran,
        breakdownPemasukan,
        breakdownPengeluaran,
        daftarTunggakan,
        totalTunggakan,
        jumlahSiswaNunggak: daftarTunggakan.length,
      });
    } catch (e: any) {
      toast.error('Gagal memuat preview: ' + e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleTutupBuku = async () => {
    if (!preview || !rentang) return;
    if (confirmText !== 'TUTUP BUKU') {
      toast.error('Ketik "TUTUP BUKU" untuk konfirmasi');
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const { data: profile } = userId
        ? await supabase.from('profiles').select('full_name').eq('user_id', userId).maybeSingle()
        : { data: null };

      const { error } = await supabase.from('laporan_tahunan').insert({
        judul: rentang.judul,
        periode_jenis: periodeJenis,
        periode_label: rentang.label,
        tanggal_mulai: rentang.start,
        tanggal_akhir: rentang.end,
        ta_id: rentang.taId || null,
        total_pemasukan: preview.totalPemasukan,
        total_pengeluaran: preview.totalPengeluaran,
        saldo: preview.saldo,
        breakdown_pemasukan: preview.breakdownPemasukan as any,
        breakdown_pengeluaran: preview.breakdownPengeluaran as any,
        daftar_tunggakan: preview.daftarTunggakan as any,
        total_tunggakan: preview.totalTunggakan,
        jumlah_siswa_nunggak: preview.jumlahSiswaNunggak,
        catatan: catatan || null,
        tutup_oleh: userId,
        tutup_oleh_nama: profile?.full_name || null,
        nama_bendahara: namaBendahara || null,
        nama_kepala: madrasah?.kepala_madrasah || null,
        nip_kepala: madrasah?.nip_kepala || null,
      });
      if (error) throw error;

      toast.success(`Tutup buku ${rentang.label} berhasil disimpan!`);
      setConfirmOpen(false);
      setConfirmText('');
      setPreview(null);
      setCatatan('');
      fetchArsip();
    } catch (e: any) {
      toast.error('Gagal menyimpan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteArsip) return;
    if (deleteText !== 'HAPUS') {
      toast.error('Ketik "HAPUS" untuk konfirmasi');
      return;
    }
    const { error } = await supabase.from('laporan_tahunan').delete().eq('id', deleteArsip.id);
    if (error) {
      toast.error('Gagal hapus: ' + error.message);
      return;
    }
    toast.success('Arsip dihapus');
    setDeleteArsip(null);
    setDeleteText('');
    fetchArsip();
  };

  const tahunKalenderOpts = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="animate-fadeIn space-y-6">
      <PageHeader
        title="Tutup Buku Keuangan"
        description="Snapshot resmi laporan keuangan per Tahun Ajaran atau Tahun Kalender. Data tersimpan permanen sebagai arsip."
        icon={<BookCheck className="h-6 w-6" />}
      />

      <Tabs defaultValue="tutup">
        <TabsList>
          <TabsTrigger value="tutup">
            <Lock className="h-4 w-4 mr-2" /> Tutup Buku Baru
          </TabsTrigger>
          <TabsTrigger value="arsip">
            <FileArchive className="h-4 w-4 mr-2" /> Arsip ({arsipList.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB: Tutup Buku Baru */}
        <TabsContent value="tutup" className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-6 flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-200">Penting: Tutup Buku bersifat permanen</p>
                <p className="text-amber-800 dark:text-amber-300 mt-1">
                  Setelah tutup buku, snapshot total pemasukan, pengeluaran, dan tunggakan akan tersimpan sebagai arsip resmi.
                  Pembayaran/pengeluaran selanjutnya tetap bisa diinput, tetapi arsip ini tidak akan berubah.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Pilih Periode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Periode</Label>
                  <Select value={periodeJenis} onValueChange={(v: any) => { setPeriodeJenis(v); setPreview(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tahun_ajaran">Tahun Ajaran (Juli - Juni)</SelectItem>
                      <SelectItem value="tahun_kalender">Tahun Kalender (Jan - Des)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {periodeJenis === 'tahun_ajaran' ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tahun Ajaran</Label>
                    <Select value={selectedTaId} onValueChange={(v) => { setSelectedTaId(v); setPreview(null); }}>
                      <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
                      <SelectContent>
                        {taList.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nama_ta} {t.is_active && '(Aktif)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tahun</Label>
                    <Select value={String(tahunKalender)} onValueChange={(v) => { setTahunKalender(Number(v)); setPreview(null); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {tahunKalenderOpts.map(y => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {rentang && (
                <div className="text-sm bg-muted/50 px-4 py-3 rounded-md">
                  <span className="text-muted-foreground">Periode: </span>
                  <span className="font-semibold">
                    {new Date(rentang.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' s.d. '}
                    {new Date(rentang.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}

              <Button onClick={handlePreview} disabled={loadingPreview || !rentang}>
                {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                Tampilkan Pratinjau
              </Button>
            </CardContent>
          </Card>

          {preview && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2. Pratinjau Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Pemasukan</p>
                      <p className="font-bold text-success text-sm">{formatCurrency(preview.totalPemasukan)}</p>
                    </div>
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Pengeluaran</p>
                      <p className="font-bold text-destructive text-sm">{formatCurrency(preview.totalPengeluaran)}</p>
                    </div>
                    <div className={`${preview.saldo >= 0 ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30'} border rounded-lg p-3`}>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className={`font-bold text-sm ${preview.saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(preview.saldo)}
                      </p>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Tunggakan ({preview.jumlahSiswaNunggak} siswa)</p>
                      <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">{formatCurrency(preview.totalTunggakan)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold mb-2">Pemasukan per Jenis Tagihan</p>
                      <div className="border rounded-md divide-y text-sm max-h-48 overflow-y-auto">
                        {preview.breakdownPemasukan.length === 0 ? (
                          <p className="p-3 text-muted-foreground italic text-center">Tidak ada data</p>
                        ) : preview.breakdownPemasukan.map(b => (
                          <div key={b.nama} className="flex justify-between px-3 py-2">
                            <span>{b.nama}</span>
                            <span className="font-medium tabular-nums">{formatCurrency(b.nominal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Pengeluaran per Kategori</p>
                      <div className="border rounded-md divide-y text-sm max-h-48 overflow-y-auto">
                        {preview.breakdownPengeluaran.length === 0 ? (
                          <p className="p-3 text-muted-foreground italic text-center">Tidak ada data</p>
                        ) : preview.breakdownPengeluaran.map(b => (
                          <div key={b.nama} className="flex justify-between px-3 py-2">
                            <span>{b.nama}</span>
                            <span className="font-medium tabular-nums">{formatCurrency(b.nominal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3. Detail Tutup Buku</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Bendahara (TTD)</Label>
                    <Input
                      value={namaBendahara}
                      onChange={(e) => setNamaBendahara(e.target.value)}
                      placeholder="Contoh: H. Ahmad Fauzi, S.E."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan (opsional)</Label>
                    <Textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Catatan tambahan tentang tutup buku ini..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-md">
                    <input
                      type="checkbox"
                      id="auto-warisan"
                      checked={autoWarisan}
                      onChange={(e) => setAutoWarisan(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="auto-warisan" className="text-sm cursor-pointer">
                      <span className="font-medium">Tunggakan otomatis terbawa ke TA berikutnya</span>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {preview.jumlahSiswaNunggak} siswa dengan total {formatCurrency(preview.totalTunggakan)} akan tetap muncul
                        di halaman Tunggakan dengan badge "Warisan TA Lalu" (sudah otomatis dari sistem TA-aware).
                      </p>
                    </label>
                  </div>

                  <Button
                    onClick={() => setConfirmOpen(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="lg"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Tutup Buku & Simpan sebagai Arsip
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB: Arsip */}
        <TabsContent value="arsip" className="space-y-4">
          {loadingArsip ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : arsipList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileArchive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Belum ada arsip tutup buku.</p>
                <p className="text-xs mt-1">Buat arsip pertama Anda di tab "Tutup Buku Baru".</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {arsipList.map(arsip => (
                <Card key={arsip.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{arsip.judul}</h3>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {arsip.periode_jenis === 'tahun_ajaran' ? 'TA' : 'Kalender'}
                        </Badge>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pemasukan</span>
                        <span className="font-medium text-success">{formatCurrency(arsip.total_pemasukan)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pengeluaran</span>
                        <span className="font-medium text-destructive">{formatCurrency(arsip.total_pengeluaran)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="font-semibold">Saldo</span>
                        <span className={`font-bold ${arsip.saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {formatCurrency(arsip.saldo)}
                        </span>
                      </div>
                      {arsip.jumlah_siswa_nunggak > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>Tunggakan ({arsip.jumlah_siswa_nunggak} siswa)</span>
                          <span className="font-medium">{formatCurrency(arsip.total_tunggakan)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      Ditutup: {new Date(arsip.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {arsip.tutup_oleh_nama && ` oleh ${arsip.tutup_oleh_nama}`}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewArsip(arsip)}>
                        <Eye className="h-3 w-3 mr-1" /> Lihat
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteArsip(arsip)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Konfirmasi Tutup Buku */}
      <AlertDialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (!o) setConfirmText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" /> Konfirmasi Tutup Buku
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Anda akan menutup buku untuk periode <strong>{rentang?.label}</strong>.</p>
                <p>Snapshot data berikut akan disimpan permanen:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Total pemasukan: <strong>{preview && formatCurrency(preview.totalPemasukan)}</strong></li>
                  <li>Total pengeluaran: <strong>{preview && formatCurrency(preview.totalPengeluaran)}</strong></li>
                  <li>Saldo akhir: <strong>{preview && formatCurrency(preview.saldo)}</strong></li>
                  <li>Tunggakan: <strong>{preview?.jumlahSiswaNunggak} siswa</strong></li>
                </ul>
                <div className="space-y-2">
                  <Label>Ketik <span className="font-mono font-bold text-destructive">TUTUP BUKU</span> untuk konfirmasi:</Label>
                  <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="TUTUP BUKU" />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTutupBuku}
              disabled={submitting || confirmText !== 'TUTUP BUKU'}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ya, Tutup Buku
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi Hapus Arsip */}
      <AlertDialog open={!!deleteArsip} onOpenChange={(o) => { if (!o) { setDeleteArsip(null); setDeleteText(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Arsip?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Arsip <strong>{deleteArsip?.judul}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</p>
                <div className="space-y-2">
                  <Label>Ketik <span className="font-mono font-bold text-destructive">HAPUS</span>:</Label>
                  <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteText !== 'HAPUS'}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Arsip Dialog */}
      <Dialog open={!!viewArsip} onOpenChange={(o) => { if (!o) { setViewArsip(null); setPrintPreview(false); } }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewArsip?.judul}</DialogTitle>
          </DialogHeader>
          {viewArsip && (
            <div className="space-y-4">
              <PrintPreviewToolbar
                preview={printPreview}
                onTogglePreview={setPrintPreview}
                orientation={orientation}
                onOrientationChange={setOrientation}
                onPrint={() => window.print()}
                hint="Cetak arsip resmi tutup buku"
              />
              <PrintPreviewFrame preview={printPreview} orientation={orientation}>
                <div className={`print-area ${printPreview ? '' : 'bg-white text-black p-6 rounded-lg border'}`}>
                  {/* Header */}
                  <div className="text-center border-b-2 border-black pb-3 mb-4">
                    <h1 className="text-lg font-bold uppercase">{madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'}</h1>
                    {madrasah?.alamat && <p className="text-xs">{madrasah.alamat}</p>}
                    <p className="text-[11px]">
                      {madrasah?.npsn && `NPSN: ${madrasah.npsn}`}
                      {madrasah?.nsm && ` · NSM: ${madrasah.nsm}`}
                    </p>
                  </div>

                  <div className="text-center mb-4">
                    <h2 className="text-base font-bold underline">LAPORAN TUTUP BUKU KEUANGAN</h2>
                    <p className="text-sm font-semibold">{viewArsip.periode_label}</p>
                    <p className="text-xs">
                      Periode: {new Date(viewArsip.tanggal_mulai).toLocaleDateString('id-ID')} s.d.{' '}
                      {new Date(viewArsip.tanggal_akhir).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  {/* Pemasukan */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold mb-2 bg-emerald-100 px-2 py-1 border border-black">A. PEMASUKAN</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black px-2 py-1 w-10">No</th>
                          <th className="border border-black px-2 py-1 text-left">Jenis Tagihan</th>
                          <th className="border border-black px-2 py-1 text-right w-40">Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewArsip.breakdown_pemasukan as any[])?.length === 0 ? (
                          <tr><td colSpan={3} className="border border-black px-2 py-3 text-center italic">Tidak ada data</td></tr>
                        ) : (viewArsip.breakdown_pemasukan as any[])?.map((b, i) => (
                          <tr key={i}>
                            <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                            <td className="border border-black px-2 py-1">{b.nama}</td>
                            <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(b.nominal)}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-bold">
                          <td colSpan={2} className="border border-black px-2 py-1 text-right">TOTAL PEMASUKAN</td>
                          <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(viewArsip.total_pemasukan)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pengeluaran */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold mb-2 bg-rose-100 px-2 py-1 border border-black">B. PENGELUARAN</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black px-2 py-1 w-10">No</th>
                          <th className="border border-black px-2 py-1 text-left">Kategori</th>
                          <th className="border border-black px-2 py-1 text-right w-40">Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewArsip.breakdown_pengeluaran as any[])?.length === 0 ? (
                          <tr><td colSpan={3} className="border border-black px-2 py-3 text-center italic">Tidak ada data</td></tr>
                        ) : (viewArsip.breakdown_pengeluaran as any[])?.map((b, i) => (
                          <tr key={i}>
                            <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                            <td className="border border-black px-2 py-1">{b.nama}</td>
                            <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(b.nominal)}</td>
                          </tr>
                        ))}
                        <tr className="bg-rose-50 font-bold">
                          <td colSpan={2} className="border border-black px-2 py-1 text-right">TOTAL PENGELUARAN</td>
                          <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(viewArsip.total_pengeluaran)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Saldo */}
                  <div className="mb-4">
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        <tr className={`font-bold ${viewArsip.saldo >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                          <td className="border-2 border-black px-3 py-2 w-1/2">SALDO AKHIR ({viewArsip.saldo >= 0 ? 'SURPLUS' : 'DEFISIT'})</td>
                          <td className="border-2 border-black px-3 py-2 text-right tabular-nums">{formatCurrency(Math.abs(viewArsip.saldo))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tunggakan */}
                  {viewArsip.jumlah_siswa_nunggak > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-bold mb-2 bg-amber-100 px-2 py-1 border border-black">
                        C. TUNGGAKAN AKHIR PERIODE ({viewArsip.jumlah_siswa_nunggak} siswa)
                      </h3>
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-black px-2 py-1 w-8">No</th>
                            <th className="border border-black px-2 py-1 w-20">NIS</th>
                            <th className="border border-black px-2 py-1 text-left">Nama Siswa</th>
                            <th className="border border-black px-2 py-1 w-24">Kelas</th>
                            <th className="border border-black px-2 py-1 text-right w-32">Tunggakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewArsip.daftar_tunggakan as any[])?.map((t, i) => (
                            <tr key={i}>
                              <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                              <td className="border border-black px-2 py-1">{t.nis}</td>
                              <td className="border border-black px-2 py-1">{t.nama}</td>
                              <td className="border border-black px-2 py-1">{t.kelas}</td>
                              <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(t.total)}</td>
                            </tr>
                          ))}
                          <tr className="bg-amber-50 font-bold">
                            <td colSpan={4} className="border border-black px-2 py-1 text-right">TOTAL TUNGGAKAN</td>
                            <td className="border border-black px-2 py-1 text-right tabular-nums">{formatCurrency(viewArsip.total_tunggakan)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Catatan */}
                  {viewArsip.catatan && (
                    <div className="mb-4 text-xs">
                      <p className="font-bold">Catatan:</p>
                      <p className="italic border border-gray-400 p-2 mt-1">{viewArsip.catatan}</p>
                    </div>
                  )}

                  {/* TTD - 2 kolom */}
                  <div className="grid grid-cols-2 gap-8 mt-12 text-xs">
                    <div className="text-center">
                      <p>Bendahara,</p>
                      <div className="h-20"></div>
                      <p className="font-bold underline">{viewArsip.nama_bendahara || '...........................'}</p>
                    </div>
                    <div className="text-center">
                      <p>
                        Jakarta, {new Date(viewArsip.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p>Kepala Madrasah,</p>
                      <div className="h-20"></div>
                      <p className="font-bold underline">{viewArsip.nama_kepala || '...........................'}</p>
                      {viewArsip.nip_kepala && <p>NIP. {viewArsip.nip_kepala}</p>}
                    </div>
                  </div>
                </div>
              </PrintPreviewFrame>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print, .sidebar-aside, header, nav, footer { display: none !important; }
          .print-area { border: none !important; padding: 0 !important; }
          [role="dialog"] { position: static !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
