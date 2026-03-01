import { useState, useEffect } from "react";
import { ClipboardList, Plus, Pencil, Trash2, Eye, EyeOff, Users } from "lucide-react";
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

interface Tugas {
  id: string;
  mapel: string;
  judul: string;
  deskripsi: string | null;
  deadline: string | null;
  nilai_max: number;
  is_published: boolean;
  kelas_id: string | null;
  guru_id: string | null;
  created_at: string;
  kelas?: { nama_kelas: string } | null;
}

interface Submission {
  id: string;
  jawaban: string | null;
  file_path: string | null;
  nilai: number | null;
  catatan_guru: string | null;
  status: string;
  submitted_at: string;
  siswa?: { nama: string; nis: string } | null;
}

export default function TugasGuru() {
  const { user } = useAuth();
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelasList, setKelasList] = useState<{ id: string; nama_kelas: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [guruId, setGuruId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    mapel: "", judul: "", deskripsi: "", kelas_id: "", deadline: "", nilai_max: "100",
  });

  // Submissions dialog
  const [subsDialogOpen, setSubsDialogOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState({ nilai: "", catatan: "" });

  useEffect(() => { fetchGuruId(); fetchKelas(); }, []);
  useEffect(() => { if (guruId !== null) fetchTugas(); }, [guruId]);

  const fetchGuruId = async () => {
    if (!user) return;
    const { data } = await supabase.from("gtk_ptk").select("id").eq("user_id", user.id).maybeSingle();
    setGuruId(data?.id || null);
  };

  const fetchKelas = async () => {
    const { data } = await supabase.from("kelas").select("id, nama_kelas").order("nama_kelas");
    setKelasList(data || []);
  };

  const fetchTugas = async () => {
    setLoading(true);
    let query = supabase.from("elearning_tugas").select("*, kelas(nama_kelas)").order("created_at", { ascending: false });
    if (guruId) query = query.eq("guru_id", guruId);
    const { data, error } = await query;
    if (error) toast.error("Gagal memuat tugas");
    setTugas((data as any) || []);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ mapel: "", judul: "", deskripsi: "", kelas_id: "", deadline: "", nilai_max: "100" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Tugas) => {
    setEditingId(item.id);
    setFormData({
      mapel: item.mapel, judul: item.judul, deskripsi: item.deskripsi || "",
      kelas_id: item.kelas_id || "", deadline: item.deadline ? item.deadline.slice(0, 16) : "", nilai_max: String(item.nilai_max),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.judul || !formData.mapel || !formData.kelas_id) {
      toast.error("Judul, mapel, dan kelas wajib diisi"); return;
    }
    setSaving(true);
    try {
      const payload: any = {
        mapel: formData.mapel, judul: formData.judul, deskripsi: formData.deskripsi || null,
        kelas_id: formData.kelas_id, guru_id: guruId, nilai_max: parseInt(formData.nilai_max) || 100,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };
      if (editingId) {
        const { error } = await supabase.from("elearning_tugas").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Tugas diperbarui");
      } else {
        const { error } = await supabase.from("elearning_tugas").insert(payload);
        if (error) throw error;
        toast.success("Tugas ditambahkan");
      }
      setDialogOpen(false); fetchTugas();
    } catch (err: any) { toast.error(err.message || "Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const togglePublish = async (item: Tugas) => {
    const { error } = await supabase.from("elearning_tugas").update({ is_published: !item.is_published }).eq("id", item.id);
    if (error) { toast.error("Gagal mengubah status"); return; }
    toast.success(item.is_published ? "Tugas disembunyikan" : "Tugas dipublikasikan");
    fetchTugas();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus tugas ini?")) return;
    const { error } = await supabase.from("elearning_tugas").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus"); return; }
    toast.success("Tugas dihapus"); fetchTugas();
  };

  const openSubmissions = async (item: Tugas) => {
    setSelectedTugas(item);
    setSubsDialogOpen(true);
    setSubsLoading(true);
    const { data, error } = await supabase
      .from("elearning_submissions")
      .select("*, siswa(nama, nis)")
      .eq("tugas_id", item.id)
      .order("submitted_at", { ascending: false });
    if (error) toast.error("Gagal memuat submissions");
    setSubmissions((data as any) || []);
    setSubsLoading(false);
  };

  const handleGrade = async (subId: string) => {
    const nilai = parseInt(gradeData.nilai);
    if (isNaN(nilai) || nilai < 0) { toast.error("Nilai tidak valid"); return; }
    const { error } = await supabase.from("elearning_submissions").update({
      nilai, catatan_guru: gradeData.catatan || null, status: "graded", graded_at: new Date().toISOString(),
    }).eq("id", subId);
    if (error) { toast.error("Gagal menyimpan nilai"); return; }
    toast.success("Nilai disimpan");
    setGradingId(null);
    if (selectedTugas) openSubmissions(selectedTugas);
  };

  const columns = [
    { header: "Judul", cell: (item: Tugas) => (
      <div><p className="font-medium">{item.judul}</p><p className="text-xs text-muted-foreground">{item.mapel}</p></div>
    )},
    { header: "Kelas", cell: (item: Tugas) => item.kelas?.nama_kelas || "-" },
    { header: "Deadline", cell: (item: Tugas) => item.deadline ? formatDateTime(item.deadline) : "-" },
    { header: "Status", cell: (item: Tugas) => (
      <Badge variant={item.is_published ? "default" : "secondary"}>{item.is_published ? "Published" : "Draft"}</Badge>
    )},
    { header: "Aksi", cell: (item: Tugas) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openSubmissions(item)} title="Lihat Submissions">
          <Users className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => togglePublish(item)}>
          {item.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(item)}><Pencil className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Kelola Tugas" description="Buat dan kelola penugasan" icon={<ClipboardList className="h-6 w-6" />}
        actions={<Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Tambah Tugas</Button>} />
      <DataTable data={tugas} columns={columns} loading={loading} emptyMessage="Belum ada tugas" />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Tugas" : "Tambah Tugas"}</DialogTitle>
            <DialogDescription>Isi detail penugasan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mapel *</Label><Input value={formData.mapel} onChange={e => setFormData(p => ({ ...p, mapel: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Kelas *</Label>
                <Select value={formData.kelas_id} onValueChange={v => setFormData(p => ({ ...p, kelas_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>{kelasList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Judul *</Label><Input value={formData.judul} onChange={e => setFormData(p => ({ ...p, judul: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formData.deskripsi} onChange={e => setFormData(p => ({ ...p, deskripsi: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Deadline</Label><Input type="datetime-local" value={formData.deadline} onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Nilai Maks</Label><Input type="number" value={formData.nilai_max} onChange={e => setFormData(p => ({ ...p, nilai_max: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={subsDialogOpen} onOpenChange={setSubsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions: {selectedTugas?.judul}</DialogTitle>
            <DialogDescription>{submissions.length} pengumpulan</DialogDescription>
          </DialogHeader>
          {subsLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>
          ) : submissions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Belum ada pengumpulan</p>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => (
                <div key={sub.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{sub.siswa?.nama || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">NIS: {sub.siswa?.nis} • {formatDateTime(sub.submitted_at)}</p>
                    </div>
                    <Badge variant={sub.status === "graded" ? "default" : "secondary"}>{sub.status === "graded" ? "Dinilai" : "Belum Dinilai"}</Badge>
                  </div>
                  {sub.jawaban && <p className="text-sm bg-muted/50 p-2 rounded">{sub.jawaban}</p>}
                  {sub.nilai !== null && <p className="text-sm font-medium">Nilai: {sub.nilai}/{selectedTugas?.nilai_max}</p>}
                  {sub.catatan_guru && <p className="text-sm text-muted-foreground">Catatan: {sub.catatan_guru}</p>}
                  
                  {gradingId === sub.id ? (
                    <div className="flex gap-2 items-end">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Nilai</Label>
                        <Input type="number" value={gradeData.nilai} onChange={e => setGradeData(p => ({ ...p, nilai: e.target.value }))} placeholder={`0-${selectedTugas?.nilai_max}`} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Catatan</Label>
                        <Input value={gradeData.catatan} onChange={e => setGradeData(p => ({ ...p, catatan: e.target.value }))} />
                      </div>
                      <Button size="sm" onClick={() => handleGrade(sub.id)}>Simpan</Button>
                      <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>Batal</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setGradingId(sub.id); setGradeData({ nilai: sub.nilai?.toString() || "", catatan: sub.catatan_guru || "" }); }}>
                      {sub.status === "graded" ? "Edit Nilai" : "Beri Nilai"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
