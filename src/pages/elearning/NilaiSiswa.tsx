import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/supabase-helpers";

interface NilaiItem {
  id: string;
  nilai: number | null;
  catatan_guru: string | null;
  status: string;
  submitted_at: string;
  tugas?: { judul: string; mapel: string; nilai_max: number } | null;
}

export default function NilaiSiswa() {
  const { user } = useAuth();
  const [nilaiList, setNilaiList] = useState<NilaiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchNilai(); }, [user]);

  const fetchNilai = async () => {
    const { data, error } = await supabase
      .from("elearning_submissions")
      .select("*, tugas:elearning_tugas(judul, mapel, nilai_max)")
      .eq("user_id", user!.id)
      .eq("status", "graded")
      .order("graded_at", { ascending: false });
    
    if (error) console.error(error);
    setNilaiList((data as any) || []);
    setLoading(false);
  };

  const avgNilai = nilaiList.length > 0
    ? Math.round(nilaiList.reduce((sum, n) => sum + (n.nilai || 0), 0) / nilaiList.length)
    : 0;

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Nilai Saya" description={`${nilaiList.length} tugas dinilai • Rata-rata: ${avgNilai}`} icon={<GraduationCap className="h-6 w-6" />} />

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>
      ) : nilaiList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Belum ada nilai</div>
      ) : (
        <div className="space-y-3">
          {nilaiList.map(n => (
            <Card key={n.id}>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <p className="font-medium">{n.tugas?.judul}</p>
                  <p className="text-sm text-muted-foreground">{n.tugas?.mapel} • {formatDateTime(n.submitted_at)}</p>
                  {n.catatan_guru && <p className="text-xs text-muted-foreground mt-1">Catatan: {n.catatan_guru}</p>}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{n.nilai}</span>
                  <span className="text-muted-foreground">/{n.tugas?.nilai_max}</span>
                  <div className="mt-1">
                    <Badge variant={
                      (n.nilai || 0) >= (n.tugas?.nilai_max || 100) * 0.75 ? "default" :
                      (n.nilai || 0) >= (n.tugas?.nilai_max || 100) * 0.5 ? "secondary" : "destructive"
                    }>
                      {(n.nilai || 0) >= (n.tugas?.nilai_max || 100) * 0.75 ? "Baik" :
                       (n.nilai || 0) >= (n.tugas?.nilai_max || 100) * 0.5 ? "Cukup" : "Kurang"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
