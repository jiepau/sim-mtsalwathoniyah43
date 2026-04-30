import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';
import type { AppRole } from '@/lib/supabase-helpers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, roles, loading, signOut, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated but has no roles - pending approval
  if (roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Menunggu Persetujuan Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Akun Anda telah terdaftar, namun belum memiliki akses ke sistem.
              Silakan hubungi Admin untuk mendapatkan role dan hak akses.
            </p>
            <p className="text-xs text-muted-foreground">
              Login sebagai: <span className="font-medium">{user.email}</span>
            </p>
            <Button variant="outline" onClick={signOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role-based access check
  if (allowedRoles && allowedRoles.length > 0) {
    const allowed = allowedRoles.some((r) => hasRole(r));
    if (!allowed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Akses Ditolak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali ke dashboard.
              </p>
              <p className="text-xs text-muted-foreground">
                Role Anda: <span className="font-medium">{roles.join(', ')}</span>
              </p>
              <Button onClick={() => window.history.back()} className="w-full">
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}
