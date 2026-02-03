import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';

interface FileUploadProps {
  currentFilePath?: string | null;
  onFileUploaded: (filePath: string | null) => void;
  folder: 'masuk' | 'keluar';
}

export function FileUpload({ currentFilePath, onFileUploaded, folder }: FileUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get public URL for current file
  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('surat-lampiran').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Format tidak didukung',
        description: 'Hanya file PDF, JPG, PNG, atau WebP yang diizinkan',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File terlalu besar',
        description: 'Ukuran file maksimal 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Delete old file if exists
      if (currentFilePath) {
        await supabase.storage.from('surat-lampiran').remove([currentFilePath]);
      }

      // Upload new file
      const { error } = await supabase.storage
        .from('surat-lampiran')
        .upload(fileName, file);

      if (error) throw error;

      onFileUploaded(fileName);
      setPreviewUrl(getPublicUrl(fileName));
      
      toast({
        title: 'Berhasil',
        description: 'File berhasil diupload',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async () => {
    if (!currentFilePath) return;

    try {
      await supabase.storage.from('surat-lampiran').remove([currentFilePath]);
      onFileUploaded(null);
      setPreviewUrl(null);
      toast({
        title: 'Berhasil',
        description: 'File berhasil dihapus',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const displayUrl = previewUrl || (currentFilePath ? getPublicUrl(currentFilePath) : null);
  const isPdf = currentFilePath?.endsWith('.pdf');

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {displayUrl ? (
        <div className="relative border rounded-lg p-3 bg-muted/50">
          <div className="flex items-center gap-3">
            {isPdf ? (
              <FileText className="h-10 w-10 text-destructive" />
            ) : (
              <Image className="h-10 w-10 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentFilePath?.split('/').pop()}
              </p>
              <a
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Lihat file
              </a>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Lampiran (PDF/Gambar)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
