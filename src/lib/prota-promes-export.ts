import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface ProtaExportData {
  mapel: string;
  fase: string;
  kelas: number | null;
  kompetensi_inti: string | null;
  alokasi_waktu_total: string | null;
  guru: string | null;
  tahun_ajaran: string | null;
  details: {
    bulan: number;
    materi: string | null;
    alokasi_waktu: string | null;
    keterangan: string | null;
  }[];
}

interface PromesExportData {
  mapel: string;
  fase: string;
  kelas: number | null;
  semester: string;
  guru: string | null;
  tahun_ajaran: string | null;
  keterangan: string | null;
  details: {
    bulan: number;
    minggu: number;
    tema: string | null;
    sub_tema: string | null;
    tujuan_pembelajaran: string | null;
    alokasi_waktu: string | null;
  }[];
}

interface TPGroupExport {
  no: number;
  items: { subNo: string; text: string }[];
  alokasiWaktu: number;
  schedule: Record<string, boolean>;
}

const BULAN_NAMES: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
  7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
};

const BULAN_ORDER = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
const BULAN_GANJIL = [7, 8, 9, 10, 11, 12];
const BULAN_GENAP = [1, 2, 3, 4, 5, 6];

function createHeaderRow(texts: string[]): TableRow {
  return new TableRow({
    children: texts.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: 22 })],
        alignment: AlignmentType.CENTER,
      })],
      shading: { fill: 'E6E6E6' },
      width: { size: Math.floor(100 / texts.length), type: WidthType.PERCENTAGE },
    })),
  });
}

function createDataRow(cells: string[]): TableRow {
  return new TableRow({
    children: cells.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text || '-', size: 22 })],
      })],
    })),
  });
}

