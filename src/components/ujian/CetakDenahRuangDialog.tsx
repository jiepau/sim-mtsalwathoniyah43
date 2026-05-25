import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PrintKopMadrasah } from "@/components/print/PrintKopMadrasah";
import { PrintPreviewToolbar, PrintPreviewFrame, type PrintOrientation } from "@/components/print/PrintPreviewToolbar";
import { useUjianRuang, useUjianPeserta, type UjianSesi } from "@/hooks/useUjianSesi";
import { JENIS_UJIAN_LABEL } from "@/lib/ujian-generator";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sesi: UjianSesi;
}

export function CetakDenahRuangDialog({ open, onOpenChange, sesi }: Props) {
  const [preview, setPreview] = useState(true);
  const [orientation, setOrientation] = useState<PrintOrientation>("landscape");
  const [filterRuang, setFilterRuang] = useState<string>("all");

  const { data: ruang = [] } = useUjianRuang(sesi.id);
  const { data: peserta = [] } = useUjianPeserta(sesi.id);

  const { data: siswaList = [] } = useQuery({
    queryKey: ["siswa-denah", sesi.id, peserta.length],
    queryFn: async () => {
      const ids = peserta.map((p) => p.siswa_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("siswa").select("id, nis, nama").in("id", ids);
      return data || [];
    },
    enabled: open,
  });

  const ruangFiltered = useMemo(
    () => (filterRuang === "all" ? ruang : ruang.filter((r) => r.id === filterRuang)),
    [ruang, filterRuang],
  );

  const seatMap = useMemo(() => {
    const sMap = new Map(siswaList.map((s: any) => [s.id, s]));
    const out = new Map<string, Map<number, any>>(); // ruangId -> seat -> peserta
    peserta.forEach((p) => {
      if (!p.ruang_id || !p.nomor_kursi) return;
      let inner = out.get(p.ruang_id);
      if (!inner) {
        inner = new Map();
        out.set(p.ruang_id, inner);
      }
      inner.set(p.nomor_kursi, { ...p, siswa: sMap.get(p.siswa_id) });
    });
    return out;
  }, [peserta, siswaList]);

  const tglText = sesi.tanggal_mulai
    ? new Date(sesi.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Denah Tempat Duduk — {sesi.nama}</DialogTitle>
        </DialogHeader>

        <div className="no-print p-3 rounded-lg border bg-card">
          <Label className="text-xs">Filter Ruang</Label>
          <select
            className="h-9 w-64 border rounded-md px-2 text-sm ml-2"
            value={filterRuang}
            onChange={(e) => setFilterRuang(e.target.value)}
          >
            <option value="all">Semua Ruang (1 ruang per halaman)</option>
            {ruang.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama_ruang}
              </option>
            ))}
          </select>
        </div>

        <PrintPreviewToolbar
          preview={preview}
          onTogglePreview={setPreview}
          orientation={orientation}
          onOrientationChange={setOrientation}
          onPrint={() => window.print()}
        />

        <PrintPreviewFrame preview={preview} orientation={orientation}>
          <div className="space-y-6">
            {ruangFiltered.map((r, idx) => {
              const inner = seatMap.get(r.id) || new Map();
              const totalSeats = r.baris * r.kolom;
              return (
                <div key={r.id} style={{ pageBreakAfter: idx < ruangFiltered.length - 1 ? "always" : "auto" }}>
                  <PrintKopMadrasah
                    judul={`DENAH TEMPAT DUDUK — ${JENIS_UJIAN_LABEL[sesi.jenis]?.split(" ")[0] || "UJIAN"}`}
                    subjudul={`${sesi.nama}`}
                  />

                  <div className="mt-3 flex items-center justify-center gap-3">
                    <div className="inline-block border-2 border-black px-8 py-1 text-xs font-bold uppercase">
                      ↑ Depan Ruang (Pengawas)
                    </div>
                    <div className="text-sm font-bold uppercase">
                      {r.nama_ruang}{r.lokasi ? ` (${r.lokasi})` : ""}
                    </div>
                  </div>
                  <div className="mb-3" />


                  <div
                    className="grid gap-1 mx-auto"
                    style={{
                      gridTemplateColumns: `repeat(${r.kolom}, 1fr)`,
                      maxWidth: "100%",
                    }}
                  >
                    {Array.from({ length: totalSeats }).map((_, i) => {
                      const seatNum = i + 1;
                      const p = inner.get(seatNum);
                      return (
                        <div
                          key={seatNum}
                          className="border border-black p-1 text-center"
                          style={{ minHeight: "18mm", fontSize: "8pt" }}
                        >
                          <div className="text-[7pt] text-muted-foreground">Kursi {seatNum}</div>
                          {p ? (
                            <>
                              <div className="font-mono font-bold text-[9pt]">{p.nomor_peserta}</div>
                              <div className="text-[7pt] leading-tight mt-0.5 line-clamp-2">{p.siswa?.nama || "-"}</div>
                            </>
                          ) : (
                            <div className="text-[7pt] text-muted-foreground mt-2">(kosong)</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-center mt-3 text-muted-foreground">
                    {r.baris} baris × {r.kolom} kolom • Kapasitas {r.kapasitas} • Terisi {inner.size}
                  </p>
                </div>
              );
            })}
            {ruangFiltered.length === 0 && <p className="text-center text-sm py-12">Belum ada ruang.</p>}
          </div>
        </PrintPreviewFrame>
      </DialogContent>
    </Dialog>
  );
}
