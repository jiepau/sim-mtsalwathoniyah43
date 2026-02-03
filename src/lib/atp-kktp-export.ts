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

  const children = [
    // Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'ALUR TUJUAN PEMBELAJARAN (ATP)', bold: true, size: 28 }),
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
              children: [new Paragraph({ children: [new TextRun({ text: 'Fase', bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: `Fase ${atp.fase}` })],
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
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Kelas', bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: atp.kelas ? `Kelas ${atp.kelas}` : '-' })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Semester', bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: atp.semester === 'ganjil' ? 'Ganjil' : atp.semester === 'genap' ? 'Genap' : '-' })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Alokasi Waktu', bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: atp.alokasi_waktu || '-' })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: 'Nilai Karakter', bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ text: nilaiKarakterText })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '' }),

    // Elemen
    ...(atp.elemen ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Elemen:', bold: true })],
      }),
      new Paragraph({ text: atp.elemen }),
      new Paragraph({ text: '' }),
    ] : []),

    // Capaian Pembelajaran
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Capaian Pembelajaran:', bold: true })],
    }),
    new Paragraph({ text: atp.capaian_pembelajaran }),
    new Paragraph({ text: '' }),

    // Tujuan Pembelajaran
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Tujuan Pembelajaran:', bold: true })],
    }),
    ...atp.tujuan_pembelajaran.map((tp, idx) => 
      new Paragraph({ text: `${idx + 1}. ${tp}` })
    ),
    new Paragraph({ text: '' }),
  ];

  // KKTP Section if available
  if (kktpList.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)', bold: true })],
      }),
      new Paragraph({ text: '' }),
    );

    // KKTP Table
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
            width: { size: 30, type: WidthType.PERCENTAGE },
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
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Instrumen', bold: true })] })],
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
  }

  // Signature section
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
