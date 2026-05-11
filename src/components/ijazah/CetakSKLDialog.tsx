import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PrintKopMadrasah, PrintTtdKepala } from '@/components/print/PrintKopMadrasah';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  siswaId: string;
  taId: string;
}

export function CetakSKLDialog({ open, onOpenChange, siswaId, taId }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['skl', siswaId, taId],
    enabled: open && !!siswaId,
    queryFn: async () => {
      const [siswaRes, kelulusanRes, taRes] = await Promise.all([
        supabase.from('siswa').select('id, nama, nis, nisn, tempat_lahir, tanggal_lahir, kelas_id').eq('id', siswaId).maybeSingle(),
        supabase.from('kelulusan').select('*').eq('siswa_id', siswaId).eq('ta_id', taId).maybeSingle(),
        supabase.from('tahun_ajaran').select('nama_ta').eq('id', taId).maybeSingle(),
      ]);
      let nama_kelas = '';
      if (siswaRes.data?.kelas_id) {
        const { data: k } = await supabase.from('kelas').select('nama_kelas').eq('id', siswaRes.data.kelas_id).maybeSingle();
        nama_kelas = k?.nama_kelas || '';
      }
      return { siswa: siswaRes.data, kelulusan: kelulusanRes.data, ta: taRes.data, nama_kelas };
    },
  });

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>SKL ${data?.siswa?.nama}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Times New Roman', serif; }
        .print-kop-logo { height: 80px; width: 80px; }
      </style>
    </head><body>${html}</body><script>window.onload=()=>setTimeout(()=>window.print(),500)</script></html>`);
    w.document.close();
  };

  if (!data?.siswa) return null;
  const s = data.siswa;
  const k = data.kelulusan;
  const isLulus = k?.status === 'lulus';
  const tglLahir = s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Surat Keterangan Lulus</DialogTitle>
            <Button onClick={handlePrint} size="sm"><Printer className="h-4 w-4 mr-2" />Cetak</Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-8 text-black text-sm leading-relaxed">
          <PrintKopMadrasah judul="SURAT KETERANGAN LULUS" subjudul={data.ta?.nama_ta ? `Tahun Pelajaran ${data.ta.nama_ta}` : undefined} />

          {k?.nomor_sk && <p className="text-center mt-3">Nomor: {k.nomor_sk}</p>}

          <div className="mt-6">
            <p>Yang bertanda tangan di bawah ini, Kepala MTs Al-Wathoniyah 43, dengan ini menerangkan bahwa:</p>
            <table className="mt-4 ml-6">
              <tbody>
                <tr><td className="pr-4">Nama</td><td>: <strong>{s.nama}</strong></td></tr>
                <tr><td className="pr-4">NISN</td><td>: {s.nisn || '-'}</td></tr>
                <tr><td className="pr-4">NIS</td><td>: {s.nis}</td></tr>
                <tr><td className="pr-4">Tempat, Tgl. Lahir</td><td>: {s.tempat_lahir || '-'}, {tglLahir}</td></tr>
                <tr><td className="pr-4">Kelas</td><td>: {data.nama_kelas}</td></tr>
              </tbody>
            </table>

            <p className="mt-4">Berdasarkan hasil rapat dewan guru, peserta didik tersebut di atas dinyatakan:</p>
            <p className="text-center my-4 text-xl font-bold tracking-wider">
              {isLulus ? 'LULUS' : k?.status === 'tidak_lulus' ? 'TIDAK LULUS' : 'BELUM DITETAPKAN'}
            </p>
            <p>dari MTs Al-Wathoniyah 43 pada Tahun Pelajaran {data.ta?.nama_ta || '-'}.</p>
            <p className="mt-3">Surat keterangan ini diberikan untuk dipergunakan sebagaimana mestinya, sambil menunggu blanko Ijazah resmi diterbitkan.</p>
          </div>

          <PrintTtdKepala kota="Jakarta" tanggal={k?.tanggal_lulus || new Date()} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
