import { useEffect, useState } from 'react';
import { Shield, Plus, Pencil, Trash2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime, AppRole } from '@/lib/supabase-helpers';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  roles: AppRole[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  bendahara: 'Bendahara',
  operator: 'Operator',
};

const ROLE_COLORS: Record<AppRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  admin: 'destructive',
  bendahara: 'default',
  operator: 'secondary',
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Role editing dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    roles: [] as AppRole[],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const userRoles = allRoles?.filter(r => r.user_id === profile.user_id) || [];
        return {
          id: profile.user_id,
          email: '',
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: userRoles.map(r => r.role as AppRole),
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  // Role editing handlers
  const handleOpenRoleDialog = (userData: UserWithRoles) => {
    setEditingUser(userData);
    setSelectedRoles(userData.roles);
    setRoleDialogOpen(true);
  };

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;

    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id);

      if (deleteError) throw deleteError;

      if (selectedRoles.length > 0) {
        const rolesToInsert = selectedRoles.map(role => ({
          user_id: editingUser.id,
          role: role,
        }));

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (insertError) throw insertError;
      }

      toast.success('Role berhasil diupdate');
      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving roles:', error);
      toast.error(error.message || 'Gagal menyimpan role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Tidak bisa menghapus akun sendiri');
      return;
    }

    if (!confirm('Yakin ingin menghapus semua role user ini? User tidak akan bisa mengakses sistem.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Role user berhasil dihapus');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus role');
    }
  };

  // Create user handlers
  const handleNewUserRoleToggle = (role: AppRole) => {
    setNewUserData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
      toast.error('Semua field harus diisi');
      return;
    }

    if (newUserData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    if (newUserData.roles.length === 0) {
      toast.error('Pilih minimal 1 role');
      return;
    }

    setCreateLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserData.email,
          password: newUserData.password,
          full_name: newUserData.full_name,
          roles: newUserData.roles,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`User ${newUserData.full_name} berhasil dibuat`);
      setCreateDialogOpen(false);
      setNewUserData({ email: '', password: '', full_name: '', roles: [] });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Gagal membuat user');
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      header: 'Nama',
      cell: (item: UserWithRoles) => (
        <div>
          <p className="font-medium">{item.full_name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.id}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (item: UserWithRoles) => (
        <div className="flex flex-wrap gap-1">
          {item.roles.length > 0 ? (
            item.roles.map(role => (
              <Badge key={role} variant={ROLE_COLORS[role]}>
                {ROLE_LABELS[role]}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">Tanpa Role</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Terdaftar',
      cell: (item: UserWithRoles) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(item.created_at)}
        </span>
      ),
    },
    {
      header: 'Aksi',
      cell: (item: UserWithRoles) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleOpenRoleDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => handleDeleteUser(item.id)}
            disabled={item.id === currentUser?.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Manajemen User"
        description={`Total ${users.length} user terdaftar`}
        icon={<Shield className="h-6 w-6" />}
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah User
          </Button>
        }
      />

      <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
        <h3 className="font-medium mb-2">Panduan Role:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li><Badge variant="destructive">Admin</Badge> - Akses penuh ke semua fitur</li>
          <li><Badge variant="default">Bendahara</Badge> - Akses ke Dashboard, Siswa (read-only), dan semua modul Keuangan</li>
          <li><Badge variant="secondary">Operator</Badge> - Akses ke Dashboard, Siswa, Kelas, Tahun Ajaran, GTK/PTK, Naik Kelas, Alumni</li>
        </ul>
      </div>

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada user terdaftar"
      />

      {/* Edit Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atur Role User</DialogTitle>
            <DialogDescription>
              {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Pilih Role</Label>
              {(['admin', 'bendahara', 'operator'] as AppRole[]).map(role => (
                <div key={role} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`edit-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => handleRoleToggle(role)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`edit-${role}`} className="font-medium cursor-pointer">
                      {ROLE_LABELS[role]}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {role === 'admin' && 'Akses penuh ke semua fitur sistem'}
                      {role === 'bendahara' && 'Akses Dashboard, Siswa (read-only), Keuangan'}
                      {role === 'operator' && 'Akses data master (Siswa, Kelas, GTK/PTK, dll)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveRoles}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Buat akun user baru dan tentukan role-nya
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                placeholder="Contoh: Ahmad Fauzi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="contoh@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Role <span className="text-destructive">*</span></Label>
              {(['admin', 'bendahara', 'operator'] as AppRole[]).map(role => (
                <div key={role} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`new-${role}`}
                    checked={newUserData.roles.includes(role)}
                    onCheckedChange={() => handleNewUserRoleToggle(role)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`new-${role}`} className="font-medium cursor-pointer">
                      {ROLE_LABELS[role]}
                    </Label>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? 'Membuat...' : 'Buat User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
