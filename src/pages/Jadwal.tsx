import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertTriangle, Plus, Printer, Trash2, Pencil, Clock, Calendar as CalIcon } from "lucide-react";
import { PrintKopMadrasah } from "@/components/print/PrintKopMadrasah";

type TA = { id: string; nama_ta: string; is_active: boolean | null };
type Kelas = { id: string; nama_kelas: string; tingkat: number | null };
type Gtk = { id: string; nama: string; mapel: string | null };
type Jam = { id: string; ta_id: string; hari: number; jam_ke: number; jam_mulai: string; jam_selesai: string; is_istirahat: boolean; label: string | null };
type Jadwal = { id: string; ta_id: string; semester: string; kelas_id: string; hari: number; jam_ke: number; mapel: string; gtk_id: string | null; ruang: string | null; catatan: string | null };
type Unav = { id: string; ta_id: string; semester: string; gtk_id: string; hari: number; jam_ke: number | null; alasan: string | null };

const HARI_LABEL = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
const DAYS = [1, 2, 3, 4, 5, 6];

const db = supabase as any;

export default function JadwalPage() {
  const { roles: userRoles } = useAuth();
  const canEdit = userRoles.includes("admin") || userRoles.includes("operator");

  const [taList, setTaList] = useState<TA[]>([]);
  const [taId, setTaId] = useState<string>("");
  const [semester, setSemester] = useState<"ganjil" | "genap">("ganjil");

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [gtkList, setGtkList] = useState<Gtk[]>([]);
  const [jamList, setJamList] = useState<Jam[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [unavList, setUnavList] = useState<Unav[]>([]);

  const [kelasId, setKelasId] = useState<string>("");
  const [gtkId, setGtkId] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // dialogs
  const [jamDialog, setJamDialog] = useState<{ open: boolean; row?: Partial<Jam> }>({ open: false });
  const [cellDialog, setCellDialog] = useState<{ open: boolean; hari: number; jam_ke: number; existing?: Jadwal }>({ open: false, hari: 1, jam_ke: 1 });
  const [unavDialog, setUnavDialog] = useState<{ open: boolean; row?: Partial<Unav> }>({ open: false });

  useEffect(() => {
    loadTA();
  }, []);

  useEffect(() => {
    if (taId) {
      loadAll();
    }
  }, [taId, semester]);

  async function loadTA() {
    const { data } = await db.from("tahun_ajaran").select("id, nama_ta, is_active").order("nama_ta", { ascending: false });
    const list = (data || []) as TA[];
    setTaList(list);
    const active = list.find(t => t.is_active) || list[0];
    if (active) setTaId(active.id);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [k, g, j, jp, u] = await Promise.all([
        db.from("kelas").select("id, nama_kelas, tingkat").order("tingkat").order("nama_kelas"),
        db.from("gtk_ptk").select("id, nama, mapel").eq("status_aktif", "aktif").order("nama"),
        db.from("jadwal_jam").select("*").eq("ta_id", taId).order("hari").order("jam_ke"),
        db.from("jadwal_pelajaran").select("*").eq("ta_id", taId).eq("semester", semester),
        db.from("guru_unavailable").select("*").eq("ta_id", taId).eq("semester", semester),
      ]);
      setKelasList((k.data || []) as Kelas[]);
      setGtkList((g.data || []) as Gtk[]);
      setJamList((j.data || []) as Jam[]);
      setJadwalList((jp.data || []) as Jadwal[]);
      setUnavList((u.data || []) as Unav[]);
      if (!kelasId && k.data?.[0]) setKelasId(k.data[0].id);
      if (!gtkId && g.data?.[0]) setGtkId(g.data[0].id);
    } finally {
      setLoading(false);
    }
  }

  const jamKeList = useMemo(() => {
    const set = new Set<number>();
    jamList.forEach(j => set.add(j.jam_ke));
    return Array.from(set).sort((a, b) => a - b);
  }, [jamList]);

  const jamByDayKe = useMemo(() => {
    const map = new Map<string, Jam>();
    jamList.forEach(j => map.set(`${j.hari}-${j.jam_ke}`, j));
    return map;
  }, [jamList]);

  // index for clash detection
  const jadwalByKelas = useMemo(() => {
    const m = new Map<string, Jadwal>();
    jadwalList.forEach(j => m.set(`${j.kelas_id}-${j.hari}-${j.jam_ke}`, j));
    return m;
  }, [jadwalList]);

  const jadwalByGuru = useMemo(() => {
    const m = new Map<string, Jadwal[]>();
    jadwalList.forEach(j => {
      if (!j.gtk_id) return;
      const key = `${j.gtk_id}-${j.hari}-${j.jam_ke}`;
      const arr = m.get(key) || [];
      arr.push(j);
      m.set(key, arr);
    });
    return m;
  }, [jadwalList]);

  const unavByGuru = useMemo(() => {
    const m = new Map<string, Unav[]>();
    unavList.forEach(u => {
      const key = `${u.gtk_id}-${u.hari}`;
      const arr = m.get(key) || [];
      arr.push(u);
      m.set(key, arr);
    });
    return m;
  }, [unavList]);

  // -------- JAM CRUD --------
  async function saveJam(row: Partial<Jam>) {
    if (!row.hari || !row.jam_ke || !row.jam_mulai || !row.jam_selesai) {
      toast.error("Lengkapi hari, jam ke, dan jam mulai/selesai");
      return;
    }
    const payload = { ...row, ta_id: taId };
    let res;
    if (row.id) res = await db.from("jadwal_jam").update(payload).eq("id", row.id);
    else res = await db.from("jadwal_jam").insert(payload);
    if (res.error) toast.error(res.error.message);
    else {
      toast.success("Slot jam disimpan");
      setJamDialog({ open: false });
      loadAll();
    }
  }

  async function deleteJam(id: string) {
    if (!confirm("Hapus slot jam ini?")) return;
    const { error } = await db.from("jadwal_jam").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Dihapus"); loadAll(); }
  }

  // -------- CELL CRUD --------
  async function saveCell(row: Partial<Jadwal>) {
    if (!row.mapel) { toast.error("Mapel wajib"); return; }
    // Anti-bentrok guru (client-side pre-check; DB unique index is the source of truth)
    if (row.gtk_id) {
      const clash = jadwalList.find(j =>
        j.gtk_id === row.gtk_id && j.hari === row.hari && j.jam_ke === row.jam_ke && j.id !== row.id
      );
      if (clash) {
        const k = kelasList.find(x => x.id === clash.kelas_id);
        toast.error(`Bentrok: guru sudah mengajar ${clash.mapel} di kelas ${k?.nama_kelas} pada slot ini`);
        return;
      }
      // Preferensi tidak mengajar
      const unav = (unavByGuru.get(`${row.gtk_id}-${row.hari}`) || []).find(u => u.jam_ke == null || u.jam_ke === row.jam_ke);
      if (unav) {
        if (!confirm(`Peringatan: guru tercatat tidak tersedia (${unav.alasan || "preferensi"}). Tetap simpan?`)) return;
      }
    }
    const payload: any = {
      ta_id: taId, semester, kelas_id: kelasId,
      hari: row.hari, jam_ke: row.jam_ke,
      mapel: row.mapel, gtk_id: row.gtk_id || null, ruang: row.ruang || null, catatan: row.catatan || null,
    };
    let res;
    if (row.id) res = await db.from("jadwal_pelajaran").update(payload).eq("id", row.id);
    else res = await db.from("jadwal_pelajaran").insert(payload);
    if (res.error) {
      if (res.error.code === "23505") toast.error("Bentrok: slot sudah terisi (kelas/guru sama).");
      else toast.error(res.error.message);
    } else {
      toast.success("Jadwal disimpan");
      setCellDialog({ open: false, hari: 1, jam_ke: 1 });
      loadAll();
    }
  }

  async function deleteCell(id: string) {
    const { error } = await db.from("jadwal_pelajaran").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Dihapus"); loadAll(); }
  }

  // -------- UNAV CRUD --------
  async function saveUnav(row: Partial<Unav>) {
    if (!row.gtk_id || !row.hari) { toast.error("Lengkapi guru & hari"); return; }
    const payload = { ...row, ta_id: taId, semester, jam_ke: row.jam_ke || null };
    let res;
    if (row.id) res = await db.from("guru_unavailable").update(payload).eq("id", row.id);
    else res = await db.from("guru_unavailable").insert(payload);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Disimpan"); setUnavDialog({ open: false }); loadAll(); }
  }

  async function deleteUnav(id: string) {
    const { error } = await db.from("guru_unavailable").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Dihapus"); loadAll(); }
  }

  function printArea(id: string) {
    const node = document.getElementById(id);
    if (!node) return;
    const w = window.open("", "_blank", "width=1000,height=700");
    if (!w) return;
    w.document.write(`<html><head><title>Cetak Jadwal</title>
      <style>
        body{font-family: Arial, sans-serif; padding: 16px;}
        table{width:100%; border-collapse: collapse; font-size: 12px;}
        th,td{border:1px solid #333; padding:6px; vertical-align: top;}
        th{background:#e6f7f3;}
        .istirahat{background:#fffbe6; text-align:center; font-style: italic;}
        h2,h3{margin:4px 0;}
        @media print { @page { size: A4 landscape; margin: 10mm; } }
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  }

  const semesterUiValue = semester;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Jadwal Pelajaran"
        description="Kelola jadwal pelajaran per semester dengan deteksi bentrok guru & kelas"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>Tahun Ajaran</Label>
              <Select value={taId} onValueChange={setTaId}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Pilih TA" /></SelectTrigger>
                <SelectContent>
                  {taList.map(t => <SelectItem key={t.id} value={t.id}>{t.nama_ta} {t.is_active && "(aktif)"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Semester</Label>
              <Select value={semesterUiValue} onValueChange={v => setSemester(v as any)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ganjil">Ganjil</SelectItem>
                  <SelectItem value="genap">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="kelas">
        <TabsList>
          <TabsTrigger value="kelas">Per Kelas</TabsTrigger>
          <TabsTrigger value="guru">Per Guru</TabsTrigger>
          <TabsTrigger value="jam"><Clock className="h-4 w-4 mr-1" />Jam Pelajaran</TabsTrigger>
          <TabsTrigger value="unav"><CalIcon className="h-4 w-4 mr-1" />Preferensi Guru</TabsTrigger>
        </TabsList>

        {/* PER KELAS */}
        <TabsContent value="kelas" className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Kelas</Label>
              <Select value={kelasId} onValueChange={setKelasId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>
                  {kelasList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => printArea("print-kelas")}><Printer className="h-4 w-4 mr-1" />Cetak</Button>
          </div>

          {jamKeList.length === 0 && (
            <Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Belum ada slot jam</AlertTitle>
              <AlertDescription>Atur dulu di tab "Jam Pelajaran".</AlertDescription></Alert>
          )}

          <div id="print-kelas" className="overflow-auto">
            <PrintKopMadrasah judul="Jadwal" subjudul={`JADWAL PELAJARAN ${semester.toUpperCase()} — ${kelasList.find(k => k.id === kelasId)?.nama_kelas || ""}`} />
            <table className="w-full border text-sm">
              <thead>
                <tr>
                  <th className="border bg-muted p-2 w-24">Jam</th>
                  {DAYS.map(d => <th key={d} className="border bg-muted p-2">{HARI_LABEL[d]}</th>)}
                </tr>
              </thead>
              <tbody>
                {jamKeList.map(jk => (
                  <tr key={jk}>
                    <td className="border p-2 text-center align-top">
                      <div className="font-semibold">Ke-{jk}</div>
                      {(() => {
                        const j = jamList.find(x => x.jam_ke === jk);
                        return j ? <div className="text-xs text-muted-foreground">{j.jam_mulai.slice(0,5)}–{j.jam_selesai.slice(0,5)}</div> : null;
                      })()}
                    </td>
                    {DAYS.map(d => {
                      const jam = jamByDayKe.get(`${d}-${jk}`);
                      if (jam?.is_istirahat) {
                        return <td key={d} className="border p-2 text-center italic bg-amber-50 dark:bg-amber-950/30 text-xs">{jam.label || "Istirahat"}</td>;
                      }
                      const cell = jadwalByKelas.get(`${kelasId}-${d}-${jk}`);
                      const guru = cell?.gtk_id ? gtkList.find(g => g.id === cell.gtk_id) : null;
                      const guruClash = cell?.gtk_id ? (jadwalByGuru.get(`${cell.gtk_id}-${d}-${jk}`) || []).length > 1 : false;
                      return (
                        <td key={d}
                          className={`border p-2 align-top text-xs cursor-pointer hover:bg-muted/50 ${guruClash ? "bg-red-50 dark:bg-red-950/30" : ""}`}
                          onClick={() => canEdit && kelasId && setCellDialog({ open: true, hari: d, jam_ke: jk, existing: cell })}
                        >
                          {cell ? (
                            <div>
                              <div className="font-semibold">{cell.mapel}</div>
                              <div className="text-muted-foreground">{guru?.nama || <span className="italic">tanpa guru</span>}</div>
                              {cell.ruang && <div className="text-[10px]">R: {cell.ruang}</div>}
                              {guruClash && <Badge variant="destructive" className="mt-1 text-[10px]">Bentrok</Badge>}
                            </div>
                          ) : (
                            canEdit ? <span className="text-muted-foreground">+ Tambah</span> : <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* PER GURU */}
        <TabsContent value="guru" className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Guru</Label>
              <Select value={gtkId} onValueChange={setGtkId}>
                <SelectTrigger className="w-72"><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                <SelectContent>
                  {gtkList.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}{g.mapel ? ` — ${g.mapel}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => printArea("print-guru")}><Printer className="h-4 w-4 mr-1" />Cetak</Button>
          </div>

          <div id="print-guru" className="overflow-auto">
            <PrintKopMadrasah judul="Jadwal" subjudul={`JADWAL MENGAJAR ${semester.toUpperCase()} — ${gtkList.find(g => g.id === gtkId)?.nama || ""}`} />
            <table className="w-full border text-sm">
              <thead>
                <tr>
                  <th className="border bg-muted p-2 w-24">Jam</th>
                  {DAYS.map(d => <th key={d} className="border bg-muted p-2">{HARI_LABEL[d]}</th>)}
                </tr>
              </thead>
              <tbody>
                {jamKeList.map(jk => (
                  <tr key={jk}>
                    <td className="border p-2 text-center align-top">
                      <div className="font-semibold">Ke-{jk}</div>
                      {(() => {
                        const j = jamList.find(x => x.jam_ke === jk);
                        return j ? <div className="text-xs text-muted-foreground">{j.jam_mulai.slice(0,5)}–{j.jam_selesai.slice(0,5)}</div> : null;
                      })()}
                    </td>
                    {DAYS.map(d => {
                      const items = (jadwalByGuru.get(`${gtkId}-${d}-${jk}`) || []);
                      const unav = (unavByGuru.get(`${gtkId}-${d}`) || []).find(u => u.jam_ke == null || u.jam_ke === jk);
                      const clash = items.length > 1;
                      return (
                        <td key={d} className={`border p-2 align-top text-xs ${clash ? "bg-red-50 dark:bg-red-950/30" : unav ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}>
                          {items.length === 0 ? (
                            unav ? <span className="italic text-amber-700 dark:text-amber-400">tidak tersedia</span> : <span className="text-muted-foreground">-</span>
                          ) : items.map(it => {
                            const k = kelasList.find(x => x.id === it.kelas_id);
                            return (
                              <div key={it.id} className="mb-1">
                                <div className="font-semibold">{it.mapel}</div>
                                <div className="text-muted-foreground">{k?.nama_kelas}</div>
                              </div>
                            );
                          })}
                          {clash && <Badge variant="destructive" className="text-[10px]">Bentrok</Badge>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* JAM PELAJARAN */}
        <TabsContent value="jam" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Slot Jam Pelajaran ({taList.find(t => t.id === taId)?.nama_ta})</CardTitle>
              {canEdit && (
                <Button size="sm" onClick={() => setJamDialog({ open: true, row: { hari: 1, jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:40" } })}>
                  <Plus className="h-4 w-4 mr-1" />Tambah
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Hari</th>
                    <th className="text-left p-2">Jam ke-</th>
                    <th className="text-left p-2">Mulai</th>
                    <th className="text-left p-2">Selesai</th>
                    <th className="text-left p-2">Istirahat</th>
                    <th className="text-left p-2">Label</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {jamList.map(j => (
                    <tr key={j.id} className="border-b">
                      <td className="p-2">{HARI_LABEL[j.hari]}</td>
                      <td className="p-2">{j.jam_ke}</td>
                      <td className="p-2">{j.jam_mulai.slice(0,5)}</td>
                      <td className="p-2">{j.jam_selesai.slice(0,5)}</td>
                      <td className="p-2">{j.is_istirahat ? "Ya" : "-"}</td>
                      <td className="p-2">{j.label || "-"}</td>
                      <td className="p-2 text-right">
                        {canEdit && (
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => setJamDialog({ open: true, row: j })}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteJam(j.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {jamList.length === 0 && <tr><td colSpan={7} className="text-center text-muted-foreground p-4">Belum ada slot jam.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UNAVAILABLE */}
        <TabsContent value="unav" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Hari/Jam Guru Tidak Tersedia</CardTitle>
              {canEdit && (
                <Button size="sm" onClick={() => setUnavDialog({ open: true, row: { hari: 1 } })}>
                  <Plus className="h-4 w-4 mr-1" />Tambah
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Guru</th>
                    <th className="text-left p-2">Hari</th>
                    <th className="text-left p-2">Jam ke-</th>
                    <th className="text-left p-2">Alasan</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {unavList.map(u => {
                    const g = gtkList.find(x => x.id === u.gtk_id);
                    return (
                      <tr key={u.id} className="border-b">
                        <td className="p-2">{g?.nama || u.gtk_id}</td>
                        <td className="p-2">{HARI_LABEL[u.hari]}</td>
                        <td className="p-2">{u.jam_ke ?? "Seharian"}</td>
                        <td className="p-2">{u.alasan || "-"}</td>
                        <td className="p-2 text-right">
                          {canEdit && (
                            <Button size="icon" variant="ghost" onClick={() => deleteUnav(u.id)}><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {unavList.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground p-4">Belum ada data.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Jam Dialog */}
      <Dialog open={jamDialog.open} onOpenChange={(o) => setJamDialog(s => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>{jamDialog.row?.id ? "Edit" : "Tambah"} Slot Jam</DialogTitle></DialogHeader>
          {jamDialog.row && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hari</Label>
                <Select value={String(jamDialog.row.hari || 1)} onValueChange={v => setJamDialog(s => ({ ...s, row: { ...s.row!, hari: Number(v) } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={String(d)}>{HARI_LABEL[d]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jam ke-</Label>
                <Input type="number" min={1} max={20} value={jamDialog.row.jam_ke || 1}
                  onChange={e => setJamDialog(s => ({ ...s, row: { ...s.row!, jam_ke: Number(e.target.value) } }))} />
              </div>
              <div>
                <Label>Mulai</Label>
                <Input type="time" value={(jamDialog.row.jam_mulai || "").slice(0,5)}
                  onChange={e => setJamDialog(s => ({ ...s, row: { ...s.row!, jam_mulai: e.target.value } }))} />
              </div>
              <div>
                <Label>Selesai</Label>
                <Input type="time" value={(jamDialog.row.jam_selesai || "").slice(0,5)}
                  onChange={e => setJamDialog(s => ({ ...s, row: { ...s.row!, jam_selesai: e.target.value } }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="ist" checked={!!jamDialog.row.is_istirahat}
                  onChange={e => setJamDialog(s => ({ ...s, row: { ...s.row!, is_istirahat: e.target.checked } }))} />
                <Label htmlFor="ist">Slot istirahat</Label>
              </div>
              <div className="col-span-2">
                <Label>Label (opsional)</Label>
                <Input value={jamDialog.row.label || ""}
                  onChange={e => setJamDialog(s => ({ ...s, row: { ...s.row!, label: e.target.value } }))}
                  placeholder="Misal: Istirahat / Sholat Dhuha" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setJamDialog({ open: false })}>Batal</Button>
            <Button onClick={() => jamDialog.row && saveJam(jamDialog.row)}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cell Dialog */}
      <Dialog open={cellDialog.open} onOpenChange={(o) => setCellDialog(s => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cellDialog.existing ? "Edit" : "Tambah"} Jadwal — {HARI_LABEL[cellDialog.hari]} jam ke-{cellDialog.jam_ke}
            </DialogTitle>
          </DialogHeader>
          <CellForm
            initial={cellDialog.existing}
            hari={cellDialog.hari}
            jam_ke={cellDialog.jam_ke}
            gtkList={gtkList}
            onCancel={() => setCellDialog({ open: false, hari: 1, jam_ke: 1 })}
            onSave={saveCell}
            onDelete={cellDialog.existing ? () => deleteCell(cellDialog.existing!.id) : undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Unav Dialog */}
      <Dialog open={unavDialog.open} onOpenChange={(o) => setUnavDialog(s => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Preferensi Guru</DialogTitle></DialogHeader>
          {unavDialog.row && (
            <div className="space-y-3">
              <div>
                <Label>Guru</Label>
                <Select value={unavDialog.row.gtk_id || ""} onValueChange={v => setUnavDialog(s => ({ ...s, row: { ...s.row!, gtk_id: v } }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                  <SelectContent>{gtkList.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hari</Label>
                <Select value={String(unavDialog.row.hari || 1)} onValueChange={v => setUnavDialog(s => ({ ...s, row: { ...s.row!, hari: Number(v) } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={String(d)}>{HARI_LABEL[d]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jam ke- (kosongkan = seharian)</Label>
                <Input type="number" min={1} max={20} value={unavDialog.row.jam_ke ?? ""}
                  onChange={e => setUnavDialog(s => ({ ...s, row: { ...s.row!, jam_ke: e.target.value ? Number(e.target.value) : null } }))} />
              </div>
              <div>
                <Label>Alasan</Label>
                <Input value={unavDialog.row.alasan || ""}
                  onChange={e => setUnavDialog(s => ({ ...s, row: { ...s.row!, alasan: e.target.value } }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnavDialog({ open: false })}>Batal</Button>
            <Button onClick={() => unavDialog.row && saveUnav(unavDialog.row)}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CellForm({ initial, hari, jam_ke, gtkList, onCancel, onSave, onDelete }: {
  initial?: Jadwal;
  hari: number; jam_ke: number;
  gtkList: Gtk[];
  onCancel: () => void;
  onSave: (r: Partial<Jadwal>) => void;
  onDelete?: () => void;
}) {
  const [mapel, setMapel] = useState(initial?.mapel || "");
  const [gtk, setGtk] = useState<string>(initial?.gtk_id || "none");
  const [ruang, setRuang] = useState(initial?.ruang || "");
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  return (
    <div className="space-y-3">
      <div>
        <Label>Mapel</Label>
        <Input value={mapel} onChange={e => setMapel(e.target.value)} placeholder="Misal: Matematika" />
      </div>
      <div>
        <Label>Guru</Label>
        <Select value={gtk} onValueChange={setGtk}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— tanpa guru —</SelectItem>
            {gtkList.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}{g.mapel ? ` — ${g.mapel}` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Ruang</Label>
          <Input value={ruang} onChange={e => setRuang(e.target.value)} />
        </div>
        <div>
          <Label>Catatan</Label>
          <Input value={catatan} onChange={e => setCatatan(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        {onDelete && <Button variant="destructive" onClick={onDelete}>Hapus</Button>}
        <Button variant="outline" onClick={onCancel}>Batal</Button>
        <Button onClick={() => onSave({ id: initial?.id, hari, jam_ke, mapel, gtk_id: gtk === "none" ? null : gtk, ruang, catatan })}>Simpan</Button>
      </DialogFooter>
    </div>
  );
}
