import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  baru: {
    label: 'Dalam Proses',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock className="h-12 w-12 text-blue-500" />,
    desc: 'Pendaftaran Anda sedang dalam proses seleksi. Silakan cek kembali secara berkala.',
  },
  diterima: {
    label: 'Diterima',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    desc: 'Selamat! Anda dinyatakan DITERIMA. Silakan hubungi pihak madrasah untuk informasi daftar ulang.',
  },
  ditolak: {
    label: 'Tidak Diterima',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-12 w-12 text-red-500" />,
    desc: 'Mohon maaf, Anda belum diterima pada seleksi ini. Terima kasih atas partisipasinya.',
  },
};

export default function PPDBCekStatus() {
  const [nomor, setNomor] = useState('');
  const [searchNomor, setSearchNomor] = useState('');

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['ppdb-cek-status', searchNomor],
    queryFn: async () => {
      if (!searchNomor) return null;
      const { data, error } = await supabase
        .from('ppdb_pendaftar')
        .select('nomor_pendaftaran, nama, status')
        .eq('nomor_pendaftaran', searchNomor.toUpperCase().trim())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!searchNomor,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nomor.trim()) setSearchNomor(nomor.trim());
  };

  const cfg = result ? statusConfig[result.status] ?? statusConfig.baru : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <img src="/logo-alwathoniyah.png" alt="Logo" className="h-16 mx-auto" />
          <CardTitle className="text-lg">Cek Status Pendaftaran</CardTitle>
          <p className="text-sm text-muted-foreground">MTs Al-Wathoniyah 43</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Masukkan nomor pendaftaran (PPDB-2026-0001)"
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
              className="text-sm"
            />
            <Button type="submit" size="sm" disabled={isLoading || !nomor.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          {searchNomor && !isLoading && (
            <>
              {result && cfg ? (
                <div className="text-center space-y-3 py-4">
                  {cfg.icon}
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Pendaftar</p>
                    <p className="font-semibold">{result.nama}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No. Pendaftaran</p>
                    <p className="font-mono text-sm">{result.nomor_pendaftaran}</p>
                  </div>
                  <Badge className={`text-sm px-4 py-1 ${cfg.color}`}>{cfg.label}</Badge>
                  <p className="text-sm text-muted-foreground mt-2">{cfg.desc}</p>
                </div>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="font-medium">Data Tidak Ditemukan</p>
                  <p className="text-sm text-muted-foreground">
                    Nomor pendaftaran tidak ditemukan. Pastikan nomor yang dimasukkan benar.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-center gap-3 pt-2 text-sm">
            <Link to="/ppdb/daftar" className="text-primary hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Daftar Baru
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
