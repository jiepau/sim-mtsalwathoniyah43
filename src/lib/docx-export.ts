import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface RppExportData {
  jenjang: string;
  kelas: string;
  semester: string;
  mapel: string;
  topik: string;
  alokasi_waktu: string;
  content: string;
}

// Parse markdown content into sections
function parseMarkdownSections(content: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  const lines = content.split('\n');
  let currentHeading = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check for headings (## or ###)
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      // Save previous section
      if (currentHeading || currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n').trim()
        });
      }
      currentHeading = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentHeading || currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n').trim()
    });
  }

  return sections;
}

// Convert markdown text to TextRun array
function parseInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = [];
  
  // Simple parsing for bold (**text**) and clean up
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ 
        text: part.slice(2, -2), 
        bold: true,
        size: 24 // 12pt
      }));
    } else if (part.trim()) {
      runs.push(new TextRun({ 
        text: part,
        size: 24 // 12pt
      }));
    }
  }
  
  return runs;
}

// Create paragraphs from content
function createContentParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;
    
    // Check for list items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      paragraphs.push(new Paragraph({
        children: parseInlineMarkdown(trimmedLine.slice(2)),
        bullet: { level: 0 },
        spacing: { after: 100 }
      }));
    } else if (trimmedLine.match(/^\d+\.\s/)) {
      // Numbered list
      const textContent = trimmedLine.replace(/^\d+\.\s/, '');
      paragraphs.push(new Paragraph({
        children: parseInlineMarkdown(textContent),
        bullet: { level: 0 },
        spacing: { after: 100 }
      }));
    } else if (trimmedLine.startsWith('|')) {
      // Skip table markdown (handled separately if needed)
      continue;
    } else {
      paragraphs.push(new Paragraph({
        children: parseInlineMarkdown(trimmedLine),
        spacing: { after: 120 }
      }));
    }
  }
  
  return paragraphs;
}

export async function exportToDocx(data: RppExportData): Promise<void> {
  const sections = parseMarkdownSections(data.content);
  
  const docChildren: Paragraph[] = [];
  
  // Title
  docChildren.push(new Paragraph({
    children: [new TextRun({ 
      text: 'RENCANA PELAKSANAAN PEMBELAJARAN', 
      bold: true,
      size: 32 // 16pt
    })],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  }));
  
  docChildren.push(new Paragraph({
    children: [new TextRun({ 
      text: '(RPP/MODUL AJAR)', 
      bold: true,
      size: 28 // 14pt
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 }
  }));
  
  // Header info
  const headerInfo = [
    `Jenjang: ${data.jenjang}`,
    `Kelas: ${data.kelas}`,
    `Semester: ${data.semester}`,
    `Mata Pelajaran: ${data.mapel}`,
    `Topik: ${data.topik}`,
    `Alokasi Waktu: ${data.alokasi_waktu}`
  ];
  
  for (const info of headerInfo) {
    docChildren.push(new Paragraph({
      children: [new TextRun({ text: info, size: 24 })],
      spacing: { after: 60 }
    }));
  }
  
  docChildren.push(new Paragraph({
    children: [],
    spacing: { after: 300 }
  }));
  
  // Separator line
  docChildren.push(new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' }
    },
    spacing: { after: 300 }
  }));
  
  // Content sections
  for (const section of sections) {
    if (section.heading) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ 
          text: section.heading.toUpperCase(), 
          bold: true,
          size: 26 // 13pt
        })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 }
      }));
    }
    
    if (section.content) {
      const contentParagraphs = createContentParagraphs(section.content);
      docChildren.push(...contentParagraphs);
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: docChildren
    }]
  });
  
  const blob = await Packer.toBlob(doc);
  const filename = `RPP_${data.mapel}_${data.topik.replace(/\s+/g, '_')}.docx`;
  saveAs(blob, filename);
}
