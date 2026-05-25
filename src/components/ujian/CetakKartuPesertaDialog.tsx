import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PrintPreviewToolbar, PrintPreviewFrame, type PrintOrientation } from '@/components/print/PrintPreviewToolbar';
import { useUjianRuang, useUjianPeserta, type UjianSesi } from '@/hooks/useUjianSesi';
import { JENIS_UJIAN_LABEL } from '@/lib/ujian-generator';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; sesi: UjianSesi; }

interface MadrasahData {
  nama_madrasah: string; nsm: string | null; npsn: string | null;
  alamat: string | null; kepala_madrasah: string | null;
}

export function CetakKartuPesertaDialog({ open, onOpenChange, sesi }: Props) {
  const [preview, setPreview] = useState(true);
  const [orientation] = useState<PrintOrientation>('portrait');
  const [filterRuang, setFilterRuang] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: ruang = [] } = useUjianRuang(sesi.id);
  const { data: peserta = [] } = useUjianPeserta(sesi.id);

  const { data: siswaList = [] } = useQuery({
    queryKey: ['siswa-ujian-kartu', sesi.id, peserta.length],
    queryFn: async () => {
      const ids = peserta.map((p) => p.siswa_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from('siswa')
        .select('id, nis, nisn, nama, tempat_lahir, tanggal_lahir, kelas:kelas_id(nama_kelas)')
        .in('id', ids);
      return data || [];
    },
    enabled: open,
  });

  const { data: madrasah } = useQuery({
    queryKey: ['madrasah-cetak'],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('*').maybeSingle();
      return data as MadrasahData | null;
    },
  });

  const { data: ta } = useQuery({
    queryKey: ['ta-ujian', sesi.ta_id],
    queryFn: async () => {
      if (!sesi.ta_id) return null;
      const { data } = await supabase.from('tahun_ajaran').select('nama_ta').eq('id', sesi.ta_id).maybeSingle();
      return data;
    },
    enabled: !!sesi.ta_id,
  });

  const filtered = useMemo(() => {
    const sMap = new Map(siswaList.map((s: any) => [s.id, s]));
    const rMap = new Map(ruang.map((r) => [r.id, r]));
    return peserta
      .filter((p) => filterRuang === 'all' || p.ruang_id === filterRuang)
      .filter((p) => selectedIds.size === 0 || selectedIds.has(p.siswa_id))
      .map((p) => ({ p, s: sMap.get(p.siswa_id), r: p.ruang_id ? rMap.get(p.ruang_id) : null }))
      .filter((x) => x.s)
      .sort((a, b) => a.p.nomor_peserta.localeCompare(b.p.nomor_peserta));
  }, [peserta, siswaList, ruang, filterRuang, selectedIds]);

  const toggleAll = () => {
    if (selectedIds.size > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(peserta.map((p) => p.siswa_id)));
  };

  const handlePrint = () => window.print();

  // Pasangkan tanggal
  const tanggalText = sesi.tanggal_mulai
    ? new Date(sesi.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        + (sesi.tanggal_selesai && sesi.tanggal_selesai !== sesi.tanggal_mulai
          ? ` s.d. ${new Date(sesi.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : '')
    : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cetak Kartu Peserta — {sesi.nama}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="no-print flex items-end gap-3 flex-wrap p-3 rounded-lg border bg-card">
            <div>
              <Label className="text-xs">Filter Ruang</Label>
              <select className="h-9 w-48 border rounded-md px-2 text-sm"
                value={filterRuang} onChange={(e) => setFilterRuang(e.target.value)}>
                <option value="all">Semua Ruang</option>
                {ruang.map((r) => <option key={r.id} value={r.id}>{r.nama_ruang}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Pilih Peserta ({selectedIds.size} terpilih)</Label>
              <button onClick={toggleAll} className="text-xs text-primary underline block">
                {selectedIds.size > 0 ? 'Kosongkan' : 'Pilih semua peserta'}
              </button>
            </div>
            <Badge variant="secondary">{filtered.length} kartu akan dicetak</Badge>
          </div>

          {/* Daftar siswa untuk dipilih */}
          <div className="no-print border rounded-md max-h-40 overflow-y-auto p-2 grid grid-cols-2 md:grid-cols-3 gap-1">
            {peserta.map((p) => {
              const s = siswaList.find((x: any) => x.id === p.siswa_id);
              if (!s) return null;
              return (
                <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={selectedIds.has(p.siswa_id)}
                    onCheckedChange={(c) => {
                      const next = new Set(selectedIds);
                      if (c) next.add(p.siswa_id); else next.delete(p.siswa_id);
                      setSelectedIds(next);
                    }} />
                  <span className="font-mono">{p.nomor_peserta}</span>
                  <span className="truncate">{(s as any).nama}</span>
                </label>
              );
            })}
          </div>

          <PrintPreviewToolbar
            preview={preview} onTogglePreview={setPreview}
            orientation={orientation} onOrientationChange={() => {}}
            onPrint={handlePrint} disabled={filtered.length === 0}
          />

          <PrintPreviewFrame preview={preview} orientation={orientation}>
            <div className="grid grid-cols-2 gap-3" style={{ fontSize: '10pt', color: '#000' }}>
              {filtered.map(({ p, s, r }, idx) => {
                const fotoUrl = (s as any).foto_path
                  ? supabase.storage.from('siswa-photos').getPublicUrl((s as any).foto_path).data.publicUrl
                  : null;
                return (
                  <div key={p.id} className="border-2 border-black p-2 avoid-break"
                    style={{ pageBreakInside: 'avoid', minHeight: '125mm', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-black pb-1 mb-2">
                      <img src="/logo-alwathoniyah.png" alt="" style={{ width: '12mm', height: '12mm', objectFit: 'contain' }} />
                      <div className="flex-1 text-center">
                        <p className="text-[8pt] font-semibold uppercase leading-tight">Kementerian Agama RI</p>
                        <p className="text-[10pt] font-bold uppercase leading-tight">{madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'}</p>
                        {madrasah?.nsm && <p className="text-[7pt] leading-tight">NSM: {madrasah.nsm}</p>}
                      </div>
                      <img src="/logo-kemenag.png" alt="" style={{ width: '12mm', height: '12mm', objectFit: 'contain' }} />
                    </div>

                    <div className="text-center mb-2">
                      <p className="font-bold text-[11pt] uppercase">Kartu Peserta {JENIS_UJIAN_LABEL[sesi.jenis]?.split(' ')[0] || 'Ujian'}</p>
                      <p className="text-[9pt]">{sesi.nama}</p>
                    </div>

                    <div className="flex gap-3 flex-1">
                      <div style={{ width: '28mm' }} className="flex flex-col items-center">
                        <div className="border border-black bg-muted flex items-center justify-center overflow-hidden"
                          style={{ width: '28mm', height: '36mm' }}>
                          {fotoUrl ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[8pt] text-muted-foreground text-center">Foto<br />3×4</span>}
                        </div>
                      </div>
                      <div className="flex-1 text-[9pt] space-y-1">
                        <div>
                          <p className="text-[7pt] uppercase text-muted-foreground">No. Peserta</p>
                          <p className="font-bold font-mono text-[14pt] leading-tight">{p.nomor_peserta}</p>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                          <span className="text-[7pt] uppercase">Nama</span>
                          <span className="font-semibold">: {(s as any).nama}</span>
                          <span className="text-[7pt] uppercase">NIS</span>
                          <span>: {(s as any).nis}</span>
                          <span className="text-[7pt] uppercase">Kelas</span>
                          <span>: {(s as any).kelas?.nama_kelas || '-'}</span>
                          <span className="text-[7pt] uppercase">Ruang</span>
                          <span className="font-semibold">: {r?.nama_ruang || '-'}</span>
                          <span className="text-[7pt] uppercase">No. Kursi</span>
                          <span className="font-semibold">: {p.nomor_kursi || '-'}</span>
                          <span className="text-[7pt] uppercase">Tanggal</span>
                          <span className="text-[8pt]">: {tanggalText}</span>
                        </div>
                      </div>
                    </div>

                    {/* TTD */}
                    <div className="grid grid-cols-2 mt-auto pt-2 text-[8pt]">
                      <div className="text-center">
                        <p>Peserta,</p>
                        <div style={{ height: '12mm' }} />
                        <p className="border-t border-black pt-0.5">{(s as any).nama}</p>
                      </div>
                      <div className="text-center">
                        <p>Kepala Madrasah,</p>
                        <div style={{ height: '12mm' }} />
                        <p className="border-t border-black pt-0.5 font-semibold">
                          {madrasah?.kepala_madrasah || '...........................'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center text-sm text-muted-foreground py-12">
                  Tidak ada peserta untuk dicetak.
                </div>
              )}
            </div>
          </PrintPreviewFrame>
        </div>
      </DialogContent>
    </Dialog>
  );
}
