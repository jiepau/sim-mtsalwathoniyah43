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
import { AlertTriangle, Plus, Printer, Trash2, Pencil, Clock, Calendar as CalIcon, Wand2, Users } from "lucide-react";
import { PrintKopMadrasah } from "@/components/print/PrintKopMadrasah";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

type TA = { id: string; nama_ta: string; is_active: boolean | null };
type Kelas = { id: string; nama_kelas: string; tingkat: number | null };
type Gtk = { id: string; nama: string; mapel: string | null };
type Jam = { id: string; ta_id: string; hari: number; jam_ke: number; jam_mulai: string; jam_selesai: string; is_istirahat: boolean; label: string | null };
type Jadwal = { id: string; ta_id: string; semester: string; kelas_id: string; hari: number; jam_ke: number; mapel: string; gtk_id: string | null; ruang: string | null; catatan: string | null };
type Unav = { id: string; ta_id: string; semester: string; gtk_id: string; hari: number; jam_ke: number | null; alasan: string | null };
type Piket = { id: string; ta_id: string; semester: string; hari: number; gtk_id: string; catatan: string | null };

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
  const [piketList, setPiketList] = useState<Piket[]>([]);

  const [kelasId, setKelasId] = useState<string>("");
  const [gtkId, setGtkId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [dragData, setDragData] = useState<
    | { kind: "palette"; mapel: string; gtk_id: string | null }
    | { kind: "cell"; id: string; mapel: string; gtk_id: string | null; ruang: string | null; catatan: string | null }
    | null
  >(null);

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
      const [k, g, j, jp, u, p] = await Promise.all([
        db.from("kelas").select("id, nama_kelas, tingkat").order("tingkat").order("nama_kelas"),
        db.from("gtk_ptk").select("id, nama, mapel").eq("status_aktif", "aktif").order("nama"),
        db.from("jadwal_jam").select("*").eq("ta_id", taId).order("hari").order("jam_ke"),
        db.from("jadwal_pelajaran").select("*").eq("ta_id", taId).eq("semester", semester),
        db.from("guru_unavailable").select("*").eq("ta_id", taId).eq("semester", semester),
        db.from("guru_piket").select("*").eq("ta_id", taId).eq("semester", semester).order("hari"),
      ]);
      setKelasList((k.data || []) as Kelas[]);
      setGtkList((g.data || []) as Gtk[]);
      setJamList((j.data || []) as Jam[]);
      setJadwalList((jp.data || []) as Jadwal[]);
      setUnavList((u.data || []) as Unav[]);
      setPiketList((p.data || []) as Piket[]);
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

  // Drag-and-drop: drop from palette (create) or from another cell (move/swap)
  async function handleDrop(hari: number, jam_ke: number) {
    if (!dragData || !kelasId) return;
    const targetCell = jadwalByKelas.get(`${kelasId}-${hari}-${jam_ke}`);
    const jam = jamByDayKe.get(`${hari}-${jam_ke}`);
    if (jam?.is_istirahat) { toast.error("Slot istirahat tidak bisa diisi"); setDragData(null); return; }

    if (dragData.kind === "palette") {
      // Cek bentrok guru
      if (dragData.gtk_id) {
        const clash = jadwalList.find(j => j.gtk_id === dragData.gtk_id && j.hari === hari && j.jam_ke === jam_ke);
        if (clash) {
          const k = kelasList.find(x => x.id === clash.kelas_id);
          toast.error(`Bentrok: guru sudah mengajar di ${k?.nama_kelas}`); setDragData(null); return;
        }
        const unav = (unavByGuru.get(`${dragData.gtk_id}-${hari}`) || []).find(u => u.jam_ke == null || u.jam_ke === jam_ke);
        if (unav && !confirm(`Guru tercatat tidak tersedia (${unav.alasan || "preferensi"}). Tetap simpan?`)) { setDragData(null); return; }
      }
      if (targetCell) {
        // Replace
        const { error } = await db.from("jadwal_pelajaran").update({ mapel: dragData.mapel, gtk_id: dragData.gtk_id }).eq("id", targetCell.id);
        if (error) toast.error(error.message); else { toast.success("Diganti"); loadAll(); }
      } else {
        const { error } = await db.from("jadwal_pelajaran").insert({
          ta_id: taId, semester, kelas_id: kelasId, hari, jam_ke,
          mapel: dragData.mapel, gtk_id: dragData.gtk_id,
        });
        if (error) toast.error(error.message); else { toast.success("Ditambahkan"); loadAll(); }
      }
    } else {
      // Cell -> Cell: move or swap
      if (dragData.id === targetCell?.id) { setDragData(null); return; }
      if (targetCell) {
        // Swap: temporarily move source to placeholder slot using two updates is tricky w/ unique index.
        // Strategi: hapus target, pindah source ke slot target, lalu insert ulang target ke slot source.
        const src = dragData;
        const srcCell = jadwalList.find(j => j.id === src.id)!;
        const { error: e1 } = await db.from("jadwal_pelajaran").delete().eq("id", targetCell.id);
        if (e1) { toast.error(e1.message); return; }
        const { error: e2 } = await db.from("jadwal_pelajaran").update({ hari, jam_ke }).eq("id", src.id);
        if (e2) { toast.error(e2.message); loadAll(); return; }
        const { error: e3 } = await db.from("jadwal_pelajaran").insert({
          ta_id: taId, semester, kelas_id: kelasId, hari: srcCell.hari, jam_ke: srcCell.jam_ke,
          mapel: targetCell.mapel, gtk_id: targetCell.gtk_id, ruang: targetCell.ruang, catatan: targetCell.catatan,
        });
        if (e3) toast.error(e3.message); else toast.success("Ditukar");
        loadAll();
      } else {
        // Move
        if (dragData.gtk_id) {
          const clash = jadwalList.find(j => j.gtk_id === dragData.gtk_id && j.hari === hari && j.jam_ke === jam_ke && j.id !== dragData.id);
          if (clash) { toast.error("Bentrok guru di slot tujuan"); setDragData(null); return; }
        }
        const { error } = await db.from("jadwal_pelajaran").update({ hari, jam_ke }).eq("id", dragData.id);
        if (error) toast.error(error.message); else { toast.success("Dipindah"); loadAll(); }
      }
    }
    setDragData(null);
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

  // -------- PIKET CRUD --------
  async function savePiket(hari: number, gtk_id: string, catatan?: string) {
    if (!gtk_id) { toast.error("Pilih guru piket"); return; }
    const existing = piketList.find(p => p.hari === hari && p.gtk_id === gtk_id);
    if (existing) { toast.error("Guru tersebut sudah terdaftar piket di hari ini"); return; }
    const { error } = await db.from("guru_piket").insert({ ta_id: taId, semester, hari, gtk_id, catatan: catatan || null });
    if (error) toast.error(error.message); else { toast.success("Disimpan"); loadAll(); }
  }

  async function deletePiket(id: string) {
    const { error } = await db.from("guru_piket").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Dihapus"); loadAll(); }
  }

  // -------- GENERATOR JAM PELAJARAN --------
  async function generateJamPelajaran(opts: {
    days: number[]; jamMulai: string; jumlahJam: number; durasiMenit: number;
    istirahat: { afterJamKe: number; durasiMenit: number; label: string }[];
    replaceExisting: boolean;
  }) {
    if (!taId) { toast.error("Pilih Tahun Ajaran"); return; }
    if (opts.days.length === 0) { toast.error("Pilih minimal 1 hari"); return; }
    if (opts.jumlahJam < 1) { toast.error("Jumlah jam minimal 1"); return; }

    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const toTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

    const rows: any[] = [];
    for (const hari of opts.days) {
      let cursor = toMin(opts.jamMulai);
      let jamKe = 1;
      for (let i = 1; i <= opts.jumlahJam; i++) {
        const start = cursor;
        const end = cursor + opts.durasiMenit;
        rows.push({ ta_id: taId, hari, jam_ke: jamKe++, jam_mulai: toTime(start), jam_selesai: toTime(end), is_istirahat: false, label: null });
        cursor = end;
        const ist = opts.istirahat.filter(x => x.afterJamKe === i);
        for (const x of ist) {
          rows.push({ ta_id: taId, hari, jam_ke: jamKe++, jam_mulai: toTime(cursor), jam_selesai: toTime(cursor + x.durasiMenit), is_istirahat: true, label: x.label || "Istirahat" });
          cursor += x.durasiMenit;
        }
      }
    }

    if (opts.replaceExisting) {
      const { error: delErr } = await db.from("jadwal_jam").delete().eq("ta_id", taId).in("hari", opts.days);
      if (delErr) { toast.error(delErr.message); return; }
    }
    const { error } = await db.from("jadwal_jam").insert(rows);
    if (error) toast.error(error.message); else { toast.success(`${rows.length} slot dibuat`); loadAll(); }
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

  function printAllKelasF4() {
    const node = document.getElementById("print-all-kelas");
    if (!node) return;
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) return;
    w.document.write(`<html><head><title>Cetak Jadwal Semua Kelas</title>
      <style>
        @page { size: 215mm 330mm landscape; margin: 8mm; }
        body{font-family: Arial, sans-serif; padding: 0; margin: 0; color:#000;}
        table{width:100%; border-collapse: collapse; font-size: 9px;}
        th,td{border:1px solid #333; padding:2px 3px; vertical-align: top; line-height:1.15;}
        th{background:#d8f3ec; text-align:center;}
        .istirahat{background:#fff7d6; text-align:center; font-style: italic;}
        .hari-sep{background:#0d9488; color:#fff; font-weight:bold; text-align:center; padding:3px;}
        .mapel{font-weight:600;}
        .guru{color:#444; font-size:8px;}
        h1,h2,h3,h4{margin:2px 0;}
        .grid-2{display:grid; grid-template-columns: 1.2fr 1fr; gap:8px; margin-top:6px;}
        .box{border:1px solid #333; padding:4px;}
        .box h4{font-size:10px; margin:0 0 3px 0; background:#0d9488; color:#fff; padding:2px 4px;}
        .small{font-size:9px;}
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  }

  async function deleteAllJam() {
    if (!taId) return;
    if (!confirm("Hapus SEMUA slot jam pelajaran pada Tahun Ajaran ini?")) return;
    if (!confirm("Konfirmasi sekali lagi: tindakan ini tidak bisa dibatalkan. Lanjutkan?")) return;
    const { error } = await db.from("jadwal_jam").delete().eq("ta_id", taId);
    if (error) toast.error(error.message);
    else { toast.success("Semua slot jam dihapus"); loadAll(); }
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
          <TabsTrigger value="piket"><Users className="h-4 w-4 mr-1" />Guru Piket</TabsTrigger>
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

          {canEdit && (
            <Alert>
              <AlertTitle className="text-sm">Cara pakai</AlertTitle>
              <AlertDescription className="text-xs">
                <b>Klik</b> sel kosong → form tambah. <b>Klik</b> sel berisi → edit/hapus.
                <b> Tarik</b> kartu guru dari panel kanan ke sel untuk menempatkan cepat.
                <b> Tarik</b> antar sel untuk memindah atau menukar jadwal. Sel merah = bentrok guru.
              </AlertDescription>
            </Alert>
          )}

          {jamKeList.length === 0 && (
            <Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Belum ada slot jam</AlertTitle>
              <AlertDescription>Atur dulu di tab "Jam Pelajaran".</AlertDescription></Alert>
          )}
          {gtkList.length === 0 && (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Belum ada data guru aktif</AlertTitle>
              <AlertDescription>Tambahkan/aktifkan GTK di menu GTK/PTK terlebih dahulu.</AlertDescription></Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
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
                            className={`border p-2 align-top text-xs hover:bg-muted/50 ${canEdit ? "cursor-pointer" : ""} ${guruClash ? "bg-red-50 dark:bg-red-950/30" : ""} ${dragData ? "outline-dashed outline-1 outline-primary/30" : ""}`}
                            draggable={canEdit && !!cell}
                            onDragStart={() => cell && setDragData({ kind: "cell", id: cell.id, mapel: cell.mapel, gtk_id: cell.gtk_id, ruang: cell.ruang, catatan: cell.catatan })}
                            onDragOver={(e) => { if (canEdit && dragData) e.preventDefault(); }}
                            onDrop={(e) => { e.preventDefault(); handleDrop(d, jk); }}
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

            {canEdit && (
              <aside className="border rounded-md p-2 space-y-2 h-fit sticky top-2 bg-card">
                <div className="text-xs font-semibold text-muted-foreground px-1">Palette Guru (drag ke sel)</div>
                <div className="max-h-[60vh] overflow-auto space-y-1">
                  {gtkList.length === 0 && <div className="text-xs text-muted-foreground p-2">Tidak ada guru aktif.</div>}
                  {gtkList.map(g => (
                    <div key={g.id}
                      draggable
                      onDragStart={() => setDragData({ kind: "palette", mapel: g.mapel || "", gtk_id: g.id })}
                      onDragEnd={() => setDragData(null)}
                      className="border rounded p-2 text-xs cursor-grab active:cursor-grabbing hover:bg-muted/50"
                      title="Tarik ke sel jadwal"
                    >
                      <div className="font-semibold truncate">{g.nama}</div>
                      <div className="text-muted-foreground truncate">{g.mapel || <span className="italic">— belum set mapel —</span>}</div>
                    </div>
                  ))}
                </div>
              </aside>
            )}
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
          {canEdit && <JamGenerator onGenerate={generateJamPelajaran} />}

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

        {/* GURU PIKET */}
        <TabsContent value="piket" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jadwal Guru Piket — {semester === "ganjil" ? "Ganjil" : "Genap"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DAYS.map(d => {
                  const items = piketList.filter(p => p.hari === d);
                  return (
                    <Card key={d} className="border">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{HARI_LABEL[d]}</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        {items.length === 0 && <div className="text-xs text-muted-foreground italic">Belum ada petugas.</div>}
                        {items.map(it => {
                          const g = gtkList.find(x => x.id === it.gtk_id);
                          return (
                            <div key={it.id} className="flex items-center justify-between gap-2 text-sm border rounded p-2">
                              <div>
                                <div className="font-medium">{g?.nama || "—"}</div>
                                {it.catatan && <div className="text-xs text-muted-foreground">{it.catatan}</div>}
                              </div>
                              {canEdit && <Button size="icon" variant="ghost" onClick={() => deletePiket(it.id)}><Trash2 className="h-4 w-4" /></Button>}
                            </div>
                          );
                        })}
                        {canEdit && (
                          <PiketAddForm gtkList={gtkList} onAdd={(gtk_id, catatan) => savePiket(d, gtk_id, catatan)} />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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

function JamGenerator({ onGenerate }: { onGenerate: (opts: { days: number[]; jamMulai: string; jumlahJam: number; durasiMenit: number; istirahat: { afterJamKe: number; durasiMenit: number; label: string }[]; replaceExisting: boolean }) => void }) {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [jamMulai, setJamMulai] = useState("07:00");
  const [jumlahJam, setJumlahJam] = useState(9);
  const [durasiMenit, setDurasiMenit] = useState(40);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [istirahat, setIstirahat] = useState<{ afterJamKe: number; durasiMenit: number; label: string }[]>([
    { afterJamKe: 3, durasiMenit: 15, label: "Istirahat" },
    { afterJamKe: 6, durasiMenit: 30, label: "Sholat & Istirahat" },
  ]);

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4" />Generator Jam Pelajaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Hari aktif</Label>
          <div className="flex flex-wrap gap-3 mt-1">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox checked={days.includes(d)} onCheckedChange={() => toggleDay(d)} />
                {HARI_LABEL[d]}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label className="text-xs">Jam Mulai</Label><Input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} /></div>
          <div><Label className="text-xs">Jumlah Jam KBM</Label><Input type="number" min={1} max={20} value={jumlahJam} onChange={e => setJumlahJam(Number(e.target.value))} /></div>
          <div><Label className="text-xs">Durasi/Jam (menit)</Label><Input type="number" min={5} max={120} value={durasiMenit} onChange={e => setDurasiMenit(Number(e.target.value))} /></div>
          <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><Checkbox checked={replaceExisting} onCheckedChange={v => setReplaceExisting(!!v)} />Ganti slot lama di hari terpilih</label></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Jeda / Istirahat</Label>
            <Button size="sm" variant="outline" onClick={() => setIstirahat(p => [...p, { afterJamKe: 1, durasiMenit: 15, label: "Istirahat" }])}>
              <Plus className="h-3 w-3 mr-1" />Tambah Istirahat
            </Button>
          </div>
          <div className="space-y-2">
            {istirahat.length === 0 && <div className="text-xs text-muted-foreground italic">Belum ada jeda. (Misal: setelah jam ke-3 ada istirahat 15 menit.)</div>}
            {istirahat.map((x, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3"><Label className="text-[10px]">Setelah jam ke-</Label><Input type="number" min={1} value={x.afterJamKe} onChange={e => setIstirahat(p => p.map((y, idx) => idx === i ? { ...y, afterJamKe: Number(e.target.value) } : y))} /></div>
                <div className="col-span-3"><Label className="text-[10px]">Durasi (menit)</Label><Input type="number" min={1} value={x.durasiMenit} onChange={e => setIstirahat(p => p.map((y, idx) => idx === i ? { ...y, durasiMenit: Number(e.target.value) } : y))} /></div>
                <div className="col-span-5"><Label className="text-[10px]">Label</Label><Input value={x.label} onChange={e => setIstirahat(p => p.map((y, idx) => idx === i ? { ...y, label: e.target.value } : y))} placeholder="Istirahat / Sholat Dhuha" /></div>
                <div className="col-span-1"><Button size="icon" variant="ghost" onClick={() => setIstirahat(p => p.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onGenerate({ days, jamMulai, jumlahJam, durasiMenit, istirahat, replaceExisting })}>
            <Wand2 className="h-4 w-4 mr-1" />Generate Slot Jam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PiketAddForm({ gtkList, onAdd }: { gtkList: Gtk[]; onAdd: (gtk_id: string, catatan?: string) => void }) {
  const [gtk, setGtk] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  return (
    <div className="border-t pt-2 space-y-2">
      <Select value={gtk} onValueChange={setGtk}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="+ Tambah petugas" /></SelectTrigger>
        <SelectContent>{gtkList.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>)}</SelectContent>
      </Select>
      {gtk && (
        <>
          <Input className="h-8 text-xs" placeholder="Catatan (opsional)" value={catatan} onChange={e => setCatatan(e.target.value)} />
          <Button size="sm" className="w-full h-7" onClick={() => { onAdd(gtk, catatan); setGtk(""); setCatatan(""); }}>Simpan</Button>
        </>
      )}
    </div>
  );
}
