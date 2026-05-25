import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wand2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUjianRuang, useUjianPeserta, type UjianSesi } from '@/hooks/useUjianSesi';
import { generatePesertaDistribusi } from '@/lib/ujian-generator';

interface Props { sesi: UjianSesi; }

export function PesertaTab({ sesi }: Props) {
  const qc = useQueryClient();
  const { data: ruang = [] } = useUjianRuang(sesi.id);
  const { data: peserta = [] } = useUjianPeserta(sesi.id);
  const [busy, setBusy] = useState(false);

  const { data: siswaList = [] } = useQuery({
    queryKey: ['siswa-kelas', sesi.kelas_ids],
    queryFn: async () => {
      if (sesi.kelas_ids.length === 0) return [];
      const { data } = await supabase.from('siswa')
        .select('id, nis, nama, kelas_id, kelas:kelas_id(nama_kelas, tingkat)')
        .in('kelas_id', sesi.kelas_ids)
        .order('nama');
      return data || [];
    },
  });

  const ruangMap = useMemo(() => new Map(ruang.map((r) => [r.id, r])), [ruang]);
  const pesertaMap = useMemo(() => new Map(peserta.map((p) => [p.siswa_id, p])), [peserta]);

  const handleGenerate = async () => {
    if (siswaList.length === 0) { toast.error('Tidak ada siswa di kelas terpilih'); return; }
    if (ruang.length === 0) { toast.error('Belum ada ruang. Buat ruang dulu.'); return; }
    setBusy(true);

    const sInput = siswaList.map((s: any) => ({
      id: s.id, nama: s.nama, kelas_id: s.kelas_id,
      tingkat: s.kelas?.tingkat ?? 99,
    }));
    const rInput = ruang.map((r) => ({ id: r.id, kapasitas: r.kapasitas, urutan: r.urutan }));
    const existing = peserta.map((p) => ({
      siswa_id: p.siswa_id, nomor_peserta: p.nomor_peserta,
      ruang_id: p.ruang_id, nomor_kursi: p.nomor_kursi,
      is_manual_override: p.is_manual_override,
    }));

    const prefix = sesi.nomor_peserta_prefix || 'UJ';
    const out = generatePesertaDistribusi(sInput, rInput, prefix, existing);

    // Hapus peserta lama yang tidak override
    const overrideIds = new Set(peserta.filter((p) => p.is_manual_override).map((p) => p.siswa_id));
    await supabase.from('ujian_peserta').delete().eq('sesi_id', sesi.id)
      .not('siswa_id', 'in', `(${[...overrideIds].map((id) => `"${id}"`).join(',') || '""'})`);

    // Upsert hasil
    const rows = out.filter((o) => !overrideIds.has(o.siswa_id)).map((o) => ({
      sesi_id: sesi.id,
      siswa_id: o.siswa_id,
      kelas_asal_id: o.kelas_asal_id,
      nomor_peserta: o.nomor_peserta,
      ruang_id: o.ruang_id,
      nomor_kursi: o.nomor_kursi,
      is_manual_override: false,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from('ujian_peserta').insert(rows);
      if (error) { setBusy(false); toast.error(error.message); return; }
    }
    setBusy(false);
    toast.success(`${rows.length} peserta digenerate ulang`);
    qc.invalidateQueries({ queryKey: ['ujian-peserta', sesi.id] });
  };

  const updatePeserta = async (siswaId: string, patch: any) => {
    const existing = pesertaMap.get(siswaId);
    if (!existing) { toast.error('Peserta belum di-generate'); return; }
    const { error } = await supabase.from('ujian_peserta').update({
      ...patch, is_manual_override: true,
    }).eq('id', existing.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ['ujian-peserta', sesi.id] });
  };

  // Cek kapasitas per ruang
  const ruangCounts = useMemo(() => {
    const m = new Map<string, number>();
    peserta.forEach((p) => { if (p.ruang_id) m.set(p.ruang_id, (m.get(p.ruang_id) || 0) + 1); });
    return m;
  }, [peserta]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground">
          <Badge variant="secondary">{siswaList.length} siswa</Badge>
          <span className="mx-2">•</span>
          <Badge variant="secondary">{peserta.length} sudah ditempatkan</Badge>
          <span className="mx-2">•</span>
          <Badge variant="secondary">{ruang.length} ruang</Badge>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={busy}>
          {peserta.length === 0 ? <Wand2 className="h-4 w-4 mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          {peserta.length === 0 ? 'Distribusi Otomatis' : 'Regenerate (Pertahankan Manual)'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 flex gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Edit Ruang/Kursi manual akan menandai peserta sebagai <b>override</b> — tidak ditimpa saat regenerate.</span>
      </div>

      <div className="border rounded-lg max-h-[60vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-32">No. Peserta</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="w-28">NIS</TableHead>
              <TableHead className="w-28">Kelas Asal</TableHead>
              <TableHead className="w-44">Ruang</TableHead>
              <TableHead className="w-20">Kursi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {siswaList.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                Belum ada siswa di kelas terpilih.
              </TableCell></TableRow>
            ) : siswaList.map((s: any, i: number) => {
              const p = pesertaMap.get(s.id);
              const r = p?.ruang_id ? ruangMap.get(p.ruang_id) : null;
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-xs">{i + 1}</TableCell>
                  <TableCell>
                    {p ? (
                      <span className="font-mono font-semibold text-primary">
                        {p.nomor_peserta}
                        {p.is_manual_override && <Badge variant="outline" className="ml-1 text-[9px]">manual</Badge>}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{s.nama}</TableCell>
                  <TableCell className="text-xs font-mono">{s.nis}</TableCell>
                  <TableCell className="text-xs">{s.kelas?.nama_kelas || '-'}</TableCell>
                  <TableCell>
                    <Select value={p?.ruang_id || 'none'}
                      onValueChange={(v) => updatePeserta(s.id, { ruang_id: v === 'none' ? null : v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Belum —</SelectItem>
                        {ruang.map((rr) => {
                          const cnt = ruangCounts.get(rr.id) || 0;
                          return (
                            <SelectItem key={rr.id} value={rr.id}>
                              {rr.nama_ruang} ({cnt}/{rr.kapasitas})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={p?.nomor_kursi || ''} className="h-8 w-16"
                      max={r?.kapasitas} min={1}
                      onChange={(e) => updatePeserta(s.id, { nomor_kursi: Number(e.target.value) || null })} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
