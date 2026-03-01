import { useState, useEffect } from "react";
import { BookOpen, FileText, Video, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Materi {
  id: string;
  mapel: string;
  judul: string;
  deskripsi: string | null;
  jenis: string;
  konten: string | null;
  file_path: string | null;
  created_at: string;
}

export default function MateriSiswa() {
  const { user } = useAuth();
  const [materi, setMateri] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMateri, setSelectedMateri] = useState<Materi | null>(null);

  useEffect(() => { fetchMateri(); }, [user]);

  const fetchMateri = async () => {
    if (!user) return;
    // Get siswa's kelas_id
    const { data: siswa } = await supabase.from("siswa").select("kelas_id").eq("user_id", user.id).maybeSingle();
    if (!siswa?.kelas_id) { setLoading(false); return; }

    const { data, error } = await supabase.from("elearning_materi")
      .select("*").eq("kelas_id", siswa.kelas_id).eq("is_published", true)
      .order("mapel").order("urutan");
    if (error) toast.error("Gagal memuat materi");
    setMateri(data || []);
    setLoading(false);
  };

  const getFileUrl = async (path: string) => {
    const { data } = await supabase.storage.from("elearning").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const jenisIcon = (jenis: string) => {
    switch (jenis) {
      case "pdf": return <FileText className="h-5 w-5" />;
      case "video": return <Video className="h-5 w-5" />;
      case "link": return <LinkIcon className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  if (selectedMateri) {
    return (
      <div className="animate-fadeIn">
        <Button variant="ghost" className="mb-4" onClick={() => setSelectedMateri(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />Kembali
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {jenisIcon(selectedMateri.jenis)}
              <CardTitle>{selectedMateri.judul}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{selectedMateri.mapel}</p>
          </CardHeader>
          <CardContent>
            {selectedMateri.deskripsi && <p className="mb-4 text-muted-foreground">{selectedMateri.deskripsi}</p>}
            {selectedMateri.jenis === "teks" && selectedMateri.konten && (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{selectedMateri.konten}</div>
            )}
            {selectedMateri.jenis === "link" && selectedMateri.konten && (
              <Button variant="outline" onClick={() => window.open(selectedMateri.konten!, "_blank")}>
                <LinkIcon className="h-4 w-4 mr-2" />Buka Link
              </Button>
            )}
            {(selectedMateri.jenis === "pdf" || selectedMateri.jenis === "video") && selectedMateri.file_path && (
              <Button variant="outline" onClick={() => getFileUrl(selectedMateri.file_path!)}>
                <FileText className="h-4 w-4 mr-2" />Buka File
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Materi Pelajaran" description="Materi yang tersedia untuk kelasmu" icon={<BookOpen className="h-6 w-6" />} />
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>
      ) : materi.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Belum ada materi tersedia</div>
      ) : (
        <div className="grid gap-3">
          {materi.map(m => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMateri(m)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {jenisIcon(m.jenis)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.judul}</p>
                  <p className="text-sm text-muted-foreground">{m.mapel}</p>
                </div>
                <Badge variant="outline">{m.jenis}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
