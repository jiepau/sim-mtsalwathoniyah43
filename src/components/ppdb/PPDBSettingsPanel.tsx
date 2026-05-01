import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, ExternalLink, Settings } from 'lucide-react';

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
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: { is_open?: boolean; tahun_ajaran?: string; pesan_selamat?: string }) => {
      if (!settings) return;
      const { error } = await supabase
        .from('ppdb_settings')
        .update(patch)
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-settings'] });
      toast.success('Pengaturan PPDB disimpan');
    },
    onError: () => toast.error('Gagal menyimpan pengaturan'),
  });

  const [editTA, setEditTA] = useState('');

  const publicUrl = `${window.location.origin}/ppdb/daftar`;

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Pengaturan PPDB
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Tahun Ajaran</Label>
          <div className="flex gap-2">
            <Input
              defaultValue={settings?.tahun_ajaran ?? ''}
              placeholder="2025/2026"
              className="text-sm"
              onChange={(e) => setEditTA(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (editTA) updateMutation.mutate({ tahun_ajaran: editTA });
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success('Link disalin');
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(publicUrl, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
