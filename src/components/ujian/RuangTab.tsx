import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUjianRuang, type UjianSesi } from '@/hooks/useUjianSesi';

interface Props { sesi: UjianSesi; }

export function RuangTab({ sesi }: Props) {
  const qc = useQueryClient();
  const { data: ruang = [] } = useUjianRuang(sesi.id);
  const [busy, setBusy] = useState(false);

  const addRuang = async () => {
    const nextUrutan = (ruang[ruang.length - 1]?.urutan ?? 0) + 1;
    const { error } = await supabase.from('ujian_ruang').insert({
      sesi_id: sesi.id,
      nama_ruang: `R-${String(nextUrutan).padStart(2, '0')}`,
      kapasitas: 32, baris: 4, kolom: 8, urutan: nextUrutan,
    });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ['ujian-ruang', sesi.id] });
  };

  const updateRuang = async (id: string, patch: any) => {
    const { error } = await supabase.from('ujian_ruang').update(patch).eq('id', id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ['ujian-ruang', sesi.id] });
  };

  const deleteRuang = async (id: string) => {
    if (!confirm('Hapus ruang ini? Penempatan peserta di ruang ini akan dikosongkan.')) return;
    const { error } = await supabase.from('ujian_ruang').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ['ujian-ruang', sesi.id] });
      qc.invalidateQueries({ queryKey: ['ujian-peserta', sesi.id] });
    }
  };

  const autoBuatDariKelas = async () => {
    if (sesi.kelas_ids.length === 0) { toast.error('Sesi belum punya kelas peserta'); return; }
    setBusy(true);
    const { data: kls } = await supabase.from('kelas')
      .select('id, nama_kelas, tingkat').in('id', sesi.kelas_ids).order('tingkat').order('nama_kelas');

    // Hitung jumlah siswa per kelas untuk kapasitas
    const { data: countData } = await supabase.from('siswa')
      .select('kelas_id').in('kelas_id', sesi.kelas_ids);
    const counts = new Map<string, number>();
    (countData || []).forEach((s: any) => counts.set(s.kelas_id, (counts.get(s.kelas_id) || 0) + 1));

    const rows = (kls || []).map((k: any, i: number) => {
      const jml = counts.get(k.id) || 32;
      const kapasitas = Math.max(jml, 20);
      // hitung baris × kolom default
      const kolom = 8;
      const baris = Math.max(4, Math.ceil(kapasitas / kolom));
      return {
        sesi_id: sesi.id,
        nama_ruang: `Ruang ${k.nama_kelas}`,
        lokasi: null,
        kapasitas,
        baris, kolom,
        urutan: i + 1,
      };
    });
    if (rows.length === 0) { setBusy(false); return; }
    // hapus ruang lama
    await supabase.from('ujian_ruang').delete().eq('sesi_id', sesi.id);
    const { error } = await supabase.from('ujian_ruang').insert(rows);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`${rows.length} ruang dibuat`);
      qc.invalidateQueries({ queryKey: ['ujian-ruang', sesi.id] });
      qc.invalidateQueries({ queryKey: ['ujian-peserta', sesi.id] });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={addRuang}><Plus className="h-4 w-4 mr-1" />Tambah Ruang</Button>
        <Button size="sm" variant="outline" onClick={autoBuatDariKelas} disabled={busy}>
          <Wand2 className="h-4 w-4 mr-1" />Auto-buat dari Kelas
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Urut</TableHead>
            <TableHead>Nama Ruang</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead className="w-24">Kapasitas</TableHead>
            <TableHead className="w-20">Baris</TableHead>
            <TableHead className="w-20">Kolom</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ruang.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
              Belum ada ruang. Klik "Auto-buat dari Kelas" untuk membuat otomatis.
            </TableCell></TableRow>
          ) : ruang.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Input type="number" value={r.urutan} className="h-8 w-14"
                  onChange={(e) => updateRuang(r.id, { urutan: Number(e.target.value) })} />
              </TableCell>
              <TableCell>
                <Input value={r.nama_ruang} className="h-8"
                  onChange={(e) => updateRuang(r.id, { nama_ruang: e.target.value })} />
              </TableCell>
              <TableCell>
                <Input value={r.lokasi || ''} placeholder="(opsional)" className="h-8"
                  onChange={(e) => updateRuang(r.id, { lokasi: e.target.value || null })} />
              </TableCell>
              <TableCell>
                <Input type="number" value={r.kapasitas} className="h-8 w-20"
                  onChange={(e) => updateRuang(r.id, { kapasitas: Number(e.target.value) })} />
              </TableCell>
              <TableCell>
                <Input type="number" value={r.baris} className="h-8 w-16"
                  onChange={(e) => updateRuang(r.id, { baris: Number(e.target.value) })} />
              </TableCell>
              <TableCell>
                <Input type="number" value={r.kolom} className="h-8 w-16"
                  onChange={(e) => updateRuang(r.id, { kolom: Number(e.target.value) })} />
              </TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => deleteRuang(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
