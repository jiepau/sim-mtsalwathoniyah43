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

const PRINT_STYLES = `
  @page { size: A4; margin: 20mm 25mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
  }
  .header { text-align: center; margin-bottom: 20px; }
  .header h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
  .header h2 { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
  .header-info { font-size: 11pt; border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 6px 0; }
  .header-info span { margin: 0 12px; }

  .section { margin-bottom: 16px; }
  .section-title {
    font-size: 12pt; font-weight: bold; margin-bottom: 6px;
    background: #f0f0f0; padding: 4px 10px;
    border-left: 4px solid #333;
  }
  .section-content { padding: 4px 10px; text-align: justify; }

  table.elemen-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  table.elemen-table td { padding: 3px 10px; vertical-align: top; font-size: 12pt; }
  table.elemen-table td:first-child::before { content: "• "; font-weight: bold; }

  table.tp-table { width: 100%; border-collapse: collapse; }
  table.tp-table td { padding: 3px 10px; vertical-align: top; font-size: 12pt; }
  table.tp-table td.tp-num { width: 30px; text-align: right; padding-right: 6px; font-weight: bold; }

  .footer {
    margin-top: 20px; font-size: 9pt; color: #666;
    text-align: right; border-top: 1px solid #ccc; padding-top: 6px;
  }
  @media print { .no-print { display: none; } }
`;

export function CpPrintDialog({ open, onOpenChange, template }: CpPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!template) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Template CP - ${template.mapel}</title>
      <style>${PRINT_STYLES}</style>
    </head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const hasElemen = template.elemen.length > 0 && template.elemen[0] !== '';

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
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2, fontFamily: "'Times New Roman', serif" }}>
              TEMPLATE CAPAIAN PEMBELAJARAN
            </h1>
            <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Times New Roman', serif" }}>
              {template.mapel}
            </h2>
            <div style={{ fontSize: '11pt', borderTop: '2px solid #000', borderBottom: '1px solid #000', padding: '6px 0', fontFamily: "'Times New Roman', serif" }}>
              <span style={{ margin: '0 12px' }}>Fase: <strong>{template.fase}</strong></span>
              <span style={{ margin: '0 12px' }}>Kelas: <strong>{template.kelas || '-'}</strong></span>
              <span style={{ margin: '0 12px' }}>Semester: <strong style={{ textTransform: 'capitalize' }}>{template.semester || '-'}</strong></span>
              {template.sumber && <span style={{ margin: '0 12px' }}>Sumber: <strong>{template.sumber}</strong></span>}
            </div>
          </div>

          {/* A. Elemen Pembelajaran */}
          {hasElemen && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: 6, background: '#f0f0f0', padding: '4px 10px', borderLeft: '4px solid #333', fontFamily: "'Times New Roman', serif" }}>
                ELEMEN PEMBELAJARAN
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {template.elemen.map((el, i) => (
                    <tr key={i}>
                      <td style={{ padding: '3px 10px', verticalAlign: 'top', fontSize: '12pt', fontFamily: "'Times New Roman', serif" }}>
                        • {el}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* B. Capaian Pembelajaran */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: 6, background: '#f0f0f0', padding: '4px 10px', borderLeft: '4px solid #333', fontFamily: "'Times New Roman', serif" }}>
              CAPAIAN PEMBELAJARAN
            </div>
            <div style={{ padding: '4px 10px', textAlign: 'justify', fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: 1.6, fontStyle: 'italic' }}>
              {template.capaian_pembelajaran}
            </div>
          </div>

          {/* C. Tujuan Pembelajaran */}
          {template.tujuan_pembelajaran.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: 6, background: '#f0f0f0', padding: '4px 10px', borderLeft: '4px solid #333', fontFamily: "'Times New Roman', serif" }}>
                TUJUAN PEMBELAJARAN ({template.tujuan_pembelajaran.length} TP)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {template.tujuan_pembelajaran.map((tp, i) => (
                    <tr key={i}>
                      <td style={{ padding: '3px 4px 3px 10px', verticalAlign: 'top', width: 30, textAlign: 'right', fontWeight: 'bold', fontFamily: "'Times New Roman', serif", fontSize: '12pt' }}>
                        {i + 1}.
                      </td>
                      <td style={{ padding: '3px 10px 3px 6px', verticalAlign: 'top', fontFamily: "'Times New Roman', serif", fontSize: '12pt' }}>
                        {tp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 20, fontSize: '9pt', color: '#666', textAlign: 'right', borderTop: '1px solid #ccc', paddingTop: 6, fontFamily: "'Times New Roman', serif" }}>
            {template.sumber && `Sumber: ${template.sumber} | `}
            Dicetak dari SIM MTs Al-Wathoniyah 43
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
