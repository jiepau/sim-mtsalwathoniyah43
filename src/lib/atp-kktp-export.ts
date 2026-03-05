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
  BorderStyle,
  VerticalAlign,
  TableLayoutType,
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

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
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

function headerCell(text: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders,
    shading: { fill: 'D9E2F3' },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, bold: true, size: 20, font: 'Times New Roman' })],
      }),
    ],
  });
}

function textCell(text: string, options?: { bold?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType] }): TableCell {
  return new TableCell({
    borders,
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        alignment: options?.align || AlignmentType.LEFT,
        spacing: { before: 20, after: 20 },
        children: [new TextRun({ text, size: 20, font: 'Times New Roman', bold: options?.bold })],
      }),
    ],
  });
}

function infoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: noBorders,
        children: [
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: label, size: 22, font: 'Times New Roman' })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 3, type: WidthType.PERCENTAGE },
        borders: noBorders,
        children: [
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: ':', size: 22, font: 'Times New Roman' })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 67, type: WidthType.PERCENTAGE },
        borders: noBorders,
        children: [
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: value, size: 22, font: 'Times New Roman' })],
          }),
        ],
      }),
    ],
  });
}

export async function exportATPToWord(
  atp: ATP,
  kktpList: KKTP[],
  madrasah: MadrasahSettings
): Promise<void> {
  const semesterLabel = atp.semester === 'ganjil' ? 'Ganjil' : atp.semester === 'genap' ? 'Genap' : '-';
  const nilaiKarakterText = atp.nilai_karakter && atp.nilai_karakter.length > 0
    ? atp.nilai_karakter.map(n => NILAI_KARAKTER_LABELS[n] || n).join(', ')
    : '-';

  const children: (Paragraph | Table)[] = [];

  // === JUDUL ===
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'ALUR TUJUAN PEMBELAJARAN (ATP)', bold: true, size: 26, font: 'Times New Roman' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: madrasah.nama_madrasah.toUpperCase(), bold: true, size: 24, font: 'Times New Roman' })],
    }),
  );

  // === INFO IDENTITAS (tanpa border, format label : value) ===
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        infoRow('Mata Pelajaran', atp.mapel),
        infoRow('Fase', atp.fase),
        infoRow('Kelas / Semester', `${atp.kelas || '-'} / ${semesterLabel}`),
        infoRow('Tahun Pelajaran', atp.tahun_ajaran?.nama_ta || '-'),
        infoRow('Guru Pengampu', atp.guru?.nama || '-'),
        infoRow('Alokasi Waktu', atp.alokasi_waktu || '-'),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
  );

  // === CAPAIAN PEMBELAJARAN ===
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: 'A. Capaian Pembelajaran', bold: true, size: 22, font: 'Times New Roman' })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      indent: { left: 360 },
      children: [new TextRun({ text: atp.capaian_pembelajaran, size: 22, font: 'Times New Roman' })],
    }),
  );

  // === ELEMEN (jika ada) ===
  if (atp.elemen) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: 'B. Elemen Capaian Pembelajaran', bold: true, size: 22, font: 'Times New Roman' })],
      }),
    );
    const elemenList = atp.elemen.split(',').map(e => e.trim()).filter(e => e);
    elemenList.forEach((el, i) => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: 360 },
          children: [new TextRun({ text: `${i + 1}. ${el}`, size: 22, font: 'Times New Roman' })],
        }),
      );
    });
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  }

  // === TABEL UTAMA ATP ===
  const sectionLabel = atp.elemen ? 'C' : 'B';
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: `${sectionLabel}. Alur Tujuan Pembelajaran`, bold: true, size: 22, font: 'Times New Roman' })],
    }),
  );

  const tableHeader = new TableRow({
    tableHeader: true,
    children: [
      headerCell('No', 5),
      headerCell('Tujuan Pembelajaran', 35),
      headerCell('Kriteria Ketercapaian TP', 25),
      headerCell('Teknik Penilaian', 12),
      headerCell('Instrumen', 12),
      headerCell('Nilai Karakter', 11),
    ],
  });

  const tableRows = atp.tujuan_pembelajaran.map((tp, idx) => {
    const matchingKktp = kktpList.find(k => k.tujuan_pembelajaran === tp) || kktpList[idx];
    const kriteriaChildren = matchingKktp && matchingKktp.kriteria_ketercapaian && matchingKktp.kriteria_ketercapaian.length > 0
      ? matchingKktp.kriteria_ketercapaian.map((k, i) =>
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: `${i + 1}. ${k}`, size: 20, font: 'Times New Roman' })],
          })
        )
      : [new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: '-', size: 20, font: 'Times New Roman' })],
        })];

    return new TableRow({
      children: [
        // No
        new TableCell({
          borders,
          verticalAlign: VerticalAlign.TOP,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: `${idx + 1}`, size: 20, font: 'Times New Roman' })],
          })],
        }),
        // TP
        new TableCell({
          borders,
          verticalAlign: VerticalAlign.TOP,
          children: [new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: tp, size: 20, font: 'Times New Roman' })],
          })],
        }),
        // Kriteria
        new TableCell({
          borders,
          verticalAlign: VerticalAlign.TOP,
          children: kriteriaChildren,
        }),
        // Teknik Penilaian
        textCell(matchingKktp?.teknik_penilaian || '-'),
        // Instrumen
        textCell(matchingKktp?.bentuk_instrumen || '-'),
        // Nilai Karakter (hanya di baris pertama)
        textCell(idx === 0 ? nilaiKarakterText : ''),
      ],
    });
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [tableHeader, ...tableRows],
    }),
  );

  // === TANDA TANGAN ===
  children.push(
    new Paragraph({ text: '', spacing: { after: 100 } }),
    new Paragraph({ text: '', spacing: { after: 100 } }),
  );

  // Tanda tangan 2 kolom: Kepala Madrasah (kiri) & Guru Pengampu (kanan)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Mengetahui,', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Kepala Madrasah', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: madrasah.kepala_madrasah || '_____________________', bold: true, size: 22, font: 'Times New Roman', underline: {} })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: madrasah.nip_kepala ? `NIP. ${madrasah.nip_kepala}` : '', size: 20, font: 'Times New Roman' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '.............................., .................... 20.....', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Guru Pengampu', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: atp.guru?.nama || '_____________________', bold: true, size: 22, font: 'Times New Roman', underline: {} })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 16838, height: 11906, orientation: 'landscape' as const },
          margin: { top: 720, right: 720, bottom: 720, left: 1080 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `ATP_${atp.mapel}_Kelas${atp.kelas || 'X'}_${semesterLabel}.docx`.replace(/\s+/g, '_');
  saveAs(blob, fileName);
}

