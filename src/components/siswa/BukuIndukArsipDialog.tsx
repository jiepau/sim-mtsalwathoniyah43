import { useEffect, useState } from "react";
import { Archive, Printer, Trash2, FileText, BookMarked, User, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/supabase-helpers";
import { toast } from "sonner";
import { BukuIndukPrint, BukuIndukSiswa } from "./BukuIndukPrint";

interface ArsipRow {
  id: string;
  judul: string;
  mode: "rekap" | "detail";
  filter_kelas: string | null;
  filter_ta: string | null;
  jumlah_siswa: number;
  daftar_siswa: BukuIndukSiswa[];
  catatan: string | null;
  dicetak_oleh_nama: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function BukuIndukArsipDialog({ open, onOpenChange }: Props) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [items, setItems] = useState<ArsipRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reprint, setReprint] = useState<ArsipRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("buku_induk_arsip")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal memuat arsip: " + error.message);
    } else {
      setItems((data || []) as unknown as ArsipRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchData();
  }, [open]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus arsip ini? Tindakan tidak bisa dibatalkan.")) return;
    const { error } = await supabase.from("buku_induk_arsip").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
    } else {
      toast.success("Arsip dihapus");
      fetchData();
    }
  };

  if (reprint) {
    return (
      <BukuIndukPrint
        siswaList={reprint.daftar_siswa}
        mode={reprint.mode}
        filterInfo={{
          kelas: reprint.filter_kelas || "-",
          ta: reprint.filter_ta || "-",
        }}
        onClose={() => setReprint(null)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Arsip Cetak Buku Induk
          </DialogTitle>
          <DialogDescription>
            Riwayat dokumen Buku Induk yang pernah dicetak. Anda dapat mencetak ulang kapan saja.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Memuat...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-2 opacity-40" />
              <p>Belum ada arsip cetak</p>
              <p className="text-xs mt-1">Setiap kali Anda mencetak, snapshot data akan tersimpan di sini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {it.mode === "detail" ? (
                          <BookMarked className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                        )}
                        <h4 className="font-medium truncate">{it.judul}</h4>
                        <Badge variant="outline" className="text-xs">
                          {it.mode === "detail" ? "Detail" : "Rekap"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span>📚 {it.filter_kelas || "Semua kelas"}</span>
                          <span>📅 {it.filter_ta || "Semua TA"}</span>
                          <span>👥 {it.jumlah_siswa} siswa</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-foreground/80">{it.dicetak_oleh_nama || "—"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(it.created_at)}
                          </span>
                        </div>
                        {it.catatan && (
                          <div className="mt-1.5 text-xs italic bg-muted/60 border-l-2 border-primary/50 pl-2 py-1 rounded-sm text-foreground/80">
                            📝 {it.catatan}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReprint(it)}
                        title="Cetak ulang"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(it.id)}
                          title="Hapus arsip"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
