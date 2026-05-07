import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, XCircle, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone?: () => void;
}

interface RowResult {
  filename: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
  matchedNama?: string;
}

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export function BulkPhotoUploadDialog({ open, onOpenChange, onDone }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<RowResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setFiles([]);
    setResults([]);
    setProgress(0);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setResults([]);
  };

  const startUpload = async () => {
    if (files.length === 0) {
      toast.error('Pilih file foto terlebih dahulu');
      return;
    }
    setUploading(true);
    const newResults: RowResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const baseName = file.name.replace(/\.[^/.]+$/, '').trim();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';

      try {
        if (!ALLOWED.includes(file.type)) {
          throw new Error('Format tidak didukung (JPG/PNG/WEBP saja)');
        }
        if (file.size > MAX_BYTES) {
          throw new Error('Ukuran > 2MB');
        }

        // Cari siswa berdasarkan NIS dulu, lalu NISN
        let { data: siswa } = await supabase
          .from('siswa')
          .select('id, nama, nis, nisn')
          .eq('nis', baseName)
          .maybeSingle();

        if (!siswa) {
          const { data: byNisn } = await supabase
            .from('siswa')
            .select('id, nama, nis, nisn')
            .eq('nisn', baseName)
            .maybeSingle();
          siswa = byNisn;
        }

        if (!siswa) {
          throw new Error(`Siswa tidak ditemukan (NIS/NISN: ${baseName})`);
        }

        const filePath = `${siswa.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('siswa-photos')
          .upload(filePath, file, { upsert: true });
        if (upErr) throw upErr;

        const { error: updErr } = await supabase
          .from('siswa')
          .update({ foto_path: filePath } as any)
          .eq('id', siswa.id);
        if (updErr) throw updErr;

        newResults.push({
          filename: file.name,
          status: 'success',
          matchedNama: siswa.nama,
        });
      } catch (err: any) {
        newResults.push({
          filename: file.name,
          status: 'error',
          message: err.message || 'Gagal upload',
        });
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
      setResults([...newResults]);
    }

    setUploading(false);
    const ok = newResults.filter(r => r.status === 'success').length;
    const fail = newResults.length - ok;
    toast.success(`Selesai: ${ok} berhasil, ${fail} gagal`);
    onDone?.();
  };

  const handleClose = (o: boolean) => {
    if (uploading) return;
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload Foto Siswa Massal
          </DialogTitle>
          <DialogDescription>
            Pilih banyak file foto sekaligus. Nama file harus sesuai{' '}
            <strong>NIS</strong> atau <strong>NISN</strong> siswa.
            <br />
            Contoh: <code>12345.jpg</code> akan diset sebagai foto siswa NIS/NISN 12345.
            <br />
            Format: JPG/PNG/WEBP, maks 2MB per file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFiles}
            disabled={uploading}
          />

          {files.length > 0 && results.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {files.length} file siap diupload
            </p>
          )}

          {uploading && <Progress value={progress} />}

          {results.length > 0 && (
            <ScrollArea className="h-64 border rounded-md p-2">
              <div className="space-y-1">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {r.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <span className="truncate">{r.filename}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.matchedNama && (
                        <Badge variant="secondary" className="text-xs">
                          {r.matchedNama}
                        </Badge>
                      )}
                      {r.message && (
                        <span className="text-xs text-destructive">{r.message}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={uploading}>
            Tutup
          </Button>
          <Button onClick={startUpload} disabled={uploading || files.length === 0}>
            <Upload className="h-4 w-4 mr-1.5" />
            {uploading ? `Mengupload... ${progress}%` : `Upload ${files.length} Foto`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
