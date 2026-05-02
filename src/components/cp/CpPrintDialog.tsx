import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
  elemen_cp: string[];
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string[];
  iktp: string[][];
  materi_pembelajaran: string[];
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
  .footer { margin-top: 14px; font-size: 9pt; color: #666; text-align: right; border-top: 1px solid #ccc; padding-top: 4px; }
  @media print { .no-print { display: none; } }
`;

export function CpPrintDialog({ open, onOpenChange, template }: CpPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: madrasah } = useQuery({
    queryKey: ['madrasah-settings-cp-print'],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('*').maybeSingle();
      return data as any;
    },
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

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

  const font: React.CSSProperties = { fontFamily: "'Times New Roman', serif" };
  const tblStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginBottom: 12 };
  const thStyle: React.CSSProperties = { border: '1px solid #000', padding: '5px 8px', background: '#d4edda', fontWeight: 'bold', textAlign: 'center', ...font, fontSize: '11pt' };
  const tdStyle: React.CSSProperties = { border: '1px solid #000', padding: '5px 8px', verticalAlign: 'top', ...font, fontSize: '11pt' };
  const tdCenter: React.CSSProperties = { ...tdStyle, textAlign: 'center', fontWeight: 'bold' };

  // Get elemen CP description from DB field (parallel array)
  const getElemenCp = (index: number): string => {
    if (template.elemen_cp && template.elemen_cp.length > index && template.elemen_cp[index]) {
      return template.elemen_cp[index];
    }
    return '—';
  };

  // Get IKTP for a TP index
  const getIktp = (index: number): string[] => {
    if (template.iktp && Array.isArray(template.iktp) && template.iktp.length > index && Array.isArray(template.iktp[index])) {
      return template.iktp[index];
    }
    return [];
  };

  // Get Materi for a TP index
  const getMateri = (index: number): string => {
    if (template.materi_pembelajaran && template.materi_pembelajaran.length > index && template.materi_pembelajaran[index]) {
      return template.materi_pembelajaran[index];
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detail Template CP — {template.mapel}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16, ...font }}>
            <h1 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2, ...font }}>
              ANALISIS KETERKAITAN CP DAN TP DENGAN IKTP DAN MATERI PEMBELAJARAN
            </h1>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: 10, ...font }}>
              TAHUN PELAJARAN 2024 / 2025
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 4px', fontSize: '11pt', ...font }}>
              <div style={{ textAlign: 'left' }}>
                <div><strong>Mata Pelajaran</strong> : <span style={{ textDecoration: 'underline' }}>{template.mapel}</span></div>
                <div><strong>Kelas/Semester</strong> : <span style={{ textDecoration: 'underline' }}>{template.kelas || '-'} / {semesterLabel}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Fase</strong> : <span style={{ textDecoration: 'underline' }}>{template.fase}</span></div>
                {template.sumber && <div><strong>Sumber</strong> : {template.sumber}</div>}
              </div>
            </div>
          </div>

          {/* A. CAPAIAN PEMBELAJARAN */}
          <div style={{ marginBottom: 12, ...font }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>A.</span>
              <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>CAPAIAN PEMBELAJARAN</span>
            </div>
            <div style={{ paddingLeft: 24, textAlign: 'justify', lineHeight: 1.6, fontSize: '11pt', ...font }}>
              <div style={{ marginBottom: 4 }}>Pada fase ini, peserta didik mampu:</div>
              <div style={{ paddingLeft: 16 }}>
                {template.capaian_pembelajaran.split(/[.]\s+/).filter(s => s.trim()).map((sentence, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                    <span>■</span>
                    <span style={{ textDecoration: 'underline' }}>{sentence.trim().replace(/\.$/, '')}.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* B. ELEMEN CAPAIAN PEMBELAJARAN */}
          {hasElemen && (
            <div style={{ marginBottom: 12, ...font }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>B.</span>
                <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>ELEMEN CAPAIAN PEMBELAJARAN</span>
              </div>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '22%' }}>ELEMEN</th>
                    <th style={{ ...thStyle, width: '78%' }}>CAPAIAN PEMBELAJARAN</th>
                  </tr>
                </thead>
                <tbody>
                  {template.elemen.map((el, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', textAlign: 'center' }}>{el}</td>
                      <td style={{ ...tdStyle, textAlign: 'justify', fontStyle: 'italic' }}>
                        {getElemenCp(i)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* C. TUJUAN PEMBELAJARAN + IKTP + MATERI */}
          {template.tujuan_pembelajaran.length > 0 && (
            <div style={{ marginBottom: 12, ...font }}>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '4%' }}></th>
                    <th style={{ ...thStyle, width: '24%' }}>Tujuan Pembelajaran</th>
                    <th style={{ ...thStyle, width: '45%' }}>Indikator Ketercapaian Tujuan Pembelajaran (IKTP)</th>
                    <th style={{ ...thStyle, width: '27%' }}>Materi Pembelajaran / Topik / Subtopik</th>
                  </tr>
                </thead>
                <tbody>
                  {template.tujuan_pembelajaran.map((tp, i) => {
                    const iktpItems = getIktp(i);
                    const materi = getMateri(i);
                    return (
                      <tr key={i}>
                        <td style={tdCenter}>{i + 1}</td>
                        <td style={tdStyle}>{tp}</td>
                        <td style={tdStyle}>
                          {iktpItems.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {iktpItems.map((item, j) => (
                                <li key={j} style={{ marginBottom: 2 }}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {materi || <span style={{ color: '#999', fontStyle: 'italic' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
