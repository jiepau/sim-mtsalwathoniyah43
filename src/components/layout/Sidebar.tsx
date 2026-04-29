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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AppRole } from '@/lib/supabase-helpers';
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
    ],
    roles: ['admin', 'bendahara']
  },
  { title: 'Buku Induk', icon: BookMarked, path: '/buku-induk', roles: ['admin', 'bendahara'] },
  { title: 'Naik Kelas', icon: ArrowUpCircle, path: '/naik-kelas', roles: ['admin', 'operator'] },
  { title: 'Alumni', icon: GraduationCap, path: '/alumni', roles: ['admin', 'operator'] },
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
    
    if (['/jenis-tagihan', '/pembayaran', '/pemasukan', '/pengeluaran', '/tunggakan'].includes(path)) {
      expanded.push('Keuangan');
    }
    if (['/prota', '/promes', '/generator-rpp', '/atp', '/kktp', '/cp-templates', '/panduan-kurikulum'].includes(path)) {
      expanded.push('Kurikulum');
    }
    if (['/surat-masuk', '/surat-keluar'].includes(path)) {
      expanded.push('Surat Menyurat');
    }
    if (['/absensi-siswa', '/absensi-gtk', '/rekap-absensi', '/kalender-akademik'].includes(path)) {
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
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              active && 'bg-sidebar-accent text-sidebar-foreground',
              level > 0 && 'pl-12'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
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
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative',
              'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              active && 'bg-sidebar-accent text-sidebar-foreground font-medium',
              level > 0 && 'pl-12 py-2'
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
      {/* Header — Nuansa Kemenag */}
      <div className={cn(
        "border-b border-sidebar-border bg-gradient-to-br from-primary/15 via-sidebar-accent/30 to-transparent",
        collapsed ? "p-2" : "p-4"
      )}>
        {collapsed ? (
          // COLLAPSED: 2 logo bertumpuk vertikal, center
          <div className="flex flex-col items-center gap-1.5">
            <img
              src="/logo-kemenag.png"
              alt="Logo Kementerian Agama RI"
              loading="lazy"
              className="h-9 w-9 object-contain"
            />
            <div className="h-px w-6 bg-sidebar-border/60" />
            <img
              src="/logo-alwathoniyah.png"
              alt="Logo MTs Al Wathoniyah 43"
              loading="lazy"
              className="h-9 w-9 rounded-md object-contain"
            />
          </div>
        ) : (
          // EXPANDED: 2 logo sejajar + teks brand
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <img
                src="/logo-kemenag.png"
                alt="Logo Kementerian Agama RI"
                loading="lazy"
                className="h-11 w-11 object-contain drop-shadow-sm"
              />
              <img
                src="/logo-alwathoniyah.png"
                alt="Logo MTs Al Wathoniyah 43"
                loading="lazy"
                className="h-11 w-11 rounded-md object-contain drop-shadow-sm"
              />
            </div>
            <div className="flex-1 min-w-0 border-l border-sidebar-border/40 pl-3">
              <p className="text-[9px] uppercase tracking-[0.12em] text-sidebar-foreground/70 font-bold leading-tight">
                Kementerian Agama RI
              </p>
              <h1 className="font-bold text-sidebar-foreground truncate text-[13px] leading-snug mt-0.5">
                MTs Al Wathoniyah 43
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 truncate leading-tight">
                Sistem Informasi Madrasah
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer with user info */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* User Role Badge */}
        {!collapsed && roleDisplayName && (
          <div className="px-4 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-xs text-sidebar-foreground/60">Login sebagai</p>
            <p className="text-sm font-semibold text-sidebar-foreground">
              {user?.user_metadata?.full_name || user?.email || roleDisplayName}
            </p>
            <p className="text-xs text-sidebar-foreground/50">{roleDisplayName}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Keluar</span>}
        </button>
      </div>
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
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-sidebar sidebar-gradient islamic-pattern flex flex-col transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
