import { useEffect, useState } from 'react';
import { 
  Users, 
  School, 
  UserCog, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Calendar,
  Sparkles
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

interface DashboardStats {
  totalSiswa: number;
  totalKelas: number;
  totalGtk: number;
  totalTunggakan: number;
  totalPemasukan: number;
  totalPengeluaran: number;
}

const COLORS = ['hsl(152, 60%, 32%)', 'hsl(45, 90%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)'];

export default function Dashboard() {
  const setupStatus = useSetupWizard();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalKelas: 0,
    totalGtk: 0,
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

  const handleWizardClose = () => {
    setWizardOpen(false);
    localStorage.setItem('setup-wizard-dismissed', 'true');
  };

  const fetchStats = async () => {
    try {
      // Fetch counts
      const [siswaRes, kelasRes, gtkRes, pembayaranRes, pengeluaranRes] = await Promise.all([
        supabase.from('siswa').select('id, kelas_id', { count: 'exact' }),
        supabase.from('kelas').select('id, nama_kelas', { count: 'exact' }),
        supabase.from('gtk_ptk').select('id', { count: 'exact' }),
        supabase.from('pembayaran').select('nominal, nominal_bayar, status'),
        supabase.from('pengeluaran').select('nominal'),
      ]);

      // Calculate tunggakan
      const tunggakan = pembayaranRes.data?.reduce((acc, p) => {
        if (p.status === 'belum_lunas' || p.status === 'cicil') {
          return acc + (Number(p.nominal) - Number(p.nominal_bayar));
        }
        return acc;
      }, 0) || 0;

      // Calculate pemasukan
      const pemasukan = pembayaranRes.data?.reduce((acc, p) => acc + Number(p.nominal_bayar), 0) || 0;

      // Calculate pengeluaran
      const pengeluaran = pengeluaranRes.data?.reduce((acc, p) => acc + Number(p.nominal), 0) || 0;

      // Calculate siswa per kelas
      const kelasMap = new Map<string, number>();
      kelasRes.data?.forEach(k => kelasMap.set(k.id, 0));
      siswaRes.data?.forEach(s => {
        if (s.kelas_id && kelasMap.has(s.kelas_id)) {
          kelasMap.set(s.kelas_id, (kelasMap.get(s.kelas_id) || 0) + 1);
        }
      });

      const kelasChartData = kelasRes.data?.map(k => ({
        name: k.nama_kelas,
        jumlah: kelasMap.get(k.id) || 0,
      })) || [];

      setKelasData(kelasChartData);

      setStats({
        totalSiswa: siswaRes.count || 0,
        totalKelas: kelasRes.count || 0,
        totalGtk: gtkRes.count || 0,
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatsCard
          title="Total Siswa"
          value={stats.totalSiswa}
          icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="default"
        />
        <StatsCard
          title="Jumlah Kelas"
          value={stats.totalKelas}
          icon={<School className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="info"
        />
        <StatsCard
          title="GTK/PTK"
          value={stats.totalGtk}
          icon={<UserCog className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="success"
        />
        <StatsCard
          title="Tunggakan"
          value={formatCurrency(stats.totalTunggakan)}
          icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
          variant="danger"
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Siswa per Kelas */}
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
      </div>
    </div>
  );
}
