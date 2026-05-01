import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
const logoImg = '/logo-alwathoniyah.png';

export default function PPDBDaftar() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['ppdb-settings-public'],
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

  const [form, setForm] = useState({
    nama: '',
    nisn: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat: '',
    nama_ayah: '',
    nama_ibu: '',
    wa_ortu: '',
    asal_sekolah: '',
  });

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.nama.trim()) throw new Error('Nama wajib diisi');
      if (!form.jenis_kelamin) throw new Error('Jenis kelamin wajib dipilih');

      // Generate nomor pendaftaran via RPC
      const { data: nomor, error: rpcErr } = await supabase.rpc('generate_nomor_ppdb');
      if (rpcErr) throw rpcErr;

      const { error } = await supabase.from('ppdb_pendaftar').insert({
        nomor_pendaftaran: nomor,
        nama: form.nama.trim(),
        nisn: form.nisn.trim() || null,
        tempat_lahir: form.tempat_lahir.trim() || null,
        tanggal_lahir: form.tanggal_lahir || null,
        jenis_kelamin: form.jenis_kelamin || null,
        alamat: form.alamat.trim() || null,
        nama_ayah: form.nama_ayah.trim() || null,
        nama_ibu: form.nama_ibu.trim() || null,
        wa_ortu: form.wa_ortu.trim() || null,
        asal_sekolah: form.asal_sekolah.trim() || null,
      });
      if (error) throw error;
      return nomor as string;
    },
    onSuccess: (nomor) => {
      setSubmitted(nomor);
      toast.success('Pendaftaran berhasil!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOpen = settings?.is_open ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center space-y-2">
          <img src={logoImg} alt="Logo" className="h-16 mx-auto" />
          <CardTitle className="text-lg">Pendaftaran Peserta Didik Baru</CardTitle>
          <p className="text-sm text-muted-foreground">
            MTs Al-Wathoniyah 43 — TA {settings?.tahun_ajaran ?? '-'}
          </p>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-lg font-bold">Pendaftaran Berhasil!</h2>
              <p className="text-sm text-muted-foreground">
                Nomor pendaftaran Anda:
              </p>
              <p className="text-2xl font-mono font-bold text-primary">{submitted}</p>
              <p className="text-xs text-muted-foreground">
                Simpan nomor ini untuk pengecekan hasil seleksi.
              </p>
              <Link to="/ppdb/cek-status" className="inline-block mt-2 text-sm text-primary hover:underline font-medium">
                Cek Status Pendaftaran →
              </Link>
              {settings?.pesan_selamat && (
                <p className="text-sm mt-4">{settings.pesan_selamat}</p>
              )}
            </div>
          ) : !isOpen ? (
            <div className="text-center space-y-4 py-8">
              <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
              <h2 className="text-lg font-semibold">Pendaftaran Ditutup</h2>
              <p className="text-sm text-muted-foreground">
                Saat ini pendaftaran peserta didik baru belum dibuka. Silakan hubungi pihak madrasah untuk informasi lebih lanjut.
              </p>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-sm">Nama Lengkap *</Label>
                  <Input value={form.nama} onChange={(e) => set('nama', e.target.value)} required />
                </div>
                <div>
                  <Label className="text-sm">NISN</Label>
                  <Input value={form.nisn} onChange={(e) => set('nisn', e.target.value)} placeholder="Opsional" />
                </div>
                <div>
                  <Label className="text-sm">Jenis Kelamin *</Label>
                  <Select value={form.jenis_kelamin} onValueChange={(v) => set('jenis_kelamin', v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Tempat Lahir</Label>
                  <Input value={form.tempat_lahir} onChange={(e) => set('tempat_lahir', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Tanggal Lahir</Label>
                  <Input type="date" value={form.tanggal_lahir} onChange={(e) => set('tanggal_lahir', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm">Alamat</Label>
                  <Textarea value={form.alamat} onChange={(e) => set('alamat', e.target.value)} rows={2} />
                </div>
                <div>
                  <Label className="text-sm">Nama Ayah</Label>
                  <Input value={form.nama_ayah} onChange={(e) => set('nama_ayah', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Nama Ibu</Label>
                  <Input value={form.nama_ibu} onChange={(e) => set('nama_ibu', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">No. WA Orang Tua</Label>
                  <Input value={form.wa_ortu} onChange={(e) => set('wa_ortu', e.target.value)} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <Label className="text-sm">Asal Sekolah</Label>
                  <Input value={form.asal_sekolah} onChange={(e) => set('asal_sekolah', e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Daftar Sekarang
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
