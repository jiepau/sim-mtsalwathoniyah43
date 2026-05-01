import { useEffect, useState } from "react";
import { Shield, Plus, Pencil, Trash2, UserPlus, Eye, EyeOff, Link2, Download, CheckCircle, Users, UserMinus, ChevronDown, List, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  roles: AppRole[];
  gtk_id?: string | null;
  initial_password?: string | null;
}

interface GtkData {
  id: string;
  nama: string;
  nip: string | null;
  nuptk: string | null;
  email: string | null;
  jabatan: string | null;
  user_id: string | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  bendahara: "Bendahara",
  operator: "Operator",
  guru: "Guru",
  siswa: "Siswa",
  panitia: "Panitia",
};

const ROLE_COLORS: Record<AppRole, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  bendahara: "default",
  operator: "secondary",
  guru: "outline",
  siswa: "outline",
  panitia: "secondary",
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

  // Generate student accounts
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateResults, setGenerateResults] = useState<any>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState<"siswa" | "gtk">("siswa");

  // Generate GTK accounts
  const [generateGtkLoading, setGenerateGtkLoading] = useState(false);

  // Delete all student accounts
  const [deleteStudentsLoading, setDeleteStudentsLoading] = useState(false);

  // Delete all GTK accounts
  const [deleteGtkLoading, setDeleteGtkLoading] = useState(false);

  // List GTK accounts dialog
  const [listGtkDialogOpen, setListGtkDialogOpen] = useState(false);
  const [listGtkSearch, setListGtkSearch] = useState("");
  const [listGtkStatusFilter, setListGtkStatusFilter] = useState<"all" | "aktif" | "menunggu" | "belum">("all");
  const [resetPwLoading, setResetPwLoading] = useState<string | null>(null);

  const handleResetGtkPassword = async (gtk: GtkData, userId: string) => {
    // Generate default password: Gtk + (NUPTK or NIP or random)
    const identifier = gtk.nuptk || gtk.nip || Math.random().toString(36).slice(2, 10);
    const defaultPw = `Gtk${identifier}`;
    const inputPw = prompt(
      `Reset password untuk: ${gtk.nama}\nEmail: ${gtk.email || "-"}\n\nKosongkan untuk pakai password default: ${defaultPw}\n\nMin. 8 karakter, mengandung huruf & angka.`,
      defaultPw
    );
    if (inputPw === null) return;
    const newPassword = inputPw.trim() || defaultPw;
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("Password minimal 8 karakter, mengandung huruf & angka");
      return;
    }

    setResetPwLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("manage-user", {
        body: { action: "update", user_id: userId, password: newPassword },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      toast.success(`Password ${gtk.nama} berhasil direset`, {
        description: `Password baru: ${newPassword}`,
        duration: 10000,
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(mapDatabaseError(error));
    } finally {
      setResetPwLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGtkList();
  }, []);

  const fetchGtkList = async () => {
    try {
      const { data, error } = await supabase
        .from("gtk_ptk")
        .select("id, nama, nip, nuptk, email, jabatan, user_id")
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
          initial_password: (profile as any).initial_password || null,
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

      // Update GTK linkage
      if (editingUser.gtk_id && editingUser.gtk_id !== editData.gtk_id) {
        await supabase
          .from("gtk_ptk")
          .update({ user_id: null })
          .eq("id", editingUser.gtk_id);
      }
      
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

  // Check if user is a Google Sign-In user (no initial_password)
  const isGoogleUser = (userData: UserWithRoles) => !userData.initial_password;

  // Approve pending user (assign role)
  const handleApproveUser = (userData: UserWithRoles) => {
    handleOpenEditDialog(userData);
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

      // Link GTK if gtk_id is selected
      if (newUserData.gtk_id && response.data?.user?.id) {
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

  // Export users to CSV
  const handleExportCSV = () => {
    const headers = ["Nama", "Role", "Password Awal", "Terdaftar"];
    const rows = users.map((u) => [
      u.full_name,
      u.roles.map((r) => ROLE_LABELS[r]).join(", ") || "Tanpa Role",
      u.initial_password || "-",
      formatDateTime(u.created_at),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daftar-user-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data user berhasil di-export");
  };

  const handleExportStudentAccounts = () => {
    const siswaUsers = users.filter((u) => u.roles.includes("siswa"));
    if (siswaUsers.length === 0) {
      toast.info("Belum ada akun siswa yang terdaftar");
      return;
    }
    const headers = ["Nama", "Email/Username", "Password Awal"];
    const rows = siswaUsers.map((u) => [
      u.full_name,
      u.initial_password ? `${u.initial_password.replace("Siswa", "")}@siswa.mts` : "-",
      u.initial_password || "-",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `akun-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data akun siswa berhasil di-export");
  };

  const handleGenerateStudentAccounts = async () => {
    if (!confirm("Generate akun untuk semua siswa aktif yang belum memiliki akun?\n\nFormat: NIS@siswa.mts / SiswaNIS")) return;
    
    setGenerateLoading(true);
    try {
      const response = await supabase.functions.invoke("generate-student-accounts");
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      setGenerateMode("siswa");
      setGenerateResults(response.data);
      setGenerateDialogOpen(true);
      
      if (response.data.created > 0) {
        toast.success(`${response.data.created} akun siswa berhasil dibuat`);
        fetchUsers();
      } else {
        toast.info(response.data.message || "Tidak ada akun baru yang dibuat");
      }
    } catch (error: any) {
      console.error("Error generating student accounts:", error);
      toast.error(mapDatabaseError(error));
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleGenerateGtkAccounts = async () => {
    if (!confirm("Generate akun untuk semua GTK aktif yang belum memiliki akun?\n\n• Email: pakai email asli (jika ada), fallback ke NUPTK/NIP@gtk.mts\n• Password: Gtk + NUPTK/NIP\n• Role otomatis berdasarkan jabatan:\n   - Kepala/Wakil Kepala Madrasah → admin\n   - Bendahara → bendahara\n   - Guru (apapun) → guru\n   - TU/Tendik/lainnya → operator")) return;

    setGenerateGtkLoading(true);
    try {
      const response = await supabase.functions.invoke("generate-gtk-accounts");
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      setGenerateMode("gtk");
      setGenerateResults(response.data);
      setGenerateDialogOpen(true);

      if (response.data.created > 0) {
        toast.success(`${response.data.created} akun GTK berhasil dibuat`);
        fetchUsers();
        fetchGtkList();
      } else {
        toast.info(response.data.message || "Tidak ada akun GTK baru yang dibuat");
      }
    } catch (error: any) {
      console.error("Error generating GTK accounts:", error);
      toast.error(mapDatabaseError(error));
    } finally {
      setGenerateGtkLoading(false);
    }
  };
  const handleDeleteAllStudentAccounts = async () => {
    const siswaCount = users.filter(u => u.roles.includes("siswa")).length;
    if (siswaCount === 0) {
      toast.info("Tidak ada akun siswa yang terdaftar");
      return;
    }

    const confirmText = prompt(
      `Anda akan menghapus ${siswaCount} akun siswa.\n\nKetik "HAPUS AKUN SISWA" untuk konfirmasi:`
    );
    if (confirmText !== "HAPUS AKUN SISWA") {
      if (confirmText !== null) toast.error("Teks konfirmasi tidak sesuai");
      return;
    }

    setDeleteStudentsLoading(true);
    try {
      const response = await supabase.functions.invoke("delete-student-accounts");
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      const { deleted, total } = response.data;
      toast.success(`${deleted} dari ${total} akun siswa berhasil dihapus`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting student accounts:", error);
      toast.error(mapDatabaseError(error));
    } finally {
      setDeleteStudentsLoading(false);
    }
  };

  const handleExportGtkAccounts = () => {
    // Hanya GTK yang sudah ter-link ke akun (punya user_id)
    const linkedGtk = gtkList.filter((g) => g.user_id);
    if (linkedGtk.length === 0) {
      toast.info("Belum ada akun GTK yang terdaftar");
      return;
    }
    const userMap = new Map(users.map((u) => [u.id, u]));

    const headers = ["Nama", "NUPTK/NIP", "Jabatan", "Role", "Email/Username", "Password Awal"];
    const rows = linkedGtk.map((g) => {
      const u = userMap.get(g.user_id as string);
      const identifier = g.nuptk || g.nip || "";
      const initial = u?.initial_password || "";
      // Email tampilan: pakai email asli kalau ada, fallback identifier@gtk.mts
      const emailDisplay = g.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)
        ? g.email
        : (identifier ? `${identifier.toLowerCase()}@gtk.mts` : "-");
      return [
        g.nama,
        identifier || "-",
        g.jabatan || "-",
        u?.roles.map((r) => ROLE_LABELS[r]).join(", ") || "-",
        emailDisplay,
        initial || "-",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `akun-gtk-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data akun GTK berhasil di-export");
  };

  const handleDeleteAllGtkAccounts = async () => {
    const gtkCount = gtkList.filter((g) => g.user_id).length;
    if (gtkCount === 0) {
      toast.info("Tidak ada akun GTK yang terdaftar");
      return;
    }

    const confirmText = prompt(
      `Anda akan menghapus ${gtkCount} akun GTK.\n\nCatatan: akun yang juga memiliki role admin akan dilewati.\n\nKetik "HAPUS AKUN GTK" untuk konfirmasi:`
    );
    if (confirmText !== "HAPUS AKUN GTK") {
      if (confirmText !== null) toast.error("Teks konfirmasi tidak sesuai");
      return;
    }

    setDeleteGtkLoading(true);
    try {
      const response = await supabase.functions.invoke("delete-gtk-accounts");
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      const { deleted, total } = response.data;
      toast.success(`${deleted} dari ${total} akun GTK berhasil dihapus`);
      fetchUsers();
      fetchGtkList();
    } catch (error: any) {
      console.error("Error deleting GTK accounts:", error);
      toast.error(mapDatabaseError(error));
    } finally {
      setDeleteGtkLoading(false);
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
            <Badge variant="outline" className="text-orange-600 border-orange-300">Menunggu Approval</Badge>
          )}
        </div>
      ),
    },
    {
      header: "Password Awal",
      cell: (item: UserWithRoles) => (
        <span className="text-sm text-muted-foreground font-mono">
          {item.initial_password || "Google Sign-In"}
        </span>
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
          {item.roles.length === 0 && (
            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleApproveUser(item)} title="Approve & assign role">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
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
      className: "w-32",
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Manajemen User"
        description={`Total ${users.length} user terdaftar`}
        icon={<Shield className="h-6 w-6" />}
        actions={
           <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Akun Siswa
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuItem onClick={handleGenerateStudentAccounts} disabled={generateLoading}>
                  <Users className="h-4 w-4 mr-2" />
                  {generateLoading ? "Generating..." : "Generate Akun Siswa"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportStudentAccounts}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Akun Siswa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteAllStudentAccounts}
                  disabled={deleteStudentsLoading}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  {deleteStudentsLoading ? "Menghapus..." : "Hapus Semua Akun Siswa"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Akun GTK
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuItem onClick={() => setListGtkDialogOpen(true)}>
                  <List className="h-4 w-4 mr-2" />
                  Lihat Daftar Akun GTK
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGenerateGtkAccounts} disabled={generateGtkLoading}>
                  <Users className="h-4 w-4 mr-2" />
                  {generateGtkLoading ? "Generating..." : "Generate Akun GTK"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportGtkAccounts}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Akun GTK
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteAllGtkAccounts}
                  disabled={deleteGtkLoading}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  {deleteGtkLoading ? "Menghapus..." : "Hapus Semua Akun GTK"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export Semua
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah User
            </Button>
          </div>
        }
      />

      <Collapsible>
        <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" /> Panduan Role & Hak Akses
            </h3>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3 space-y-4">
            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {/* Admin */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Admin</Badge>
                  <span className="text-xs text-muted-foreground">Superuser</span>
                </div>
                <p className="text-xs text-muted-foreground">Akses penuh ke <strong>seluruh fitur</strong> sistem tanpa batasan.</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Dashboard, Siswa, Kelas, Tahun Ajaran, GTK/PTK</li>
                  <li>Absensi, Surat Menyurat, Kurikulum, E-Learning</li>
                  <li>Keuangan (semua modul), Buku Induk</li>
                  <li>Naik Kelas, Alumni, SPMB</li>
                  <li>Pengaturan Madrasah, Notifikasi WA</li>
                  <li>Manajemen User (tambah, edit, hapus)</li>
                </ul>
              </div>

              {/* Operator */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Operator</Badge>
                  <span className="text-xs text-muted-foreground">Data Master</span>
                </div>
                <p className="text-xs text-muted-foreground">Mengelola data akademik & administratif <strong>tanpa akses keuangan</strong>.</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Dashboard, Siswa, Kelas, Tahun Ajaran</li>
                  <li>GTK/PTK, Absensi, Surat Menyurat</li>
                  <li>Kurikulum, E-Learning (kelola)</li>
                  <li>Naik Kelas, Alumni</li>
                </ul>
              </div>

              {/* Bendahara */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Bendahara</Badge>
                  <span className="text-xs text-muted-foreground">Keuangan</span>
                </div>
                <p className="text-xs text-muted-foreground">Mengelola seluruh modul keuangan, <strong>baca saja</strong> untuk data siswa.</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Dashboard (info siswa & GTK L/P, keuangan)</li>
                  <li>Siswa (read-only), Profil Saya</li>
                  <li>Jenis Tagihan, Pembayaran, Pemasukan</li>
                  <li>Pengeluaran, Tunggakan, Laporan Keuangan</li>
                  <li>Buku Induk</li>
                </ul>
              </div>

              {/* Guru */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Guru</Badge>
                  <span className="text-xs text-muted-foreground">Pengajar</span>
                </div>
                <p className="text-xs text-muted-foreground">Akses kurikulum, e-learning, dan <strong>absensi mandiri</strong>.</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Dashboard, Profil Saya</li>
                  <li>Absensi GTK (self-attendance)</li>
                  <li>Kurikulum (ATP, KKTP, Prota, Promes, RPP)</li>
                  <li>E-Learning (kelola materi & tugas, forum)</li>
                </ul>
              </div>

              {/* Siswa */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Siswa</Badge>
                  <span className="text-xs text-muted-foreground">Peserta Didik</span>
                </div>
                <p className="text-xs text-muted-foreground">Akses e-learning dan <strong>dashboard khusus siswa</strong>.</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Dashboard Siswa</li>
                  <li>E-Learning (lihat materi, kerjakan tugas)</li>
                  <li>Nilai Saya, Forum Diskusi</li>
                  <li>Kalender Akademik</li>
                </ul>
              </div>

              {/* Panitia */}
              <div className="border rounded-lg p-3 space-y-2 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Panitia</Badge>
                  <span className="text-xs text-muted-foreground">SPMB</span>
                </div>
                <p className="text-xs text-muted-foreground">Khusus mengelola <strong>Sistem Penerimaan Murid Baru</strong>.</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Dashboard</li>
                  <li>SPMB — lihat, verifikasi, dan kelola pendaftar</li>
                  <li>Export data pendaftar (CSV EMIS 4.0)</li>
                  <li>Riwayat Pembaruan</li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-t pt-2">
              💡 Guru yang masuk via Google akan berstatus <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">Menunggu Approval</Badge> — Admin perlu assign role secara manual.
            </p>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <DataTable data={users} columns={columns} loading={loading} emptyMessage="Belum ada user terdaftar" paginated defaultPageSize={10} />

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser && editingUser.roles.length === 0 ? "Approve User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {editingUser && editingUser.roles.length === 0 
                ? `Berikan role untuk ${editingUser?.full_name}` 
                : `Ubah data user ${editingUser?.full_name}`}
            </DialogDescription>
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

            {/* Hide password field for Google Sign-In users when approving */}
            {!(editingUser && isGoogleUser(editingUser) && editingUser.roles.length === 0) && (
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
            )}
            
            {editingUser && isGoogleUser(editingUser) && editingUser.roles.length === 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ Akun ini terdaftar via Google Sign-In. Tidak perlu mengatur password — cukup pilih role lalu simpan.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label>
                Role <span className="text-destructive">*</span>
              </Label>
              {(["admin", "bendahara", "operator", "guru", "panitia"] as AppRole[]).map((role) => (
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
                      {role === "panitia" && "Dashboard, SPMB, Riwayat Pembaruan"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {editData.roles.length > 0 && (
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
                  Menghubungkan akun dengan data GTK/PTK untuk sinkronisasi data
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
              {(["admin", "bendahara", "operator", "guru", "panitia"] as AppRole[]).map((role) => (
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
                      {role === "panitia" && "Dashboard, SPMB, Riwayat Pembaruan"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {newUserData.roles.length > 0 && (
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
                  Menghubungkan akun dengan data GTK/PTK untuk sinkronisasi data
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

      {/* Generate Accounts Results Dialog (Siswa / GTK) */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {generateMode === "gtk" ? "Hasil Generate Akun GTK" : "Hasil Generate Akun Siswa"}
            </DialogTitle>
            <DialogDescription>
              {generateResults && (generateResults.total
                ? `${generateResults.created} dari ${generateResults.total} akun berhasil dibuat`
                : generateResults.message || (generateMode === "gtk"
                    ? "Semua GTK aktif sudah memiliki akun"
                    : "Semua siswa aktif sudah memiliki akun"))}
            </DialogDescription>
          </DialogHeader>

          {generateResults?.results && (
            <div className="space-y-2">
              {generateResults.results.map((r: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${r.success ? 'bg-muted/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <div className="font-medium">
                    {r.nama} {generateMode === "gtk"
                      ? (r.identifier ? `(${r.identifier})` : "")
                      : `(${r.nis})`}
                    {generateMode === "gtk" && r.role && (
                      <Badge variant="outline" className="ml-2 text-xs">{r.role}</Badge>
                    )}
                  </div>
                  {r.success ? (
                    <div className="text-muted-foreground font-mono text-xs mt-1 break-all">
                      Email: {r.email} | Password: {r.password}
                    </div>
                  ) : (
                    <div className="text-destructive text-xs mt-1">❌ {r.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              if (!generateResults?.results) return;
              const successResults = generateResults.results.filter((r: any) => r.success);
              if (successResults.length === 0) {
                toast.info("Tidak ada akun yang berhasil dibuat untuk di-export");
                return;
              }
              const isGtk = generateMode === "gtk";
              const headers = isGtk
                ? ["Nama", "NUPTK/NIP", "Role", "Email", "Password"]
                : ["Nama", "NIS", "Email", "Password"];
              const rows = successResults.map((r: any) => isGtk
                ? [r.nama, r.identifier || "", r.role || "", r.email, r.password]
                : [r.nama, r.nis, r.email, r.password]);
              const csvContent = [
                headers.join(","),
                ...rows.map((row: string[]) => row.map((cell: string) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")),
              ].join("\n");
              const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `akun-${isGtk ? "gtk" : "siswa"}-${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success(`Data akun ${isGtk ? "GTK" : "siswa"} berhasil di-export ke CSV`);
            }}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List GTK Accounts Dialog */}
      <Dialog open={listGtkDialogOpen} onOpenChange={setListGtkDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daftar Akun GTK</DialogTitle>
            <DialogDescription>
              Status akun untuk semua GTK aktif. Total {gtkList.length} GTK.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            // Build list with status
            const rows = gtkList.map((g) => {
              const linkedUser = g.user_id ? users.find((u) => u.id === g.user_id) : null;
              const hasUser = !!g.user_id;
              const hasRole = linkedUser && linkedUser.roles.length > 0;
              const status: "aktif" | "menunggu" | "belum" = hasUser
                ? hasRole ? "aktif" : "menunggu"
                : "belum";
              const emailLogin = g.email || (g.nuptk || g.nip ? `${g.nuptk || g.nip}@gtk.mts` : "-");
              return {
                id: g.id,
                gtk: g,
                userId: g.user_id,
                nama: g.nama,
                jabatan: g.jabatan || "-",
                emailLogin,
                roles: linkedUser?.roles || [],
                createdAt: linkedUser?.created_at || null,
                status,
              };
            });

            const filtered = rows.filter((r) => {
              if (listGtkStatusFilter !== "all" && r.status !== listGtkStatusFilter) return false;
              if (listGtkSearch) {
                const q = listGtkSearch.toLowerCase();
                return r.nama.toLowerCase().includes(q) || r.emailLogin.toLowerCase().includes(q) || (r.jabatan || "").toLowerCase().includes(q);
              }
              return true;
            });

            const counts = {
              all: rows.length,
              aktif: rows.filter((r) => r.status === "aktif").length,
              menunggu: rows.filter((r) => r.status === "menunggu").length,
              belum: rows.filter((r) => r.status === "belum").length,
            };

            return (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="rounded-lg border p-3 bg-card">
                    <p className="text-xs text-muted-foreground">Total GTK</p>
                    <p className="text-lg font-bold">{counts.all}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-green-500/5 border-green-500/30">
                    <p className="text-xs text-muted-foreground">Aktif</p>
                    <p className="text-lg font-bold text-green-600">{counts.aktif}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-amber-500/5 border-amber-500/30">
                    <p className="text-xs text-muted-foreground">Menunggu Approval</p>
                    <p className="text-lg font-bold text-amber-600">{counts.menunggu}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <p className="text-xs text-muted-foreground">Belum Punya Akun</p>
                    <p className="text-lg font-bold text-muted-foreground">{counts.belum}</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama, email, atau jabatan..."
                      value={listGtkSearch}
                      onChange={(e) => setListGtkSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={listGtkStatusFilter} onValueChange={(v: any) => setListGtkStatusFilter(v)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="menunggu">Menunggu Approval</SelectItem>
                      <SelectItem value="belum">Belum Punya Akun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Nama</th>
                        <th className="text-left p-3 font-medium">Jabatan</th>
                        <th className="text-left p-3 font-medium">Email Login</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Akun Dibuat</th>
                        <th className="text-left p-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            Tidak ada data sesuai filter
                          </td>
                        </tr>
                      ) : filtered.map((r) => (
                        <tr key={r.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-medium">{r.nama}</td>
                          <td className="p-3 text-muted-foreground">{r.jabatan}</td>
                          <td className="p-3 font-mono text-xs">{r.emailLogin}</td>
                          <td className="p-3">
                            {r.roles.length === 0 ? (
                              <span className="text-muted-foreground text-xs">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {r.roles.map((role) => (
                                  <Badge key={role} variant={ROLE_COLORS[role]} className="text-xs">
                                    {ROLE_LABELS[role]}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {r.status === "aktif" && (
                              <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30">Aktif</Badge>
                            )}
                            {r.status === "menunggu" && (
                              <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/30">Menunggu Approval</Badge>
                            )}
                            {r.status === "belum" && (
                              <Badge variant="outline" className="text-muted-foreground">Belum Punya Akun</Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {r.createdAt ? formatDateTime(r.createdAt) : "-"}
                          </td>
                          <td className="p-3">
                            {r.userId ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resetPwLoading === r.userId}
                                onClick={() => handleResetGtkPassword(r.gtk, r.userId!)}
                                title="Reset password tanpa mengubah email"
                              >
                                {resetPwLoading === r.userId ? "..." : "Reset Password"}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Menampilkan {filtered.length} dari {rows.length} GTK
                </p>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setListGtkDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
