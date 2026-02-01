import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  Calendar, 
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AppRole } from '@/lib/supabase-helpers';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItem[];
  roles?: AppRole[]; // Which roles can see this menu
}

// All menu items with role restrictions
const allMenuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }, // All roles
  { title: 'Siswa', icon: Users, path: '/siswa' }, // All roles (bendahara = read-only handled in page)
  { title: 'Kelas', icon: School, path: '/kelas', roles: ['admin', 'operator'] },
  { title: 'Tahun Ajaran', icon: Calendar, path: '/tahun-ajaran', roles: ['admin', 'operator'] },
  { title: 'GTK/PTK', icon: UserCog, path: '/gtk-ptk', roles: ['admin', 'operator'] },
  { 
    title: 'Kurikulum', 
    icon: BookOpen,
    children: [
      { title: 'ATP', icon: BookOpen, path: '/atp' },
      { title: 'KKTP', icon: Target, path: '/kktp' },
      { title: 'Template CP', icon: FileText, path: '/cp-templates' },
    ],
    roles: ['admin', 'operator']
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
  { title: 'Naik Kelas', icon: ArrowUpCircle, path: '/naik-kelas', roles: ['admin', 'operator'] },
  { title: 'Alumni', icon: GraduationCap, path: '/alumni', roles: ['admin', 'operator'] },
  { title: 'Pengaturan Madrasah', icon: Settings, path: '/pengaturan-madrasah', roles: ['admin'] },
  { title: 'Manajemen User', icon: Shield, path: '/user-management', roles: ['admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, hasRole, roles, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Auto-expand menu based on current route
  const getInitialExpandedItems = () => {
    const path = location.pathname;
    const expanded: string[] = [];
    
    // Check Keuangan routes
    if (['/jenis-tagihan', '/pembayaran', '/pemasukan', '/pengeluaran', '/tunggakan'].includes(path)) {
      expanded.push('Keuangan');
    }
    // Check Kurikulum routes
    if (['/atp', '/kktp', '/cp-templates'].includes(path)) {
      expanded.push('Kurikulum');
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
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              active && 'bg-sidebar-accent text-sidebar-foreground font-medium',
              level > 0 && 'pl-12 py-2'
            )}
          >
            <item.icon className={cn('flex-shrink-0', level > 0 ? 'h-4 w-4' : 'h-5 w-5')} />
            {!collapsed && <span className="text-sm">{item.title}</span>}
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
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src="/logo-alwathoniyah.png" 
            alt="Logo MTs Al Wathoniyah 43" 
            className="h-10 w-10 rounded-lg object-contain"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-sidebar-foreground truncate text-sm">
                MTs Al Wathoniyah 43
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Sistem Informasi</p>
            </div>
          )}
        </div>
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
            <p className="text-sm font-semibold text-sidebar-foreground">{roleDisplayName}</p>
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
