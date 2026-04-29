import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { TrendingDown, AlertTriangle, Trophy, Users, UserCog } from 'lucide-react';
import { format, getDaysInMonth, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TrendProps {
  selectedTA: string;
}

interface SiswaInfo { id: string; nama: string; nis: string; kelas_id: string | null; }
interface KelasInfo { id: string; nama_kelas: string; }
interface GtkInfo { id: string; nama: string; jabatan: string | null; }

export function TrenKetidakhadiranTab({ selectedTA }: TrendProps) {
  const [rangeMonths, setRangeMonths] = useState(3); // last N months
  const [siswaList, setSiswaList] = useState<SiswaInfo[]>([]);
  const [kelasList, setKelasList] = useState<KelasInfo[]>([]);
  const [gtkList, setGtkList] = useState<GtkInfo[]>([]);
  const [absensiSiswa, setAbsensiSiswa] = useState<{ siswa_id: string; status: string; tanggal: string }[]>([]);
  const [absensiGtk, setAbsensiGtk] = useState<{ gtk_id: string; status: string; tanggal: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedTA) return;
    const load = async () => {
      setLoading(true);
      const today = new Date();
      const startDate = format(startOfMonth(subMonths(today, rangeMonths - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

      const [sRes, kRes, gRes, asRes, agRes] = await Promise.all([
        supabase.from('siswa').select('id, nama, nis, kelas_id').eq('ta_id', selectedTA).eq('status', 'aktif'),
        supabase.from('kelas').select('id, nama_kelas'),
        supabase.from('gtk_ptk').select('id, nama, jabatan').eq('status_aktif', 'aktif'),
        supabase.from('absensi_siswa').select('siswa_id, status, tanggal').eq('ta_id', selectedTA).gte('tanggal', startDate).lte('tanggal', endDate),
        supabase.from('absensi_gtk').select('gtk_id, status, tanggal').gte('tanggal', startDate).lte('tanggal', endDate),
      ]);
      if (sRes.data) setSiswaList(sRes.data);
      if (kRes.data) setKelasList(kRes.data);
      if (gRes.data) setGtkList(gRes.data);
      if (asRes.data) setAbsensiSiswa(asRes.data);
      if (agRes.data) setAbsensiGtk(agRes.data);
      setLoading(false);
    };
    load();
  }, [selectedTA, rangeMonths]);

  const kelasMap = useMemo(() => new Map(kelasList.map(k => [k.id, k.nama_kelas])), [kelasList]);

  // Top 10 siswa paling sering absen (alfa + sakit + izin)
  const topSiswaAbsen = useMemo(() => {
    const counter: Record<string, { alfa: number; sakit: number; izin: number; total: number }> = {};
    absensiSiswa.forEach(a => {
      if (!['alfa', 'sakit', 'izin'].includes(a.status)) return;
      if (!counter[a.siswa_id]) counter[a.siswa_id] = { alfa: 0, sakit: 0, izin: 0, total: 0 };
      counter[a.siswa_id][a.status as 'alfa' | 'sakit' | 'izin']++;
      counter[a.siswa_id].total++;
    });
    return siswaList
      .map(s => ({ siswa: s, ...(counter[s.id] || { alfa: 0, sakit: 0, izin: 0, total: 0 }) }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total || b.alfa - a.alfa)
      .slice(0, 10);
  }, [absensiSiswa, siswaList]);

  // Top 10 GTK paling sering absen
  const topGtkAbsen = useMemo(() => {
    const counter: Record<string, { alfa: number; sakit: number; izin: number; total: number }> = {};
    absensiGtk.forEach(a => {
      if (!['alfa', 'sakit', 'izin'].includes(a.status)) return;
      if (!counter[a.gtk_id]) counter[a.gtk_id] = { alfa: 0, sakit: 0, izin: 0, total: 0 };
      counter[a.gtk_id][a.status as 'alfa' | 'sakit' | 'izin']++;
      counter[a.gtk_id].total++;
    });
    return gtkList
      .map(g => ({ gtk: g, ...(counter[g.id] || { alfa: 0, sakit: 0, izin: 0, total: 0 }) }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total || b.alfa - a.alfa)
      .slice(0, 10);
  }, [absensiGtk, gtkList]);

  // Tren bulanan (jumlah Alfa per bulan - siswa & GTK)
  const trenBulanan = useMemo(() => {
    const map: Record<string, { bulan: string; alfaSiswa: number; alfaGtk: number; sakitSiswa: number; sakitGtk: number }> = {};
    const today = new Date();
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = subMonths(today, i);
      const key = format(d, 'yyyy-MM');
      map[key] = { bulan: format(d, 'MMM yy', { locale: idLocale }), alfaSiswa: 0, alfaGtk: 0, sakitSiswa: 0, sakitGtk: 0 };
    }
    absensiSiswa.forEach(a => {
      const key = a.tanggal.slice(0, 7);
      if (!map[key]) return;
      if (a.status === 'alfa') map[key].alfaSiswa++;
      else if (a.status === 'sakit') map[key].sakitSiswa++;
    });
    absensiGtk.forEach(a => {
      const key = a.tanggal.slice(0, 7);
      if (!map[key]) return;
      if (a.status === 'alfa') map[key].alfaGtk++;
      else if (a.status === 'sakit') map[key].sakitGtk++;
    });
    return Object.values(map);
  }, [absensiSiswa, absensiGtk, rangeMonths]);

  const chartSiswaData = topSiswaAbsen.map(r => ({
    nama: r.siswa.nama.length > 18 ? r.siswa.nama.slice(0, 18) + '…' : r.siswa.nama,
    Alfa: r.alfa, Sakit: r.sakit, Izin: r.izin,
  }));
  const chartGtkData = topGtkAbsen.map(r => ({
    nama: r.gtk.nama.length > 18 ? r.gtk.nama.slice(0, 18) + '…' : r.gtk.nama,
    Alfa: r.alfa, Sakit: r.sakit, Izin: r.izin,
  }));

  if (!selectedTA) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Pilih tahun ajaran untuk melihat tren ketidakhadiran.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Rentang waktu</label>
          <Select value={String(rangeMonths)} onValueChange={(v) => setRangeMonths(parseInt(v))}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 bulan terakhir</SelectItem>
              <SelectItem value="3">3 bulan terakhir</SelectItem>
              <SelectItem value="6">6 bulan terakhir</SelectItem>
              <SelectItem value="12">12 bulan terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading && <span className="text-xs text-muted-foreground pb-2">Memuat data...</span>}
      </div>

      {/* Tren line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Tren Ketidakhadiran Bulanan
          </CardTitle>
          <CardDescription>Jumlah Alfa & Sakit per bulan untuk siswa dan GTK</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trenBulanan}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="bulan" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="alfaSiswa" name="Alfa Siswa" stroke="hsl(0 70% 55%)" strokeWidth={2} />
                <Line type="monotone" dataKey="sakitSiswa" name="Sakit Siswa" stroke="hsl(40 90% 50%)" strokeWidth={2} />
                <Line type="monotone" dataKey="alfaGtk" name="Alfa GTK" stroke="hsl(280 60% 50%)" strokeWidth={2} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="sakitGtk" name="Sakit GTK" stroke="hsl(200 70% 50%)" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 siswa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Top 10 Siswa Paling Sering Absen
          </CardTitle>
          <CardDescription>Berdasarkan total Alfa + Sakit + Izin dalam {rangeMonths} bulan terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          {chartSiswaData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data ketidakhadiran siswa.</p>
          ) : (
            <>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSiswaData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                    <YAxis type="category" dataKey="nama" fontSize={11} width={140} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Alfa" stackId="a" fill="hsl(0 70% 55%)" />
                    <Bar dataKey="Sakit" stackId="a" fill="hsl(40 90% 50%)" />
                    <Bar dataKey="Izin" stackId="a" fill="hsl(200 70% 50%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">No</th>
                      <th className="p-2 text-left">NIS</th>
                      <th className="p-2 text-left">Nama Siswa</th>
                      <th className="p-2 text-left">Kelas</th>
                      <th className="p-2 text-center">Alfa</th>
                      <th className="p-2 text-center">Sakit</th>
                      <th className="p-2 text-center">Izin</th>
                      <th className="p-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSiswaAbsen.map((r, idx) => (
                      <tr key={r.siswa.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2 font-mono">{r.siswa.nis}</td>
                        <td className="p-2 font-medium">{r.siswa.nama}</td>
                        <td className="p-2 text-muted-foreground">{kelasMap.get(r.siswa.kelas_id || '') || '-'}</td>
                        <td className="p-2 text-center"><Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">{r.alfa}</Badge></td>
                        <td className="p-2 text-center"><Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">{r.sakit}</Badge></td>
                        <td className="p-2 text-center"><Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">{r.izin}</Badge></td>
                        <td className="p-2 text-center font-bold">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top 10 GTK */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Top 10 GTK/PTK Paling Sering Absen
          </CardTitle>
          <CardDescription>Berdasarkan total Alfa + Sakit + Izin dalam {rangeMonths} bulan terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          {chartGtkData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data ketidakhadiran GTK.</p>
          ) : (
            <>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartGtkData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                    <YAxis type="category" dataKey="nama" fontSize={11} width={140} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Alfa" stackId="a" fill="hsl(0 70% 55%)" />
                    <Bar dataKey="Sakit" stackId="a" fill="hsl(40 90% 50%)" />
                    <Bar dataKey="Izin" stackId="a" fill="hsl(200 70% 50%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">No</th>
                      <th className="p-2 text-left">Nama</th>
                      <th className="p-2 text-left">Jabatan</th>
                      <th className="p-2 text-center">Alfa</th>
                      <th className="p-2 text-center">Sakit</th>
                      <th className="p-2 text-center">Izin</th>
                      <th className="p-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGtkAbsen.map((r, idx) => (
                      <tr key={r.gtk.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2 font-medium">{r.gtk.nama}</td>
                        <td className="p-2 text-muted-foreground">{r.gtk.jabatan || '-'}</td>
                        <td className="p-2 text-center"><Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">{r.alfa}</Badge></td>
                        <td className="p-2 text-center"><Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">{r.sakit}</Badge></td>
                        <td className="p-2 text-center"><Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">{r.izin}</Badge></td>
                        <td className="p-2 text-center font-bold">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
