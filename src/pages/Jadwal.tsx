import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertTriangle, Plus, Printer, Trash2, Pencil, Clock, Settings as SettingsIcon, Users, LayoutGrid, CalendarOff, Eye } from "lucide-react";
import { PrintKopMadrasah } from "@/components/print/PrintKopMadrasah";

// ============ Types ============
type TA = { id: string; nama_ta: string; is_active: boolean | null };
type Kelas = { id: string; nama_kelas: string; tingkat: number | null };
type Gtk = { id: string; nama: string; nik: string | null; mapel: string | null };
type Model = {
  id: string;
  ta_id: string;
  nama: string;
  keterangan: string | null;
  max_jam_per_hari: number;
  hari_libur: string[];
  is_active: boolean;
};
type Jam = {
  id: string;
  model_id: string | null;
  ta_id: string;
  hari: number;
  jam_ke: number;
  jam_mulai: string;
  jam_selesai: string;
  is_istirahat: boolean;
  label: string | null;
};
type Jadwal = {
  id: string;
  model_id: string | null;
  ta_id: string;
  semester: string;
  kelas_id: string;
  hari: number;
  jam_ke: number;
  mapel: string;
  gtk_id: string | null;
  ruang: string | null;
  catatan: string | null;
};
type Unav = {
  id: string;
  ta_id: string;
  semester: string;
  gtk_id: string;
  hari: number;
  jam_ke: number | null;
  alasan: string | null;
};

// ============ Constants ============
const HARI_LABEL = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
const HARI_KEYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
const db = supabase as any;

// ============ Helpers ============
const hariKeToNum = (k: string) => HARI_KEYS.indexOf(k) + 1;
const numToHariKey = (n: number) => HARI_KEYS[n - 1];

