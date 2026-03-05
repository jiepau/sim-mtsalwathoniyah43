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
  @page { size: A4 landscape; margin: 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000;
  }
  .print-header { text-align: center; margin-bottom: 16px; }
  .print-header h1 { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
  .print-header-info { display: flex; justify-content: space-between; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; font-size: 11pt; }
  .print-header-info .left { text-align: left; }
  .print-header-info .right { text-align: right; }

  .section-title { font-size: 12pt; font-weight: bold; margin: 14px 0 8px 0; }

  table.cp-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  table.cp-table th, table.cp-table td {
    border: 1px solid #000; padding: 5px 8px; vertical-align: top; font-size: 11pt;
  }
  table.cp-table th {
    background: #e8e8e8; font-weight: bold; text-align: center; font-size: 11pt;
  }
  .cp-narasi { text-align: justify; line-height: 1.6; }
  .cp-narasi ul { margin-left: 18px; }
  .cp-narasi ul li { margin-bottom: 3px; }

  .footer { margin-top: 14px; font-size: 9pt; color: #666; text-align: right; border-top: 1px solid #ccc; padding-top: 4px; }
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
      <title>CP - ${template.mapel}</title>
      <style>${PRINT_STYLES}</style>
    </head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const hasElemen = template.elemen.length > 0 && template.elemen[0] !== '';
  const semesterLabel = template.semester ? template.semester.charAt(0).toUpperCase() + template.semester.slice(1) : '-';

  // Parse CP narasi into bullet points
  const cpLines = template.capaian_pembelajaran
    .split(/(?:^|\.\s+)(?=[A-Z])/)
    .filter(l => l.trim().length > 0);

  const tblStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginBottom: 12 };
  const thStyle: React.CSSProperties = { border: '1px solid #000', padding: '5px 8px', background: '#e8e8e8', fontWeight: 'bold', textAlign: 'center', fontFamily: "'Times New Roman', serif", fontSize: '11pt' };
  const tdStyle: React.CSSProperties = { border: '1px solid #000', padding: '5px 8px', verticalAlign: 'top', fontFamily: "'Times New Roman', serif", fontSize: '11pt' };
  const tdCenter: React.CSSProperties = { ...tdStyle, textAlign: 'center', fontWeight: 'bold' };
  const font: React.CSSProperties = { fontFamily: "'Times New Roman', serif" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detail Template CP — {template.mapel}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16, ...font }}>
            <h1 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, ...font }}>
              ANALISIS KETERKAITAN CP DAN TP
            </h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0', fontSize: '11pt', ...font }}>
              <div style={{ textAlign: 'left' }}>
                <div><strong>Mata Pelajaran:</strong> {template.mapel}</div>
                <div><strong>Kelas/Semester:</strong> {template.kelas || '-'} / {semesterLabel}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Fase:</strong> {template.fase}</div>
                {template.sumber && <div><strong>Sumber:</strong> {template.sumber}</div>}
              </div>
            </div>
          </div>

          {/* A. CAPAIAN PEMBELAJARAN */}
          <div style={{ fontSize: '12pt', fontWeight: 'bold', margin: '14px 0 8px 0', ...font }}>
            A. CAPAIAN PEMBELAJARAN
          </div>
          <table style={tblStyle}>
            <tbody>
              <tr>
                <td style={{ ...tdStyle, textAlign: 'justify', lineHeight: 1.6 }}>
                  {template.capaian_pembelajaran}
                </td>
              </tr>
            </tbody>
          </table>

          {/* B. ELEMEN CAPAIAN PEMBELAJARAN */}
          {hasElemen && (
            <>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', margin: '14px 0 8px 0', ...font }}>
                B. ELEMEN CAPAIAN PEMBELAJARAN
              </div>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '5%' }}>No</th>
                    <th style={{ ...thStyle, width: '30%' }}>ELEMEN</th>
                    <th style={{ ...thStyle, width: '65%' }}>CAPAIAN PEMBELAJARAN</th>
                  </tr>
                </thead>
                <tbody>
                  {template.elemen.map((el, i) => (
                    <tr key={i}>
                      <td style={tdCenter}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{el}</td>
                      <td style={{ ...tdStyle, fontStyle: 'italic' }}>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* C. TUJUAN PEMBELAJARAN */}
          {template.tujuan_pembelajaran.length > 0 && (
            <>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', margin: '14px 0 8px 0', ...font }}>
                C. TUJUAN PEMBELAJARAN
              </div>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '5%' }}>No</th>
                    <th style={{ ...thStyle, width: '95%' }}>TUJUAN PEMBELAJARAN</th>
                  </tr>
                </thead>
                <tbody>
                  {template.tujuan_pembelajaran.map((tp, i) => (
                    <tr key={i}>
                      <td style={tdCenter}>{i + 1}</td>
                      <td style={tdStyle}>{tp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: 14, fontSize: '9pt', color: '#666', textAlign: 'right', borderTop: '1px solid #ccc', paddingTop: 4, ...font }}>
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
