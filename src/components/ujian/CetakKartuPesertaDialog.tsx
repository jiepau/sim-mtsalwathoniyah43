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
  nip_kepala: string | null;
  ttd_kepala_url: string | null; stempel_url: string | null;
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
    queryKey: ['madrasah-cetak-kartu', open],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('*').maybeSingle();
      return data as MadrasahData | null;
    },
    enabled: open,
    staleTime: 0,
    refetchOnMount: 'always',
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
            <div className="flex flex-wrap gap-[3mm]" style={{ fontSize: '9pt', color: '#000' }}>
              {filtered.map(({ p, s, r }) => {
                return (
                  <div key={p.id} className="border-2 border-black avoid-break"
                    style={{ pageBreakInside: 'avoid', width: '90mm', height: '80mm', padding: '2mm', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-black pb-1 mb-1">
                      <img src="/logo-alwathoniyah.png" alt="" style={{ width: '10mm', height: '10mm', objectFit: 'contain' }} />
                      <div className="flex-1 text-center">
                        <p className="text-[7pt] font-semibold uppercase leading-tight">Kementerian Agama RI</p>
                        <p className="text-[9pt] font-bold uppercase leading-tight">{madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'}</p>
                        {(madrasah?.nsm || madrasah?.npsn) && (
                          <p className="text-[6pt] leading-tight">
                            {madrasah?.nsm && <>NSM: {madrasah.nsm}</>}
                            {madrasah?.nsm && madrasah?.npsn && <> &nbsp;•&nbsp; </>}
                            {madrasah?.npsn && <>NPSN: {madrasah.npsn}</>}
                          </p>
                        )}
                      </div>
                      <img src="/logo-kemenag.png" alt="" style={{ width: '10mm', height: '10mm', objectFit: 'contain' }} />
                    </div>

                    <div className="text-center mb-1">
                      <p className="font-bold text-[10pt] uppercase leading-tight">Kartu Peserta</p>
                      <p className="text-[8pt] leading-tight">{sesi.nama}</p>
                      {ta?.nama_ta && <p className="text-[7pt] leading-tight">Tahun Ajaran {ta.nama_ta}</p>}
                    </div>

                    <div className="flex gap-2 flex-1 items-stretch">
                      <div className="flex-1 text-[9pt] flex flex-col justify-center" style={{ paddingLeft: '3mm' }}>
                        <div className="mb-1">
                          <p className="text-[6pt] uppercase text-muted-foreground leading-none">No. Peserta</p>
                          <p className="font-bold font-mono text-[14pt] leading-tight">{p.nomor_peserta}</p>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-x-1 gap-y-0.5 leading-tight">
                          <span className="text-[7pt] uppercase">Nama</span>
                          <span className="font-semibold text-[9pt]">: {(s as any).nama}</span>
                          <span className="text-[7pt] uppercase">NISN</span>
                          <span className="text-[8pt]">: {(s as any).nisn || '-'}</span>
                          <span className="text-[7pt] uppercase">Kelas</span>
                          <span className="text-[8pt]">: {(s as any).kelas?.nama_kelas || '-'}</span>
                          <span className="text-[7pt] uppercase">Tanggal</span>
                          <span className="text-[7pt]">: {tanggalText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Ruang (kiri-bawah) & TTD (kanan-bawah) */}
                    <div className="flex items-end justify-between gap-2 mt-auto" style={{ marginBottom: '4mm' }}>
                      <div className="border-2 border-black flex flex-col items-center justify-center"
                        style={{ width: '19mm', height: '21mm' }}>
                        <p className="text-[6pt] uppercase leading-none">Ruang</p>
                        <p className="font-bold leading-none mt-0.5" style={{ fontSize: '14pt' }}>{r?.nama_ruang || '-'}</p>
                      </div>

                      <div className="text-center text-[7pt]" style={{ width: '46mm' }}>
                        <p>Kepala Madrasah,</p>
                        <div className="relative flex items-center justify-center" style={{ height: '18mm' }}>
                          {madrasah?.stempel_url && (
                            <img src={madrasah.stempel_url} alt=""
                              className="absolute left-1/2 top-1/2"
                              style={{
                                height: '18mm',
                                opacity: 0.85,
                                transform: 'translate(-50%, -50%)',
                                mixBlendMode: 'multiply',
                              }} />
                          )}
                          {madrasah?.ttd_kepala_url && (
                            <img src={madrasah.ttd_kepala_url} alt=""
                              className="absolute left-1/2 top-1/2"
                              style={{
                                height: '16mm',
                                transform: 'translate(-50%, -50%)',
                                mixBlendMode: 'multiply',
                              }} />
                          )}
                        </div>
                        <p className="font-semibold leading-tight" style={{ textDecoration: 'underline' }}>
                          {madrasah?.kepala_madrasah || '...........................'}
                        </p>
                        {madrasah?.nip_kepala && (
                          <p className="text-[6pt] leading-tight">NIP. {madrasah.nip_kepala}</p>
                        )}
                      </div>
                    </div>


                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="w-full text-center text-sm text-muted-foreground py-12">
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
