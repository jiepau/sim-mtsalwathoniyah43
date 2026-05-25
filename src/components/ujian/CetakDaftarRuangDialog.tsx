import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function CetakDaftarRuangDialog({ open, onOpenChange, sesi }: Props) {
  const [preview, setPreview] = useState(true);
  const [orientation, setOrientation] = useState<PrintOrientation>("portrait");
  const [filterRuang, setFilterRuang] = useState<string>("all");

  const { data: ruang = [] } = useUjianRuang(sesi.id);
  const { data: peserta = [] } = useUjianPeserta(sesi.id);

  const { data: siswaList = [] } = useQuery({
    queryKey: ["siswa-daftar-ruang", sesi.id, peserta.length],
    queryFn: async () => {
      const ids = peserta.map((p) => p.siswa_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("siswa").select("id, nis, nisn, nama, kelas:kelas_id(nama_kelas)").in("id", ids);
      return data || [];
    },
    enabled: open,
  });

  const { data: ta } = useQuery({
    queryKey: ["ta-daftar-ruang", sesi.ta_id],
    queryFn: async () => {
      if (!sesi.ta_id) return null;
      const { data } = await supabase.from("tahun_ajaran").select("nama_ta").eq("id", sesi.ta_id).maybeSingle();
      return data;
    },
    enabled: !!sesi.ta_id && open,
  });

  const ruangFiltered = useMemo(
    () => (filterRuang === "all" ? ruang : ruang.filter((r) => r.id === filterRuang)),
    [ruang, filterRuang],
  );

  const pesertaPerRuang = useMemo(() => {
    const sMap = new Map(siswaList.map((s: any) => [s.id, s]));
    const m = new Map<string, any[]>();
    peserta.forEach((p) => {
      if (!p.ruang_id) return;
      const arr = m.get(p.ruang_id) || [];
      const s = sMap.get(p.siswa_id);
      if (s) arr.push({ ...p, siswa: s });
      m.set(p.ruang_id, arr);
    });
    m.forEach((arr) => arr.sort((a, b) => a.nomor_peserta.localeCompare(b.nomor_peserta)));
    return m;
  }, [peserta, siswaList]);

  const tglText = sesi.tanggal_mulai
    ? new Date(sesi.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daftar Peserta per Ruang — {sesi.nama}</DialogTitle>
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
              const list = pesertaPerRuang.get(r.id) || [];
              return (
                <div key={r.id} style={{ pageBreakAfter: idx < ruangFiltered.length - 1 ? "always" : "auto" }}>
                  <PrintKopMadrasah
                    judul="DAFTAR PESERTA"
                    subjudul={sesi.nama}
                    periode={ta?.nama_ta ? `Tahun Ajaran ${ta.nama_ta}` : undefined}
                  />
                  <Table className="mt-3 text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8 border border-black text-black">No</TableHead>
                        <TableHead className="w-28 border border-black text-black">No. Peserta</TableHead>
                        <TableHead className="border border-black text-black">Nama</TableHead>
                        <TableHead className="w-24 border border-black text-black">NISN</TableHead>
                        <TableHead className="w-24 border border-black text-black">Kelas</TableHead>
                        <TableHead className="w-28 border border-black text-black">Ruang</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-3 border border-black">
                            — Belum ada peserta —
                          </TableCell>
                        </TableRow>
                      ) : (
                        list.map((p: any, i: number) => (
                          <TableRow key={p.id}>
                            <TableCell className="border border-black">{i + 1}</TableCell>
                            <TableCell className="border border-black font-mono">{p.nomor_peserta}</TableCell>
                            <TableCell className="border border-black">{p.siswa.nama}</TableCell>
                            <TableCell className="border border-black font-mono">{p.siswa.nisn || "-"}</TableCell>
                            <TableCell className="border border-black">{p.siswa.kelas?.nama_kelas || "-"}</TableCell>
                            <TableCell className="border border-black">{r.nama_ruang}{r.lokasi ? ` (${r.lokasi})` : ""}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <p className="text-[10px] text-center mt-2 text-muted-foreground">
                    Kapasitas ruang: {r.kapasitas} • Terisi: {list.length}
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
