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

export async function exportPromesToDocx(data: PromesExportData): Promise<void> {
  const docChildren: Paragraph[] = [];

  // Title
  docChildren.push(new Paragraph({
    children: [new TextRun({ text: 'PROGRAM SEMESTER (PROMES)', bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  // Header info
  const headerInfo = [
    `Mata Pelajaran: ${data.mapel}`,
    `Fase: ${data.fase}${data.kelas ? ` / Kelas ${data.kelas}` : ''}`,
    `Semester: ${data.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`,
    `Tahun Ajaran: ${data.tahun_ajaran || '-'}`,
    `Guru: ${data.guru || '-'}`,
  ];

  headerInfo.forEach(info => {
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: info, size: 24 })],
      spacing: { after: 60 },
    }));
  });

  if (data.keterangan) {
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: 'Keterangan: ', bold: true, size: 24 }), new TextRun({ text: data.keterangan, size: 22 })],
      spacing: { before: 100, after: 200 },
    }));
  }

  docChildren.push(new Paragraph({
    children: [new TextRun({ text: 'Rincian Program Semester:', bold: true, size: 24 })],
    spacing: { before: 200, after: 100 },
  }));

  // Table
  const tableRows = [
    createHeaderRow(['Bulan', 'Minggu', 'Tema', 'Tujuan Pembelajaran', 'JP']),
  ];

  const bulanList = data.semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;

  bulanList.forEach(bulan => {
    for (let minggu = 1; minggu <= 5; minggu++) {
      const detail = data.details.find(d => d.bulan === bulan && d.minggu === minggu);
      if (detail?.tema || detail?.tujuan_pembelajaran) {
        tableRows.push(createDataRow([
          minggu === 1 ? BULAN_NAMES[bulan] : '',
          String(minggu),
          detail?.tema || '',
          detail?.tujuan_pembelajaran || '',
          detail?.alokasi_waktu || '',
        ]));
      }
    }
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
  const filename = `Promes_${data.mapel}_${data.semester}_${data.tahun_ajaran || 'TA'}.docx`;
  saveAs(blob, filename.replace(/\s+/g, '_'));
}
