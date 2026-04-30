import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  Calendar, 
  CalendarDays,
  UserCog,
  Wallet,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Building2,
  ArrowUpCircle,
  GraduationCap,
  Shield,
  BookOpen,
  Target,
  FileText,
  Settings,
  Sparkles,
  Mail,
  MailOpen,
  Send,
  BookMarked,
  User,
  ClipboardCheck,
  ClipboardList,
  BarChart3,
  MessageSquare,
  History,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AppRole } from '@/lib/supabase-helpers';
import { useSidebarTheme } from '@/hooks/useSidebarTheme';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItem[];
  roles?: AppRole[]; // Which roles can see this menu
}

// All menu items with role restrictions
const allMenuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'operator', 'bendahara', 'guru'] },
  { title: 'Dashboard Siswa', icon: GraduationCap, path: '/e-learning/dashboard', roles: ['siswa'] },
  { title: 'Profil Saya', icon: User, path: '/profil-guru', roles: ['guru', 'bendahara'] },
  { title: 'Siswa', icon: Users, path: '/siswa', roles: ['admin', 'operator', 'bendahara'] },
  { title: 'Kelas', icon: School, path: '/kelas', roles: ['admin', 'operator'] },
  { title: 'Tahun Ajaran', icon: Calendar, path: '/tahun-ajaran', roles: ['admin', 'operator'] },
  { title: 'GTK/PTK', icon: UserCog, path: '/gtk-ptk', roles: ['admin', 'operator'] },
  { 
    title: 'Absensi', 
    icon: ClipboardCheck,
    children: [
      { title: 'Absensi Siswa', icon: ClipboardCheck, path: '/absensi-siswa' },
      { title: 'Absensi GTK', icon: ClipboardList, path: '/absensi-gtk' },
      { title: 'Rekap Bulanan', icon: BarChart3, path: '/rekap-absensi' },
      { title: 'Rapor Kehadiran', icon: ClipboardList, path: '/rapor-kehadiran' },
      { title: 'Kalender Akademik', icon: CalendarDays, path: '/kalender-akademik' },
    ],
    roles: ['admin', 'operator', 'guru']
  },
  { 
    title: 'Surat Menyurat', 
    icon: Mail,
    children: [
      { title: 'Surat Masuk', icon: MailOpen, path: '/surat-masuk' },
      { title: 'Surat Keluar', icon: Send, path: '/surat-keluar' },
    ],
    roles: ['admin', 'operator']
  },
  { 
    title: 'Kurikulum', 
    icon: BookOpen,
    children: [
      { title: '📋 Panduan', icon: BookOpen, path: '/panduan-kurikulum' },
      { title: 'Template CP', icon: FileText, path: '/cp-templates' },
      { title: 'ATP', icon: BookOpen, path: '/atp' },
      { title: 'KKTP', icon: Target, path: '/kktp' },
      { title: 'Prota', icon: Calendar, path: '/prota' },
      { title: 'Promes', icon: CalendarDays, path: '/promes' },
      { title: 'Generator RPP', icon: Sparkles, path: '/generator-rpp' },
    ],
    roles: ['admin', 'operator', 'guru']
  },
  { 
    title: 'E-Learning',
    icon: GraduationCap,
    children: [
      { title: 'Kelola Materi', icon: BookOpen, path: '/e-learning/materi-guru', roles: ['admin', 'operator', 'guru'] },
      { title: 'Kelola Tugas', icon: ClipboardList, path: '/e-learning/tugas-guru', roles: ['admin', 'operator', 'guru'] },
      { title: 'Materi', icon: BookOpen, path: '/e-learning/materi-siswa', roles: ['siswa'] },
      { title: 'Tugas', icon: ClipboardList, path: '/e-learning/tugas-siswa', roles: ['siswa'] },
      { title: 'Nilai Saya', icon: Target, path: '/e-learning/nilai', roles: ['siswa'] },
      { title: 'Forum Diskusi', icon: MessageSquare, path: '/e-learning/forum' },
    ],
    roles: ['admin', 'operator', 'guru', 'siswa']
  },
  { 
    title: 'Keuangan', 
    icon: Wallet,
    children: [
      { title: 'Jenis Tagihan', icon: Receipt, path: '/jenis-tagihan' },
      { title: 'Pembayaran', icon: CreditCard, path: '/pembayaran' },
      { title: 'Pemasukan', icon: TrendingUp, path: '/pemasukan' },
      { title: 'Pengeluaran', icon: TrendingDown, path: '/pengeluaran' },
      { title: 'Tunggakan', icon: AlertTriangle, path: '/tunggakan' },
      { title: 'Laporan Keuangan', icon: FileText, path: '/laporan-keuangan' },
    ],
    roles: ['admin', 'bendahara']
  },
  { title: 'Buku Induk', icon: BookMarked, path: '/buku-induk', roles: ['admin', 'bendahara'] },
  { title: 'Naik Kelas', icon: ArrowUpCircle, path: '/naik-kelas', roles: ['admin', 'operator'] },
  { title: 'Alumni', icon: GraduationCap, path: '/alumni', roles: ['admin', 'operator'] },
  { title: 'Kalender Akademik', icon: CalendarDays, path: '/kalender-akademik', roles: ['siswa'] },
  { title: 'Riwayat Pembaruan', icon: History, path: '/changelog' }, // All roles
  { title: 'Pengaturan Madrasah', icon: Settings, path: '/pengaturan-madrasah', roles: ['admin'] },
  { title: 'Notifikasi WA', icon: MessageSquare, path: '/notifikasi-wa', roles: ['admin'] },
  { title: 'Manajemen User', icon: Shield, path: '/user-management', roles: ['admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, hasRole, roles, loading, isAdmin, user } = useAuth();
  const { hasUpdate } = useUpdateChecker();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [taActive, setTaActive] = useState<{ nama_ta: string; semester: string } | null>(null);
  const { themeColor, intensity: gradientIntensity } = useSidebarTheme();

  // Fetch TA aktif
  useEffect(() => {
    supabase
      .from('tahun_ajaran')
      .select('nama_ta, semester')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTaActive({ nama_ta: data.nama_ta, semester: data.semester });
      });
  }, []);

  const gradientMap = {
    hijau: {
      super: 'bg-gradient-to-b from-teal-700 via-teal-600 to-teal-500',
      kuat: 'bg-gradient-to-b from-teal-700 via-teal-600 to-teal-500/95',
      sedang: 'bg-gradient-to-b from-teal-600 via-teal-500 to-teal-400',
      netral: 'bg-gradient-to-b from-teal-600 via-teal-500 to-teal-400/90',
      kontras: 'bg-gradient-to-b from-teal-800 via-teal-700 to-teal-600',
    },
    tosca: {
      super: 'bg-gradient-to-b from-teal-700 via-cyan-600 to-teal-500',
      kuat: 'bg-gradient-to-b from-teal-700 via-cyan-600 to-teal-500/95',
      sedang: 'bg-gradient-to-b from-teal-600 via-cyan-500 to-teal-400',
      netral: 'bg-gradient-to-b from-teal-600 via-cyan-500 to-teal-400/90',
      kontras: 'bg-gradient-to-b from-teal-800 via-cyan-700 to-teal-600',
    },
  };
  const gradientClass = gradientMap[themeColor][gradientIntensity];
  const isKontras = gradientIntensity === 'kontras';

  // Fetch pending approval count for admin
  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingCount = async () => {
      const { data: profiles } = await supabase.from('profiles').select('user_id');
      if (!profiles) return;
      const { data: rolesData } = await supabase.from('user_roles').select('user_id');
      const usersWithRoles = new Set(rolesData?.map(r => r.user_id) || []);
      const pending = profiles.filter(p => !usersWithRoles.has(p.user_id)).length;
      setPendingApprovalCount(pending);
    };

    fetchPendingCount();

    // Listen for realtime changes
    const channel = supabase
      .channel('pending-approval-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchPendingCount())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchPendingCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);
  
  // Auto-expand menu based on current route
  const getInitialExpandedItems = () => {
    const path = location.pathname;
    const expanded: string[] = [];
    
    if (['/jenis-tagihan', '/pembayaran', '/pemasukan', '/pengeluaran', '/tunggakan', '/laporan-keuangan'].includes(path)) {
      expanded.push('Keuangan');
    }
    if (['/prota', '/promes', '/generator-rpp', '/atp', '/kktp', '/cp-templates', '/panduan-kurikulum'].includes(path)) {
      expanded.push('Kurikulum');
    }
    if (['/surat-masuk', '/surat-keluar'].includes(path)) {
      expanded.push('Surat Menyurat');
    }
    if (['/absensi-siswa', '/absensi-gtk', '/rekap-absensi', '/rapor-kehadiran', '/kalender-akademik'].includes(path)) {
      expanded.push('Absensi');
    }
    if (path.startsWith('/e-learning/')) {
      expanded.push('E-Learning');
    }
    
    return expanded;
  };
  
  const [expandedItems, setExpandedItems] = useState<string[]>(getInitialExpandedItems);

  // Debug: log role state
  console.log('Sidebar roles:', roles, 'loading:', loading);

  // Get display role name
  const getRoleDisplayName = () => {
    if (roles.includes('admin')) return 'Admin';
    if (roles.includes('bendahara')) return 'Bendahara';
    if (roles.includes('operator')) return 'Operator';
    if (roles.includes('guru')) return 'Guru';
    if (roles.includes('siswa')) return 'Siswa';
    return null;
  };
  
  const roleDisplayName = getRoleDisplayName();

  // Filter menu items based on user roles
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    // If still loading roles, show all menu items to prevent flicker
    if (loading) {
      return items.map(item => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined
      }));
    }
    
    return items.filter(item => {
      // If no roles specified, show to everyone
      if (!item.roles || item.roles.length === 0) return true;
      // Check if user has any of the required roles
      return item.roles.some(role => hasRole(role));
    }).map(item => ({
      ...item,
      children: item.children ? filterMenuItems(item.children) : undefined
    }));
  };

  // Recalculate when roles change
  const menuItems = filterMenuItems(allMenuItems);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isChildActive = (children?: MenuItem[]) => 
    children?.some(child => location.pathname === child.path);

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.path) || isChildActive(item.children);

    return (
      <div key={item.title}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.title)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200',
              'text-white/90 hover:text-white hover:bg-white/15',
              active && 'bg-white text-primary font-semibold shadow-sm',
              level > 0 && 'pl-12'
            )}
          >
            <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary")} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </>
            )}
          </button>
        ) : (
          <Link
            to={item.path || '#'}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative',
              'text-white/90 hover:text-white hover:bg-white/15',
              active && 'bg-white text-primary font-semibold shadow-sm hover:bg-white hover:text-primary',
              level > 0 && 'pl-12 py-2 text-[13px]'
            )}
          >
            <item.icon className={cn('flex-shrink-0', level > 0 ? 'h-4 w-4' : 'h-5 w-5')} />
            {!collapsed && <span className="text-sm">{item.title}</span>}
            {/* Pending approval badge for Manajemen User */}
            {item.path === '/user-management' && pendingApprovalCount > 0 && !collapsed && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                {pendingApprovalCount}
              </span>
            )}
            {item.path === '/user-management' && pendingApprovalCount > 0 && collapsed && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {pendingApprovalCount}
              </span>
            )}
            {/* Update badge for Pengaturan Madrasah */}
            {item.path === '/pengaturan-madrasah' && hasUpdate && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
              </span>
            )}
          </Link>
        )}
        
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Header dipindahkan ke TopBar agar menyatu */}

      {/* TA Aktif — di atas menu, ala EMIS */}
      {taActive && !collapsed && (
        <div className="px-3 pt-3 pb-2 space-y-1.5">
          <div className="px-4 py-2 rounded-md bg-white/70 border border-primary/25 shadow-sm">
            <p className="text-[13px] text-foreground">
              <span className="font-semibold">Tahun:</span> <span className="font-bold text-primary">{taActive.nama_ta}</span>
            </p>
          </div>
          <div className="px-4 py-2 rounded-md bg-white/70 border border-primary/25 shadow-sm">
            <p className="text-[13px] text-foreground">
              <span className="font-semibold">Semester:</span> <span className="font-bold text-primary">{taActive.semester}</span>
            </p>
          </div>
        </div>
      )}
      {taActive && collapsed && (
        <div className="px-2 pt-3 pb-2">
          <div
            title={`Tahun ${taActive.nama_ta} · Semester ${taActive.semester}`}
            className="px-2 py-1.5 rounded-md bg-white/70 border border-primary/25 text-center"
          >
            <p className="text-[10px] font-bold text-primary leading-tight">{taActive.nama_ta.split('/')[0]}</p>
            <p className="text-[9px] text-foreground/70 leading-tight">Sem {taActive.semester?.charAt(0)}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer — quick logout & info ringkas */}
      {user && (
        <div className="px-3 pt-2 pb-3 space-y-1">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 leading-tight flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  {roleDisplayName && (
                    <p className="text-[10px] text-white/70 uppercase tracking-wider font-medium truncate">
                      {roleDisplayName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={async () => { setLoggingOut(true); await signOut(); setLoggingOut(false); }}
                disabled={loggingOut}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm font-semibold",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700",
                  loggingOut
                    ? "bg-red-500/30 text-red-300 border-red-400/40 cursor-wait opacity-80"
                    : "bg-red-500/20 text-red-500 border-red-400/30 hover:bg-red-600/50 hover:text-white hover:border-red-400/60 hover:shadow-md hover:shadow-red-900/20 active:scale-[0.97]"
                )}
              >
                {loggingOut ? (
                  <svg className="h-5 w-5 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
                ) : (
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                )}
                <span>{loggingOut ? 'Memproses...' : 'Keluar'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={async () => { setLoggingOut(true); await signOut(); setLoggingOut(false); }}
              disabled={loggingOut}
              title="Keluar"
              className={cn(
                "w-full flex items-center justify-center px-4 py-2.5 rounded-lg border transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700",
                loggingOut
                  ? "bg-red-500/30 text-red-300 border-red-400/40 cursor-wait opacity-80"
                  : "bg-red-500/20 text-red-500 border-red-400/30 hover:bg-red-600/50 hover:text-white hover:border-red-400/60 hover:shadow-md hover:shadow-red-900/20 active:scale-[0.97]"
              )}
            >
              {loggingOut ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-intensity={gradientIntensity}
        className={cn(
          'sidebar-aside fixed left-0 z-30 flex flex-col shadow-md',
          'top-0 h-screen lg:top-14 lg:h-[calc(100vh-3.5rem)]',
          gradientClass,
          isKontras ? 'border-r-2 border-primary/70' : 'border-r-2 border-primary/30',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
