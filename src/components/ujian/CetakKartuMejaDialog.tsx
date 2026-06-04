import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PrintPreviewToolbar, PrintPreviewFrame, type PrintOrientation } from '@/components/print/PrintPreviewToolbar';
import { useUjianRuang, useUjianPeserta, type UjianSesi } from '@/hooks/useUjianSesi';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; sesi: UjianSesi; }

export function CetakKartuMejaDialog({ open, onOpenChange, sesi }: Props) {
  const [preview, setPreview] = useState(true);
  const [orientation] = useState<PrintOrientation>('portrait');
  const [filterRuang, setFilterRuang] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cardW, setCardW] = useState<number>(() => Number(localStorage.getItem('ujian.kartuMeja.w')) || 95);
  const [cardH, setCardH] = useState<number>(() => Number(localStorage.getItem('ujian.kartuMeja.h')) || 65);
  const [padding, setPadding] = useState<number>(() => Number(localStorage.getItem('ujian.kartuMeja.pad')) || 4);
  const [gap, setGap] = useState<number>(() => Number(localStorage.getItem('ujian.kartuMeja.gap')) || 5);
  const updateNum = (key: string, setter: (n: number) => void, min: number, max: number) => (v: string) => {
    const n = Math.max(min, Math.min(max, Number(v) || min));
    setter(n);
    localStorage.setItem(`ujian.kartuMeja.${key}`, String(n));
  };

  const { data: ruang = [] } = useUjianRuang(sesi.id);
  const { data: peserta = [] } = useUjianPeserta(sesi.id);

  const { data: siswaList = [] } = useQuery({
    queryKey: ['siswa-ujian-kartu-meja', sesi.id, peserta.length],
    queryFn: async () => {
      const ids = peserta.map((p) => p.siswa_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from('siswa')
        .select('id, nis, nisn, nama, kelas:kelas_id(nama_kelas)')
        .in('id', ids);
      return data || [];
    },
    enabled: open,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cetak Kartu Meja — {sesi.nama}</DialogTitle>
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
            <Badge variant="secondary">{filtered.length} kartu meja</Badge>
          </div>

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

          <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-lg border bg-card">
            <div>
              <Label className="text-xs">Lebar (mm)</Label>
              <input type="number" min={30} max={210} value={cardW}
                onChange={(e) => updateNum('w', setCardW, 30, 210)(e.target.value)}
                className="h-9 w-full border rounded-md px-2 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Tinggi (mm)</Label>
              <input type="number" min={20} max={297} value={cardH}
                onChange={(e) => updateNum('h', setCardH, 20, 297)(e.target.value)}
                className="h-9 w-full border rounded-md px-2 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Padding (mm)</Label>
              <input type="number" min={0} max={50} value={padding}
                onChange={(e) => updateNum('pad', setPadding, 0, 50)(e.target.value)}
                className="h-9 w-full border rounded-md px-2 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Jarak antar kartu (mm)</Label>
              <input type="number" min={0} max={50} value={gap}
                onChange={(e) => updateNum('gap', setGap, 0, 50)(e.target.value)}
                className="h-9 w-full border rounded-md px-2 text-sm" />
            </div>
          </div>

          <p className="no-print text-xs text-muted-foreground">
            Ukuran kartu {cardW}mm × {cardH}mm. Sesuaikan agar pas dengan printer/kertas Anda. Lipat di garis tengah agar berdiri seperti tenda meja.
          </p>

          <PrintPreviewToolbar
            preview={preview} onTogglePreview={setPreview}
            orientation={orientation} onOrientationChange={() => {}}
            onPrint={handlePrint} disabled={filtered.length === 0}
          />

          <PrintPreviewFrame preview={preview} orientation={orientation}>
            {(() => {
              // Scale font sizes proportional to card height (baseline: 65mm)
              const scale = cardH / 65;
              const fsLabel = Math.max(5, 8 * scale);
              const fsRuang = Math.max(8, 14 * scale);
              const fsNomor = Math.max(12, 26 * scale);
              const fsNama = Math.max(8, 14 * scale);
              const fsKelas = Math.max(6, 9 * scale);
              return (
                <div className="flex flex-wrap" style={{ color: '#000', gap: `${gap}mm` }}>
                  {filtered.map(({ p, s, r }) => (
                    <div key={p.id} className="border-2 border-black avoid-break"
                      style={{
                        pageBreakInside: 'avoid',
                        width: `${cardW}mm`,
                        height: `${cardH}mm`,
                        padding: `${padding}mm`,
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        overflow: 'hidden',
                      }}>
                      <div className="flex items-center justify-between border-b border-black"
                        style={{ paddingBottom: `${1 * scale}mm`, marginBottom: `${1.5 * scale}mm` }}>
                        <span className="uppercase font-semibold leading-none" style={{ fontSize: `${fsLabel}pt` }}>Ruang</span>
                        <span className="font-bold leading-none" style={{ fontSize: `${fsRuang}pt` }}>{r?.nama_ruang || '-'}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                        <p className="uppercase text-gray-600 leading-none" style={{ fontSize: `${fsLabel}pt`, marginBottom: `${0.8 * scale}mm` }}>No. Peserta</p>
                        <p className="font-bold font-mono leading-none break-all" style={{ fontSize: `${fsNomor}pt` }}>
                          {p.nomor_peserta}
                        </p>
                        <p className="font-semibold leading-tight" style={{ fontSize: `${fsNama}pt`, marginTop: `${2 * scale}mm` }}>
                          {(s as any).nama}
                        </p>
                        {(s as any).kelas?.nama_kelas && (
                          <p className="text-gray-700 leading-none" style={{ fontSize: `${fsKelas}pt`, marginTop: `${0.8 * scale}mm` }}>
                            {(s as any).kelas.nama_kelas}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="w-full text-center text-sm text-muted-foreground py-12">
                      Tidak ada peserta untuk dicetak.
                    </div>
                  )}
                </div>
              );
            })()}
          </PrintPreviewFrame>
        </div>
      </DialogContent>
    </Dialog>
  );
}