export async function exportProtaToDocx(data: ProtaExportData): Promise<void> {
  const docChildren: Paragraph[] = [];

  // Title
  docChildren.push(new Paragraph({
    children: [new TextRun({ text: 'PROGRAM TAHUNAN (PROTA)', bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  // Header info
  const headerInfo = [
    `Mata Pelajaran: ${data.mapel}`,
    `Fase: ${data.fase}${data.kelas ? ` / Kelas ${data.kelas}` : ''}`,
    `Tahun Ajaran: ${data.tahun_ajaran || '-'}`,
    `Guru: ${data.guru || '-'}`,
    `Alokasi Waktu Total: ${data.alokasi_waktu_total || '-'}`,
  ];

  headerInfo.forEach(info => {
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: info, size: 24 })],
      spacing: { after: 60 },
    }));
  });

  if (data.kompetensi_inti) {
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: 'Kompetensi Inti/CP:', bold: true, size: 24 })],
      spacing: { before: 200, after: 60 },
    }));
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: data.kompetensi_inti, size: 22 })],
      spacing: { after: 200 },
    }));
  }

  docChildren.push(new Paragraph({
    children: [new TextRun({ text: 'Rincian Program Tahunan:', bold: true, size: 24 })],
    spacing: { before: 200, after: 100 },
  }));

  // Table
  const tableRows = [
    createHeaderRow(['No', 'Bulan', 'Materi/TP', 'Alokasi Waktu', 'Keterangan']),
  ];

  BULAN_ORDER.forEach((bulan, idx) => {
    const detail = data.details.find(d => d.bulan === bulan);
    tableRows.push(createDataRow([
      String(idx + 1),
      BULAN_NAMES[bulan],
      detail?.materi || '',
      detail?.alokasi_waktu || '',
      detail?.keterangan || '',
    ]));
  });

  const table = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [...docChildren, table],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Prota_${data.mapel}_${data.tahun_ajaran || 'TA'}.docx`;
  saveAs(blob, filename.replace(/\s+/g, '_'));
}

// Parse promes details into TP groups for export
function parseDetailsToGroups(details: PromesExportData['details']): TPGroupExport[] {
  const groupMap = new Map<string, TPGroupExport>();

  details.forEach(d => {
    const groupNo = d.tema || '1';
    const subNo = d.sub_tema || `${groupNo}.1`;
    const tpText = d.tujuan_pembelajaran || '';

    if (!groupMap.has(groupNo)) {
      groupMap.set(groupNo, {
        no: parseInt(groupNo) || 1,
        items: [],
        alokasiWaktu: 0,
        schedule: {},
      });
    }

    const group = groupMap.get(groupNo)!;

    // Add item if not already present
    if (tpText && !group.items.find(i => i.subNo === subNo)) {
      group.items.push({ subNo, text: tpText });
    }

    if (d.alokasi_waktu) {
      const jp = parseInt(d.alokasi_waktu);
      if (!isNaN(jp) && jp > group.alokasiWaktu) {
        group.alokasiWaktu = jp;
      }
    }

    if (d.bulan > 0) {
      const key = `${subNo}:${d.bulan}-${d.minggu}`;
      group.schedule[key] = true;
    }
  });

  return [...groupMap.values()].sort((a, b) => a.no - b.no);
}

export async function exportPromesToDocx(data: PromesExportData): Promise<void> {
  const bulanList = data.semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;
  const bulanNames = bulanList.map(b => BULAN_NAMES[b]);
  const groups = parseDetailsToGroups(data.details);
  const totalJP = groups.reduce((s, g) => s + g.alokasiWaktu, 0);

  // Build table rows
  // Header row 1: No | KD | | Alokasi Waktu | Month names (each spanning 5 cols)
  const headerRow1 = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        shading: { fill: 'D4EDDA' },
        rowSpan: 2,
        verticalAlign: 'center' as any,
        width: { size: 3, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Kompetensi Dasar', bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        shading: { fill: 'D4EDDA' },
        rowSpan: 2,
        columnSpan: 2,
        verticalAlign: 'center' as any,
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Alokasi Waktu', bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        shading: { fill: 'D4EDDA' },
        rowSpan: 2,
        verticalAlign: 'center' as any,
        width: { size: 7, type: WidthType.PERCENTAGE },
      }),
      ...bulanList.map(b => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: BULAN_NAMES[b], bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        shading: { fill: 'D4EDDA' },
        columnSpan: 5,
      })),
    ],
  });

  // Header row 2: Week numbers
  const headerRow2 = new TableRow({
    children: bulanList.flatMap(() =>
      [1, 2, 3, 4, 5].map(w => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(w), bold: true, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        shading: { fill: 'D4EDDA' },
        width: { size: 2, type: WidthType.PERCENTAGE },
      }))
    ),
  });

  const dataRows: TableRow[] = [];

  groups.forEach(group => {
    group.items.forEach((item, itemIdx) => {
      const cells: TableCell[] = [];
      
      // No (only first item in group)
      if (itemIdx === 0) {
        cells.push(new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(group.no), size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
          rowSpan: group.items.length,
          verticalAlign: 'center' as any,
        }));
      }

      // Sub number
      cells.push(new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: item.subNo, size: 18, font: 'Times New Roman' })] })],
        width: { size: 4, type: WidthType.PERCENTAGE },
      }));

      // TP text
      cells.push(new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: item.text, size: 18, font: 'Times New Roman' })] })],
      }));

      // Alokasi waktu (only first item)
      if (itemIdx === 0) {
        cells.push(new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(group.alokasiWaktu || ''), size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
          rowSpan: group.items.length,
          verticalAlign: 'center' as any,
        }));
      }

      // Week cells
      bulanList.forEach(b => {
        [1, 2, 3, 4, 5].forEach(w => {
          const isChecked = group.schedule[`${item.subNo}:${b}-${w}`];
          cells.push(new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: isChecked ? '✓' : '', size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
          }));
        });
      });

      dataRows.push(new TableRow({ children: cells }));
    });

    // SUMATIF row
    dataRows.push(new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [] })],
          columnSpan: 3,
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `SUMATIF ${group.no}`, bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        ...bulanList.flatMap(() =>
          [1, 2, 3, 4, 5].map(() => new TableCell({ children: [new Paragraph({ children: [] })] }))
        ),
      ],
    }));
  });

  // CADANGAN row
  dataRows.push(new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'CADANGAN', bold: true, size: 18, font: 'Times New Roman' })] })],
        columnSpan: 3,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '0', size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
      }),
      ...bulanList.flatMap(() =>
        [1, 2, 3, 4, 5].map(() => new TableCell({ children: [new Paragraph({ children: [] })] }))
      ),
    ],
  }));

  // JUMLAH row
  dataRows.push(new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'JUMLAH', bold: true, size: 18, font: 'Times New Roman' })] })],
        columnSpan: 3,
        shading: { fill: 'D4EDDA' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(totalJP), bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        shading: { fill: 'D4EDDA' },
      }),
      ...bulanList.flatMap(() =>
        [1, 2, 3, 4, 5].map(() => new TableCell({ children: [new Paragraph({ children: [] })], shading: { fill: 'D4EDDA' } }))
      ),
    ],
  }));

  const table = new Table({
    rows: [headerRow1, headerRow2, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Title section
  const titleParagraphs = [
    new Paragraph({
      children: [new TextRun({ text: 'PROGRAM SEMESTER', bold: true, size: 28, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `TAHUN PELAJARAN ${data.tahun_ajaran || '20.. / 20..'}`, bold: true, size: 24, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Mata Pelajaran: ${data.mapel}`, size: 22, font: 'Times New Roman' }),
        new TextRun({ text: `     Kelas: ${data.kelas || '-'}`, size: 22, font: 'Times New Roman' }),
        new TextRun({ text: `     Semester: ${data.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`, size: 22, font: 'Times New Roman' }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Guru: ${data.guru || '-'}`, size: 22, font: 'Times New Roman' }),
      ],
      spacing: { after: 200 },
    }),
  ];

  // Keterangan section at bottom
  const keteranganParagraphs = [
    new Paragraph({ children: [], spacing: { before: 300 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Keterangan :', bold: true, size: 20, font: 'Times New Roman' })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '     ✓  = Minggu efektif pembelajaran', size: 20, font: 'Times New Roman' })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '     Sumatif = Penilaian akhir per kelompok TP', size: 20, font: 'Times New Roman' })],
      spacing: { after: 200 },
    }),
    // Signature
    new Paragraph({
      children: [new TextRun({ text: `${data.guru ? `Guru Mata Pelajaran,` : ''}`, size: 20, font: 'Times New Roman' })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '', size: 20 })],
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [new TextRun({ text: data.guru || '..............................', size: 20, font: 'Times New Roman', underline: {} })],
      alignment: AlignmentType.RIGHT,
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
          size: {
            orientation: 'landscape' as any,
            width: 16838, // A4 landscape
            height: 11906,
          },
        },
      },
      children: [...titleParagraphs, table, ...keteranganParagraphs],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Promes_${data.mapel}_Kelas${data.kelas || ''}_${data.semester}_${data.tahun_ajaran || 'TA'}.docx`;
  saveAs(blob, filename.replace(/\s+/g, '_'));
}
