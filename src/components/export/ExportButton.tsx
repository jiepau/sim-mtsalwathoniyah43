import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps<T> {
  data: T[];
  columns: { header: string; accessor: (item: T) => string | number | null | undefined }[];
  filename: string;
  disabled?: boolean;
}

export function ExportButton<T>({ data, columns, filename, disabled }: ExportButtonProps<T>) {
  const handleExport = () => {
    if (data.length === 0) return;

    const BOM = '\uFEFF';
    
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Header row
    let content = BOM + 'sep=,\n';
    content += columns.map(col => escapeCSV(col.header)).join(',') + '\n';

    // Data rows
    data.forEach(item => {
      const row = columns.map(col => escapeCSV(col.accessor(item)));
      content += row.join(',') + '\n';
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={disabled || data.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Download Excel
    </Button>
  );
}
