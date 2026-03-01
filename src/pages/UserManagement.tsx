import { useEffect, useState } from "react";
import { Shield, Plus, Pencil, Trash2, UserPlus, Eye, EyeOff, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, AppRole } from "@/lib/supabase-helpers";
import { mapDatabaseError } from "@/lib/error-mapper";

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  roles: AppRole[];
  gtk_id?: string | null;
}

interface GtkData {
  id: string;
  nama: string;
  nip: string | null;
  user_id: string | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  bendahara: "Bendahara",
  operator: "Operator",
  guru: "Guru",
};

const ROLE_COLORS: Record<AppRole, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  bendahara: "default",
  operator: "secondary",
  guru: "outline",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [gtkList, setGtkList] = useState<GtkData[]>([]);

  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    email: "",
    password: "",
    roles: [] as AppRole[],
    gtk_id: "" as string,
  });

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    full_name: "",
    roles: [] as AppRole[],
    gtk_id: "" as string,
  });

  useEffect(() => {
    fetchUsers();
    fetchGtkList();
  }, []);

  const fetchGtkList = async () => {
    try {
      const { data, error } = await supabase
        .from("gtk_ptk")
        .select("id, nama, nip, user_id")
        .order("nama");

      if (error) throw error;
      setGtkList(data || []);
    } catch (error) {
      console.error("Error fetching GTK list:", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;

      // Fetch GTK data to get user_id mappings
      const { data: gtkData, error: gtkError } = await supabase
        .from("gtk_ptk")
        .select("id, user_id");
      if (gtkError) throw gtkError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => {
        const userRoles = allRoles?.filter((r) => r.user_id === profile.user_id) || [];
        const linkedGtk = gtkData?.find((g) => g.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: "",
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: userRoles.map((r) => r.role as AppRole),
          gtk_id: linkedGtk?.id || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  // Edit user handlers
  const handleOpenEditDialog = (userData: UserWithRoles) => {
    setEditingUser(userData);
    setEditData({
      full_name: userData.full_name,
      email: userData.email,
      password: "",
      roles: userData.roles,
      gtk_id: userData.gtk_id || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditRoleToggle = (role: AppRole) => {
    setEditData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    if (!editData.full_name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    if (editData.password && editData.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (editData.roles.length === 0) {
      toast.error("Pilih minimal 1 role");
      return;
    }

    setEditLoading(true);
    try {
      const response = await supabase.functions.invoke("manage-user", {
        body: {
          action: "update",
          user_id: editingUser.id,
          full_name: editData.full_name,
          email: editData.email || undefined,
          password: editData.password || undefined,
          roles: editData.roles,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      // Update GTK linkage if role includes guru
      if (editData.roles.includes("guru")) {
        // First, unlink any previously linked GTK for this user
        if (editingUser.gtk_id && editingUser.gtk_id !== editData.gtk_id) {
          await supabase
            .from("gtk_ptk")
            .update({ user_id: null })
            .eq("id", editingUser.gtk_id);
        }
        
        // Link new GTK if selected
        if (editData.gtk_id) {
          const { error: gtkError } = await supabase
            .from("gtk_ptk")
            .update({ user_id: editingUser.id })
            .eq("id", editData.gtk_id);
          
          if (gtkError) {
            console.error("Error linking GTK:", gtkError);
            toast.error("User diupdate, tapi gagal menghubungkan ke data GTK");
          }
        }
      } else {
        // If role no longer includes guru, unlink GTK
        if (editingUser.gtk_id) {
          await supabase
            .from("gtk_ptk")
            .update({ user_id: null })
            .eq("id", editingUser.gtk_id);
        }
      }

      toast.success("User berhasil diupdate");
      setEditDialogOpen(false);
      fetchUsers();
      fetchGtkList();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(mapDatabaseError(error));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("Tidak bisa menghapus akun sendiri");
      return;
    }

    if (!confirm("Yakin ingin menghapus user ini? Akun akan dihapus permanen.")) {
      return;
    }

    try {
      const response = await supabase.functions.invoke("manage-user", {
        body: {
          action: "delete",
          user_id: userId,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success("User berhasil dihapus");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(mapDatabaseError(error));
    }
  };

  // Create user handlers
  const handleNewUserRoleToggle = (role: AppRole) => {
    setNewUserData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
      toast.error("Semua field harus diisi");
      return;
    }

    if (newUserData.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (newUserData.roles.length === 0) {
      toast.error("Pilih minimal 1 role");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await supabase.functions.invoke("manage-user", {
        body: {
          action: "create",
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

      // Link GTK if role includes guru and gtk_id is selected
      if (newUserData.roles.includes("guru") && newUserData.gtk_id && response.data?.user?.id) {
        const { error: gtkError } = await supabase
          .from("gtk_ptk")
          .update({ user_id: response.data.user.id })
          .eq("id", newUserData.gtk_id);
        
        if (gtkError) {
          console.error("Error linking GTK:", gtkError);
          toast.error("User dibuat, tapi gagal menghubungkan ke data GTK");
        }
      }

      toast.success(`User ${newUserData.full_name} berhasil dibuat`);
      setCreateDialogOpen(false);
      setNewUserData({ email: "", password: "", full_name: "", roles: [], gtk_id: "" });
      fetchGtkList();
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(mapDatabaseError(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      header: "Nama",
      cell: (item: UserWithRoles) => (
        <div>
          <p className="font-medium">{item.full_name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.id}</p>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (item: UserWithRoles) => (
        <div className="flex flex-wrap gap-1">
          {item.roles.length > 0 ? (
            item.roles.map((role) => (
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
      header: "Terdaftar",
      cell: (item: UserWithRoles) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</span>
      ),
    },
    {
      header: "Aksi",
      cell: (item: UserWithRoles) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(item)}>
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
      className: "w-24",
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
          <li>
            <Badge variant="destructive">Admin</Badge> - Akses penuh ke semua fitur sistem
          </li>
          <li>
            <Badge variant="default">Bendahara</Badge> - Dashboard (info siswa & GTK L/P, keuangan), Siswa (read-only), Buku Induk, dan semua modul Keuangan
          </li>
          <li>
            <Badge variant="secondary">Operator</Badge> - Dashboard, Siswa, Kelas, Tahun Ajaran, GTK/PTK, Absensi (Siswa & GTK), Rekap Bulanan, Kalender Akademik, Surat Menyurat, Naik Kelas, Alumni
          </li>
          <li>
            <Badge variant="secondary">Guru</Badge> - Dashboard (info siswa L/P), Profil Saya, Absensi GTK (self-attendance), Rekap Bulanan, Kalender Akademik, dan semua modul Kurikulum
          </li>
        </ul>
      </div>

      <DataTable data={users} columns={columns} loading={loading} emptyMessage="Belum ada user terdaftar" />

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Ubah data user {editingUser?.full_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nama Lengkap</Label>
              <Input
                id="edit_full_name"
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="Email baru (kosongkan jika tidak diubah)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="edit_password"
                  type={showPassword ? "text" : "password"}
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  placeholder="Kosongkan jika tidak diubah"
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
              <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
            </div>

            <div className="space-y-3">
              <Label>
                Role <span className="text-destructive">*</span>
              </Label>
              {(["admin", "bendahara", "operator", "guru"] as AppRole[]).map((role) => (
                <div key={role} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`edit-role-${role}`}
                    checked={editData.roles.includes(role)}
                    onCheckedChange={() => handleEditRoleToggle(role)}
                    disabled={editingUser?.id === currentUser?.id && role === "admin"}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`edit-role-${role}`} className="font-medium cursor-pointer">
                      {ROLE_LABELS[role]}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {role === "admin" && "Akses penuh ke semua fitur sistem"}
                      {role === "bendahara" && "Akses Dashboard, Siswa (read-only), Keuangan"}
                      {role === "operator" && "Akses data master (Siswa, Kelas, GTK/PTK, dll)"}
                      {role === "guru" && "Akses Dashboard, Profil Saya, Kurikulum"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* GTK Link dropdown - only show if guru role is selected */}
            {editData.roles.includes("guru") && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <Label htmlFor="edit_gtk_id" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Hubungkan ke Data GTK
                </Label>
                <Select
                  value={editData.gtk_id || "none"}
                  onValueChange={(value) => setEditData({ ...editData, gtk_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih data GTK..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Tidak dihubungkan --</SelectItem>
                    {gtkList
                      .filter((gtk) => !gtk.user_id || gtk.id === editData.gtk_id)
                      .map((gtk) => (
                        <SelectItem key={gtk.id} value={gtk.id}>
                          {gtk.nama} {gtk.nip && `(${gtk.nip})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Menghubungkan akun dengan data GTK agar guru dapat melihat profil di halaman "Profil Saya"
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>Buat akun user baru dan tentukan role-nya</DialogDescription>
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
                  type={showPassword ? "text" : "password"}
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
              <Label>
                Role <span className="text-destructive">*</span>
              </Label>
              {(["admin", "bendahara", "operator", "guru"] as AppRole[]).map((role) => (
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
                    <p className="text-xs text-muted-foreground">
                      {role === "admin" && "Akses penuh ke semua fitur sistem"}
                      {role === "bendahara" && "Akses Dashboard, Siswa (read-only), Keuangan"}
                      {role === "operator" && "Akses data master (Siswa, Kelas, GTK/PTK, dll)"}
                      {role === "guru" && "Akses Dashboard, Profil Saya, Kurikulum"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* GTK Link dropdown - only show if guru role is selected */}
            {newUserData.roles.includes("guru") && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <Label htmlFor="new_gtk_id" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Hubungkan ke Data GTK
                </Label>
                <Select
                  value={newUserData.gtk_id || "none"}
                  onValueChange={(value) => setNewUserData({ ...newUserData, gtk_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih data GTK..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Tidak dihubungkan --</SelectItem>
                    {gtkList
                      .filter((gtk) => !gtk.user_id)
                      .map((gtk) => (
                        <SelectItem key={gtk.id} value={gtk.id}>
                          {gtk.nama} {gtk.nip && `(${gtk.nip})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Menghubungkan akun dengan data GTK agar guru dapat melihat profil di halaman "Profil Saya"
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Membuat..." : "Buat User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