export default function JadwalPage() {
  const { roles: userRoles } = useAuth();
  const canEdit = userRoles.includes("admin") || userRoles.includes("operator");

  // Filters
  const [taList, setTaList] = useState<TA[]>([]);
  const [taId, setTaId] = useState<string>("");
  const [semester, setSemester] = useState<"ganjil" | "genap">("ganjil");

  // Data
  const [modelList, setModelList] = useState<Model[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [gtkList, setGtkList] = useState<Gtk[]>([]);
  const [jamList, setJamList] = useState<Jam[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [unavList, setUnavList] = useState<Unav[]>([]);

  const [loading, setLoading] = useState(false);

  const activeModel = useMemo(() => modelList.find(m => m.is_active) || null, [modelList]);

  // Hari aktif dari hari_libur model aktif
  const activeDays = useMemo(() => {
    if (!activeModel) return [1, 2, 3, 4, 5, 6];
    const libur = new Set((activeModel.hari_libur || []).map(numToHariKeyLow));
    return ALL_DAYS.filter(d => !libur.has(HARI_KEYS[d - 1]));
  }, [activeModel]);

  function numToHariKeyLow(s: string) { return (s || "").toLowerCase(); }

  // Initial load
  useEffect(() => { loadTA(); }, []);
  useEffect(() => { if (taId) loadAll(); }, [taId, semester]);

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
      const [m, k, g, j, jp, u] = await Promise.all([
        db.from("jadwal_model").select("*").eq("ta_id", taId).order("created_at"),
        db.from("kelas").select("id, nama_kelas, tingkat").order("tingkat").order("nama_kelas"),
        db.from("gtk_ptk").select("id, nama, nik, mapel").eq("status_aktif", "aktif").order("nama"),
        db.from("jadwal_jam").select("*").eq("ta_id", taId).order("hari").order("jam_ke"),
        db.from("jadwal_pelajaran").select("*").eq("ta_id", taId).eq("semester", semester),
        db.from("guru_unavailable").select("*").eq("ta_id", taId).eq("semester", semester),
      ]);
      setModelList((m.data || []) as Model[]);
      setKelasList((k.data || []) as Kelas[]);
      setGtkList((g.data || []) as Gtk[]);
      setJamList((j.data || []) as Jam[]);
      setJadwalList((jp.data || []) as Jadwal[]);
      setUnavList((u.data || []) as Unav[]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Jadwal Pelajaran" description="Pengaturan model jadwal, jadwal mengajar PTK, dan jadwal per kelas." icon={<LayoutGrid className="h-5 w-5" />} />

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label>Tahun Ajaran</Label>
            <Select value={taId} onValueChange={setTaId}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {taList.map(t => <SelectItem key={t.id} value={t.id}>{t.nama_ta}{t.is_active ? " (Aktif)" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Semester</Label>
            <Select value={semester} onValueChange={(v) => setSemester(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ganjil">Ganjil</SelectItem>
                <SelectItem value="genap">Genap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {activeModel ? (
            <div className="ml-auto text-sm">
              Model aktif: <Badge className="bg-primary text-primary-foreground">{activeModel.nama}</Badge>
            </div>
          ) : (
            <div className="ml-auto text-sm text-muted-foreground">Belum ada model aktif</div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="pengaturan">
        <TabsList>
          <TabsTrigger value="pengaturan"><SettingsIcon className="h-4 w-4 mr-1" />Pengaturan Jadwal</TabsTrigger>
          <TabsTrigger value="ptk"><Users className="h-4 w-4 mr-1" />Jadwal Mengajar PTK</TabsTrigger>
          <TabsTrigger value="kelas"><LayoutGrid className="h-4 w-4 mr-1" />Jadwal Per Kelas</TabsTrigger>
          <TabsTrigger value="preferensi"><CalendarOff className="h-4 w-4 mr-1" />Preferensi Guru</TabsTrigger>
        </TabsList>

        <TabsContent value="pengaturan" className="space-y-4">
          <PengaturanTab
            taId={taId}
            canEdit={canEdit}
            modelList={modelList}
            jamList={jamList}
            activeModel={activeModel}
            reload={loadAll}
          />
        </TabsContent>

        <TabsContent value="ptk" className="space-y-4">
          <PtkTab
            taId={taId}
            semester={semester}
            canEdit={canEdit}
            activeModel={activeModel}
            activeDays={activeDays}
            jamList={jamList}
            gtkList={gtkList}
            kelasList={kelasList}
            jadwalList={jadwalList}
            unavList={unavList}
            reload={loadAll}
          />
        </TabsContent>

        <TabsContent value="kelas" className="space-y-4">
          <KelasTab
            taId={taId}
            semester={semester}
            canEdit={canEdit}
            activeModel={activeModel}
            activeDays={activeDays}
            jamList={jamList}
            gtkList={gtkList}
            kelasList={kelasList}
            jadwalList={jadwalList}
            reload={loadAll}
          />
        </TabsContent>

        <TabsContent value="preferensi" className="space-y-4">
          <PreferensiTab
            taId={taId}
            semester={semester}
            canEdit={canEdit}
            gtkList={gtkList}
            unavList={unavList}
            reload={loadAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===========================================================
// TAB 1 — PENGATURAN: kelola model jadwal + jam pelajaran
// ===========================================================
function PengaturanTab({
  taId, canEdit, modelList, jamList, activeModel, reload,
}: {
  taId: string;
  canEdit: boolean;
  modelList: Model[];
  jamList: Jam[];
  activeModel: Model | null;
  reload: () => void;
}) {
  const [modelDialog, setModelDialog] = useState<{ open: boolean; row?: Partial<Model> }>({ open: false });
  const [jamDialog, setJamDialog] = useState<{ open: boolean; row?: Partial<Jam> }>({ open: false });

  async function saveModel(row: Partial<Model>) {
    if (!row.nama?.trim()) { toast.error("Nama model wajib diisi"); return; }
    const payload: any = {
      ta_id: taId,
      nama: row.nama,
      keterangan: row.keterangan || null,
      max_jam_per_hari: Number(row.max_jam_per_hari) || 10,
      hari_libur: row.hari_libur && row.hari_libur.length ? row.hari_libur : ["minggu"],
      is_active: !!row.is_active,
    };
    // Jika diaktifkan, non-aktifkan model lain dalam TA yang sama
    if (payload.is_active) {
      await db.from("jadwal_model").update({ is_active: false }).eq("ta_id", taId);
    }
    const res = row.id
      ? await db.from("jadwal_model").update(payload).eq("id", row.id)
      : await db.from("jadwal_model").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Model jadwal disimpan");
    setModelDialog({ open: false });
    reload();
  }

  async function deleteModel(id: string) {
    if (!confirm("Hapus model jadwal beserta jam pelajaran & jadwal yang menggunakannya?")) return;
    const res = await db.from("jadwal_model").delete().eq("id", id);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Model dihapus");
    reload();
  }

  async function setActive(id: string) {
    await db.from("jadwal_model").update({ is_active: false }).eq("ta_id", taId);
    const res = await db.from("jadwal_model").update({ is_active: true }).eq("id", id);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Model diaktifkan");
    reload();
  }

  const jamModel = useMemo(() => jamList.filter(j => activeModel && j.model_id === activeModel.id), [jamList, activeModel]);
  const jamKeList = useMemo(() => {
    const s = new Set<number>(); jamModel.forEach(j => s.add(j.jam_ke));
    return Array.from(s).sort((a, b) => a - b);
  }, [jamModel]);

  async function saveJam(row: Partial<Jam>) {
    if (!activeModel) { toast.error("Aktifkan model jadwal terlebih dahulu"); return; }
    const jam_ke = Number(row.jam_ke);
    if (!jam_ke) { toast.error("Jam ke wajib diisi"); return; }
    if (!row.jam_mulai || !row.jam_selesai) { toast.error("Jam mulai/selesai wajib"); return; }

    // Terapkan ke semua hari aktif (otomatis)
    const liburSet = new Set((activeModel.hari_libur || []).map(s => s.toLowerCase()));
    const days = ALL_DAYS.filter(d => !liburSet.has(HARI_KEYS[d - 1]));

    // Hapus jam_ke lama untuk model+jam_ke ini, lalu insert ulang
    if (row.id) {
      await db.from("jadwal_jam").delete().eq("model_id", activeModel.id).eq("jam_ke", jam_ke);
    }
    const payloads = days.map(h => ({
      model_id: activeModel.id,
      ta_id: taId,
      hari: h,
      jam_ke,
      jam_mulai: row.jam_mulai,
      jam_selesai: row.jam_selesai,
      is_istirahat: !!row.is_istirahat,
      label: row.label || null,
    }));
    const res = await db.from("jadwal_jam").insert(payloads);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Jam pelajaran disimpan");
    setJamDialog({ open: false });
    reload();
  }

  async function deleteJam(jam_ke: number) {
    if (!activeModel) return;
    if (!confirm(`Hapus jam ke-${jam_ke}?`)) return;
    const res = await db.from("jadwal_jam").delete().eq("model_id", activeModel.id).eq("jam_ke", jam_ke);
    if (res.error) { toast.error(res.error.message); return; }
    reload();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Model Jadwal</CardTitle>
            <p className="text-sm text-muted-foreground">Kelola konfigurasi model jadwal sekolah. Hanya satu model boleh aktif per Tahun Ajaran.</p>
          </div>
          {canEdit && (
            <Button onClick={() => setModelDialog({ open: true, row: { max_jam_per_hari: 10, hari_libur: ["minggu"], is_active: modelList.length === 0 } })}>
              <Plus className="h-4 w-4 mr-1" />Tambah Model
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Model</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Max Jam</TableHead>
                <TableHead>Hari Libur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelList.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Belum ada model jadwal</TableCell></TableRow>
              )}
              {modelList.map((m, i) => (
                <TableRow key={m.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{m.nama}</TableCell>
                  <TableCell className="text-muted-foreground">{m.keterangan || "-"}</TableCell>
                  <TableCell>{m.max_jam_per_hari} jam</TableCell>
                  <TableCell className="capitalize">{(m.hari_libur || []).join(", ") || "-"}</TableCell>
                  <TableCell>
                    {m.is_active
                      ? <Badge className="bg-primary text-primary-foreground">Aktif</Badge>
                      : <Badge variant="secondary">Non-Aktif</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {canEdit && !m.is_active && (
                      <Button size="sm" variant="outline" onClick={() => setActive(m.id)}>Aktifkan</Button>
                    )}
                    {canEdit && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => setModelDialog({ open: true, row: m })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteModel(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Jam Pelajaran untuk model aktif */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle><Clock className="h-4 w-4 inline mr-1" />Jam Pelajaran {activeModel ? `— ${activeModel.nama}` : ""}</CardTitle>
            <p className="text-sm text-muted-foreground">Definisi jam pelajaran berlaku untuk semua hari aktif pada model.</p>
          </div>
          {canEdit && activeModel && (
            <Button onClick={() => setJamDialog({ open: true, row: { jam_mulai: "07:00", jam_selesai: "07:40" } })}>
              <Plus className="h-4 w-4 mr-1" />Tambah Jam
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!activeModel ? (
            <Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Belum ada model aktif</AlertTitle><AlertDescription>Tambah dan aktifkan model jadwal terlebih dahulu.</AlertDescription></Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jam Ke</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Selesai</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Istirahat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jamKeList.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Belum ada slot jam</TableCell></TableRow>
                )}
                {jamKeList.map(jk => {
                  const j = jamModel.find(x => x.jam_ke === jk);
                  if (!j) return null;
                  return (
                    <TableRow key={jk}>
                      <TableCell>{jk}</TableCell>
                      <TableCell>{j.jam_mulai}</TableCell>
                      <TableCell>{j.jam_selesai}</TableCell>
                      <TableCell>{j.label || "-"}</TableCell>
                      <TableCell>{j.is_istirahat ? "Ya" : "-"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {canEdit && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => setJamDialog({ open: true, row: j })}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteJam(jk)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Model dialog */}
      <ModelFormDialog
        open={modelDialog.open}
        row={modelDialog.row}
        onClose={() => setModelDialog({ open: false })}
        onSave={saveModel}
      />

      {/* Jam dialog */}
      <JamFormDialog
        open={jamDialog.open}
        row={jamDialog.row}
        onClose={() => setJamDialog({ open: false })}
        onSave={saveJam}
      />
    </>
  );
}

function ModelFormDialog({ open, row, onClose, onSave }: { open: boolean; row?: Partial<Model>; onClose: () => void; onSave: (r: Partial<Model>) => void }) {
  const [form, setForm] = useState<Partial<Model>>({});
  useEffect(() => { setForm(row || {}); }, [row, open]);
  const toggleLibur = (key: string) => {
    const cur = new Set(form.hari_libur || []);
    if (cur.has(key)) cur.delete(key); else cur.add(key);
    setForm({ ...form, hari_libur: Array.from(cur) });
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row?.id ? "Edit" : "Tambah"} Model Jadwal</DialogTitle>
          <DialogDescription>Konfigurasi maksimal jam dan hari libur.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Nama Model *</Label>
            <Input value={form.nama || ""} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Jadwal Reguler 2026" />
          </div>
          <div className="space-y-1">
            <Label>Maksimal Jam per Hari *</Label>
            <Input type="number" min={1} max={20} value={form.max_jam_per_hari ?? 10} onChange={e => setForm({ ...form, max_jam_per_hari: Number(e.target.value) })} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Keterangan</Label>
            <Textarea value={form.keterangan || ""} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan tambahan (opsional)" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Hari Libur</Label>
            <p className="text-xs text-muted-foreground">Centang hari yang merupakan hari libur</p>
            <div className="flex flex-wrap gap-3">
              {HARI_KEYS.map(k => (
                <label key={k} className="flex items-center gap-2 capitalize text-sm">
                  <Checkbox checked={(form.hari_libur || []).includes(k)} onCheckedChange={() => toggleLibur(k)} />
                  {k}
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <div>
              <div className="text-sm font-medium">Aktifkan model ini</div>
              <div className="text-xs text-muted-foreground">Jika diaktifkan, model jadwal lain akan otomatis dinonaktifkan</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => onSave(form)}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JamFormDialog({ open, row, onClose, onSave }: { open: boolean; row?: Partial<Jam>; onClose: () => void; onSave: (r: Partial<Jam>) => void }) {
  const [form, setForm] = useState<Partial<Jam>>({});
  useEffect(() => { setForm(row || {}); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row?.id ? "Edit" : "Tambah"} Jam Pelajaran</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Jam Ke *</Label>
            <Input type="number" min={1} value={form.jam_ke ?? ""} onChange={e => setForm({ ...form, jam_ke: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>Label</Label>
            <Input value={form.label || ""} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Misal: Istirahat" />
          </div>
          <div className="space-y-1">
            <Label>Jam Mulai *</Label>
            <Input type="time" value={form.jam_mulai || ""} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Jam Selesai *</Label>
            <Input type="time" value={form.jam_selesai || ""} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <Checkbox checked={!!form.is_istirahat} onCheckedChange={(v) => setForm({ ...form, is_istirahat: !!v })} />
            Slot istirahat (bukan jam mengajar)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => onSave(form)}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// TAB 2 — JADWAL MENGAJAR PTK (per guru)
// ===========================================================
function PtkTab({
  taId, semester, canEdit, activeModel, activeDays, jamList, gtkList, kelasList, jadwalList, unavList, reload,
}: {
  taId: string;
  semester: string;
  canEdit: boolean;
  activeModel: Model | null;
  activeDays: number[];
  jamList: Jam[];
  gtkList: Gtk[];
  kelasList: Kelas[];
  jadwalList: Jadwal[];
  unavList: Unav[];
  reload: () => void;
}) {
  const [q, setQ] = useState("");
  const [openPtk, setOpenPtk] = useState<Gtk | null>(null);
  const [slotDialog, setSlotDialog] = useState<{ open: boolean; row?: Partial<Jadwal>; gtk?: Gtk }>({ open: false });

  const jamModel = useMemo(() => jamList.filter(j => activeModel && j.model_id === activeModel.id), [jamList, activeModel]);
  const jamKeList = useMemo(() => {
    const s = new Set<number>(); jamModel.forEach(j => s.add(j.jam_ke));
    return Array.from(s).sort((a, b) => a - b);
  }, [jamModel]);

  const guruStats = useMemo(() => {
    const map = new Map<string, { mapelCount: number; total: number }>();
    jadwalList.forEach(j => {
      if (!j.gtk_id) return;
      const cur = map.get(j.gtk_id) || { mapelCount: 0, total: 0 };
      cur.total += 1;
      map.set(j.gtk_id, cur);
    });
    // Count distinct mapel per guru
    const distinct = new Map<string, Set<string>>();
    jadwalList.forEach(j => {
      if (!j.gtk_id) return;
      const s = distinct.get(j.gtk_id) || new Set();
      s.add(j.mapel);
      distinct.set(j.gtk_id, s);
    });
    distinct.forEach((set, k) => {
      const cur = map.get(k) || { mapelCount: 0, total: 0 };
      cur.mapelCount = set.size;
      map.set(k, cur);
    });
    return map;
  }, [jadwalList]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return gtkList.filter(g => !t || g.nama.toLowerCase().includes(t) || (g.nik || "").includes(t));
  }, [gtkList, q]);

  const sudahInput = useMemo(() => {
    const s = new Set<string>(); jadwalList.forEach(j => j.gtk_id && s.add(j.gtk_id));
    return s.size;
  }, [jadwalList]);

  async function saveSlot(row: Partial<Jadwal>, gtk: Gtk) {
    if (!activeModel) { toast.error("Tidak ada model aktif"); return; }
    if (!row.kelas_id || !row.mapel || !row.hari || !row.jam_ke) {
      toast.error("Kelas, mapel, hari, dan jam ke wajib diisi"); return;
    }
    // Cek bentrok guru di slot yang sama (kelas lain)
    const clashGuru = jadwalList.find(j =>
      j.id !== row.id && j.gtk_id === gtk.id && j.hari === row.hari && j.jam_ke === row.jam_ke
    );
    if (clashGuru) {
      const k = kelasList.find(x => x.id === clashGuru.kelas_id);
      toast.error(`Bentrok: guru sudah mengajar di kelas ${k?.nama_kelas || "?"} pada slot ini`);
      return;
    }
    // Cek bentrok kelas (mapel lain di slot yang sama)
    const clashKelas = jadwalList.find(j =>
      j.id !== row.id && j.kelas_id === row.kelas_id && j.hari === row.hari && j.jam_ke === row.jam_ke
    );
    if (clashKelas) {
      toast.error(`Bentrok: kelas sudah punya mapel "${clashKelas.mapel}" pada slot ini`); return;
    }
    // Cek preferensi guru unavailable
    const unav = unavList.find(u => u.gtk_id === gtk.id && u.hari === row.hari && (u.jam_ke === null || u.jam_ke === row.jam_ke));
    if (unav && !confirm(`Guru ini menandai hari/jam ini sebagai tidak tersedia (${unav.alasan || "preferensi"}). Lanjutkan?`)) return;

    const payload: any = {
      model_id: activeModel.id,
      ta_id: taId,
      semester,
      kelas_id: row.kelas_id,
      hari: row.hari,
      jam_ke: row.jam_ke,
      mapel: row.mapel,
      gtk_id: gtk.id,
      ruang: row.ruang || null,
      catatan: row.catatan || null,
    };
    const res = row.id
      ? await db.from("jadwal_pelajaran").update(payload).eq("id", row.id)
      : await db.from("jadwal_pelajaran").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Slot jadwal disimpan");
    setSlotDialog({ open: false });
    reload();
  }

  async function deleteSlot(id: string) {
    if (!confirm("Hapus slot jadwal ini?")) return;
    const res = await db.from("jadwal_pelajaran").delete().eq("id", id);
    if (res.error) { toast.error(res.error.message); return; }
    reload();
  }

  const detailRows = useMemo(() => {
    if (!openPtk) return [];
    return jadwalList
      .filter(j => j.gtk_id === openPtk.id)
      .sort((a, b) => a.hari - b.hari || a.jam_ke - b.jam_ke);
  }, [openPtk, jadwalList]);

  return (
    <>
      {!activeModel && (
        <Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Belum ada model aktif</AlertTitle><AlertDescription>Buka tab Pengaturan Jadwal untuk membuat dan mengaktifkan model.</AlertDescription></Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total Guru</div><div className="text-3xl font-bold">{gtkList.length}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Sudah Input</div><div className="text-3xl font-bold text-primary">{sudahInput}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Belum Input</div><div className="text-3xl font-bold text-amber-600">{Math.max(0, gtkList.length - sudahInput)}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total Jam Terisi</div><div className="text-3xl font-bold">{jadwalList.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Jadwal Mengajar PTK</CardTitle>
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama / NIK..." className="w-64" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama PTK</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Mapel Diampu</TableHead>
                <TableHead>Total Jam</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Tidak ada guru</TableCell></TableRow>
              )}
              {filtered.map((g, i) => {
                const st = guruStats.get(g.id) || { mapelCount: 0, total: 0 };
                return (
                  <TableRow key={g.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{g.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{g.nik || "-"}</TableCell>
                    <TableCell>
                      {st.mapelCount > 0
                        ? <Badge variant="secondary">{st.mapelCount} mapel</Badge>
                        : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell>
                      {st.total > 0
                        ? <Badge className="bg-amber-500 text-white">{st.total} jam</Badge>
                        : <span className="text-muted-foreground text-xs">0 jam</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => setOpenPtk(g)}><Eye className="h-4 w-4" /></Button>
                      {canEdit && (
                        <Button size="icon" variant="ghost" onClick={() => { setOpenPtk(g); setSlotDialog({ open: true, gtk: g, row: {} }); }}>
                          <Plus className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!openPtk} onOpenChange={(v) => !v && setOpenPtk(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Jadwal Mengajar — {openPtk?.nama}</DialogTitle>
            <DialogDescription>Daftar slot jadwal {semester}.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-2">
            {canEdit && activeModel && (
              <Button size="sm" onClick={() => setSlotDialog({ open: true, gtk: openPtk!, row: {} })}>
                <Plus className="h-4 w-4 mr-1" />Tambah Slot
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Jam Ke</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Ruang</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailRows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Belum ada slot</TableCell></TableRow>
              )}
              {detailRows.map(j => {
                const k = kelasList.find(x => x.id === j.kelas_id);
                return (
                  <TableRow key={j.id}>
                    <TableCell>{HARI_LABEL[j.hari]}</TableCell>
                    <TableCell>Jam ke-{j.jam_ke}</TableCell>
                    <TableCell>{k?.nama_kelas || "-"}</TableCell>
                    <TableCell className="font-medium">{j.mapel}</TableCell>
                    <TableCell>{j.ruang || "-"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {canEdit && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => setSlotDialog({ open: true, gtk: openPtk!, row: j })}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteSlot(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Slot form dialog */}
      <SlotFormDialog
        open={slotDialog.open}
        row={slotDialog.row}
        gtk={slotDialog.gtk}
        kelasList={kelasList}
        activeDays={activeDays}
        jamKeList={jamKeList}
        onClose={() => setSlotDialog({ open: false })}
        onSave={(r) => slotDialog.gtk && saveSlot(r, slotDialog.gtk)}
      />
    </>
  );
}

function SlotFormDialog({
  open, row, gtk, kelasList, activeDays, jamKeList, onClose, onSave,
}: {
  open: boolean; row?: Partial<Jadwal>; gtk?: Gtk;
  kelasList: Kelas[]; activeDays: number[]; jamKeList: number[];
  onClose: () => void; onSave: (r: Partial<Jadwal>) => void;
}) {
  const [form, setForm] = useState<Partial<Jadwal>>({});
  useEffect(() => { setForm(row || {}); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row?.id ? "Edit" : "Tambah"} Slot Jadwal — {gtk?.nama}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label>Mapel *</Label>
            <Input value={form.mapel || ""} onChange={e => setForm({ ...form, mapel: e.target.value })} placeholder={gtk?.mapel || "Nama mapel"} />
            {gtk?.mapel && <p className="text-xs text-muted-foreground">Mapel default guru: {gtk.mapel}</p>}
          </div>
          <div className="space-y-1">
            <Label>Kelas *</Label>
            <Select value={form.kelas_id || ""} onValueChange={(v) => setForm({ ...form, kelas_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                {kelasList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ruang</Label>
            <Input value={form.ruang || ""} onChange={e => setForm({ ...form, ruang: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Hari *</Label>
            <Select value={form.hari ? String(form.hari) : ""} onValueChange={(v) => setForm({ ...form, hari: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Pilih hari" /></SelectTrigger>
              <SelectContent>
                {activeDays.map(d => <SelectItem key={d} value={String(d)}>{HARI_LABEL[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Jam Ke *</Label>
            <Select value={form.jam_ke ? String(form.jam_ke) : ""} onValueChange={(v) => setForm({ ...form, jam_ke: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Pilih jam" /></SelectTrigger>
              <SelectContent>
                {jamKeList.map(jk => <SelectItem key={jk} value={String(jk)}>Jam ke-{jk}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Catatan</Label>
            <Textarea value={form.catatan || ""} onChange={e => setForm({ ...form, catatan: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => onSave(form)}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// TAB 3 — JADWAL PER KELAS (grid view + cetak)
// ===========================================================
function KelasTab({
  taId, semester, canEdit, activeModel, activeDays, jamList, gtkList, kelasList, jadwalList, reload,
}: {
  taId: string; semester: string; canEdit: boolean;
  activeModel: Model | null; activeDays: number[];
  jamList: Jam[]; gtkList: Gtk[]; kelasList: Kelas[]; jadwalList: Jadwal[];
  reload: () => void;
}) {
  const [kelasId, setKelasId] = useState<string>("");
  useEffect(() => { if (!kelasId && kelasList[0]) setKelasId(kelasList[0].id); }, [kelasList, kelasId]);

  const jamModel = useMemo(() => jamList.filter(j => activeModel && j.model_id === activeModel.id), [jamList, activeModel]);
  const jamKeList = useMemo(() => {
    const s = new Set<number>(); jamModel.forEach(j => s.add(j.jam_ke));
    return Array.from(s).sort((a, b) => a - b);
  }, [jamModel]);
  const jamByKe = useMemo(() => {
    const m = new Map<number, Jam>();
    jamModel.forEach(j => { if (!m.has(j.jam_ke)) m.set(j.jam_ke, j); });
    return m;
  }, [jamModel]);

  const cellMap = useMemo(() => {
    const m = new Map<string, Jadwal>();
    jadwalList.forEach(j => { if (j.kelas_id === kelasId) m.set(`${j.hari}-${j.jam_ke}`, j); });
    return m;
  }, [jadwalList, kelasId]);

  const kelas = kelasList.find(k => k.id === kelasId);

  async function deleteCell(id: string) {
    if (!confirm("Hapus jadwal pada slot ini?")) return;
    const res = await db.from("jadwal_pelajaran").delete().eq("id", id);
    if (res.error) { toast.error(res.error.message); return; }
    reload();
  }

  function handlePrint() { window.print(); }

  return (
    <>
      {!activeModel && (
        <Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Belum ada model aktif</AlertTitle></Alert>
      )}
      <Card className="no-print">
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label>Pilih Kelas</Label>
            <Select value={kelasId} onValueChange={setKelasId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                {kelasList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="ml-auto" onClick={handlePrint} disabled={!kelasId}>
            <Printer className="h-4 w-4 mr-1" />Cetak
          </Button>
        </CardContent>
      </Card>

      <div id="jadwal-print-area">
        <div className="hidden print:block mb-4">
          <PrintKopMadrasah judul={`Jadwal Pelajaran — ${kelas?.nama_kelas || ""}`} subjudul={`Semester ${semester.toUpperCase()}${activeModel ? ` — ${activeModel.nama}` : ""}`} />
          <h2 className="text-center font-bold text-lg mt-2">JADWAL PELAJARAN — {kelas?.nama_kelas || ""}</h2>
          <p className="text-center text-sm">Semester {semester.toUpperCase()}{activeModel ? ` — ${activeModel.nama}` : ""}</p>
        </div>

        <Card>
          <CardContent className="pt-6 overflow-auto">
            {jamKeList.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Belum ada jam pelajaran. Atur di tab Pengaturan Jadwal.</div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted">Jam</th>
                    <th className="border p-2 bg-muted">Waktu</th>
                    {activeDays.map(d => <th key={d} className="border p-2 bg-muted">{HARI_LABEL[d]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {jamKeList.map(jk => {
                    const j = jamByKe.get(jk);
                    return (
                      <tr key={jk}>
                        <td className="border p-2 text-center font-medium">{jk}</td>
                        <td className="border p-2 text-center text-xs">{j?.jam_mulai}–{j?.jam_selesai}</td>
                        {activeDays.map(d => {
                          const cell = cellMap.get(`${d}-${jk}`);
                          if (j?.is_istirahat) {
                            return <td key={d} className="border p-2 text-center bg-muted/50 text-xs italic">{j.label || "Istirahat"}</td>;
                          }
                          if (!cell) {
                            return <td key={d} className="border p-2 text-center text-muted-foreground text-xs">-</td>;
                          }
                          const guru = gtkList.find(g => g.id === cell.gtk_id);
                          return (
                            <td key={d} className="border p-2 align-top">
                              <div className="font-medium">{cell.mapel}</div>
                              <div className="text-xs text-muted-foreground">{guru?.nama || "-"}</div>
                              {cell.ruang && <div className="text-xs">R: {cell.ruang}</div>}
                              {canEdit && (
                                <Button size="icon" variant="ghost" className="h-6 w-6 no-print mt-1" onClick={() => deleteCell(cell.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #jadwal-print-area, #jadwal-print-area * { visibility: visible; }
          #jadwal-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ===========================================================
// TAB 4 — PREFERENSI GURU
// ===========================================================
function PreferensiTab({
  taId, semester, canEdit, gtkList, unavList, reload,
}: {
  taId: string; semester: string; canEdit: boolean;
  gtkList: Gtk[]; unavList: Unav[]; reload: () => void;
}) {
  const [form, setForm] = useState<Partial<Unav>>({});

  async function saveUnav() {
    if (!form.gtk_id || !form.hari) { toast.error("Pilih guru & hari"); return; }
    const res = await db.from("guru_unavailable").insert({
      ta_id: taId, semester,
      gtk_id: form.gtk_id, hari: form.hari,
      jam_ke: form.jam_ke || null,
      alasan: form.alasan || null,
    });
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Preferensi ditambahkan");
    setForm({});
    reload();
  }

  async function deleteUnav(id: string) {
    if (!confirm("Hapus preferensi?")) return;
    const res = await db.from("guru_unavailable").delete().eq("id", id);
    if (res.error) { toast.error(res.error.message); return; }
    reload();
  }

  return (
    <>
      {canEdit && (
        <Card>
          <CardHeader><CardTitle>Tambah Preferensi Guru Tidak Tersedia</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label>Guru</Label>
              <Select value={form.gtk_id || ""} onValueChange={(v) => setForm({ ...form, gtk_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                <SelectContent>
                  {gtkList.map(g => <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Hari</Label>
              <Select value={form.hari ? String(form.hari) : ""} onValueChange={(v) => setForm({ ...form, hari: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => <SelectItem key={d} value={String(d)}>{HARI_LABEL[d]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Jam ke (opsional)</Label>
              <Input type="number" min={1} value={form.jam_ke ?? ""} onChange={e => setForm({ ...form, jam_ke: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Alasan</Label>
              <Input value={form.alasan || ""} onChange={e => setForm({ ...form, alasan: e.target.value })} />
            </div>
            <Button onClick={saveUnav}>Tambah</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Daftar Preferensi</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>Hari</TableHead>
                <TableHead>Jam Ke</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unavList.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Belum ada preferensi</TableCell></TableRow>
              )}
              {unavList.map(u => {
                const g = gtkList.find(x => x.id === u.gtk_id);
                return (
                  <TableRow key={u.id}>
                    <TableCell>{g?.nama || "-"}</TableCell>
                    <TableCell>{HARI_LABEL[u.hari]}</TableCell>
                    <TableCell>{u.jam_ke ? `Jam ke-${u.jam_ke}` : "Sepanjang hari"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.alasan || "-"}</TableCell>
                    <TableCell className="text-right">
                      {canEdit && <Button size="icon" variant="ghost" onClick={() => deleteUnav(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
