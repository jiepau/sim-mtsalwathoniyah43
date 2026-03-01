import { useState, useEffect } from "react";
import { MessageSquare, Plus, Pin, Trash2, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Topic {
  id: string;
  judul: string;
  konten: string;
  mapel: string | null;
  author_name: string;
  author_role: string;
  is_pinned: boolean;
  created_at: string;
  kelas_id: string | null;
  kelas?: { nama_kelas: string } | null;
}

interface Reply {
  id: string;
  konten: string;
  author_name: string;
  author_role: string;
  author_id: string;
  created_at: string;
}

export default function ForumDiskusi() {
  const { user, roles } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelasList, setKelasList] = useState<{ id: string; nama_kelas: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ judul: "", konten: "", mapel: "", kelas_id: "" });
  const [saving, setSaving] = useState(false);

  // Topic detail
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const userRole = roles.includes("admin") ? "admin" : roles.includes("guru") ? "guru" : roles.includes("siswa") ? "siswa" : roles[0] || "user";
  const userName = user?.user_metadata?.full_name || user?.email || "User";

  useEffect(() => { fetchTopics(); fetchKelas(); }, []);

  const fetchKelas = async () => {
    const { data } = await supabase.from("kelas").select("id, nama_kelas").order("nama_kelas");
    setKelasList(data || []);
  };

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("elearning_forum_topics")
      .select("*, kelas(nama_kelas)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error("Gagal memuat forum");
    setTopics((data as any) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.judul || !formData.konten) { toast.error("Judul dan konten wajib diisi"); return; }
    setSaving(true);
    const { error } = await supabase.from("elearning_forum_topics").insert({
      judul: formData.judul, konten: formData.konten, mapel: formData.mapel || null,
      kelas_id: formData.kelas_id || null, author_id: user!.id, author_name: userName, author_role: userRole,
    });
    if (error) { toast.error("Gagal membuat topik"); setSaving(false); return; }
    toast.success("Topik dibuat");
    setCreateOpen(false);
    setFormData({ judul: "", konten: "", mapel: "", kelas_id: "" });
    fetchTopics();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus topik ini?")) return;
    const { error } = await supabase.from("elearning_forum_topics").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus"); return; }
    toast.success("Topik dihapus");
    if (selectedTopic?.id === id) setSelectedTopic(null);
    fetchTopics();
  };

  const openTopic = async (topic: Topic) => {
    setSelectedTopic(topic);
    const { data } = await supabase
      .from("elearning_forum_replies")
      .select("*")
      .eq("topic_id", topic.id)
      .order("created_at");
    setReplies((data as any) || []);

    // Realtime subscription
    const channel = supabase
      .channel(`forum-${topic.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "elearning_forum_replies", filter: `topic_id=eq.${topic.id}` },
        (payload) => setReplies(prev => [...prev, payload.new as Reply])
      ).subscribe();
    
    return () => { supabase.removeChannel(channel); };
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTopic) return;
    setReplying(true);
    const { error } = await supabase.from("elearning_forum_replies").insert({
      topic_id: selectedTopic.id, konten: replyText, author_id: user!.id, author_name: userName, author_role: userRole,
    });
    if (error) toast.error("Gagal mengirim balasan");
    else setReplyText("");
    setReplying(false);
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "Baru saja";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  if (selectedTopic) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => setSelectedTopic(null)}>← Kembali ke Forum</Button>
        </div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{selectedTopic.judul}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTopic.author_name} ({selectedTopic.author_role}) • {formatTime(selectedTopic.created_at)}
                  {selectedTopic.mapel && ` • ${selectedTopic.mapel}`}
                </p>
              </div>
              {selectedTopic.is_pinned && <Badge variant="outline"><Pin className="h-3 w-3 mr-1" />Pinned</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{selectedTopic.konten}</p>
          </CardContent>
        </Card>

        <div className="mt-4 space-y-3">
          <h3 className="font-medium">{replies.length} Balasan</h3>
          {replies.map(r => (
            <div key={r.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{r.author_name} <Badge variant="outline" className="text-xs ml-1">{r.author_role}</Badge></span>
                <span className="text-xs text-muted-foreground">{formatTime(r.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{r.konten}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Textarea className="flex-1" rows={2} placeholder="Tulis balasan..." value={replyText} onChange={e => setReplyText(e.target.value)} 
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }} />
            <Button onClick={sendReply} disabled={replying || !replyText.trim()} className="self-end"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Forum Diskusi" description="Diskusi antar guru dan siswa" icon={<MessageSquare className="h-6 w-6" />}
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Buat Topik</Button>} />

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Belum ada topik diskusi</div>
      ) : (
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t.id} className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => openTopic(t)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {t.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                    <h3 className="font-medium">{t.judul}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.konten}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.author_name} ({t.author_role}) • {formatTime(t.created_at)}
                    {t.mapel && ` • ${t.mapel}`}
                    {t.kelas?.nama_kelas && ` • ${t.kelas.nama_kelas}`}
                  </p>
                </div>
                {(user?.id === t.author_name || roles.includes("admin") || roles.includes("guru")) && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={e => { e.stopPropagation(); handleDelete(t.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Topik Baru</DialogTitle><DialogDescription>Mulai diskusi baru</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mapel</Label><Input value={formData.mapel} onChange={e => setFormData(p => ({ ...p, mapel: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={formData.kelas_id} onValueChange={v => setFormData(p => ({ ...p, kelas_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Semua kelas" /></SelectTrigger>
                  <SelectContent>{kelasList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Judul *</Label><Input value={formData.judul} onChange={e => setFormData(p => ({ ...p, judul: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Konten *</Label><Textarea value={formData.konten} onChange={e => setFormData(p => ({ ...p, konten: e.target.value }))} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Menyimpan..." : "Buat Topik"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
