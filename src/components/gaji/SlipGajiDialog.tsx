import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SlipGajiPrint, type SlipGajiData } from './SlipGajiPrint';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  periodeId: string | null;
}

export function SlipGajiDialog({ open, onOpenChange, periodeId }: Props) {
  const [data, setData] = useState<SlipGajiData | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !periodeId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: periode, error: e1 } = await supabase
          .from('gaji_periode').select('*').eq('id', periodeId).maybeSingle();
        if (e1) throw e1;
        if (!periode) throw new Error('Slip tidak ditemukan');

        const [{ data: guru }, { data: detail }, { data: settings }] = await Promise.all([
          supabase.from('gtk_ptk').select('nama,nip,nuptk,jabatan').eq('id', periode.gtk_id).maybeSingle(),
          supabase.from('gaji_detail').select('*').eq('gaji_periode_id', periodeId).order('urutan'),
          supabase.from('gaji_settings').select('judul_slip').maybeSingle(),
        ]);
        if (cancelled) return;
        setData({
          periode,
          guru: guru || { nama: '-', nip: null, nuptk: null, jabatan: null },
          detail: (detail || []) as SlipGajiData['detail'],
          judul: settings?.judul_slip || 'SLIP GAJI GURU & TENAGA KEPENDIDIKAN',
        });
      } catch (err) {
        toast.error('Gagal memuat slip: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, periodeId]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '', 'width=800,height=900');
    if (!w) return;
    w.document.write(`
      <html><head><title>Slip Gaji</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A5 portrait; margin: 10mm; }
        body { font-family: 'Times New Roman', serif; }
      </style>
      </head><body>${printRef.current.innerHTML}</body>
      <script>window.onload=()=>setTimeout(()=>{window.print();window.close();},500);</script>
      </html>
    `);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Preview Slip Gaji</DialogTitle>
            <Button size="sm" onClick={handlePrint} disabled={!data}>
              <Printer className="h-4 w-4 mr-2" /> Cetak
            </Button>
          </div>
        </DialogHeader>
        {loading || !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div ref={printRef}>
            <SlipGajiPrint data={data} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
