import { useEffect, useState } from 'react';
import { 
  Users, 
  School, 
  UserCog, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Calendar,
  Sparkles,
  Award,
  Briefcase,
  HandCoins
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useSetupWizard } from '@/hooks/useSetupWizard';
import { SetupWizardDialog } from '@/components/wizard/SetupWizardDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ActivityLog } from '@/components/dashboard/ActivityLog';
import { logActivity } from '@/lib/activity-logger';

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

const COLORS = ['hsl(152, 60%, 32%)', 'hsl(45, 90%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)'];

export default function Dashboard() {
  const { isAdmin, isBendahara, hasRole } = useAuth();
  const isOperator = hasRole('operator');
  const setupStatus = useSetupWizard();
  const [wizardOpen, setWizardOpen] = useState(false);
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

  // Auto-open wizard for new users
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
  }, []);

  // Realtime notification for admin when guru fills attendance
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('absensi-gtk-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'absensi_gtk',
        },
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
        },
        async (payload) => {
          const newProfile = payload.new as any;
          // Check if the new user has any roles
          const { data: roles } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', newProfile.user_id)
            .limit(1);
          
          // If no roles, it's a new registration waiting for approval
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

  const fetchStats = async () => {
    try {
      // Fetch siswa - visible to all
      const siswaRes = await supabase.from('siswa').select('id, kelas_id, jenis_kelamin', { count: 'exact' });
      const siswaData = siswaRes.data || [];
      const siswaLaki = siswaData.filter((s: any) => s.jenis_kelamin === 'L' || s.jenis_kelamin === 'Laki-laki').length;
      const siswaPerempuan = siswaData.filter((s: any) => s.jenis_kelamin === 'P' || s.jenis_kelamin === 'Perempuan').length;
      
      // Fetch kelas - visible to admin and operator
      const kelasRes = await supabase.from('kelas').select('id, nama_kelas', { count: 'exact' });
      
      // Fetch GTK/PTK - visible to admin, operator, and bendahara
      const gtkRes = (isAdmin || isOperator || isBendahara)
        ? await supabase.from('gtk_ptk').select('id, jenis_kelamin, status_kepegawaian, sertifikasi', { count: 'exact' })
        : { data: [], count: 0 };
      const gtkData = gtkRes.data || [];
      const gtkLaki = gtkData.filter((g: any) => g.jenis_kelamin === 'L' || g.jenis_kelamin === 'Laki-laki').length;
      const gtkPerempuan = gtkData.filter((g: any) => g.jenis_kelamin === 'P' || g.jenis_kelamin === 'Perempuan').length;
      const gtkPns = gtkData.filter((g: any) => g.status_kepegawaian === 'PNS' || g.status_kepegawaian === 'PPPK').length;
      const gtkHonor = gtkData.filter((g: any) => ['Honorer', 'GTT', 'GTY'].includes(g.status_kepegawaian)).length;
      const gtkSertifikasi = gtkData.filter((g: any) => g.sertifikasi === true).length;
      
      // Fetch pembayaran & pengeluaran - only visible to admin and bendahara
      const pembayaranRes = (isAdmin || isBendahara)
        ? await supabase.from('pembayaran').select('nominal, nominal_bayar, status')
        : { data: [] };
        
      const pengeluaranRes = (isAdmin || isBendahara)
        ? await supabase.from('pengeluaran').select('nominal')
        : { data: [] };

      // Calculate tunggakan
      const pembayaranData = pembayaranRes.data as any[] || [];
      const tunggakan = pembayaranData.reduce((acc: number, p: any) => {
        if (p.status === 'belum_lunas' || p.status === 'cicil') {
          return acc + (Number(p.nominal) - Number(p.nominal_bayar));
        }
        return acc;
      }, 0);

      // Calculate pemasukan
      const pemasukan = pembayaranData.reduce((acc: number, p: any) => acc + Number(p.nominal_bayar), 0);

      // Calculate pengeluaran
      const pengeluaranData = pengeluaranRes.data as any[] || [];
      const pengeluaran = pengeluaranData.reduce((acc: number, p: any) => acc + Number(p.nominal), 0);

      // Calculate siswa per kelas
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

  return (
    <div className="animate-fadeIn">
      <SetupWizardDialog open={wizardOpen} onOpenChange={handleWizardClose} />
      
      <PageHeader 
        title="Dashboard" 
        description="Selamat datang di Sistem Informasi Madrasah"
        icon={<Calendar className="h-6 w-6" />}
        actions={
          <Button variant="outline" onClick={() => setWizardOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Setup Wizard
          </Button>
        }
      />

      {/* ============ GRUP 1: SISWA & KELAS ============ */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Data Siswa & Kelas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Total Siswa"
            value={stats.totalSiswa}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="default"
          />
          <StatsCard
            title="Siswa Laki-laki"
            value={stats.siswaLaki}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="info"
          />
          <StatsCard
            title="Siswa Perempuan"
            value={stats.siswaPerempuan}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            variant="warning"
          />
          {(isAdmin || isOperator) && (
            <StatsCard
              title="Jumlah Kelas"
              value={stats.totalKelas}
              icon={<School className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="info"
            />
          )}
        </div>
      </div>

      {/* ============ GRUP 2: GTK/PTK (tanpa duplikasi) ============ */}
      {(isAdmin || isOperator || isBendahara) && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <UserCog className="h-3.5 w-3.5" />
            Data GTK/PTK
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatsCard
              title="Total GTK/PTK"
              value={stats.totalGtk}
              icon={<UserCog className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="success"
            />
            <StatsCard
              title="GTK Laki-laki"
              value={stats.gtkLaki}
              icon={<UserCog className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="info"
            />
            <StatsCard
              title="GTK Perempuan"
              value={stats.gtkPerempuan}
              icon={<UserCog className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="warning"
            />
            <StatsCard
              title="PNS / PPPK"
              value={stats.gtkPns}
              icon={<Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="info"
            />
            <StatsCard
              title="Honor / GTY"
              value={stats.gtkHonor}
              icon={<HandCoins className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="warning"
            />
            <StatsCard
              title="Sertifikasi"
              value={stats.gtkSertifikasi}
              icon={<Award className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="success"
            />
          </div>
        </div>
      )}

      {/* ============ GRUP 3: KEUANGAN (Pemasukan, Pengeluaran, Tunggakan satu baris) ============ */}
      {(isAdmin || isBendahara) && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Ringkasan Keuangan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatsCard
              title="Pemasukan"
              value={formatCurrency(stats.totalPemasukan)}
              icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="success"
            />
            <StatsCard
              title="Pengeluaran"
              value={formatCurrency(stats.totalPengeluaran)}
              icon={<TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="warning"
            />
            <StatsCard
              title="Tunggakan"
              value={formatCurrency(stats.totalTunggakan)}
              icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
              variant="danger"
            />
          </div>
        </div>
      )}

      {/* Activity Log - Admin only */}
      {isAdmin && (
        <div className="mb-6 sm:mb-8">
          <ActivityLog />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Siswa per Kelas - Only for Admin and Operator */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Siswa per Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            {kelasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kelasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="jumlah" fill="hsl(152, 60%, 32%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data kelas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Keuangan */}
        {(isAdmin || isBendahara) && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ringkasan Keuangan</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalPemasukan > 0 || stats.totalPengeluaran > 0 || stats.totalTunggakan > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={keuanganData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {keuanganData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data keuangan
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
