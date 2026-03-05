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

// Map elemen singkatan ke deskripsi CP per elemen (referensi Fase D)
const ELEMEN_CP_MAP: Record<string, string> = {
  'Berpikir Komputasional (BK)': 'Peserta didik mampu menerapkan berpikir komputasional untuk menghasilkan beberapa solusi dalam menyelesaikan persoalan dengan data diskrit bervolume kecil dan mendisposisikan berpikir komputasional dalam bidang lain terutama dalam literasi, numerasi, dan literasi sains (computationally literate).',
  'Teknologi Informasi dan Komunikasi (TIK)': 'Peserta didik mampu menerapkan praktik baik dalam memanfaatkan aplikasi surel untuk berkomunikasi, aplikasi peramban untuk pencarian informasi di internet, Content Management System (CMS) untuk pengelolaan konten digital, dan memanfaatkan perkakas TIK untuk mendukung pembuatan laporan, presentasi serta analisis dan interpretasi data.',
  'Sistem Komputer (SK)': 'Peserta didik mampu mendeskripsikan komponen, fungsi, dan cara kerja komputer yang membentuk sebuah sistem komputasi, serta menjelaskan proses dan penggunaan kodifikasi untuk penyimpanan data dalam memori komputer.',
  'Jaringan Komputer dan Internet (JKI)': 'Peserta didik mampu memahami konektivitas jaringan lokal, komunikasi data via ponsel, konektivitas internet melalui jaringan kabel dan nirkabel (bluetooth, wifi, internet).',
  'Analisis Data (AD)': 'Peserta didik mampu mengakses, mengolah, mengelola, dan menganalisis data secara efisien, terstruktur, dan sistematis untuk menginterpretasi dan memprediksi sekumpulan data dari situasi konkret sehari-hari yang berasal dari suatu sumber data dengan menggunakan perkakas TIK atau manual.',
  'Algoritma dan Pemrograman (AP)': 'Peserta didik mampu memahami objek-objek dan instruksi dalam sebuah lingkungan pemrograman blok (visual) untuk mengembangkan program visual sederhana berdasarkan contoh-contoh yang diberikan, mengembangkan karya digital kreatif (game, animasi, atau presentasi), menerapkan aturan translasi konsep dari satu bahasa visual ke bahasa visual lainnya, dan mengenal pemrograman tekstual sederhana.',
  'Dampak Sosial Informatika (DSI)': 'Peserta didik mampu memahami ketersediaan data dan informasi lewat aplikasi media sosial, memahami keterbukaan informasi, memilih informasi yang bersifat publik atau privat, menerapkan etika dan menjaga keamanan dirinya dalam masyarakat digital.',
  'Praktik Lintas Bidang (PLB)': 'Peserta didik mampu bergotong royong untuk mengidentifikasi persoalan, merancang, mengimplementasi, menguji, dan menyempurnakan artefak komputasional sebagai solusi persoalan masyarakat serta mengomunikasikan produk dan proses pengembangannya dalam bentuk karya kreatif yang menyenangkan secara lisan maupun tertulis.',
};

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

function getElemenCp(elemenName: string): string {
  // Try exact match first
  if (ELEMEN_CP_MAP[elemenName]) return ELEMEN_CP_MAP[elemenName];
  // Try partial match
  for (const key of Object.keys(ELEMEN_CP_MAP)) {
    if (key.toLowerCase().includes(elemenName.toLowerCase()) || elemenName.toLowerCase().includes(key.toLowerCase())) {
      return ELEMEN_CP_MAP[key];
    }
  }
  return '—';
}

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

  const font: React.CSSProperties = { fontFamily: "'Times New Roman', serif" };
  const tblStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginBottom: 12 };
  const thStyle: React.CSSProperties = { border: '1px solid #000', padding: '5px 8px', background: '#d4edda', fontWeight: 'bold', textAlign: 'center', ...font, fontSize: '11pt' };
  const tdStyle: React.CSSProperties = { border: '1px solid #000', padding: '5px 8px', verticalAlign: 'top', ...font, fontSize: '11pt' };
  const tdCenter: React.CSSProperties = { ...tdStyle, textAlign: 'center', fontWeight: 'bold' };

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
                        {getElemenCp(el)}
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
                    <th style={{ ...thStyle, width: '5%' }} rowSpan={2}></th>
                    <th style={{ ...thStyle, width: '25%' }}>Tujuan Pembelajaran</th>
                    <th style={{ ...thStyle, width: '45%' }}>Indikator Ketercapaian Tujuan Pembelajaran (IKTP)</th>
                    <th style={{ ...thStyle, width: '25%' }}>Materi Pembelajaran / Topik / Subtopik</th>
                  </tr>
                </thead>
                <tbody>
                  {template.tujuan_pembelajaran.map((tp, i) => (
                    <tr key={i}>
                      <td style={tdCenter}>{i + 1}</td>
                      <td style={tdStyle}>{tp}</td>
                      <td style={{ ...tdStyle, color: '#666', fontStyle: 'italic' }}>—</td>
                      <td style={{ ...tdStyle, color: '#666', fontStyle: 'italic' }}>—</td>
                    </tr>
                  ))}
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
