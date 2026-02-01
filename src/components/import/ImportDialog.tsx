import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  templateHeaders: string[];
  templateFileName: string;
  templateSampleData?: string[][];
  onImport: (data: Record<string, string>[]) => Promise<ImportResult>;
  onSuccess: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  templateHeaders,
  templateFileName,
  templateSampleData = [],
  onImport,
  onSuccess,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    // Create proper CSV with semicolon separator (Excel compatible)
    const BOM = '\uFEFF';
    
    // Helper function to escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(';') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    let content = BOM + templateHeaders.map(escapeCSV).join(';') + '\n';
    
    // Add sample data rows
    templateSampleData.forEach(row => {
      content += row.map(escapeCSV).join(';') + '\n';
    });

    // Download as .csv with proper MIME type
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = templateFileName.endsWith('.csv') ? templateFileName : templateFileName.replace(/\.[^/.]+$/, '.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('File harus memiliki minimal 1 baris data selain header');
    }

    // Detect delimiter: tab first (from Excel), then semicolon, then comma
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    }
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length !== headers.length) continue;
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setParseError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(10);
    setParseError(null);

    try {
      const text = await file.text();
      setProgress(30);

      const data = parseCSV(text);
      if (data.length === 0) {
        throw new Error('Tidak ada data valid dalam file');
      }

      setProgress(50);
      const importResult = await onImport(data);
      setProgress(100);
      setResult(importResult);

      if (importResult.success > 0) {
        onSuccess();
      }
    } catch (error: any) {
      setParseError(error.message || 'Gagal memproses file');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setParseError(null);
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Upload file CSV untuk import data secara massal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Download Template</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Gunakan template ini untuk format data yang benar
                </p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template Excel
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Bisa langsung copy-paste dari Excel karena menggunakan format tab
                </p>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6" />
                {file ? (
                  <span className="text-sm font-medium">{file.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Klik untuk pilih file CSV
                  </span>
                )}
              </div>
            </Button>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Mengimport data...
              </p>
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2">
          {result.success > 0 && (
            <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {result.success} data berhasil diimport
              </AlertDescription>
            </Alert>
          )}
              {result.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p>{result.failed} data gagal diimport:</p>
                    <ul className="list-disc list-inside mt-1 text-xs max-h-24 overflow-auto">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...dan {result.errors.length - 5} error lainnya</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? 'Mengimport...' : 'Import Data'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
