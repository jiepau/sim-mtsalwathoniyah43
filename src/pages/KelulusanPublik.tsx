import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, CheckCircle2, XCircle, Clock, GraduationCap, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CetakSKLDialog } from '@/components/ijazah/CetakSKLDialog';
import loginBg from '@/assets/login-background.png';

export default function KelulusanPublik() {
  const [nisn, setNisn] = useState('');
  const [tglLahir, setTglLahir] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showSKL, setShowSKL] = useState(false);
  const [taIdForSKL, setTaIdForSKL] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim()) return;
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('cek-kelulusan', {
        body: { nisn: nisn.trim(), tanggal_lahir: tglLahir || undefined },
      });
      if (error) throw error;
      setResult(data);
      // Ambil ta aktif untuk SKL print
      const { data: ta } = await supabase.from('kelulusan_settings').select('ta_id').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (ta?.ta_id) setTaIdForSKL(ta.ta_id);
    } catch (err: any) {
      setResult({ status: 'error', message: err.message || 'Gagal memuat data' });
    } finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen p-4 flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <Helmet>
        <title>Pengumuman Kelulusan — MTs Al Wathoniyah 43</title>
        <meta name="description" content="Cek hasil pengumuman kelulusan siswa kelas 9 MTs Al Wathoniyah 43 dengan memasukkan NISN dan tanggal lahir. Unduh Surat Keterangan Lulus (SKL) di sini." />
        <link rel="canonical" href="https://sim.mtsalwathoniyah43.com/kelulusan" />
        <meta property="og:title" content="Pengumuman Kelulusan — MTs Al Wathoniyah 43" />
        <meta property="og:description" content="Cek hasil pengumuman kelulusan siswa MTs Al Wathoniyah 43." />
        <meta property="og:url" content="https://sim.mtsalwathoniyah43.com/kelulusan" />
      </Helmet>
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-background/85 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <img src="/logo-alwathoniyah.png" alt="Logo MTs Al Wathoniyah 43" className="h-16 mx-auto" />
          <h1 className="text-lg font-semibold">Pengumuman Kelulusan MTs Al Wathoniyah 43</h1>
          <p className="text-sm text-muted-foreground">MTs Al-Wathoniyah 43</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>NISN</Label>
              <Input value={nisn} onChange={(e) => setNisn(e.target.value)} placeholder="Masukkan NISN" required />
            </div>
            <div>
              <Label>Tanggal Lahir <span className="text-xs text-muted-foreground">(opsional, untuk verifikasi)</span></Label>
              <Input type="date" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !nisn.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Cek Status Kelulusan
            </Button>
          </form>

          {result && (
            <div className="pt-4 border-t">
              <ResultView result={result} onPrintSKL={() => setShowSKL(true)} />
            </div>
          )}
        </CardContent>
      </Card>

      {showSKL && result?.siswa?.id && taIdForSKL && (
        <CetakSKLDialog open={showSKL} onOpenChange={setShowSKL} siswaId={result.siswa.id} taId={taIdForSKL} />
      )}
    </div>
  );
}

function ResultView({ result, onPrintSKL }: { result: any; onPrintSKL: () => void }) {
  if (result.status === 'lulus') {
    return (
      <div className="text-center space-y-3 py-2">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <div>
          <p className="text-sm text-muted-foreground">Selamat,</p>
          <p className="font-bold text-lg">{result.siswa?.nama}</p>
          <p className="text-xs text-muted-foreground">NISN: {result.siswa?.nisn} {result.siswa?.nama_kelas && `· ${result.siswa.nama_kelas}`}</p>
        </div>
        <p className="text-2xl font-bold text-green-600 tracking-wider">LULUS</p>
        <p className="text-sm">{result.pengumuman?.pesan}</p>
        {result.kelulusan?.nomor_sk && <p className="text-xs text-muted-foreground">SK: {result.kelulusan.nomor_sk}</p>}
        <Button onClick={onPrintSKL} className="w-full" variant="default">
          <Printer className="h-4 w-4 mr-2" />Lihat & Cetak Surat Kelulusan
        </Button>
      </div>
    );
  }
  if (result.status === 'tidak_lulus') {
    return (
      <div className="text-center space-y-3 py-2">
        <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
        <p className="font-medium">Mohon maaf, berdasarkan hasil rapat dewan guru, ananda belum dinyatakan lulus pada tahun ini.</p>
        <p className="text-sm text-muted-foreground">Silakan menghubungi madrasah untuk konsultasi lebih lanjut.</p>
      </div>
    );
  }
  if (result.status === 'pending') {
    return (
      <div className="text-center space-y-3 py-2">
        <Clock className="h-16 w-16 text-amber-500 mx-auto" />
        <p>Status kelulusan {result.nama && <strong>{result.nama}</strong>} belum ditetapkan.</p>
      </div>
    );
  }
  if (result.status === 'not_yet' || result.status === 'not_published') {
    return (
      <div className="text-center space-y-3 py-2">
        <Clock className="h-16 w-16 text-blue-500 mx-auto" />
        <p className="font-medium">Pengumuman belum dibuka</p>
        <p className="text-sm text-muted-foreground">{result.message}</p>
        {result.published_at && (
          <p className="text-xs">Akan dibuka: {new Date(result.published_at).toLocaleString('id-ID')}</p>
        )}
      </div>
    );
  }
  return (
    <div className="text-center space-y-2 py-2">
      <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
      <p className="text-sm">{result.message || 'Data tidak ditemukan'}</p>
    </div>
  );
}
