import { useState, useEffect } from "react";
import { BookOpen, ClipboardList, MessageSquare, Calendar, User, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardSiswa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [siswaData, setSiswaData] = useState<any>(null);
  const [stats, setStats] = useState({ materi: 0, tugas: 0, tugasDone: 0, forum: 0 });
  const [recentTugas, setRecentTugas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // Get linked siswa data
    const { data: siswa } = await supabase.from("siswa").select("*, kelas(nama_kelas)").eq("user_id", user!.id).maybeSingle();
    setSiswaData(siswa);

    if (siswa?.kelas_id) {
      // Count published materi for this kelas
      const { count: materiCount } = await supabase.from("elearning_materi").select("*", { count: "exact", head: true })
        .eq("kelas_id", siswa.kelas_id).eq("is_published", true);

      // Count published tugas
      const { data: tugasData } = await supabase.from("elearning_tugas").select("id")
        .eq("kelas_id", siswa.kelas_id).eq("is_published", true);
      
      // Count submissions
      const { count: subCount } = await supabase.from("elearning_submissions").select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

      // Forum count
      const { count: forumCount } = await supabase.from("elearning_forum_topics").select("*", { count: "exact", head: true });

      // Recent tugas with deadline
      const { data: recent } = await supabase.from("elearning_tugas").select("*")
        .eq("kelas_id", siswa.kelas_id).eq("is_published", true)
        .order("deadline", { ascending: true }).limit(5);

      setStats({
        materi: materiCount || 0,
        tugas: tugasData?.length || 0,
        tugasDone: subCount || 0,
        forum: forumCount || 0,
      });
      setRecentTugas(recent || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  if (!siswaData) {
    return (
      <div className="animate-fadeIn text-center py-12">
        <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akun belum terhubung</h2>
        <p className="text-muted-foreground">Akun Anda belum terhubung dengan data siswa. Hubungi Admin untuk menghubungkan akun.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Student info */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {siswaData.foto_path ? (
              <img 
                src={supabase.storage.from('siswa-photos').getPublicUrl(siswaData.foto_path).data.publicUrl} 
                alt={siswaData.nama} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{siswaData.nama}</h2>
            <p className="text-muted-foreground">NIS: {siswaData.nis} • Kelas: {siswaData.kelas?.nama_kelas}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/e-learning/materi-siswa")}>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.materi}</p>
            <p className="text-sm text-muted-foreground">Materi</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/e-learning/tugas-siswa")}>
          <CardContent className="p-4 text-center">
            <ClipboardList className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.tugas}</p>
            <p className="text-sm text-muted-foreground">Tugas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.tugasDone}</p>
            <p className="text-sm text-muted-foreground">Dikumpulkan</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/e-learning/forum")}>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.forum}</p>
            <p className="text-sm text-muted-foreground">Diskusi</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent tugas */}
      {recentTugas.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tugas Terbaru</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTugas.map(t => (
                <div key={t.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{t.judul}</p>
                    <p className="text-xs text-muted-foreground">{t.mapel}</p>
                  </div>
                  {t.deadline && (
                    <Badge variant={new Date(t.deadline) < new Date() ? "destructive" : "outline"} className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
