import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendaftarIds: string[];
}

export function PPDBKonversiDialog({ open, onOpenChange, pendaftarIds }: Props) {
  const qc = useQueryClient();
  const [kelasId, setKelasId] = useState('');
  const [taId, setTaId] = useState('');

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

  const mutation = useMutation({
    mutationFn: async () => {
      // Fetch pendaftar data
      const { data: pendaftarList, error: fetchErr } = await supabase
        .from('ppdb_pendaftar')
        .select('*')
        .in('id', pendaftarIds);
      if (fetchErr) throw fetchErr;
      if (!pendaftarList?.length) throw new Error('Tidak ada data pendaftar');

      // Insert each as siswa
      for (const p of pendaftarList) {
        // Generate NIS from nomor_pendaftaran
        const nis = p.nomor_pendaftaran.replace(/[^0-9]/g, '');

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
            kelas_id: kelasId,
            ta_id: taId,
            status: 'aktif',
          })
          .select('id')
          .single();
        if (insertErr) throw insertErr;

        // Insert siswa_riwayat
        await supabase.from('siswa_riwayat').insert({
          siswa_id: siswa.id,
          kelas_id: kelasId,
          ta_id: taId,
          status: 'aktif',
        });

        // Update pendaftar status
        await supabase
          .from('ppdb_pendaftar')
          .update({ status: 'diterima', catatan: `Dikonversi ke siswa (${siswa.id})` })
          .eq('id', p.id);
      }
    },
    onSuccess: () => {
      toast.success(`${pendaftarIds.length} pendaftar berhasil dikonversi ke siswa`);
      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Gagal konversi: ' + err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konversi Pendaftar ke Siswa</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {pendaftarIds.length} pendaftar akan dikonversi menjadi siswa aktif.
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Kelas Tujuan</Label>
            <Select value={kelasId} onValueChange={setKelasId}>
              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                {kelasList?.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Tahun Ajaran</Label>
            <Select value={taId} onValueChange={setTaId}>
              <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
              <SelectContent>
                {taList?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama_ta} - {t.semester} {t.is_active ? '(aktif)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!kelasId || !taId || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Konversi {pendaftarIds.length} Pendaftar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
