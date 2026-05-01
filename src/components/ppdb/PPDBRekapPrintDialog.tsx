import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  PrintPreviewToolbar,
  PrintPreviewFrame,
  type PrintOrientation,
} from '@/components/print/PrintPreviewToolbar';

type Pendaftar = {
  id: string;
  nomor_pendaftaran: string;
  nama: string;
  jenis_kelamin: string | null;
  asal_sekolah: string | null;
  status: string;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pendaftar: Pendaftar[];
}

/**
 * Klasifikasi asal sekolah:
 * - MI / Madrasah (Kemenag) jika nama sekolah mengandung "MI", "MADRASAH",
 *   "MIN", "MIS", "RA"
 * - SD / Diknas (Kemdikbud) jika mengandung "SD", "SDN", "SDS", "SDIT"
 *   (tetapi bukan MI)
 * - Lainnya jika tidak kosong namun tidak match
 * - Tidak diisi jika kosong
 */
function klasifikasiAsalSekolah(nama: string | null | undefined):
  'MI' | 'SD' | 'LAINNYA' | 'KOSONG' {
  const s = (nama ?? '').trim().toUpperCase();
  if (!s) return 'KOSONG';
  // Cek MI dulu (lebih spesifik)
  if (/\b(MI|MIN|MIS|MADRASAH|RA)\b/.test(s)) return 'MI';
  if (/\b(SD|SDN|SDS|SDIT|SDI)\b/.test(s)) return 'SD';
  return 'LAINNYA';
}

