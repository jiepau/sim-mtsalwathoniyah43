import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader as Loader2, Users, RefreshCw, UserPlus, MessageSquare } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendaftarIds: string[];
}

type DistribusiMode = 'single' | 'auto';

export function PPDBKonversiDialog({ open, onOpenChange, pendaftarIds }: Props) {
  const qc = useQueryClient();
  const [distribusiMode, setDistribusiMode] = useState<DistribusiMode>('auto');
  const [kelasId, setKelasId] = useState('');
  const [taId, setTaId] = useState('');
  const [generateAkun, setGenerateAkun] = useState(true);
  const [kirimNotif, setKirimNotif] = useState(false);

  const { data: kelasList } = useQuery({
    queryKey: ['kelas-all'],
    queryFn: async () => {
      const { data } = await supabase.from('kelas').select('*').order('tingkat').order('nama_kelas');
      return data ?? [];
    },
    enabled: open,
  });

  const { data: taList } = useQuery({
    queryKey: ['ta-all'],
    queryFn: async () => {
      const { data } = await supabase.from('tahun_ajaran').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: open,
  });

  const { data: settings } = useQuery({
    queryKey: ['ppdb-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('ppdb_settings').select('*').limit(1).maybeSingle();
      return data;
    },
    enabled: open,
  });

  // Filter kelas 7 untuk auto-distribusi
  const kelas7List = kelasList?.filter(k => k.tingkat === 7) ?? [];
  const selectedTa = taList?.find(t => t.id === taId);

  // Preview distribusi
  const previewDistribusi = () => {
    if (distribusiMode === 'single' || kelas7List.length === 0) return null;
    const perKelas = Math.ceil(pendaftarIds.length / kelas7List.length);
    return kelas7List.map((k, i) => ({
      nama: k.nama_kelas,
      jumlah: Math.min(perKelas, pendaftarIds.length - i * perKelas),
    })).filter(d => d.jumlah > 0);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      // Fetch pendaftar data
      const { data: pendaftarList, error: fetchErr } = await supabase
        .from('ppdb_pendaftar')
        .select('*')
        .in('id', pendaftarIds);
      if (fetchErr) throw fetchErr;
      if (!pendaftarList?.length) throw new Error('Tidak ada data pendaftar');

      // Get kelas tujuan berdasarkan mode
      let kelasTargets: string[] = [];
      if (distribusiMode === 'single') {
        kelasTargets = [kelasId];
      } else {
        // Auto-distribusi ke kelas 7
        kelasTargets = kelas7List.map(k => k.id);
      }

      if (kelasTargets.length === 0) throw new Error('Pilih kelas terlebih dahulu');

      // Distribusi pendaftar ke kelas
      let kelasIndex = 0;
      let siswaPerKelas = Math.ceil(pendaftarList.length / kelasTargets.length);

      const results: { siswaId?: string; nama: string; nis: string; email?: string; password?: string }[] = [];

      for (let i = 0; i < pendaftarList.length; i++) {
        const p = pendaftarList[i];
        const currentKelasIndex = Math.floor(i / siswaPerKelas);
        const targetKelasId = kelasTargets[Math.min(currentKelasIndex, kelasTargets.length - 1)];

        // Generate NIS from nomor_pendaftaran
        const nis = p.nomor_pendaftaran.replace(/[^0-9]/g, '').slice(-6) || `${Date.now()}-${i}`;

        const { data: siswa, error: insertErr } = await supabase
          .from('siswa')
          .insert({
            nis,
            nama: p.nama,
            nisn: p.nisn,
            tempat_lahir: p.tempat_lahir,
            tanggal_lahir: p.tanggal_lahir,
            jenis_kelamin: p.jenis_kelamin,
            alamat: p.alamat,
            nama_ayah_kandung: p.nama_ayah,
            nama_ibu_kandung: p.nama_ibu,
            wa_ortu: p.wa_ortu,
            kelas_id: targetKelasId,
            ta_id: taId,
            status: 'aktif',
          })
          .select('id')
          .single();
        if (insertErr) throw insertErr;

        // Insert siswa_riwayat
        await supabase.from('siswa_riwayat').insert({
          siswa_id: siswa.id,
          kelas_id: targetKelasId,
          ta_id: taId,
          status: 'aktif',
        });

        // Update pendaftar status
        await supabase
          .from('ppdb_pendaftar')
          .update({ status: 'diterima', catatan: `Dikonversi ke siswa (${siswa.id})` })
          .eq('id', p.id);

        results.push({ siswaId: siswa.id, nama: p.nama, nis });
      }

      // Generate akun siswa jika dipilih
      if (generateAkun) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (token) {
          const response = await fetch(
            `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/generate-student-accounts`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            console.error('Failed to generate accounts');
          }
        }
      }

      // Kirim notifikasi WA jika dipilih
      if (kirimNotif) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (token) {
          const siswaIds = results.map(r => r.siswaId).filter(Boolean);
          const response = await fetch(
            `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/notify-spmb-diterima`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ siswa_ids: siswaIds }),
            }
          );

          if (response.ok) {
            const notifyResult = await response.json();
            toast.success(`Notifikasi WA terkirim ke ${notifyResult.sent} orang tua`);
          }
        }
      }

      return results;
    },
    onSuccess: (results) => {
      toast.success(`${pendaftarIds.length} pendaftar berhasil dikonversi ke siswa`);
      if (generateAkun) {
        toast.info('Akun siswa sedang digenerate...');
      }
      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
      qc.invalidateQueries({ queryKey: ['siswa'] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Gagal konversi: ' + err.message),
  });

  const isValid = taId && (distribusiMode === 'auto' ? kelas7List.length > 0 : kelasId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Konversi Pendaftar ke Siswa
          </DialogTitle>
          <DialogDescription>
            {pendaftarIds.length} pendaftar diterima akan menjadi siswa aktif.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tahun Ajaran */}
          <div>
            <Label className="text-sm font-medium">Tahun Ajaran</Label>
            <Select value={taId} onValueChange={setTaId}>
              <SelectTrigger><SelectValue placeholder="Pilih Tahun Ajaran" /></SelectTrigger>
              <SelectContent>
                {taList?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama_ta} {t.semester} {t.is_active ? '(aktif)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode Distribusi */}
          <div>
            <Label className="text-sm font-medium">Distribusi ke Kelas</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                type="button"
                variant={distribusiMode === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDistribusiMode('auto')}
                className="justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto Spread
              </Button>
              <Button
                type="button"
                variant={distribusiMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDistribusiMode('single')}
                className="justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Satu Kelas
              </Button>
            </div>

            {distribusiMode === 'auto' && kelas7List.length > 0 && (
              <Card className="mt-2 bg-muted/50">
                <CardContent className="p-3 text-xs">
                  <p className="font-medium mb-1">Distribusi otomatis ke {kelas7List.length} kelas 7:</p>
                  <div className="flex flex-wrap gap-1">
                    {previewDistribusi()?.map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {d.nama}: {d.jumlah}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {distribusiMode === 'auto' && kelas7List.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Belum ada kelas 7. Buat kelas 7 terlebih dahulu di menu Kelas.
              </p>
            )}

            {distribusiMode === 'single' && (
              <div className="mt-2">
                <Select value={kelasId} onValueChange={setKelasId}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas tujuan" /></SelectTrigger>
                  <SelectContent>
                    {kelasList?.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama_kelas} (Kelas {k.tingkat})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Opsi Tambahan */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Checkbox
                id="generate-akun"
                checked={generateAkun}
                onCheckedChange={(v) => setGenerateAkun(!!v)}
              />
              <Label htmlFor="generate-akun" className="text-sm cursor-pointer">
                Generate akun siswa massal ({pendaftarIds.length} akun)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Format: [NIS]@siswa.mts / Siswa[NIS]
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                id="kirim-notif"
                checked={kirimNotif}
                onCheckedChange={(v) => setKirimNotif(!!v)}
              />
              <Label htmlFor="kirim-notif" className="text-sm cursor-pointer flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Kirim notifikasi WA ke orang tua
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Konversi {pendaftarIds.length} Pendaftar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