export async function exportKKTPToWord(
  atp: ATP,
  kktpList: KKTP[],
  madrasah: MadrasahSettings
): Promise<void> {
  const semesterLabel = atp.semester === 'ganjil' ? 'Ganjil' : atp.semester === 'genap' ? 'Genap' : '-';

  const children: (Paragraph | Table)[] = [
    // Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)', bold: true, size: 26, font: 'Times New Roman' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: madrasah.nama_madrasah.toUpperCase(), bold: true, size: 24, font: 'Times New Roman' })],
    }),

    // Info
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        infoRow('Mata Pelajaran', atp.mapel),
        infoRow('Fase / Kelas', `Fase ${atp.fase} / Kelas ${atp.kelas || '-'}`),
        infoRow('Semester', semesterLabel),
        infoRow('Tahun Pelajaran', atp.tahun_ajaran?.nama_ta || '-'),
        infoRow('Guru Pengampu', atp.guru?.nama || '-'),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
  ];

  // KKTP Table
  if (kktpList.length > 0) {
    const kktpRows = [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('No', 5),
          headerCell('Tujuan Pembelajaran', 25),
          headerCell('Kriteria Ketercapaian', 30),
          headerCell('Teknik Penilaian', 15),
          headerCell('Instrumen', 13),
          headerCell('Keterangan', 12),
        ],
      }),
      ...kktpList.map((kktp, idx) =>
        new TableRow({
          children: [
            new TableCell({
              borders,
              verticalAlign: VerticalAlign.TOP,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 20 },
                children: [new TextRun({ text: `${idx + 1}`, size: 20, font: 'Times New Roman' })],
              })],
            }),
            new TableCell({
              borders,
              verticalAlign: VerticalAlign.TOP,
              children: [new Paragraph({
                spacing: { before: 20, after: 20 },
                children: [new TextRun({ text: kktp.tujuan_pembelajaran, size: 20, font: 'Times New Roman' })],
              })],
            }),
            new TableCell({
              borders,
              verticalAlign: VerticalAlign.TOP,
              children: (kktp.kriteria_ketercapaian && kktp.kriteria_ketercapaian.length > 0)
                ? kktp.kriteria_ketercapaian.map((k, i) =>
                    new Paragraph({
                      spacing: { before: 20, after: 20 },
                      children: [new TextRun({ text: `${i + 1}. ${k}`, size: 20, font: 'Times New Roman' })],
                    })
                  )
                : [new Paragraph({ children: [new TextRun({ text: '-', size: 20, font: 'Times New Roman' })] })],
            }),
            textCell(kktp.teknik_penilaian || '-'),
            textCell(kktp.bentuk_instrumen || '-'),
            textCell(kktp.keterangan || '-'),
          ],
        })
      ),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: kktpRows,
      }),
    );
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Belum ada data KKTP untuk ATP ini', italics: true, size: 22, font: 'Times New Roman' })],
      }),
    );
  }

  // Tanda tangan
  children.push(
    new Paragraph({ text: '', spacing: { after: 100 } }),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Mengetahui,', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Kepala Madrasah', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: madrasah.kepala_madrasah || '_____________________', bold: true, size: 22, font: 'Times New Roman', underline: {} })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: madrasah.nip_kepala ? `NIP. ${madrasah.nip_kepala}` : '', size: 20, font: 'Times New Roman' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '.............................., .................... 20.....', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Guru Pengampu', size: 22, font: 'Times New Roman' })],
                }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: atp.guru?.nama || '_____________________', bold: true, size: 22, font: 'Times New Roman', underline: {} })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, right: 720, bottom: 720, left: 1080 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `KKTP_${atp.mapel}_Kelas${atp.kelas || 'X'}_${semesterLabel}.docx`.replace(/\s+/g, '_');
  saveAs(blob, fileName);
}
