import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, ChevronDown, LogIn, LogOut, Palette, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AppRole } from '@/lib/supabase-helpers';

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  bendahara: 'Bendahara',
  guru: 'Guru',
  siswa: 'Siswa',
};

export function TopBar() {
  const { user, session, signOut } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [taActive, setTaActive] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [gradientIntensity, setGradientIntensity] = useState<'kuat' | 'sedang' | 'netral'>(() => {
    if (typeof window === 'undefined') return 'kuat';
    return (localStorage.getItem('sidebar-gradient') as 'kuat' | 'sedang' | 'netral') || 'kuat';
  });

  const cycleGradient = () => {
    const order: Array<'kuat' | 'sedang' | 'netral'> = ['kuat', 'sedang', 'netral'];
    const next = order[(order.indexOf(gradientIntensity) + 1) % order.length];
    setGradientIntensity(next);
    localStorage.setItem('sidebar-gradient', next);
    // Trigger reload supaya Sidebar re-read localStorage
    window.dispatchEvent(new Event('storage'));
  };

  const gradientLabel = {
    kuat: 'Kuat',
    sedang: 'Sedang',
    netral: 'Netral',
  }[gradientIntensity];

  // Reactive: reset role saat user berubah/logout supaya indikator instan sinkron
  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    (async () => {
      const [{ data: roles }, { data: ta }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user.id).limit(1).maybeSingle(),
        supabase.from('tahun_ajaran').select('nama_ta, semester').eq('is_active', true).maybeSingle(),
      ]);
      if (roles?.role) setRole(roles.role as AppRole);
      if (ta) setTaActive(`${ta.nama_ta}${ta.semester ? ' · ' + ta.semester : ''}`);
    })();
  }, [user]);

  // Listener network status — auto-update tanpa reload
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Status: butuh user (sesi aktif) DAN koneksi internet
  const sessionActive = !!user && !!session && isOnline;
  const statusLabel = !isOnline ? 'No Internet' : user ? 'Online' : 'Offline';

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const initial = fullName.charAt(0).toUpperCase();
  const roleLabel = role ? roleLabels[role] : '';

  return (
    <header className="sticky top-0 z-40 h-14 bg-white border-b-2 border-primary/20 shadow-sm">
      <div className="h-full flex items-center gap-2 sm:gap-4">
        {/* Brand area — sejajar dengan kolom sidebar (lebar 256px), nempel ke kiri */}
        <div className="hidden lg:flex items-center gap-2 h-full pl-4 pr-3 w-64 border-r border-slate-200 bg-white shrink-0">
          <img src="/logo-kemenag.png" alt="Logo Kemenag" className="h-8 w-8 object-contain shrink-0" />
          <img src="/logo-alwathoniyah.png" alt="Logo Madrasah" className="h-8 w-8 object-contain shrink-0" />
          <div className="min-w-0 leading-tight">
            <p className="text-[8px] uppercase tracking-wider text-primary font-bold truncate">
              Kementerian Agama RI
            </p>
            <p className="text-[12px] font-bold text-foreground truncate">
              MTs Al Wathoniyah 43
            </p>
          </div>
        </div>

        {/* Spacer mobile (tempat tombol toggle sidebar) */}
        <div className="lg:hidden pl-12" />

        {/* Right: status + notification + user */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2 min-w-0 pr-2 sm:pr-4 lg:pr-6">
          {/* Indikator status sesi — auto-update via onAuthStateChange + network listener */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
              sessionActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : !isOnline
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={
              !isOnline
                ? 'Koneksi internet terputus'
                : user
                ? `Sesi aktif: ${user.email}`
                : 'Belum login'
            }
            aria-live="polite"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sessionActive
                  ? 'bg-emerald-500 animate-pulse'
                  : !isOnline
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            {statusLabel}
          </div>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleGradient}
                title={`Tema hijau: ${gradientLabel} (klik untuk ubah)`}
                className="text-muted-foreground hover:text-primary hover:bg-primary/5 h-9 w-9 shrink-0"
              >
                <Palette className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5 h-9 w-9 shrink-0">
                <Bell className="h-4 w-4" />
              </Button>

              <div className="h-6 w-px bg-border hidden sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-1.5 sm:px-2 py-1.5 rounded-md hover:bg-primary/5 transition-colors min-w-0 max-w-[180px] sm:max-w-[240px]">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {initial}
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-tight min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                        {fullName}
                      </span>
                      {roleLabel && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{fullName}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role === 'guru' || role === 'bendahara' ? (
                    <DropdownMenuItem asChild>
                      <a href="/profil-guru" className="cursor-pointer">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Profil Saya
                      </a>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Masuk
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
