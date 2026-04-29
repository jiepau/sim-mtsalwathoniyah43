import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
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
  const { user, signOut } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [taActive, setTaActive] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: roles }, { data: ta }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user.id).limit(1).maybeSingle(),
        supabase.from('tahun_ajaran').select('nama_ta, semester').eq('is_active', true).maybeSingle(),
      ]);
      if (roles?.role) setRole(roles.role as AppRole);
      if (ta) setTaActive(`${ta.nama_ta}${ta.semester ? ' · ' + ta.semester : ''}`);
    })();
  }, [user]);

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const initial = fullName.charAt(0).toUpperCase();
  const roleLabel = role ? roleLabels[role] : '';

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b-2 border-primary/20 shadow-sm">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: TA aktif (hanya tampil di desktop) */}
        <div className="hidden md:flex items-center gap-2 pl-12 lg:pl-0">
          {taActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20">
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">
                Tahun Ajaran Aktif
              </span>
              <span className="text-xs font-bold text-primary">{taActive}</span>
            </div>
          )}
        </div>

        {/* Right: notification + user */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bell className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/5 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                  {initial}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                    {fullName}
                  </span>
                  {roleLabel && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {roleLabel}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
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
        </div>
      </div>
    </header>
  );
}
