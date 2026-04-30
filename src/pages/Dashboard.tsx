import { useEffect, useState, useCallback } from 'react';
import { 
  Users, 
  School, 
  UserCog, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Sparkles,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';
import { Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useSetupWizard } from '@/hooks/useSetupWizard';
import { SetupWizardDialog } from '@/components/wizard/SetupWizardDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ActivityLog } from '@/components/dashboard/ActivityLog';
import logoMts from '@/assets/logo-mts.svg';

interface DashboardStats {
  totalSiswa: number;
  siswaLaki: number;
  siswaPerempuan: number;
  totalKelas: number;
  totalGtk: number;
  gtkLaki: number;
  gtkPerempuan: number;
  gtkPns: number;
  gtkHonor: number;
  gtkSertifikasi: number;
  totalTunggakan: number;
  totalPemasukan: number;
  totalPengeluaran: number;
}

interface MadrasahInfo {
  nama_madrasah: string;
  npsn: string;
  nsm: string;
  alamat: string;
  kabupaten_kota: string;
  provinsi: string;
  kepala_madrasah: string;
  akreditasi: string;
}

const KELAS_COLORS = ['hsl(170, 60%, 32%)', 'hsl(199, 89%, 48%)', 'hsl(45, 90%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(340, 70%, 50%)', 'hsl(120, 50%, 40%)', 'hsl(30, 80%, 50%)', 'hsl(210, 70%, 55%)'];
const GENDER_COLORS = ['hsl(199, 89%, 48%)', 'hsl(340, 70%, 55%)'];
const KEPEG_COLORS = ['hsl(170, 60%, 32%)', 'hsl(199, 89%, 48%)', 'hsl(30, 80%, 50%)'];
const KEUANGAN_COLORS = ['hsl(170, 60%, 32%)', 'hsl(45, 90%, 50%)', 'hsl(0, 72%, 51%)'];

export default function Dashboard() {
  const { isAdmin, isBendahara, hasRole } = useAuth();
  const isOperator = hasRole('operator');
  const setupStatus = useSetupWizard();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [madrasah, setMadrasah] = useState<MadrasahInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    siswaLaki: 0,
    siswaPerempuan: 0,
    totalKelas: 0,
    totalGtk: 0,
    gtkLaki: 0,
    gtkPerempuan: 0,
    gtkPns: 0,
    gtkHonor: 0,
    gtkSertifikasi: 0,
    totalTunggakan: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
  });
  const [loading, setLoading] = useState(true);
  const [kelasData, setKelasData] = useState<{ name: string; jumlah: number }[]>([]);

  useEffect(() => {
    if (!setupStatus.loading && !setupStatus.isComplete) {
      const dismissed = localStorage.getItem('setup-wizard-dismissed');
      if (!dismissed) {
        setWizardOpen(true);
      }
    }
  }, [setupStatus.loading, setupStatus.isComplete]);

  useEffect(() => {
    fetchStats();
    fetchMadrasah();
  }, []);

  // Realtime notification for admin
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('absensi-gtk-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'absensi_gtk' },
        async (payload) => {
          const newRecord = payload.new as any;
          const { data: gtkData } = await supabase
            .from('gtk_ptk')
            .select('nama')
            .eq('id', newRecord.gtk_id)
            .single();
          
          const nama = gtkData?.nama || 'Seorang Guru';
          const statusLabel = newRecord.status === 'hadir' ? 'Hadir' : 
            newRecord.status === 'sakit' ? 'Sakit' :
            newRecord.status === 'izin' ? 'Izin' :
            newRecord.status === 'alfa' ? 'Alfa' :
            newRecord.status === 'dinas_luar' ? 'Dinas Luar' :
            newRecord.status === 'cuti' ? 'Cuti' : newRecord.status;

          toast.info(`${nama} mengisi absensi: ${statusLabel}`, {
            description: `Tanggal: ${newRecord.tanggal}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        async (payload) => {
          const newProfile = payload.new as any;
          const { data: roles } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', newProfile.user_id)
            .limit(1);
          
          if (!roles || roles.length === 0) {
            toast.warning(`User baru mendaftar: ${newProfile.full_name}`, {
              description: 'Menunggu approval di Manajemen User',
              action: {
                label: 'Lihat',
                onClick: () => window.location.href = '/user-management',
              },
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleWizardClose = () => {
    setWizardOpen(false);
    localStorage.setItem('setup-wizard-dismissed', 'true');
  };

  const fetchMadrasah = async () => {
    const { data } = await supabase.from('madrasah_settings').select('*').limit(1).single();
    if (data) setMadrasah(data as any);
  };

  const fetchStats = async () => {
    try {
      const siswaRes = await supabase.from('siswa').select('id, kelas_id, jenis_kelamin', { count: 'exact' });
      const siswaData = siswaRes.data || [];
      const siswaLaki = siswaData.filter((s: any) => s.jenis_kelamin === 'L' || s.jenis_kelamin === 'Laki-laki').length;
      const siswaPerempuan = siswaData.filter((s: any) => s.jenis_kelamin === 'P' || s.jenis_kelamin === 'Perempuan').length;
      
      const kelasRes = await supabase.from('kelas').select('id, nama_kelas', { count: 'exact' });
      
      const gtkRes = (isAdmin || isOperator || isBendahara)
        ? await supabase.from('gtk_ptk').select('id, jenis_kelamin, status_kepegawaian, sertifikasi', { count: 'exact' })
        : { data: [], count: 0 };
      const gtkData = gtkRes.data || [];
      const gtkLaki = gtkData.filter((g: any) => g.jenis_kelamin === 'L' || g.jenis_kelamin === 'Laki-laki').length;
      const gtkPerempuan = gtkData.filter((g: any) => g.jenis_kelamin === 'P' || g.jenis_kelamin === 'Perempuan').length;
      const gtkPns = gtkData.filter((g: any) => g.status_kepegawaian === 'PNS' || g.status_kepegawaian === 'PPPK').length;
      const gtkHonor = gtkData.filter((g: any) => ['Honorer', 'GTT', 'GTY'].includes(g.status_kepegawaian)).length;
      const gtkSertifikasi = gtkData.filter((g: any) => g.sertifikasi === true).length;
      
      const pembayaranRes = (isAdmin || isBendahara)
        ? await supabase.from('pembayaran').select('nominal, nominal_bayar, status')
        : { data: [] };
        
      const pengeluaranRes = (isAdmin || isBendahara)
        ? await supabase.from('pengeluaran').select('nominal')
        : { data: [] };

      const pembayaranData = pembayaranRes.data as any[] || [];
      const tunggakan = pembayaranData.reduce((acc: number, p: any) => {
        if (p.status === 'belum_lunas' || p.status === 'cicil') {
          return acc + (Number(p.nominal) - Number(p.nominal_bayar));
        }
        return acc;
      }, 0);
      const pemasukan = pembayaranData.reduce((acc: number, p: any) => acc + Number(p.nominal_bayar), 0);
      const pengeluaranData = pengeluaranRes.data as any[] || [];
      const pengeluaran = pengeluaranData.reduce((acc: number, p: any) => acc + Number(p.nominal), 0);

      const kelasMap = new Map<string, number>();
      kelasRes.data?.forEach((k: any) => kelasMap.set(k.id, 0));
      siswaRes.data?.forEach((s: any) => {
        if (s.kelas_id && kelasMap.has(s.kelas_id)) {
          kelasMap.set(s.kelas_id, (kelasMap.get(s.kelas_id) || 0) + 1);
        }
      });

      const kelasChartData = kelasRes.data?.map((k: any) => ({
        name: k.nama_kelas,
        jumlah: kelasMap.get(k.id) || 0,
      })) || [];

      setKelasData(kelasChartData);
      setStats({
        totalSiswa: siswaRes.count || 0,
        siswaLaki,
        siswaPerempuan,
        totalKelas: kelasRes.count || 0,
        totalGtk: gtkRes.count || 0,
        gtkLaki,
        gtkPerempuan,
        gtkPns,
        gtkHonor,
        gtkSertifikasi,
        totalTunggakan: tunggakan,
        totalPemasukan: pemasukan,
        totalPengeluaran: pengeluaran,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const keuanganData = [
    { name: 'Pemasukan', value: stats.totalPemasukan },
    { name: 'Pengeluaran', value: stats.totalPengeluaran },
    { name: 'Tunggakan', value: stats.totalTunggakan },
  ];

  const siswaGenderData = [
    { name: 'Laki-laki', value: stats.siswaLaki },
    { name: 'Perempuan', value: stats.siswaPerempuan },
  ];

  const kepegawaianData = [
    { name: 'PNS/PPPK', value: stats.gtkPns },
    { name: 'Honor/GTY', value: stats.gtkHonor },
    { name: 'Lainnya', value: Math.max(0, stats.totalGtk - stats.gtkPns - stats.gtkHonor) },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-fadeIn space-y-6">
      <SetupWizardDialog open={wizardOpen} onOpenChange={handleWizardClose} />
      
      {/* ============ BANNER MADRASAH (ala EMIS) ============ */}
      <div className="rounded-xl bg-gradient-to-r from-primary/90 to-primary overflow-hidden shadow-lg">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <img src={logoMts} alt="Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-primary-foreground truncate">
              {madrasah?.nama_madrasah || 'SIM MTs Al Wathoniyah 43'}
            </h1>
            <p className="text-primary-foreground/80 text-sm">Madrasah Tsanawiyah</p>
            <div className="flex items-center gap-1.5 mt-1 text-primary-foreground/70 text-xs">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {madrasah ? `${madrasah.kabupaten_kota}, ${madrasah.provinsi}` : 'DKI Jakarta'}
              </span>
              {madrasah?.npsn && (
                <>
                  <span className="mx-1">•</span>
                  <span>NPSN: {madrasah.npsn}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30"
              onClick={() => setWizardOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Setup Wizard
            </Button>
          </div>
        </div>
      </div>

      {/* ============ RINGKASAN UTAMA — 3 card besar ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card: Data Siswa & Kelas */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Data Siswa & Kelas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-foreground">{stats.totalSiswa}</span>
              <span className="text-xs text-muted-foreground">Total Siswa</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-info/10 rounded-lg px-3 py-2">
                <span className="text-info font-semibold">{stats.siswaLaki}</span>
                <p className="text-xs text-muted-foreground">Laki-laki</p>
              </div>
              <div className="bg-warning/10 rounded-lg px-3 py-2">
                <span className="text-warning font-semibold">{stats.siswaPerempuan}</span>
                <p className="text-xs text-muted-foreground">Perempuan</p>
              </div>
            </div>
            {(isAdmin || isOperator) && (
              <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-sm">
                <School className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Jumlah Kelas:</span>
                <span className="font-semibold text-foreground">{stats.totalKelas}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Data GTK/PTK */}
        {(isAdmin || isOperator || isBendahara) && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <UserCog className="h-4 w-4 text-success" />
                </div>
                Data GTK/PTK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-foreground">{stats.totalGtk}</span>
                <span className="text-xs text-muted-foreground">Total GTK/PTK</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-info/10 rounded-lg px-3 py-2">
                  <span className="text-info font-semibold">{stats.gtkLaki}</span>
                  <p className="text-xs text-muted-foreground">Laki-laki</p>
                </div>
                <div className="bg-warning/10 rounded-lg px-3 py-2">
                  <span className="text-warning font-semibold">{stats.gtkPerempuan}</span>
                  <p className="text-xs text-muted-foreground">Perempuan</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs text-muted-foreground">
                <span>PNS/PPPK: <strong className="text-foreground">{stats.gtkPns}</strong></span>
                <span>Honor/GTY: <strong className="text-foreground">{stats.gtkHonor}</strong></span>
                <span>Sertifikasi: <strong className="text-foreground">{stats.gtkSertifikasi}</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card: Keuangan */}
        {(isAdmin || isBendahara) && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                Ringkasan Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-success/10 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">Pemasukan</span>
                  </div>
                  <span className="font-semibold text-success">{formatCurrency(stats.totalPemasukan)}</span>
                </div>
                <div className="flex items-center justify-between bg-warning/10 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-warning" />
                    <span className="text-muted-foreground">Pengeluaran</span>
                  </div>
                  <span className="font-semibold text-warning">{formatCurrency(stats.totalPengeluaran)}</span>
                </div>
                <div className="flex items-center justify-between bg-destructive/10 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-muted-foreground">Tunggakan</span>
                  </div>
                  <span className="font-semibold text-destructive">{formatCurrency(stats.totalTunggakan)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Log - Admin only */}
      {isAdmin && <ActivityLog />}

      {/* Donut Charts — EMIS style with center label */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Distribusi Siswa per Kelas */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Distribusi Siswa</CardTitle>
            <p className="text-xs text-muted-foreground">Berdasarkan kelas</p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {kelasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={kelasData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="jumlah" nameKey="name">
                    {kelasData.map((_, i) => (
                      <Cell key={i} fill={KELAS_COLORS[i % KELAS_COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>Total</text>
                  <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalSiswa}</text>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data kelas</div>
            )}
          </CardContent>
        </Card>

        {/* Distribusi Siswa L/P */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Distribusi Siswa</CardTitle>
            <p className="text-xs text-muted-foreground">Berdasarkan jenis kelamin</p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={siswaGenderData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {siswaGenderData.map((_, i) => (
                    <Cell key={i} fill={GENDER_COLORS[i]} />
                  ))}
                </Pie>
                <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>Total</text>
                <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalSiswa}</text>
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Kepegawaian */}
        {(isAdmin || isOperator || isBendahara) && (
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Status Kepegawaian</CardTitle>
            <p className="text-xs text-muted-foreground">Distribusi berdasarkan status</p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={kepegawaianData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {kepegawaianData.map((_, i) => (
                    <Cell key={i} fill={KEPEG_COLORS[i]} />
                  ))}
                </Pie>
                <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>Total</text>
                <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalGtk}</text>
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        )}

        {/* Ringkasan Keuangan */}
        {(isAdmin || isBendahara) && (
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Ringkasan Keuangan</CardTitle>
            <p className="text-xs text-muted-foreground">Pemasukan, pengeluaran & tunggakan</p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {stats.totalPemasukan > 0 || stats.totalPengeluaran > 0 || stats.totalTunggakan > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={keuanganData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {keuanganData.map((_, i) => (
                      <Cell key={i} fill={KEUANGAN_COLORS[i]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data keuangan</div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}