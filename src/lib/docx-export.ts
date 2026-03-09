import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, VerticalAlign } from 'docx';
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
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
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
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ 
        text: part.slice(2, -2), 
        bold: true,
        size: 22
      }));
    } else if (part.trim()) {
      runs.push(new TextRun({ 
        text: part,
        size: 22
      }));
    }
  }
  
  return runs;
}

// Parse a markdown table into rows of cells
function parseMarkdownTable(lines: string[]): string[][] {
  const rows: string[][] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    // Skip separator rows like |---|---|
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
    
    const cells = trimmed
      .split('|')
      .slice(1, -1) // remove first and last empty strings
      .map(c => c.trim());
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

// Create a DOCX table from parsed markdown table data
function createDocxTable(tableData: string[][]): Table {
  if (tableData.length === 0) {
    return new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '-', size: 22 })] })] })] })] });
  }

  const numCols = Math.max(...tableData.map(r => r.length));

  const docxRows = tableData.map((row, rowIndex) => {
    const cells = [];
    for (let i = 0; i < numCols; i++) {
      const cellText = row[i] || '';
      const isHeader = rowIndex === 0;
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  bold: isHeader,
                  size: 20, // 10pt
                  font: 'Calibri',
                }),
              ],
              spacing: { before: 40, after: 40 },
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
          shading: isHeader ? { fill: 'D9E2F3' } : undefined,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
        })
      );
    }
    return new TableRow({ children: cells });
  });

  return new Table({
    rows: docxRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Create paragraphs from content, now handling tables
function createContentElements(content: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const trimmedLine = lines[i].trim();
    
    if (!trimmedLine) {
      i++;
      continue;
    }
    
    // Detect table block (consecutive lines starting with |)
    if (trimmedLine.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const tableData = parseMarkdownTable(tableLines);
      if (tableData.length > 0) {
        elements.push(createDocxTable(tableData));
        elements.push(new Paragraph({ children: [], spacing: { after: 120 } }));
      }
      continue;
    }
    
    // Sub-heading (####)
    if (trimmedLine.startsWith('#### ')) {
      elements.push(new Paragraph({
        children: [new TextRun({ 
          text: trimmedLine.replace(/^####\s+/, ''), 
          bold: true, 
          size: 22,
          font: 'Calibri',
        })],
        spacing: { before: 200, after: 100 },
      }));
      i++;
      continue;
    }
    
    // List items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      elements.push(new Paragraph({
        children: parseInlineMarkdown(trimmedLine.slice(2)),
        bullet: { level: 0 },
        spacing: { after: 80 }
      }));
      i++;
      continue;
    }
    
    if (trimmedLine.match(/^\d+\.\s/)) {
      const textContent = trimmedLine.replace(/^\d+\.\s/, '');
      elements.push(new Paragraph({
        children: parseInlineMarkdown(textContent),
        bullet: { level: 0 },
        spacing: { after: 80 }
      }));
      i++;
      continue;
    }
    
    // Regular paragraph
    elements.push(new Paragraph({
      children: parseInlineMarkdown(trimmedLine),
      spacing: { after: 120 }
    }));
    i++;
  }
  
  return elements;
}

export async function exportToDocx(data: RppExportData): Promise<void> {
  const sections = parseMarkdownSections(data.content);
  
  const docChildren: (Paragraph | Table)[] = [];
  
  // Content sections
  for (const section of sections) {
    if (section.heading) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ 
          text: section.heading.toUpperCase(), 
          bold: true,
          size: 26
        })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 }
      }));
    }
    
    if (section.content) {
      const contentElements = createContentElements(section.content);
      docChildren.push(...contentElements);
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
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