export function PPDBRekapPrintDialog({ open, onOpenChange, pendaftar }: Props) {
  const [preview, setPreview] = useState(true);
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait');

  const { data: madrasah } = useQuery({
    queryKey: ['madrasah-settings-rekap-spmb'],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('*').maybeSingle();
      return data;
    },
    enabled: open,
  });

  const groups = useMemo(() => {
    const mi: Pendaftar[] = [];
    const sd: Pendaftar[] = [];
    const lainnya: Pendaftar[] = [];
    const kosong: Pendaftar[] = [];
    for (const p of pendaftar) {
      const k = klasifikasiAsalSekolah(p.asal_sekolah);
      if (k === 'MI') mi.push(p);
      else if (k === 'SD') sd.push(p);
      else if (k === 'LAINNYA') lainnya.push(p);
      else kosong.push(p);
    }
    const sortFn = (a: Pendaftar, b: Pendaftar) =>
      (a.asal_sekolah ?? '').localeCompare(b.asal_sekolah ?? '') ||
      a.nama.localeCompare(b.nama);
    mi.sort(sortFn);
    sd.sort(sortFn);
    lainnya.sort(sortFn);
    kosong.sort((a, b) => a.nama.localeCompare(b.nama));
    return { mi, sd, lainnya, kosong };
  }, [pendaftar]);

  const handlePrint = () => window.print();

  const renderTable = (rows: Pendaftar[], startNo = 1) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-xs">No</TableHead>
          <TableHead className="text-xs">No. Daftar</TableHead>
          <TableHead className="text-xs">Nama</TableHead>
          <TableHead className="text-xs w-16">L/P</TableHead>
          <TableHead className="text-xs">Asal Sekolah</TableHead>
          <TableHead className="text-xs w-24">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-2">
              — Tidak ada data —
            </TableCell>
          </TableRow>
        ) : (
          rows.map((p, i) => (
            <TableRow key={p.id}>
              <TableCell className="text-xs">{startNo + i}</TableCell>
              <TableCell className="text-xs font-mono">{p.nomor_pendaftaran}</TableCell>
              <TableCell className="text-xs font-medium">{p.nama}</TableCell>
              <TableCell className="text-xs">{p.jenis_kelamin ?? '-'}</TableCell>
              <TableCell className="text-xs">{p.asal_sekolah ?? '-'}</TableCell>
              <TableCell className="text-xs capitalize">{p.status}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const total = pendaftar.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rekap Pendaftar SPMB</DialogTitle>
        </DialogHeader>

        <PrintPreviewToolbar
          preview={preview}
          onTogglePreview={setPreview}
          orientation={orientation}
          onOrientationChange={setOrientation}
          onPrint={handlePrint}
          hint="Rekap dikelompokkan berdasarkan asal sekolah (MI/Madrasah & SD/Diknas)."
        />

        <PrintPreviewFrame preview={preview} orientation={orientation}>
          <div className="space-y-3 text-black">
            {/* Kop */}
            <div className="text-center border-b-2 border-black pb-2">
              <h2 className="text-base font-bold uppercase leading-tight">
                {madrasah?.nama_madrasah ?? 'MTs Al-Wathoniyah 43'}
              </h2>
              {madrasah?.alamat && (
                <p className="text-[11px] leading-tight">{madrasah.alamat}</p>
              )}
              {(madrasah?.npsn || madrasah?.nsm) && (
                <p className="text-[11px] leading-tight">
                  {madrasah?.nsm && `NSM: ${madrasah.nsm}`}
                  {madrasah?.nsm && madrasah?.npsn && ' • '}
                  {madrasah?.npsn && `NPSN: ${madrasah.npsn}`}
                </p>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold uppercase">
                Rekap Pendaftar SPMB
              </h3>
            </div>

            {/* Ringkasan */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="border p-2 rounded">
                <p className="text-[10px] text-muted-foreground">Total Pendaftar</p>
                <p className="font-bold text-base">{total}</p>
              </div>
              <div className="border p-2 rounded">
                <p className="text-[10px] text-muted-foreground">Asal MI / Madrasah</p>
                <p className="font-bold text-base">{groups.mi.length}</p>
              </div>
              <div className="border p-2 rounded">
                <p className="text-[10px] text-muted-foreground">Asal SD / Diknas</p>
                <p className="font-bold text-base">{groups.sd.length}</p>
              </div>
              <div className="border p-2 rounded">
                <p className="text-[10px] text-muted-foreground">Lainnya / Tidak Diisi</p>
                <p className="font-bold text-base">{groups.lainnya.length + groups.kosong.length}</p>
              </div>
            </div>

            {/* Diagram MI vs SD */}
            <RekapDonutChart
              mi={groups.mi.length}
              sd={groups.sd.length}
              lainnya={groups.lainnya.length}
              kosong={groups.kosong.length}
            />

            {/* MI */}
            <section>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold uppercase">A. Asal MI / Madrasah (Kemenag)</h4>
                <Badge variant="secondary" className="text-[10px]">{groups.mi.length} siswa</Badge>
              </div>
              {renderTable(groups.mi, 1)}
            </section>

            {/* SD */}
            <section>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold uppercase">B. Asal SD / Diknas (Kemdikbud)</h4>
                <Badge variant="secondary" className="text-[10px]">{groups.sd.length} siswa</Badge>
              </div>
              {renderTable(groups.sd, 1)}
            </section>

            {/* Lainnya */}
            {groups.lainnya.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold uppercase">C. Asal Sekolah Lainnya</h4>
                  <Badge variant="secondary" className="text-[10px]">{groups.lainnya.length} siswa</Badge>
                </div>
                {renderTable(groups.lainnya, 1)}
              </section>
            )}

            {/* Kosong */}
            {groups.kosong.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold uppercase">D. Asal Sekolah Belum Diisi</h4>
                  <Badge variant="secondary" className="text-[10px]">{groups.kosong.length} siswa</Badge>
                </div>
                {renderTable(groups.kosong, 1)}
              </section>
            )}

            {/* TTD */}
            <div className="flex justify-end pt-6 text-xs">
              <div className="text-center w-64">
                <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Kepala Madrasah</p>
                <div className="h-16" />
                <p className="font-semibold underline">{madrasah?.kepala_madrasah ?? '...........................'}</p>
                {madrasah?.nip_kepala && <p>NIP. {madrasah.nip_kepala}</p>}
              </div>
            </div>
          </div>
        </PrintPreviewFrame>
      </DialogContent>
    </Dialog>
  );
}
