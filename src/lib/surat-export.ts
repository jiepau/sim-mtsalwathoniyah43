import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface SuratKeluarData {
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  klasifikasi: string;
  keterangan?: string | null;
}

interface MadrasahData {
  nama_madrasah: string;
  alamat?: string | null;
  kabupaten_kota?: string | null;
  provinsi?: string | null;
  no_telp?: string | null;
  email?: string | null;
  website?: string | null;
  kepala_madrasah?: string | null;
  nip_kepala?: string | null;
}

const formatTanggal = (dateStr: string): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export async function exportSuratKeluar(surat: SuratKeluarData, madrasah: MadrasahData) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm in twips
              bottom: 1134,
              left: 1701, // 3cm
              right: 1134, // 2cm
            },
          },
        },
        children: [
          // Kop Surat
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: madrasah.nama_madrasah.toUpperCase(),
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: madrasah.alamat || '',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${madrasah.kabupaten_kota || ''} - ${madrasah.provinsi || ''}`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Telp: ${madrasah.no_telp || '-'} | Email: ${madrasah.email || '-'}`,
                size: 18,
              }),
            ],
          }),
          
          // Garis pembatas
          new Paragraph({
            border: {
              bottom: {
                color: '000000',
                size: 12,
                style: BorderStyle.SINGLE,
              },
            },
            spacing: { after: 200 },
          }),

          // Spacing
          new Paragraph({ spacing: { after: 200 } }),

          // Nomor, Lampiran, Perihal
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Nomor', size: 24 })] })],
                  }),
                  new TableCell({
                    width: { size: 3, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: ':', size: 24 })] })],
                  }),
                  new TableCell({
                    width: { size: 82, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: surat.nomor_surat, size: 24 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Lampiran', size: 24 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: ':', size: 24 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '-', size: 24 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Perihal', size: 24 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: ':', size: 24 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: surat.perihal, size: 24, bold: true })] })],
                  }),
                ],
              }),
            ],
          }),

          // Spacing
          new Paragraph({ spacing: { after: 400 } }),

          // Kepada Yth
          new Paragraph({
            children: [
              new TextRun({ text: 'Kepada Yth.', size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: surat.tujuan, size: 24, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'di Tempat', size: 24 }),
            ],
          }),

          // Spacing
          new Paragraph({ spacing: { after: 400 } }),

          // Salam pembuka
          new Paragraph({
            children: [
              new TextRun({ text: 'Assalamu\'alaikum Wr. Wb.', size: 24, italics: true }),
            ],
          }),

          // Spacing
          new Paragraph({ spacing: { after: 200 } }),

          // Isi surat (placeholder)
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({ 
                text: surat.keterangan || 'Dengan hormat, bersama surat ini kami sampaikan...', 
                size: 24 
              }),
            ],
          }),

          // Spacing
          new Paragraph({ spacing: { after: 200 } }),

          // Penutup
          new Paragraph({
            children: [
              new TextRun({ text: 'Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.', size: 24 }),
            ],
          }),

          // Spacing
          new Paragraph({ spacing: { after: 200 } }),

          // Salam penutup
          new Paragraph({
            children: [
              new TextRun({ text: 'Wassalamu\'alaikum Wr. Wb.', size: 24, italics: true }),
            ],
          }),

          // Spacing untuk TTD
          new Paragraph({ spacing: { after: 400 } }),

          // TTD section
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `${madrasah.kabupaten_kota || ''}, ${formatTanggal(surat.tanggal_surat)}`, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Kepala Madrasah,', size: 24 }),
            ],
          }),

          // Space for signature
          new Paragraph({ spacing: { after: 800 } }),
          new Paragraph({ spacing: { after: 800 } }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: madrasah.kepala_madrasah || '............................', size: 24, bold: true, underline: {} }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `NIP. ${madrasah.nip_kepala || '-'}`, size: 22 }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Surat_${surat.nomor_surat.replace(/\//g, '-')}.docx`;
  saveAs(blob, fileName);
}
