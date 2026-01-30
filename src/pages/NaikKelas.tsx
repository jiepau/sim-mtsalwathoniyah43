import { useState, useEffect } from 'react';
import { ArrowUpCircle, Users, GraduationCap, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

interface SiswaWithAssignment extends Siswa {
  kelasLama: Kelas | null;
  kelasBaru: Kelas | null;
  isLulus: boolean;
  selected: boolean;
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
  
  const [siswaAssignments, setSiswaAssignments] = useState<SiswaWithAssignment[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Bulk assignment
  const [bulkTargetKelas, setBulkTargetKelas] = useState<string>('');

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

    const siswaFromTaLama = siswaList.filter(s => s.ta_id === tahunAjaranLama);

    const assignments: SiswaWithAssignment[] = siswaFromTaLama.map(siswa => {
      const kelasLama = kelasList.find(k => k.id === siswa.kelas_id) || null;
      const isLulus = kelasLama ? kelasLama.tingkat >= 9 : false;
      
      // Default: suggest next tingkat kelas (first one found)
      let kelasBaru: Kelas | null = null;
      if (!isLulus && kelasLama) {
        const nextTingkat = kelasLama.tingkat + 1;
        kelasBaru = kelasList.find(k => k.tingkat === nextTingkat) || null;
      }

      return {
        ...siswa,
        kelasLama,
        kelasBaru,
        isLulus,
        selected: false,
      };
    });

    setSiswaAssignments(assignments);
    setCompleted(false);
  };

  const toggleSelectSiswa = (siswaId: string) => {
    setSiswaAssignments(prev => prev.map(s => 
      s.id === siswaId ? { ...s, selected: !s.selected } : s
    ));
  };

  const toggleSelectAll = (isLulus: boolean) => {
    const allSelected = siswaAssignments
      .filter(s => s.isLulus === isLulus)
      .every(s => s.selected);

    setSiswaAssignments(prev => prev.map(s => 
      s.isLulus === isLulus ? { ...s, selected: !allSelected } : s
    ));
  };

  const updateSiswaKelas = (siswaId: string, kelasBaruId: string) => {
    const kelasBaru = kelasList.find(k => k.id === kelasBaruId) || null;
    setSiswaAssignments(prev => prev.map(s => 
      s.id === siswaId ? { ...s, kelasBaru } : s
    ));
  };

  const applyBulkAssignment = () => {
    if (!bulkTargetKelas) {
      toast({ title: 'Peringatan', description: 'Pilih kelas tujuan terlebih dahulu', variant: 'destructive' });
      return;
    }

    const kelasBaru = kelasList.find(k => k.id === bulkTargetKelas) || null;
    const selectedCount = siswaAssignments.filter(s => s.selected && !s.isLulus).length;

    if (selectedCount === 0) {
      toast({ title: 'Peringatan', description: 'Pilih siswa yang akan dipindahkan', variant: 'destructive' });
      return;
    }

    setSiswaAssignments(prev => prev.map(s => 
      s.selected && !s.isLulus ? { ...s, kelasBaru, selected: false } : s
    ));

    setBulkTargetKelas('');
    toast({ 
      title: 'Berhasil', 
      description: `${selectedCount} siswa dipindahkan ke ${kelasBaru?.nama_kelas}` 
    });
  };

  const getAvailableKelasForTingkat = (currentTingkat: number) => {
    const nextTingkat = currentTingkat + 1;
    return kelasList.filter(k => k.tingkat === nextTingkat);
  };

  const executeNaikKelas = async () => {
    setProcessing(true);
    setConfirmOpen(false);

    try {
      const lulusSiswa = siswaAssignments.filter(s => s.isLulus);
      const naikKelasSiswa = siswaAssignments.filter(s => !s.isLulus);

      // 1. Pindahkan siswa lulus ke alumni
      for (const item of lulusSiswa) {
        await supabase.from('alumni').insert({
          nis: item.nis,
          nama: item.nama,
          alamat: item.alamat,
          wa_ortu: item.wa_ortu,
          kelas_terakhir: item.kelasLama?.nama_kelas || 'Tidak diketahui',
          tahun_lulus: tahunAjaranList.find(ta => ta.id === tahunAjaranLama)?.nama_ta || '',
          original_siswa_id: item.id,
          original_kelas_id: item.kelas_id,
          original_ta_id: item.ta_id,
        });

        await supabase.from('siswa').delete().eq('id', item.id);
      }

      // 2. Update siswa yang naik kelas
      for (const item of naikKelasSiswa) {
        await supabase.from('siswa').update({
          kelas_id: item.kelasBaru?.id || item.kelas_id,
          ta_id: tahunAjaranBaru,
        }).eq('id', item.id);
      }

      // 3. Set TA baru sebagai aktif
      await supabase.from('tahun_ajaran').update({ is_active: false }).neq('id', tahunAjaranBaru);
      await supabase.from('tahun_ajaran').update({ is_active: true }).eq('id', tahunAjaranBaru);

      setCompleted(true);
      toast({ 
        title: 'Berhasil!', 
        description: `${naikKelasSiswa.length} siswa naik kelas, ${lulusSiswa.length} siswa lulus ke alumni` 
      });

      fetchData();
      setSiswaAssignments([]);

    } catch (error) {
      console.error('Error executing naik kelas:', error);
      toast({ title: 'Error', description: 'Gagal memproses naik kelas', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const naikKelasSiswa = siswaAssignments.filter(s => !s.isLulus);
  const lulusSiswa = siswaAssignments.filter(s => s.isLulus);
  const selectedNaikKelasCount = naikKelasSiswa.filter(s => s.selected).length;

  // Group siswa by kelas lama
  const siswaByKelasLama = naikKelasSiswa.reduce((acc, siswa) => {
    const kelasName = siswa.kelasLama?.nama_kelas || 'Tanpa Kelas';
    if (!acc[kelasName]) {
      acc[kelasName] = [];
    }
    acc[kelasName].push(siswa);
    return acc;
  }, {} as Record<string, SiswaWithAssignment[]>);

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
              <Label>Tahun Ajaran Lama (Asal) <span className="text-destructive">*</span></Label>
              <Select value={tahunAjaranLama} onValueChange={setTahunAjaranLama}>
                <SelectTrigger className={!tahunAjaranLama ? 'border-destructive/50' : 'border-success/50'}>
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
              <Label>Tahun Ajaran Baru (Tujuan) <span className="text-destructive">*</span></Label>
              <Select value={tahunAjaranBaru} onValueChange={setTahunAjaranBaru}>
                <SelectTrigger className={!tahunAjaranBaru ? 'border-destructive/50' : 'border-success/50'}>
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

          <div className="flex items-center gap-3">
            <Button onClick={generatePreview} disabled={!tahunAjaranLama || !tahunAjaranBaru}>
              Lihat Daftar Siswa
            </Button>
            {(!tahunAjaranLama || !tahunAjaranBaru) && (
              <p className="text-sm text-muted-foreground">
                * Pilih kedua tahun ajaran terlebih dahulu
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview & Assignment */}
      {siswaAssignments.length > 0 && (
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
                    <p className="text-2xl font-bold">{naikKelasSiswa.length}</p>
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
                    <p className="text-2xl font-bold">{lulusSiswa.length}</p>
                    <p className="text-sm text-muted-foreground">Siswa Lulus (Pindah ke Alumni)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Assignment Tool */}
          {naikKelasSiswa.length > 0 && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Pindahkan Siswa Terpilih ({selectedNaikKelasCount} dipilih)
                </CardTitle>
                <CardDescription>
                  Centang siswa, lalu pilih kelas tujuan dan klik "Pindahkan"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs">Kelas Tujuan</Label>
                    <Select value={bulkTargetKelas} onValueChange={setBulkTargetKelas}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasList.filter(k => k.tingkat >= 8).map(kelas => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.nama_kelas} (Tingkat {kelas.tingkat})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={applyBulkAssignment} 
                    disabled={selectedNaikKelasCount === 0 || !bulkTargetKelas}
                  >
                    Pindahkan {selectedNaikKelasCount} Siswa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Siswa Naik Kelas - Grouped by Kelas */}
          {Object.entries(siswaByKelasLama).map(([kelasName, siswas]) => {
            const allSelected = siswas.every(s => s.selected);
            const currentTingkat = siswas[0]?.kelasLama?.tingkat || 7;
            const availableKelas = getAvailableKelasForTingkat(currentTingkat);

            return (
              <Card key={kelasName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {kelasName} ({siswas.length} siswa)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={allSelected}
                        onCheckedChange={() => {
                          setSiswaAssignments(prev => prev.map(s => 
                            siswas.some(ss => ss.id === s.id) 
                              ? { ...s, selected: !allSelected } 
                              : s
                          ));
                        }}
                      />
                      <span className="text-sm text-muted-foreground">Pilih Semua</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {siswas.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-2 rounded ${item.selected ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={item.selected}
                            onCheckedChange={() => toggleSelectSiswa(item.id)}
                          />
                          <div>
                            <span className="font-medium">{item.nama}</span>
                            <span className="text-muted-foreground ml-2 text-sm">({item.nis})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{kelasName}</Badge>
                          <span>→</span>
                          <Select 
                            value={item.kelasBaru?.id || ''} 
                            onValueChange={(val) => updateSiswaKelas(item.id, val)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Pilih kelas" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableKelas.map(k => (
                                <SelectItem key={k.id} value={k.id}>
                                  {k.nama_kelas}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Siswa Lulus */}
          {lulusSiswa.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Siswa Lulus (Pindah ke Alumni)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {lulusSiswa.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded bg-success/10">
                      <div>
                        <span className="font-medium">{item.nama}</span>
                        <span className="text-muted-foreground ml-2">({item.nis})</span>
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
            disabled={processing || naikKelasSiswa.some(s => !s.kelasBaru)}
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
          
          {naikKelasSiswa.some(s => !s.kelasBaru) && (
            <p className="text-sm text-destructive text-center">
              Semua siswa harus memiliki kelas tujuan sebelum diproses
            </p>
          )}
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
                <li>{naikKelasSiswa.length} siswa naik kelas</li>
                <li>{lulusSiswa.length} siswa lulus (dipindah ke Alumni)</li>
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
