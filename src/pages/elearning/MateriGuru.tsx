import { useState, useEffect } from "react";
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/supabase-helpers";

interface Materi {
  id: string;
  mapel: string;
  judul: string;
  deskripsi: string | null;
  jenis: string;
  konten: string | null;
  file_path: string | null;
  is_published: boolean;
  kelas_id: string | null;
  guru_id: string | null;
  created_at: string;
  kelas?: { nama_kelas: string } | null;
}

export default function MateriGuru() {
  const { user } = useAuth();
  const [materi, setMateri] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelasList, setKelasList] = useState<{ id: string; nama_kelas: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [guruId, setGuruId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    mapel: "", judul: "", deskripsi: "", jenis: "teks", konten: "", kelas_id: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchGuruId();
    fetchKelas();
  }, []);

  useEffect(() => {
    if (guruId !== null) fetchMateri();
  }, [guruId]);

  const fetchGuruId = async () => {
    if (!user) return;
    const { data } = await supabase.from("gtk_ptk").select("id").eq("user_id", user.id).maybeSingle();
    setGuruId(data?.id || null);
  };

  const fetchKelas = async () => {
    const { data } = await supabase.from("kelas").select("id, nama_kelas").order("nama_kelas");
    setKelasList(data || []);
  };

  const fetchMateri = async () => {
    setLoading(true);
    let query = supabase.from("elearning_materi").select("*, kelas(nama_kelas)").order("created_at", { ascending: false });
    if (guruId) query = query.eq("guru_id", guruId);
    const { data, error } = await query;
    if (error) { toast.error("Gagal memuat materi"); console.error(error); }
    setMateri((data as any) || []);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ mapel: "", judul: "", deskripsi: "", jenis: "teks", konten: "", kelas_id: "" });
    setFile(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Materi) => {
    setEditingId(item.id);
    setFormData({
      mapel: item.mapel, judul: item.judul, deskripsi: item.deskripsi || "",
      jenis: item.jenis, konten: item.konten || "", kelas_id: item.kelas_id || "",
    });
    setFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.judul || !formData.mapel || !formData.kelas_id) {
      toast.error("Judul, mapel, dan kelas wajib diisi");
      return;
    }
    setSaving(true);
    try {
      let filePath = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `materi/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("elearning").upload(path, file);
        if (upErr) throw upErr;
        filePath = path;
      }

      const payload: any = {
        mapel: formData.mapel, judul: formData.judul, deskripsi: formData.deskripsi || null,
        jenis: formData.jenis, konten: formData.konten || null,
        kelas_id: formData.kelas_id, guru_id: guruId,
      };
      if (filePath) payload.file_path = filePath;

      if (editingId) {
        const { error } = await supabase.from("elearning_materi").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Materi diperbarui");
      } else {
        const { error } = await supabase.from("elearning_materi").insert(payload);
        if (error) throw error;
        toast.success("Materi ditambahkan");
      }
      setDialogOpen(false);
      fetchMateri();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: Materi) => {
    const { error } = await supabase.from("elearning_materi").update({ is_published: !item.is_published }).eq("id", item.id);
    if (error) { toast.error("Gagal mengubah status"); return; }
    toast.success(item.is_published ? "Materi disembunyikan" : "Materi dipublikasikan");
    fetchMateri();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus materi ini?")) return;
    const { error } = await supabase.from("elearning_materi").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus"); return; }
    toast.success("Materi dihapus");
    fetchMateri();
  };

  const columns = [
    { header: "Judul", cell: (item: Materi) => (
      <div><p className="font-medium">{item.judul}</p><p className="text-xs text-muted-foreground">{item.mapel}</p></div>
    )},
    { header: "Kelas", cell: (item: Materi) => item.kelas?.nama_kelas || "-" },
    { header: "Jenis", cell: (item: Materi) => <Badge variant="outline">{item.jenis}</Badge> },
    { header: "Status", cell: (item: Materi) => (
      <Badge variant={item.is_published ? "default" : "secondary"}>{item.is_published ? "Published" : "Draft"}</Badge>
    )},
    { header: "Tanggal", cell: (item: Materi) => <span className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</span> },
    { header: "Aksi", cell: (item: Materi) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => togglePublish(item)} title={item.is_published ? "Sembunyikan" : "Publikasikan"}>
          {item.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(item)}><Pencil className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Kelola Materi" description="Upload dan kelola materi pelajaran" icon={<BookOpen className="h-6 w-6" />}
        actions={<Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Tambah Materi</Button>} />
      <DataTable data={materi} columns={columns} loading={loading} emptyMessage="Belum ada materi" />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Materi" : "Tambah Materi"}</DialogTitle>
            <DialogDescription>Isi detail materi pelajaran</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mapel *</Label>
                <Input value={formData.mapel} onChange={e => setFormData(p => ({ ...p, mapel: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Kelas *</Label>
                <Select value={formData.kelas_id} onValueChange={v => setFormData(p => ({ ...p, kelas_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>{kelasList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input value={formData.judul} onChange={e => setFormData(p => ({ ...p, judul: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={formData.deskripsi} onChange={e => setFormData(p => ({ ...p, deskripsi: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Jenis</Label>
              <Select value={formData.jenis} onValueChange={v => setFormData(p => ({ ...p, jenis: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teks">Teks</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="link">Link Eksternal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.jenis === "teks") && (
              <div className="space-y-2">
                <Label>Konten</Label>
                <Textarea value={formData.konten} onChange={e => setFormData(p => ({ ...p, konten: e.target.value }))} rows={6} />
              </div>
            )}
            {(formData.jenis === "link") && (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={formData.konten} onChange={e => setFormData(p => ({ ...p, konten: e.target.value }))} placeholder="https://..." />
              </div>
            )}
            {(formData.jenis === "pdf" || formData.jenis === "video") && (
              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept={formData.jenis === "pdf" ? ".pdf" : "video/*"} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
