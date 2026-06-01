import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export function PengaturanGajiTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    id: '',
    tarif_per_hadir: '0',
    potongan_per_tidak_masuk: '0',
    potongan_per_alpa: '0',
    potongan_per_izin: '0',
    potongan_per_sakit: '0',
    format_nomor_slip: 'SLIP/{bulan}/{tahun}/{seq}',
    judul_slip: 'SLIP GAJI GURU & TENAGA KEPENDIDIKAN',
    hari_kerja_per_minggu: '6',
  });
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['gaji-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gaji_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        tarif_per_hadir: String(data.tarif_per_hadir),
        potongan_per_tidak_masuk: String((data as any).potongan_per_tidak_masuk ?? 0),
        potongan_per_alpa: String(data.potongan_per_alpa),
        potongan_per_izin: String(data.potongan_per_izin),
        potongan_per_sakit: String(data.potongan_per_sakit),
        format_nomor_slip: data.format_nomor_slip,
        judul_slip: data.judul_slip,
        hari_kerja_per_minggu: String(data.hari_kerja_per_minggu),
      });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        tarif_per_hadir: Number(form.tarif_per_hadir) || 0,
        potongan_per_tidak_masuk: Number(form.potongan_per_tidak_masuk) || 0,
        potongan_per_alpa: Number(form.potongan_per_alpa) || 0,
        potongan_per_izin: Number(form.potongan_per_izin) || 0,
        potongan_per_sakit: Number(form.potongan_per_sakit) || 0,
        format_nomor_slip: form.format_nomor_slip,
        judul_slip: form.judul_slip,
        hari_kerja_per_minggu: Number(form.hari_kerja_per_minggu) || 6,
      };
      const { error } = form.id
        ? await supabase.from('gaji_settings').update(payload).eq('id', form.id)
        : await supabase.from('gaji_settings').insert(payload);
      if (error) throw error;
      toast.success('Pengaturan disimpan');
      qc.invalidateQueries({ queryKey: ['gaji-settings'] });
    } catch (err) {
      toast.error('Gagal: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Gaji</CardTitle>
        <p className="text-sm text-muted-foreground">Tarif default kehadiran & format slip. Berlaku untuk semua guru saat generate gaji.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tarif per Hari Hadir (Rp)</Label>
            <Input type="number" value={form.tarif_per_hadir} onChange={(e) => setForm({ ...form, tarif_per_hadir: e.target.value })} />
            <p className="text-xs text-muted-foreground">Opsional. Jika 0, hanya komponen master yang dihitung.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Hari Kerja per Minggu</Label>
            <Input type="number" min={1} max={7} value={form.hari_kerja_per_minggu} onChange={(e) => setForm({ ...form, hari_kerja_per_minggu: e.target.value })} />
            <p className="text-xs text-muted-foreground">Untuk hitung jumlah hari kerja bulan ini (default 6 = Sen–Sab).</p>
          </div>
          <div className="space-y-1.5 md:col-span-2 p-3 rounded-md border border-primary/30 bg-primary/5">
            <Label className="font-semibold">Potongan per Hari Tidak Masuk (Rp) — disarankan</Label>
            <Input type="number" value={form.potongan_per_tidak_masuk} onChange={(e) => setForm({ ...form, potongan_per_tidak_masuk: e.target.value })} />
            <p className="text-xs text-muted-foreground">
              Alpa + Izin + Sakit digabung dianggap "tidak masuk". Jika field ini &gt; 0, akan menggantikan 3 potongan terpisah di bawah.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Potongan per Alpa (Rp)</Label>
            <Input type="number" value={form.potongan_per_alpa} onChange={(e) => setForm({ ...form, potongan_per_alpa: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Potongan per Izin (Rp)</Label>
            <Input type="number" value={form.potongan_per_izin} onChange={(e) => setForm({ ...form, potongan_per_izin: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Potongan per Sakit (Rp)</Label>
            <Input type="number" value={form.potongan_per_sakit} onChange={(e) => setForm({ ...form, potongan_per_sakit: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Format Nomor Slip</Label>
            <Input value={form.format_nomor_slip} onChange={(e) => setForm({ ...form, format_nomor_slip: e.target.value })} />
            <p className="text-xs text-muted-foreground">Placeholder: {'{bulan}'} {'{tahun}'} {'{seq}'}</p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Judul Slip</Label>
            <Input value={form.judul_slip} onChange={(e) => setForm({ ...form, judul_slip: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
