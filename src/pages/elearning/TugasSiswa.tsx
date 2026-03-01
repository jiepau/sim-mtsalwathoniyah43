import { useState, useEffect } from "react";
import { ClipboardList, Upload, Calendar, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
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
  created_at: string;
}

interface Submission {
  id: string;
  tugas_id: string;
  jawaban: string | null;
  nilai: number | null;
  catatan_guru: string | null;
  status: string;
  submitted_at: string;
}

export default function TugasSiswa() {
  const { user } = useAuth();
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [siswaId, setSiswaId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);
  const [jawaban, setJawaban] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: siswa } = await supabase.from("siswa").select("id, kelas_id").eq("user_id", user!.id).maybeSingle();
    if (!siswa?.kelas_id) { setLoading(false); return; }
    setSiswaId(siswa.id);

    const [tugasRes, subRes] = await Promise.all([
      supabase.from("elearning_tugas").select("*").eq("kelas_id", siswa.kelas_id).eq("is_published", true).order("deadline", { ascending: true }),
      supabase.from("elearning_submissions").select("*").eq("user_id", user!.id),
    ]);

    setTugas(tugasRes.data || []);
    setSubmissions((subRes.data as any) || []);
    setLoading(false);
  };

  const getSubmission = (tugasId: string) => submissions.find(s => s.tugas_id === tugasId);

  const handleSubmit = async () => {
    if (!selectedTugas || !siswaId || (!jawaban.trim() && !file)) {
      toast.error("Isi jawaban atau upload file"); return;
    }
    setSubmitting(true);
    try {
      let filePath = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `submissions/${user!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("elearning").upload(path, file);
        if (upErr) throw upErr;
        filePath = path;
      }

      const { error } = await supabase.from("elearning_submissions").insert({
        tugas_id: selectedTugas.id, siswa_id: siswaId, user_id: user!.id,
        jawaban: jawaban || null, file_path: filePath,
      });
      if (error) throw error;
      toast.success("Tugas berhasil dikumpulkan!");
      setSubmitOpen(false);
      setJawaban("");
      setFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengumpulkan");
    }
    setSubmitting(false);
  };

  const isOverdue = (deadline: string | null) => deadline && new Date(deadline) < new Date();

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Tugas" description="Daftar tugas dan pengumpulan" icon={<ClipboardList className="h-6 w-6" />} />

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>
      ) : tugas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Belum ada tugas tersedia</div>
      ) : (
        <div className="space-y-3">
          {tugas.map(t => {
            const sub = getSubmission(t.id);
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{t.judul}</h3>
                      <p className="text-sm text-muted-foreground">{t.mapel}</p>
                      {t.deskripsi && <p className="text-sm mt-2">{t.deskripsi}</p>}
                      {t.deadline && (
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs ${isOverdue(t.deadline) ? "text-destructive" : "text-muted-foreground"}`}>
                            Deadline: {formatDateTime(t.deadline)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {sub ? (
                        <>
                          <Badge variant={sub.status === "graded" ? "default" : "secondary"}>
                            {sub.status === "graded" ? <><CheckCircle className="h-3 w-3 mr-1" />Dinilai</> : "Dikumpulkan"}
                          </Badge>
                          {sub.nilai !== null && (
                            <span className="text-sm font-bold">{sub.nilai}/{t.nilai_max}</span>
                          )}
                          {sub.catatan_guru && (
                            <p className="text-xs text-muted-foreground max-w-[200px] text-right">{sub.catatan_guru}</p>
                          )}
                        </>
                      ) : (
                        <Button size="sm" onClick={() => { setSelectedTugas(t); setSubmitOpen(true); }}
                          disabled={isOverdue(t.deadline) === true}>
                          <Upload className="h-4 w-4 mr-1" />Kumpulkan
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kumpulkan Tugas</DialogTitle>
            <DialogDescription>{selectedTugas?.judul}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jawaban</Label>
              <Textarea value={jawaban} onChange={e => setJawaban(e.target.value)} rows={4} placeholder="Tulis jawaban di sini..." />
            </div>
            <div className="space-y-2">
              <Label>Upload File (opsional)</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Mengirim..." : "Kumpulkan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
