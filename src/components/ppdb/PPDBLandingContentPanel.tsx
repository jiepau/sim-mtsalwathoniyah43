import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LayoutTemplate, Plus, Trash2, Save } from 'lucide-react';

interface JadwalItem {
  fase: string;
  tanggal: string;
  status: 'aktif' | 'akan-datang' | 'selesai';
}

interface LandingContent {
  id: string;
  alamat: string | null;
  whatsapp: string | null;
  jam_layanan: string | null;
  jadwal: JadwalItem[];
  persyaratan: string[];
}

export function PPDBLandingContentPanel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ppdb-landing-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ppdb_settings')
        .select('id, alamat, whatsapp, jam_layanan, jadwal, persyaratan')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LandingContent | null;
    },
  });

  const [alamat, setAlamat] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [jamLayanan, setJamLayanan] = useState('');
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [persyaratan, setPersyaratan] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setAlamat(data.alamat ?? '');
    setWhatsapp(data.whatsapp ?? '');
    setJamLayanan(data.jam_layanan ?? '');
    setJadwal(Array.isArray(data.jadwal) ? data.jadwal : []);
    setPersyaratan(Array.isArray(data.persyaratan) ? data.persyaratan : []);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const { error } = await supabase
        .from('ppdb_settings')
        .update({
          alamat: alamat.trim() || null,
          whatsapp: whatsapp.trim() || null,
          jam_layanan: jamLayanan.trim() || null,
          jadwal: jadwal as unknown as never,
          persyaratan: persyaratan.filter((p) => p.trim()) as unknown as never,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-landing-content'] });
      qc.invalidateQueries({ queryKey: ['ppdb-settings-public'] });
      toast.success('Konten landing SPMB disimpan');
    },
    onError: (e: Error) => toast.error(`Gagal menyimpan: ${e.message}`),
  });

  if (isLoading) return null;

  const updateJadwal = (i: number, patch: Partial<JadwalItem>) => {
    setJadwal((prev) => prev.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Konten Landing SPMB
        </CardTitle>
        <p className="text-xs text-muted-foreground">Edit info yang tampil di halaman publik /spmb</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Kontak */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hubungi Kami</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Alamat</Label>
            <Input value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Jl. Raya ..." className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">No. WhatsApp (format 628...)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="6281234567890" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Jam Layanan</Label>
            <Input value={jamLayanan} onChange={(e) => setJamLayanan(e.target.value)} placeholder="Senin – Sabtu, 07.30 – 14.00 WIB" className="text-sm" />
          </div>
        </div>

        {/* Jadwal */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jadwal SPMB</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setJadwal((p) => [...p, { fase: '', tanggal: '', status: 'akan-datang' }])}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          <div className="space-y-2">
            {jadwal.map((j, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                <Input
                  value={j.fase}
                  onChange={(e) => updateJadwal(i, { fase: e.target.value })}
                  placeholder="Fase"
                  className="col-span-4 h-8 text-xs"
                />
                <Input
                  value={j.tanggal}
                  onChange={(e) => updateJadwal(i, { tanggal: e.target.value })}
                  placeholder="Tanggal"
                  className="col-span-5 h-8 text-xs"
                />
                <select
                  value={j.status}
                  onChange={(e) => updateJadwal(i, { status: e.target.value as JadwalItem['status'] })}
                  className="col-span-2 h-8 text-xs border rounded-md bg-background px-1"
                >
                  <option value="aktif">Aktif</option>
                  <option value="akan-datang">Akan</option>
                  <option value="selesai">Selesai</option>
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="col-span-1 h-8 w-8 p-0"
                  onClick={() => setJadwal((p) => p.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            {jadwal.length === 0 && <p className="text-xs text-muted-foreground italic">Belum ada jadwal</p>}
          </div>
        </div>

        {/* Persyaratan */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Persyaratan Dokumen</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setPersyaratan((p) => [...p, ''])}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          <div className="space-y-2">
            {persyaratan.map((p, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <Input
                  value={p}
                  onChange={(e) => setPersyaratan((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                  placeholder="Mis. Fotokopi Akta Kelahiran"
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => setPersyaratan((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            {persyaratan.length === 0 && <p className="text-xs text-muted-foreground italic">Belum ada persyaratan</p>}
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full"
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Konten Landing'}
        </Button>
      </CardContent>
    </Card>
  );
}
