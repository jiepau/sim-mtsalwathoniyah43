import { useState, useEffect } from 'react';
import { ArrowUpCircle, Users, GraduationCap, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TahunAjaran {
  id: string;
  nama_ta: string;
  is_active: boolean;
}

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
}

interface Siswa {
  id: string;
  nama: string;
  nis: string;
  kelas_id: string | null;
  ta_id: string | null;
  alamat: string | null;
  wa_ortu: string | null;
}

interface PreviewData {
  naikKelas: { siswa: Siswa; kelasLama: Kelas | null; kelasBaru: Kelas | null }[];
  lulus: { siswa: Siswa; kelasLama: Kelas | null }[];
}

export default function NaikKelas() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  
  const [tahunAjaranLama, setTahunAjaranLama] = useState<string>('');
  const [tahunAjaranBaru, setTahunAjaranBaru] = useState<string>('');
  
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [taRes, kelasRes, siswaRes] = await Promise.all([
        supabase.from('tahun_ajaran').select('*').order('nama_ta', { ascending: false }),
        supabase.from('kelas').select('*').order('tingkat').order('nama_kelas'),
        supabase.from('siswa').select('*'),
      ]);

      setTahunAjaranList(taRes.data || []);
      setKelasList(kelasRes.data || []);
      setSiswaList(siswaRes.data || []);

      // Set default TA lama to active one
      const activeTa = taRes.data?.find(ta => ta.is_active);
      if (activeTa) {
        setTahunAjaranLama(activeTa.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    if (!tahunAjaranLama || !tahunAjaranBaru) {
      toast({ title: 'Peringatan', description: 'Pilih tahun ajaran lama dan baru', variant: 'destructive' });
      return;
    }

    if (tahunAjaranLama === tahunAjaranBaru) {
      toast({ title: 'Peringatan', description: 'Tahun ajaran lama dan baru tidak boleh sama', variant: 'destructive' });
      return;
    }

    // Filter siswa from TA lama
    const siswaFromTaLama = siswaList.filter(s => s.ta_id === tahunAjaranLama);

    const naikKelas: PreviewData['naikKelas'] = [];
    const lulus: PreviewData['lulus'] = [];

    siswaFromTaLama.forEach(siswa => {
      const kelasLama = kelasList.find(k => k.id === siswa.kelas_id) || null;
      
      if (kelasLama && kelasLama.tingkat >= 9) {
        // Siswa kelas 9 = lulus
        lulus.push({ siswa, kelasLama });
      } else {
        // Find next tingkat kelas
        const nextTingkat = kelasLama ? kelasLama.tingkat + 1 : 7;
        const kelasBaru = kelasList.find(k => k.tingkat === nextTingkat) || null;
        naikKelas.push({ siswa, kelasLama, kelasBaru });
      }
    });

    setPreview({ naikKelas, lulus });
  };

  const executeNaikKelas = async () => {
    if (!preview) return;
    
    setProcessing(true);
    setConfirmOpen(false);

    try {
      // 1. Pindahkan siswa lulus ke alumni
      for (const item of preview.lulus) {
        await supabase.from('alumni').insert({
          nis: item.siswa.nis,
          nama: item.siswa.nama,
          alamat: item.siswa.alamat,
          wa_ortu: item.siswa.wa_ortu,
          kelas_terakhir: item.kelasLama?.nama_kelas || 'Tidak diketahui',
          tahun_lulus: tahunAjaranList.find(ta => ta.id === tahunAjaranLama)?.nama_ta || '',
          original_siswa_id: item.siswa.id,
          original_kelas_id: item.siswa.kelas_id,
          original_ta_id: item.siswa.ta_id,
        });

        // Hapus dari tabel siswa
        await supabase.from('siswa').delete().eq('id', item.siswa.id);
      }

      // 2. Update siswa yang naik kelas
      for (const item of preview.naikKelas) {
        await supabase.from('siswa').update({
          kelas_id: item.kelasBaru?.id || item.siswa.kelas_id,
          ta_id: tahunAjaranBaru,
        }).eq('id', item.siswa.id);
      }

      // 3. Set TA baru sebagai aktif
      await supabase.from('tahun_ajaran').update({ is_active: false }).neq('id', tahunAjaranBaru);
      await supabase.from('tahun_ajaran').update({ is_active: true }).eq('id', tahunAjaranBaru);

      setCompleted(true);
      toast({ 
        title: 'Berhasil!', 
        description: `${preview.naikKelas.length} siswa naik kelas, ${preview.lulus.length} siswa lulus ke alumni` 
      });

      // Refresh data
      fetchData();
      setPreview(null);

    } catch (error) {
      console.error('Error executing naik kelas:', error);
      toast({ title: 'Error', description: 'Gagal memproses naik kelas', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

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
        title="Naik Kelas" 
        description="Proses kenaikan kelas siswa ke tahun ajaran baru"
        icon={<ArrowUpCircle className="h-6 w-6" />}
      />

      {completed && (
        <Alert className="bg-success/10 border-success/30">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle>Proses Selesai!</AlertTitle>
          <AlertDescription>
            Kenaikan kelas telah berhasil diproses. Data siswa telah diperbarui.
          </AlertDescription>
        </Alert>
      )}

      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Tahun Ajaran</CardTitle>
          <CardDescription>
            Pilih tahun ajaran lama (asal) dan tahun ajaran baru (tujuan)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tahun Ajaran Lama (Asal)</Label>
              <Select value={tahunAjaranLama} onValueChange={setTahunAjaranLama}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih TA Lama" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranList.map(ta => (
                    <SelectItem key={ta.id} value={ta.id}>
                      {ta.nama_ta} {ta.is_active && '(Aktif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tahun Ajaran Baru (Tujuan)</Label>
              <Select value={tahunAjaranBaru} onValueChange={setTahunAjaranBaru}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih TA Baru" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranList.map(ta => (
                    <SelectItem key={ta.id} value={ta.id}>
                      {ta.nama_ta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generatePreview} disabled={!tahunAjaranLama || !tahunAjaranBaru}>
            Lihat Preview
          </Button>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {preview && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{preview.naikKelas.length}</p>
                    <p className="text-sm text-muted-foreground">Siswa Naik Kelas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{preview.lulus.length}</p>
                    <p className="text-sm text-muted-foreground">Siswa Lulus (Pindah ke Alumni)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detail Lists */}
          {preview.naikKelas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Siswa Naik Kelas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {preview.naikKelas.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium">{item.siswa.nama}</span>
                        <span className="text-muted-foreground ml-2">({item.siswa.nis})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.kelasLama?.nama_kelas || 'Belum ada kelas'}</Badge>
                        <span>→</span>
                        <Badge variant="default">{item.kelasBaru?.nama_kelas || 'Tidak ditemukan'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {preview.lulus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Siswa Lulus (Pindah ke Alumni)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {preview.lulus.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-success/10">
                      <div>
                        <span className="font-medium">{item.siswa.nama}</span>
                        <span className="text-muted-foreground ml-2">({item.siswa.nis})</span>
                      </div>
                      <Badge variant="outline" className="text-success border-success">
                        {item.kelasLama?.nama_kelas} → Alumni
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Perhatian!</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Proses ini <strong>tidak dapat dibatalkan</strong></li>
                <li>Siswa kelas 9 akan dipindahkan ke tabel Alumni</li>
                <li>Tunggakan siswa <strong>tidak akan dihapus</strong> dan tetap tercatat</li>
                <li>Tahun ajaran baru akan diaktifkan secara otomatis</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Button */}
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => setConfirmOpen(true)}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Proses Naik Kelas
              </>
            )}
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Naik Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memproses kenaikan kelas untuk:
              <ul className="list-disc list-inside mt-2">
                <li>{preview?.naikKelas.length || 0} siswa naik kelas</li>
                <li>{preview?.lulus.length || 0} siswa lulus (dipindah ke Alumni)</li>
              </ul>
              <br />
              <strong>Apakah Anda yakin ingin melanjutkan?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeNaikKelas}>
              Ya, Proses Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
