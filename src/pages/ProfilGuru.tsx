import { useState, useEffect } from "react";
import { User, Save, Mail, Phone, MapPin, GraduationCap, Briefcase, Calendar, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mapDatabaseError } from "@/lib/error-mapper";
import { formatDate } from "@/lib/supabase-helpers";

interface GtkProfile {
  id: string;
  nama: string;
  nip: string | null;
  nuptk: string | null;
  nik: string | null;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  no_hp: string | null;
  email: string | null;
  jabatan: string | null;
  mapel: string | null;
  lulusan: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilGuru() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<GtkProfile | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    nuptk: "",
    nik: "",
    jenis_kelamin: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    no_hp: "",
    email: "",
    jabatan: "",
    mapel: "",
    lulusan: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Fetch GTK profile linked to current user
      const { data, error } = await supabase
        .from("gtk_ptk")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
        setFormData({
          nama: data.nama || "",
          nip: data.nip || "",
          nuptk: data.nuptk || "",
          nik: data.nik || "",
          jenis_kelamin: data.jenis_kelamin || "",
          tempat_lahir: data.tempat_lahir || "",
          tanggal_lahir: data.tanggal_lahir || "",
          alamat: data.alamat || "",
          no_hp: data.no_hp || "",
          email: data.email || "",
          jabatan: data.jabatan || "",
          mapel: data.mapel || "",
          lulusan: data.lulusan || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("gtk_ptk")
        .update({
          nama: formData.nama,
          nip: formData.nip || null,
          nuptk: formData.nuptk || null,
          nik: formData.nik || null,
          jenis_kelamin: formData.jenis_kelamin || null,
          tempat_lahir: formData.tempat_lahir || null,
          tanggal_lahir: formData.tanggal_lahir || null,
          alamat: formData.alamat || null,
          no_hp: formData.no_hp || null,
          email: formData.email || null,
          jabatan: formData.jabatan || null,
          mapel: formData.mapel || null,
          lulusan: formData.lulusan || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profil berhasil diperbarui");
      fetchProfile();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <PageHeader
          title="Profil Saya"
          description="Lihat dan perbarui data pribadi Anda"
          icon={<User className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-fadeIn">
        <PageHeader
          title="Profil Saya"
          description="Lihat dan perbarui data pribadi Anda"
          icon={<User className="h-6 w-6" />}
        />
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Profil Belum Terhubung</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Akun Anda belum terhubung dengan data GTK/PTK. 
                Silakan hubungi Admin untuk menghubungkan akun Anda dengan data kepegawaian.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Profil Saya"
        description="Lihat dan perbarui data pribadi Anda"
        icon={<User className="h-6 w-6" />}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Identitas
            </CardTitle>
            <CardDescription>Informasi dasar kepegawaian</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select
                  value={formData.jenis_kelamin}
                  onValueChange={(val) => setFormData({ ...formData, jenis_kelamin: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="19xxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nuptk">NUPTK</Label>
                <Input
                  id="nuptk"
                  value={formData.nuptk}
                  onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Birth & Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data Kelahiran & Alamat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                <Input
                  id="tempat_lahir"
                  value={formData.tempat_lahir}
                  onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input
                  id="tanggal_lahir"
                  type="date"
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="no_hp">No. HP</Label>
                <Input
                  id="no_hp"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Kepegawaian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input
                  id="jabatan"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Guru Mapel / Wali Kelas / dll"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapel">Mata Pelajaran</Label>
                <Input
                  id="mapel"
                  value={formData.mapel}
                  onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                  placeholder="Matematika, IPA, dll"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lulusan">Lulusan / Pendidikan Terakhir</Label>
              <Input
                id="lulusan"
                value={formData.lulusan}
                onChange={(e) => setFormData({ ...formData, lulusan: e.target.value })}
                placeholder="S1 Pendidikan Matematika - UNJ"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>

      {/* Meta info */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p>Terakhir diperbarui: {formatDate(profile.updated_at)}</p>
      </div>
    </div>
  );
}
