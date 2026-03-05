import { useEffect, useState, useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { GtkKtaCard } from './GtkKtaCard';
import { supabase } from '@/integrations/supabase/client';

interface GtkData {
  id: string;
  nama: string;
  nip: string | null;
  nuptk: string | null;
  jabatan: string | null;
}

interface GtkKtaPrintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gtkList: GtkData[];
}

export function GtkKtaPrint({ open, onOpenChange, gtkList }: GtkKtaPrintProps) {
  const [madrasah, setMadrasah] = useState<{
    nama_madrasah: string;
    alamat: string | null;
    npsn: string | null;
    nsm: string | null;
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      supabase.from('madrasah_settings').select('nama_madrasah, alamat, npsn, nsm').limit(1).single()
        .then(({ data }) => {
          if (data) setMadrasah(data);
        });
    }
  }, [open]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak KTA GTK/PTK</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
          }
          .kta-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 5mm;
            justify-content: flex-start;
          }
          .kta-card {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (gtkList.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Cetak KTA - {gtkList.length} Kartu
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          <div className="kta-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '5mm', justifyContent: 'flex-start' }}>
            {gtkList.map((gtk) => (
              <GtkKtaCard key={gtk.id} gtk={gtk} madrasah={madrasah} />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
