import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, ExternalLink, Settings, Lock, Clock as Unlock, Archive, Loader as Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PpdbSettings {
  id: string;
  is_open: boolean;
  tahun_ajaran: string | null;
  pesan_selamat: string | null;
  is_finalized?: boolean;
  finalized_at?: string | null;
  finalized_by?: string | null;
}

export function PPDBSettingsPanel() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['ppdb-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ppdb_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as PpdbSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<PpdbSettings>) => {
      if (!settings) return;
      const { error } = await supabase
        .from('ppdb_settings')
        .update(patch)
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-settings'] });
      qc.invalidateQueries({ queryKey: ['ppdb-settings-public'] });
      toast.success('Pengaturan SPMB disimpan');
    },
    onError: (e: Error) => toast.error(`Gagal menyimpan: ${e.message}`),
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('ppdb_settings')
        .update({
          is_open: false,
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          finalized_by: user?.id,
        })
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-settings'] });
      qc.invalidateQueries({ queryKey: ['ppdb-settings-public'] });
      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
      toast.success('SPMB telah difinalisasi. Pendaftaran ditutup.');
    },
    onError: (e: Error) => toast.error(`Gagal finalisasi: ${e.message}`),
  });

  const [editTA, setEditTA] = useState('');
  useEffect(() => {
    if (settings?.tahun_ajaran) setEditTA(settings.tahun_ajaran);
  }, [settings?.tahun_ajaran]);

  const publicUrl = `${window.location.origin}/spmb/daftar`;
  const cekStatusUrl = `${window.location.origin}/spmb/cek-status`;
  if (isLoading) return null;

  const isFinalized = settings?.is_finalized === true;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Pengaturan SPMB
          {isFinalized && (
            <Badge variant="secondary" className="ml-auto text-xs bg-amber-100 text-amber-800 border-amber-200">
              <Archive className="h-3 w-3 mr-1" /> Finalized
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Finalisasi */}
        {isFinalized && settings?.finalized_at && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            <Lock className="h-3.5 w-3.5 inline mr-1" />
            SPMB telah difinalisasi pada {new Date(settings.finalized_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}. Pendaftaran tidak dapat dibuka kembali.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Pendaftaran Dibuka</Label>
            <p className="text-xs text-muted-foreground">
              {settings?.is_open ? 'Pendaftaran sedang BUKA' : 'Pendaftaran sedang TUTUP'}
            </p>
          </div>
          <Switch
            checked={settings?.is_open ?? false}
            onCheckedChange={(v) => updateMutation.mutate({ is_open: v })}
            disabled={isFinalized}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Tahun Ajaran</Label>
          <div className="flex gap-2">
            <Input
              value={editTA}
              placeholder="2025/2026"
              className="text-sm"
              onChange={(e) => setEditTA(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const v = editTA.trim();
                if (!/^\d{4}\/\d{4}$/.test(v)) {
                  toast.error('Format harus YYYY/YYYY, contoh 2026/2027');
                  return;
                }
                updateMutation.mutate({ tahun_ajaran: v });
              }}
            >
              Simpan
            </Button>
          </div>
        </div>


        <div className="space-y-1.5">
          <Label className="text-sm">Link Pendaftaran</Label>
          <div className="flex gap-2">
            <Input value={publicUrl} readOnly className="text-xs" />
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link disalin'); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.open(publicUrl, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Link Cek Status</Label>
          <div className="flex gap-2">
            <Input value={cekStatusUrl} readOnly className="text-xs" />
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(cekStatusUrl); toast.success('Link disalin'); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.open(cekStatusUrl, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tombol Finalisasi */}
        {!isFinalized && (
          <div className="pt-3 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-amber-300 text-amber-800 hover:bg-amber-50"
                  disabled={settings?.is_open}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Tutup & Finalisasi SPMB
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalisasi SPMB</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Tindakan ini akan <strong>menutup pendaftaran secara permanen</strong> untuk Tahun Ajaran {settings?.tahun_ajaran || 'ini'}.
                    </p>
                    <p className="text-amber-600 font-medium">
                      Setelah difinalisasi, Anda tidak dapat membuka pendaftaran kembali atau mengubah status pendaftar.
                    </p>
                    <p>
                      Pastikan semua pendaftar sudah diproses (diterima/ditolak) sebelum finalisasi.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => finalizeMutation.mutate()}
                    disabled={finalizeMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {finalizeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Ya, Finalisasi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {settings?.is_open && (
              <p className="text-xs text-muted-foreground mt-2">
                Tutup pendaftaran terlebih dahulu sebelum finalisasi.
              </p>
            )}
          </div>
        )}

        {/* Status jika sudah final */}
        {isFinalized && (
          <div className="pt-3 border-t flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Unlock className="h-4 w-4" />
            SPMB telah diarsipkan
          </div>
        )}
      </CardContent>
    </Card>
  );
}
