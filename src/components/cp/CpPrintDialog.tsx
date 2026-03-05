import { useRef } from 'react';
import { Printer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface CPTemplate {
  id: string;
  mapel: string;
  fase: string;
  kelas: number | null;
  semester: string | null;
  elemen: string[];
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string[];
  sumber: string | null;
}

interface CpPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CPTemplate | null;
}

export function CpPrintDialog({ open, onOpenChange, template }: CpPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!template) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Template CP - ${template.mapel}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
          }
          .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .header h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .header .info {
            font-size: 11pt;
            display: flex;
            justify-content: center;
            gap: 24px;
            flex-wrap: wrap;
          }
          .section {
            margin-bottom: 16px;
          }
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 8px;
            background: #f0f0f0;
            padding: 4px 8px;
            border-left: 4px solid #333;
          }
          .section-content {
            padding: 0 8px;
          }
          .elemen-list, .tp-list {
            list-style: none;
            padding: 0;
          }
          .elemen-list li {
            padding: 2px 0;
            padding-left: 16px;
            position: relative;
          }
          .elemen-list li::before {
            content: "•";
            position: absolute;
            left: 4px;
            font-weight: bold;
          }
          .tp-list li {
            padding: 3px 0;
            padding-left: 24px;
            position: relative;
            counter-increment: tp;
          }
          .tp-list {
            counter-reset: tp;
          }
          .tp-list li::before {
            content: counter(tp) ".";
            position: absolute;
            left: 4px;
            font-weight: bold;
          }
          .cp-text {
            text-align: justify;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 24px;
            font-size: 10pt;
            color: #666;
            text-align: right;
            border-top: 1px solid #ccc;
            padding-top: 8px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detail Template CP — {template.mapel}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          <div className="header" style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 12 }}>
            <h1 style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: 4 }}>TEMPLATE CAPAIAN PEMBELAJARAN</h1>
            <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: 8 }}>{template.mapel.toUpperCase()}</h2>
            <div style={{ fontSize: '11pt', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' as const }}>
              <span>Fase: <strong>{template.fase}</strong></span>
              <span>Kelas: <strong>{template.kelas || '-'}</strong></span>
              <span>Semester: <strong style={{ textTransform: 'capitalize' }}>{template.semester || '-'}</strong></span>
              {template.sumber && <span>Sumber: <strong>{template.sumber}</strong></span>}
            </div>
          </div>

          {template.elemen.length > 0 && template.elemen[0] !== '' && (
            <div className="section" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: 8, background: '#f0f0f0', padding: '4px 8px', borderLeft: '4px solid #333' }}>
                ELEMEN PEMBELAJARAN
              </div>
              <ul style={{ listStyle: 'none', padding: '0 8px' }}>
                {template.elemen.map((el, i) => (
                  <li key={i} style={{ padding: '2px 0', paddingLeft: 16 }}>• {el}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="section" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: 8, background: '#f0f0f0', padding: '4px 8px', borderLeft: '4px solid #333' }}>
              CAPAIAN PEMBELAJARAN
            </div>
            <div style={{ padding: '0 8px', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
              {template.capaian_pembelajaran}
            </div>
          </div>

          {template.tujuan_pembelajaran.length > 0 && (
            <div className="section" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: 8, background: '#f0f0f0', padding: '4px 8px', borderLeft: '4px solid #333' }}>
                TUJUAN PEMBELAJARAN ({template.tujuan_pembelajaran.length} TP)
              </div>
              <ol style={{ padding: '0 8px', listStyle: 'none', counterReset: 'tp' }}>
                {template.tujuan_pembelajaran.map((tp, i) => (
                  <li key={i} style={{ padding: '3px 0', paddingLeft: 24, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 4, fontWeight: 'bold' }}>{i + 1}.</span>
                    {tp}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: '10pt', color: '#666', textAlign: 'right', borderTop: '1px solid #ccc', paddingTop: 8 }}>
            {template.sumber && `Sumber: ${template.sumber} | `}
            Dicetak dari SIM MTs Al-Wathoniyah 43
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
