import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';

interface ATP {
  id: string;
  mapel: string;
  fase: string;
  kelas: number | null;
  semester: string | null;
  elemen: string | null;
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string[];
  alokasi_waktu: string | null;
  nilai_karakter?: string[];
  keterangan: string | null;
  guru?: { nama: string } | null;
  tahun_ajaran?: { nama_ta: string } | null;
}

interface KKTP {
  id: string;
  tujuan_pembelajaran: string;
  kriteria_ketercapaian: string[];
  teknik_penilaian: string | null;
  bentuk_instrumen: string | null;
  keterangan: string | null;
}

interface MadrasahSettings {
  nama_madrasah: string;
  alamat: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
}

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

const NILAI_KARAKTER_LABELS: Record<string, string> = {
  'kasih_sayang': 'Kasih Sayang',
  'empati': 'Empati',
  'ketulusan': 'Ketulusan',
  'kesabaran': 'Kesabaran',
  'toleransi': 'Toleransi',
  'tanggung_jawab': 'Tanggung Jawab',
  'kejujuran': 'Kejujuran',
  'kerjasama': 'Kerjasama',
};

export async function exportATPToWord(
  atp: ATP,
  kktpList: KKTP[],
  madrasah: MadrasahSettings
): Promise<void> {
  const nilaiKarakterText = atp.nilai_karakter && atp.nilai_karakter.length > 0
    ? atp.nilai_karakter.map(n => NILAI_KARAKTER_LABELS[n] || n).join(', ')
    : '-';

  const headerCellStyle = {
    borders: cellBorders,
    shading: { fill: 'D9E2F3' },
  };

  const children: (Paragraph | Table)[] = [
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: 'ALUR TUJUAN PEMBELAJARAN', bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `TAHUN PELAJARAN ${atp.tahun_ajaran?.nama_ta || '20.../20...'}`, bold: true, size: 24 }),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 100 } }),

    // Section A: Capaian Pembelajaran
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: 'A. CAPAIAN PEMBELAJARAN', bold: true, size: 24 })],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: atp.capaian_pembelajaran, size: 22 })],
    }),
    new Paragraph({ text: '' }),
  ];

  // Section B: Elemen Capaian Pembelajaran (if available)
  if (atp.elemen) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: 'B. ELEMEN CAPAIAN PEMBELAJARAN', bold: true, size: 24 })],
      }),
    );

    const elemenList = atp.elemen.split(',').map(e => e.trim()).filter(e => e);
    if (elemenList.length > 0) {
      const elemenRows = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              ...headerCellStyle,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ELEMEN', bold: true, size: 20 })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              ...headerCellStyle,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CAPAIAN PEMBELAJARAN', bold: true, size: 20 })] })],
            }),
          ],
        }),
        ...elemenList.map(el =>
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                children: [new Paragraph({ children: [new TextRun({ text: el, bold: true, size: 20 })] })],
              }),
              new TableCell({
                borders: cellBorders,
                children: [new Paragraph({ children: [new TextRun({ text: '-', size: 20 })] })],
              }),
            ],
          })
        ),
      ];
      children.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: elemenRows }),
        new Paragraph({ text: '' }),
      );
    }
  }

  // Info row: Mapel, Kelas/Semester, Fase, Alokasi Waktu
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [new Paragraph({ children: [
                new TextRun({ text: 'Mata Pelajaran: ', bold: true, size: 20 }),
                new TextRun({ text: atp.mapel, size: 20 }),
              ] })],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [new Paragraph({ children: [
                new TextRun({ text: `Kelas/Semester: `, bold: true, size: 20 }),
                new TextRun({ text: `${atp.kelas || '-'} / ${atp.semester === 'ganjil' ? 'Ganjil' : atp.semester === 'genap' ? 'Genap' : '-'}`, size: 20 }),
              ] })],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [new Paragraph({ children: [
                new TextRun({ text: 'Fase: ', bold: true, size: 20 }),
                new TextRun({ text: atp.fase, size: 20 }),
                new TextRun({ text: '\nAlokasi Waktu: ', bold: true, size: 20 }),
                new TextRun({ text: atp.alokasi_waktu || '-', size: 20 }),
              ] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  );

  // Main ATP Table: TP with KKTP data
  const mainTableHeader = new TableRow({
    children: [
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        ...headerCellStyle,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        ...headerCellStyle,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tujuan Pembelajaran', bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        ...headerCellStyle,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kriteria Ketercapaian', bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        ...headerCellStyle,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Teknik Penilaian', bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        ...headerCellStyle,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Instrumen', bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        ...headerCellStyle,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nilai Karakter', bold: true, size: 20 })] })],
      }),
    ],
  });

  const mainTableRows = atp.tujuan_pembelajaran.map((tp, idx) => {
    // Find matching KKTP for this TP
    const matchingKktp = kktpList.find(k => k.tujuan_pembelajaran === tp) || kktpList[idx];

    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, size: 20 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: tp, size: 20 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: matchingKktp && matchingKktp.kriteria_ketercapaian.length > 0
            ? matchingKktp.kriteria_ketercapaian.map((k, i) =>
                new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${k}`, size: 20 })] })
              )
            : [new Paragraph({ children: [new TextRun({ text: '-', size: 20 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: matchingKktp?.teknik_penilaian || '-', size: 20 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: matchingKktp?.bentuk_instrumen || '-', size: 20 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: idx === 0 ? nilaiKarakterText : '', size: 18 })] })],
        }),
      ],
    });
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [mainTableHeader, ...mainTableRows],
    }),
  );

  // Guru info
  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Guru Pengampu: ', bold: true, size: 22 }),
        new TextRun({ text: atp.guru?.nama || '-', size: 22 }),
      ],
    }),
  );

  // Signature section
  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `.............................., ........................... 20.....`, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'Mengetahui,', size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'Guru Pengampu,', size: 22 })],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: atp.guru?.nama || '_____________________', bold: true, size: 22, underline: {} })],
    }),
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 16838, height: 11906, orientation: 1 }, // Landscape A4 (values in twips, orientation 1 = landscape)
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `ATP_${atp.mapel}_Kelas${atp.kelas || 'X'}_${atp.semester || ''}.docx`.replace(/\s+/g, '_');
  saveAs(blob, fileName);
}

export async function exportKKTPToWord(
  atp: ATP,
  kktpList: KKTP[],
  madrasah: MadrasahSettings
): Promise<void> {
  const children = [
    // Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)', bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: madrasah.nama_madrasah, bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: madrasah.alamat || '', size: 20 }),
      ],
    }),
    new Paragraph({ text: '' }),

    // Info Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Mata Pelajaran', bold: true })] })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [new Paragraph({ text: atp.mapel })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Guru Pengampu', bold: true })] })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [new Paragraph({ text: atp.guru?.nama || '-' })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Fase/Kelas', bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: `Fase ${atp.fase} / Kelas ${atp.kelas || '-'}` })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Tahun Ajaran', bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: atp.tahun_ajaran?.nama_ta || '-' })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  // KKTP Table
  if (kktpList.length > 0) {
    const kktpTableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true })] })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tujuan Pembelajaran', bold: true })] })],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kriteria Ketercapaian', bold: true })] })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Teknik Penilaian', bold: true })] })],
          }),
          new TableCell({
            width: { size: 13, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Instrumen', bold: true })] })],
          }),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Keterangan', bold: true })] })],
          }),
        ],
      }),
      ...kktpList.map((kktp, idx) => 
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, text: `${idx + 1}` })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: kktp.tujuan_pembelajaran })],
            }),
            new TableCell({
              borders: cellBorders,
              children: kktp.kriteria_ketercapaian.map((k, i) => 
                new Paragraph({ text: `${i + 1}. ${k}` })
              ),
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: kktp.teknik_penilaian || '-' })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: kktp.bentuk_instrumen || '-' })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: kktp.keterangan || '-' })],
            }),
          ],
        })
      ),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: kktpTableRows,
      }),
    );
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Belum ada data KKTP untuk ATP ini', italics: true })],
      }),
    );
  }

  // Signature
  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `.............................., ........................... 20.....` })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'Guru Pengampu,' })],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: atp.guru?.nama || '_____________________', bold: true })],
    }),
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `KKTP_${atp.mapel}_Kelas${atp.kelas || 'X'}_${atp.semester || ''}.docx`.replace(/\s+/g, '_');
  saveAs(blob, fileName);
}
