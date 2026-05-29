import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Save, Download, Upload, Calculator, Printer, FileText, GripVertical, ArrowUp, ArrowDown, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CetakSKLDialog } from '@/components/ijazah/CetakSKLDialog';
import {
  SEMESTER_LIST, type RaporRow, type UmRow,
  rataRapor, nilaiAkhir, exportPDUMExcel, exportRekapNilaiAkhir, parseNilaiExcel,
} from '@/lib/pdum-calc';

interface TA { id: string; nama_ta: string; is_active: boolean }
interface Kelas { id: string; nama_kelas: string; tingkat: number }
interface Siswa {
  id: string; nama: string; nis: string; nisn: string | null; kelas_id: string | null;
  jenis_kelamin: string | null; tempat_lahir: string | null; tanggal_lahir: string | null;
  nama_ayah_kandung: string | null; nama_ibu_kandung: string | null;
}
interface Mapel { id: string; kode_mapel: string; nama_mapel: string; kelompok: string; urutan: number; kkm: number | null; is_active: boolean }
interface Peserta { siswa_id: string; nomor_peserta: string | null; kelas_ujian: number | null; jurusan: string | null; no_absen: number | null; nama_ayah_override: string | null; nama_ibu_override: string | null }
interface Settings { id?: string; ta_id?: string; bobot_rapor: number; bobot_um: number; nsm: string | null; nomor_peserta_prefix: string | null }
interface Madrasah { nama_madrasah: string; provinsi: string | null; kabupaten_kota: string | null; nsm: string | null }

const DEFAULT_SETTINGS: Settings = { bobot_rapor: 60, bobot_um: 40, nsm: null, nomor_peserta_prefix: null };

export default function PDUMPage() {
  const qc = useQueryClient();
  const [taId, setTaId] = useState<string>('');
  const [kelasId, setKelasId] = useState<string>('all');
  const [activeSemester, setActiveSemester] = useState<string>('7g');
  const [editedRapor, setEditedRapor] = useState<Record<string, number | null>>({}); // key: siswa|kode|sem
  const [editedUm, setEditedUm] = useState<Record<string, number | null>>({}); // key: siswa|kode
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [ignoreEmptyMapel, setIgnoreEmptyMapel] = useState(true);
  const [formSettings, setFormSettings] = useState<Partial<Settings>>({});
  const [printSiswaId, setPrintSiswaId] = useState<string | null>(null);
  const fileRaporRef = useRef<HTMLInputElement>(null);
  const fileUmRef = useRef<HTMLInputElement>(null);

  // ============ Queries ============
  const { data: taList } = useQuery({
    queryKey: ['pdum-ta'],
    queryFn: async () => {
      const { data } = await supabase.from('tahun_ajaran').select('id, nama_ta, is_active').order('nama_ta', { ascending: false });
      const list = (data || []) as TA[];
      if (!taId && list.length) setTaId((list.find(t => t.is_active) || list[0]).id);
      return list;
    },
  });

  const { data: madrasah } = useQuery({
    queryKey: ['pdum-madrasah'],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('nama_madrasah, provinsi, kabupaten_kota, nsm').maybeSingle();
      return (data || { nama_madrasah: '', provinsi: '', kabupaten_kota: '', nsm: '' }) as Madrasah;
    },
  });

  const { data: kelasList } = useQuery({
    queryKey: ['pdum-kelas'],
    queryFn: async () => {
      const { data } = await supabase.from('kelas').select('id, nama_kelas, tingkat').eq('tingkat', 9).order('nama_kelas');
      return (data || []) as Kelas[];
    },
  });

  const { data: mapelList = [] } = useQuery({
    queryKey: ['pdum-mapel'],
    queryFn: async () => {
      const { data } = await supabase.from('pdum_mapel').select('*').eq('is_active', true).order('urutan');
      return (data || []) as Mapel[];
    },
  });

  const { data: siswaList = [] } = useQuery({
    queryKey: ['pdum-siswa', taId, kelasId, (kelasList || []).length],
    enabled: !!taId && (kelasList || []).length > 0,
    queryFn: async () => {
      const kelasIds = (kelasList || []).map(k => k.id);
      let q = supabase.from('siswa')
        .select('id, nama, nis, nisn, kelas_id, jenis_kelamin, tempat_lahir, tanggal_lahir, nama_ayah_kandung, nama_ibu_kandung')
        .eq('ta_id', taId).in('kelas_id', kelasIds);
      if (kelasId !== 'all') q = q.eq('kelas_id', kelasId);
      const { data } = await q;
      // Urutkan: berdasarkan nama_kelas dulu, lalu nama siswa dalam kelas
      const kelasOrder = new Map((kelasList || []).map((k, idx) => [k.id, { nama: k.nama_kelas || '', idx }]));
      const sorted = (data || []).slice().sort((a: any, b: any) => {
        const ka = kelasOrder.get(a.kelas_id);
        const kb = kelasOrder.get(b.kelas_id);
        const cmp = (ka?.nama || '').localeCompare(kb?.nama || '', 'id', { numeric: true });
        if (cmp !== 0) return cmp;
        return (a.nama || '').localeCompare(b.nama || '', 'id', { numeric: true });
      });
      return sorted as Siswa[];
    },
  });

  const siswaIds = siswaList.map(s => s.id);
  const idsKey = siswaIds.join(',');

  const { data: rapor = [] } = useQuery({
    queryKey: ['pdum-rapor', taId, idsKey, activeSemester],
    enabled: !!taId && siswaIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('pdum_nilai_rapor').select('siswa_id, kode_mapel, semester, nilai').eq('ta_id', taId).eq('semester', activeSemester).in('siswa_id', siswaIds);
      return (data || []) as RaporRow[];
    },
  });

  // Rapor SEMUA semester — dipakai untuk Nilai Akhir (samakan dengan SKL)
  const { data: raporAll = [] } = useQuery({
    queryKey: ['pdum-rapor-all', taId, idsKey],
    enabled: !!taId && siswaIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('pdum_nilai_rapor').select('siswa_id, kode_mapel, semester, nilai').eq('ta_id', taId).in('siswa_id', siswaIds).limit(100000);
      return (data || []) as RaporRow[];
    },
  });

  const { data: umRows = [] } = useQuery({
    queryKey: ['pdum-um', taId, idsKey],
    enabled: !!taId && siswaIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('pdum_nilai_um').select('siswa_id, kode_mapel, nilai').eq('ta_id', taId).in('siswa_id', siswaIds).limit(100000);
      return (data || []) as UmRow[];
    },
  });

  const { data: pesertaList = [] } = useQuery({
    queryKey: ['pdum-peserta', taId, idsKey],
    enabled: !!taId && siswaIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('pdum_peserta').select('*').eq('ta_id', taId).in('siswa_id', siswaIds);
      return (data || []) as Peserta[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['pdum-settings', taId],
    enabled: !!taId,
    queryFn: async () => {
      const { data } = await supabase.from('pdum_settings').select('*').eq('ta_id', taId).maybeSingle();
      return (data || null) as Settings | null;
    },
  });

  const { data: kelulusanData = [] } = useQuery({
    queryKey: ['pdum-kelulusan', taId, idsKey],
    enabled: !!taId && siswaIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('kelulusan').select('siswa_id, status, nomor_sk, tanggal_lulus').eq('ta_id', taId).in('siswa_id', siswaIds);
      return data || [];
    },
  });

  const pesertaMap = useMemo(() => Object.fromEntries(pesertaList.map(p => [p.siswa_id, p])), [pesertaList]);
  const raporMap = useMemo(() => {
    const m: Record<string, number | null> = {};
    rapor.forEach(r => { m[`${r.siswa_id}|${r.kode_mapel}|${r.semester}`] = r.nilai; });
    return m;
  }, [rapor]);
  const umMap = useMemo(() => {
    const m: Record<string, number | null> = {};
    umRows.forEach(r => { m[`${r.siswa_id}|${r.kode_mapel}`] = r.nilai; });
    return m;
  }, [umRows]);
  const kelulusanMap = useMemo(() => Object.fromEntries((kelulusanData as any[]).map(k => [k.siswa_id, k.status])), [kelulusanData]);
  const kelulusanFullMap = useMemo(() => Object.fromEntries((kelulusanData as any[]).map(k => [k.siswa_id, k])), [kelulusanData]);

  const cur: Settings = { ...DEFAULT_SETTINGS, ...(settings || {}), ...formSettings };

  // ============ Handlers ============
  const getRapor = (sid: string, kode: string, sem: string) => {
    const k = `${sid}|${kode}|${sem}`;
    if (k in editedRapor) return editedRapor[k];
    return raporMap[k] ?? null;
  };
  const setRapor = (sid: string, kode: string, sem: string, v: string) => {
    const num = v === '' ? null : Number(v);
    setEditedRapor(p => ({ ...p, [`${sid}|${kode}|${sem}`]: num }));
  };
  const getUm = (sid: string, kode: string) => {
    const k = `${sid}|${kode}`;
    if (k in editedUm) return editedUm[k];
    return umMap[k] ?? null;
  };
  const setUm = (sid: string, kode: string, v: string) => {
    const num = v === '' ? null : Number(v);
    setEditedUm(p => ({ ...p, [`${sid}|${kode}`]: num }));
  };

  const saveRapor = async () => {
    const rows = Object.entries(editedRapor).map(([k, nilai]) => {
      const [siswa_id, kode_mapel, semester] = k.split('|');
      return { siswa_id, ta_id: taId, kode_mapel, semester, nilai };
    });
    if (!rows.length) { toast.info('Tidak ada perubahan'); return; }
    const { error } = await supabase.from('pdum_nilai_rapor').upsert(rows, { onConflict: 'siswa_id,ta_id,kode_mapel,semester' });
    if (error) { toast.error(error.message); return; }
    toast.success(`Tersimpan ${rows.length} nilai rapor`);
    setEditedRapor({});
    qc.invalidateQueries({ queryKey: ['pdum-rapor'] });
    qc.invalidateQueries({ queryKey: ['pdum-rapor-all'] });
  };

  const saveUm = async () => {
    const rows = Object.entries(editedUm).map(([k, nilai]) => {
      const [siswa_id, kode_mapel] = k.split('|');
      return { siswa_id, ta_id: taId, kode_mapel, nilai };
    });
    if (!rows.length) { toast.info('Tidak ada perubahan'); return; }
    const { error } = await supabase.from('pdum_nilai_um').upsert(rows, { onConflict: 'siswa_id,ta_id,kode_mapel' });
    if (error) { toast.error(error.message); return; }
    toast.success(`Tersimpan ${rows.length} nilai UM`);
    setEditedUm({});
    qc.invalidateQueries({ queryKey: ['pdum-um'] });
  };

  const saveSettings = async () => {
    if (!taId) return;
    const payload = {
      ta_id: taId,
      bobot_rapor: Number(cur.bobot_rapor) || 60,
      bobot_um: Number(cur.bobot_um) || 40,
      nsm: cur.nsm || null,
      nomor_peserta_prefix: cur.nomor_peserta_prefix || null,
    };
    const { error } = await supabase.from('pdum_settings').upsert(payload, { onConflict: 'ta_id' });
    if (error) { toast.error(error.message); return; }
    toast.success('Pengaturan tersimpan');
    setFormSettings({});
    qc.invalidateQueries({ queryKey: ['pdum-settings'] });
  };

  // Generate Nomor Peserta otomatis untuk siswa yang belum
  const generateNomorPeserta = async () => {
    const prefix = cur.nomor_peserta_prefix || '';
    if (!prefix) { toast.error('Isi dulu prefix Nomor Peserta di tab Pengaturan'); return; }
    const existing = pesertaList.filter(p => p.nomor_peserta).map(p => p.nomor_peserta!);
    let maxSeq = 0;
    existing.forEach(n => {
      const m = n.match(/-(\d{4})$/);
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1]));
    });
    const rows = siswaList
      .filter(s => !pesertaMap[s.id]?.nomor_peserta)
      .map((s, i) => ({
        siswa_id: s.id, ta_id: taId,
        nomor_peserta: `${prefix}-${String(maxSeq + i + 1).padStart(4, '0')}`,
        kelas_ujian: pesertaMap[s.id]?.kelas_ujian ?? 1,
        jurusan: pesertaMap[s.id]?.jurusan ?? 'UMUM',
        no_absen: pesertaMap[s.id]?.no_absen ?? (i + 1),
      }));
    if (!rows.length) { toast.info('Semua siswa sudah punya Nomor Peserta'); return; }
    const { error } = await supabase.from('pdum_peserta').upsert(rows, { onConflict: 'siswa_id,ta_id' });
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} Nomor Peserta dibuat`);
    qc.invalidateQueries({ queryKey: ['pdum-peserta'] });
  };

  const updatePeserta = async (siswa_id: string, patch: Partial<Peserta>) => {
    const existing = pesertaMap[siswa_id];
    const payload = { siswa_id, ta_id: taId, ...existing, ...patch };
    delete (payload as any).id;
    const { error } = await supabase.from('pdum_peserta').upsert(payload, { onConflict: 'siswa_id,ta_id' });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['pdum-peserta'] });
  };

  const handleImportNilai = async (e: React.ChangeEvent<HTMLInputElement>, target: 'rapor' | 'um') => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { rows } = await parseNilaiExcel(file, mapelList);
      const insertRows: any[] = [];
      let matched = 0, skipped = 0;
      for (const r of rows) {
        const siswa = siswaList.find(s => (r.nisn && s.nisn === r.nisn) || (r.nis && s.nis === r.nis));
        if (!siswa) { skipped++; continue; }
        matched++;
        Object.entries(r.nilai).forEach(([kode_mapel, nilai]) => {
          if (target === 'rapor') insertRows.push({ siswa_id: siswa.id, ta_id: taId, kode_mapel, semester: activeSemester, nilai });
          else insertRows.push({ siswa_id: siswa.id, ta_id: taId, kode_mapel, nilai });
        });
      }
      if (!insertRows.length) { toast.error(`Tidak ada nilai dikenali. (${skipped} baris siswa tidak cocok)`); return; }
      const onConflict = target === 'rapor' ? 'siswa_id,ta_id,kode_mapel,semester' : 'siswa_id,ta_id,kode_mapel';
      const table = target === 'rapor' ? 'pdum_nilai_rapor' : 'pdum_nilai_um';
      const { error } = await supabase.from(table).upsert(insertRows, { onConflict });
      if (error) { toast.error(error.message); return; }
      toast.success(`Import OK: ${insertRows.length} nilai (${matched} siswa cocok${skipped ? `, ${skipped} dilewati` : ''})`);
      qc.invalidateQueries({ queryKey: [target === 'rapor' ? 'pdum-rapor' : 'pdum-um'] });
      if (target === 'rapor') qc.invalidateQueries({ queryKey: ['pdum-rapor-all'] });
    } catch (err: any) {
      toast.error('Gagal import: ' + (err.message || String(err)));
    } finally {
      if (target === 'rapor' && fileRaporRef.current) fileRaporRef.current.value = '';
      if (target === 'um' && fileUmRef.current) fileUmRef.current.value = '';
    }
  };

  const handleHapusNilai = async (target: 'rapor' | 'um') => {
    if (!taId) return;
    const sids = siswaList.map(s => s.id);
    if (!sids.length) { toast.error('Tidak ada siswa'); return; }
    const scope = kelasId === 'all' ? 'SEMUA KELAS' : (kelasList?.find(k => k.id === kelasId)?.nama_kelas || 'kelas ini');
    const label = target === 'rapor' ? `Nilai Rapor semester ${SEMESTER_LIST.find(s => s.kode === activeSemester)?.label}` : 'Nilai UM';
    if (!confirm(`HAPUS ${label} untuk ${scope} (${sids.length} siswa)?\n\nTindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const table = target === 'rapor' ? 'pdum_nilai_rapor' : 'pdum_nilai_um';
      let q: any = supabase.from(table).delete().eq('ta_id', taId).in('siswa_id', sids);
      if (target === 'rapor') q = q.eq('semester', activeSemester);
      const { error } = await q;
      if (error) { toast.error(error.message); return; }
      setEditedRapor({}); setEditedUm({});
      toast.success(`${label} dihapus untuk ${scope}`);
      qc.invalidateQueries({ queryKey: [target === 'rapor' ? 'pdum-rapor' : 'pdum-um'] });
      if (target === 'rapor') qc.invalidateQueries({ queryKey: ['pdum-rapor-all'] });
    } catch (err: any) {
      toast.error('Gagal hapus: ' + (err.message || String(err)));
    }
  };

  const downloadTemplate = (target: 'rapor' | 'um') => {
    const headers = ['NISN', 'NIS', 'NAMA', ...mapelList.map(m => m.nama_mapel)];
    const rows = siswaList.map(s => [s.nisn || '', s.nis, s.nama, ...mapelList.map(m => {
      if (target === 'rapor') return raporMap[`${s.id}|${m.kode_mapel}|${activeSemester}`] ?? '';
      return umMap[`${s.id}|${m.kode_mapel}`] ?? '';
    })]);
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Nilai');
      const suffix = target === 'rapor' ? `rapor-${activeSemester}` : 'um';
      XLSX.writeFile(wb, `template-pdum-${suffix}.xlsx`);
    });
  };

  const handleExportPDUM = () => {
    if (!siswaList.length) { toast.error('Belum ada siswa'); return; }
    exportPDUMExcel({
      nsm: cur.nsm || madrasah?.nsm || '',
      namaMadrasah: madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43',
      provinsi: madrasah?.provinsi || '',
      kabupaten: madrasah?.kabupaten_kota || '',
      siswaList, pesertaMap, mapelList, rapor: raporAll, um: umRows,
      bobotRapor: cur.bobot_rapor, bobotUm: cur.bobot_um,
    });
    toast.success('File Excel PDUM Kemenag dibuat');
  };

  const handleExportRekap = () => {
    if (!siswaList.length) { toast.error('Belum ada siswa'); return; }
    const kelasNama = kelasId === 'all' ? 'Semua Kelas 9' : kelasList?.find(k => k.id === kelasId)?.nama_kelas;
    exportRekapNilaiAkhir({
      namaMadrasah: madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43',
      siswaList: siswaList as any, mapelList, rapor: raporAll, um: umRows,
      bobotRapor: cur.bobot_rapor, bobotUm: cur.bobot_um, kelasNama,
    });
  };

  const handleRecalculate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['pdum-rapor'] }),
      qc.invalidateQueries({ queryKey: ['pdum-rapor-all'] }),
      qc.invalidateQueries({ queryKey: ['pdum-um'] }),
    ]);
    setEditedRapor({});
    setEditedUm({});
    toast.success('Nilai Akhir dihitung ulang dari data terbaru');
  };

  const handleBulkLulus = async () => {
    if (!siswaList.length) return;
    if (!confirm(`Tandai ${siswaList.length} siswa sebagai LULUS?`)) return;
    const today = new Date().toISOString().slice(0, 10);
    const rows = siswaList.map(s => ({ siswa_id: s.id, ta_id: taId, status: 'lulus', tanggal_lulus: today }));
    const { error } = await supabase.from('kelulusan').upsert(rows, { onConflict: 'siswa_id,ta_id' });
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} siswa ditandai LULUS`);
    qc.invalidateQueries({ queryKey: ['pdum-kelulusan'] });
  };

  const handleSetStatus = async (siswa_id: string, status: 'lulus' | 'tidak_lulus' | 'pending') => {
    const existing = kelulusanFullMap[siswa_id];
    const payload: any = {
      siswa_id, ta_id: taId, status,
      tanggal_lulus: status === 'lulus' ? (existing?.tanggal_lulus || new Date().toISOString().slice(0, 10)) : null,
    };
    const { error } = await supabase.from('kelulusan').upsert(payload, { onConflict: 'siswa_id,ta_id' });
    if (error) { toast.error('Gagal: ' + error.message); return; }
    qc.invalidateQueries({ queryKey: ['pdum-kelulusan'] });
  };

  // ============ Render ============
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nilai Ijazah & Kelulusan (PDUM)"
        description="Olah nilai rapor 5 sem + UM → Nilai Akhir Ijazah, cetak SKL & atur pengumuman kelulusan"
        icon={<FileSpreadsheet className="h-6 w-6" />}
      />

      <Card>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
          <div>
            <Label>Tahun Ajaran</Label>
            <Select value={taId} onValueChange={setTaId}>
              <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
              <SelectContent>
                {(taList || []).map(t => <SelectItem key={t.id} value={t.id}>{t.nama_ta} {t.is_active && '(Aktif)'}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kelas (Tingkat 9)</Label>
            <Select value={kelasId} onValueChange={setKelasId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas 9</SelectItem>
                {(kelasList || []).map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="peserta">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="peserta">Peserta UM</TabsTrigger>
          <TabsTrigger value="rapor">Nilai Rapor</TabsTrigger>
          <TabsTrigger value="um">Nilai UM</TabsTrigger>
          <TabsTrigger value="akhir">Nilai Akhir</TabsTrigger>
          <TabsTrigger value="kelulusan">Kelulusan & SKL</TabsTrigger>
          <TabsTrigger value="pengumuman">Pengumuman</TabsTrigger>
          <TabsTrigger value="mapel">Mata Pelajaran</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        {/* ===== PESERTA ===== */}
        <TabsContent value="peserta" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={generateNomorPeserta}><Calculator className="h-4 w-4 mr-2" />Generate Nomor Peserta Otomatis</Button>
            <Button variant="outline" onClick={handleExportPDUM}><Download className="h-4 w-4 mr-2" />Export Excel PDUM Kemenag</Button>
          </div>
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              {siswaList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada siswa kelas 9 di TA ini.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead className="min-w-[180px]">Nama / NISN</TableHead>
                      <TableHead>Nomor Peserta</TableHead>
                      <TableHead className="w-20">Kelas Uji</TableHead>
                      <TableHead className="w-24">Jurusan</TableHead>
                      <TableHead className="w-20">No Absen</TableHead>
                      <TableHead className="min-w-[160px]">Nama Ayah (override)</TableHead>
                      <TableHead className="min-w-[160px]">Nama Ibu (override)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siswaList.map((s, i) => {
                      const p = pesertaMap[s.id] || {} as Peserta;
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{s.nama}</div>
                            <div className="text-xs text-muted-foreground">{s.nisn || s.nis}</div>
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-sm" defaultValue={p.nomor_peserta || ''}
                              onBlur={(e) => e.target.value !== (p.nomor_peserta || '') && updatePeserta(s.id, { nomor_peserta: e.target.value || null })} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="h-8 text-sm w-16" defaultValue={p.kelas_ujian ?? 1}
                              onBlur={(e) => updatePeserta(s.id, { kelas_ujian: Number(e.target.value) || 1 })} />
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-sm w-24" defaultValue={p.jurusan || 'UMUM'}
                              onBlur={(e) => updatePeserta(s.id, { jurusan: e.target.value || 'UMUM' })} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="h-8 text-sm w-16" defaultValue={p.no_absen ?? 0}
                              onBlur={(e) => updatePeserta(s.id, { no_absen: Number(e.target.value) || 0 })} />
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-sm" placeholder={s.nama_ayah_kandung || '-'} defaultValue={p.nama_ayah_override || ''}
                              onBlur={(e) => updatePeserta(s.id, { nama_ayah_override: e.target.value || null })} />
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-sm" placeholder={s.nama_ibu_kandung || '-'} defaultValue={p.nama_ibu_override || ''}
                              onBlur={(e) => updatePeserta(s.id, { nama_ibu_override: e.target.value || null })} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RAPOR ===== */}
        <TabsContent value="rapor" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Semester:</Label>
              <Select value={activeSemester} onValueChange={setActiveSemester}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEMESTER_LIST.map(s => <SelectItem key={s.kode} value={s.kode}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveRapor} disabled={!Object.keys(editedRapor).length}>
              <Save className="h-4 w-4 mr-2" />Simpan ({Object.keys(editedRapor).length})
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate('rapor')}><Download className="h-4 w-4 mr-2" />Template</Button>
            <Button variant="outline" onClick={() => fileRaporRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Import Excel</Button>
            <Button variant="destructive" onClick={() => handleHapusNilai('rapor')}><Trash2 className="h-4 w-4 mr-2" />Hapus Nilai Semester Ini</Button>
            <input ref={fileRaporRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleImportNilai(e, 'rapor')} className="hidden" />
          </div>
          <NilaiTable
            siswaList={siswaList} mapelList={mapelList}
            getValue={(sid, kode) => getRapor(sid, kode, activeSemester)}
            setValue={(sid, kode, v) => setRapor(sid, kode, activeSemester, v)}
          />
        </TabsContent>

        {/* ===== UM ===== */}
        <TabsContent value="um" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveUm} disabled={!Object.keys(editedUm).length}>
              <Save className="h-4 w-4 mr-2" />Simpan ({Object.keys(editedUm).length})
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate('um')}><Download className="h-4 w-4 mr-2" />Template</Button>
            <Button variant="outline" onClick={() => fileUmRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Import Excel</Button>
            <Button variant="destructive" onClick={() => handleHapusNilai('um')}><Trash2 className="h-4 w-4 mr-2" />Hapus Nilai UM</Button>
            <input ref={fileUmRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleImportNilai(e, 'um')} className="hidden" />
          </div>
          <NilaiTable
            siswaList={siswaList} mapelList={mapelList}
            getValue={(sid, kode) => getUm(sid, kode)}
            setValue={(sid, kode, v) => setUm(sid, kode, v)}
          />
        </TabsContent>

        {/* ===== NILAI AKHIR ===== */}
        <TabsContent value="akhir" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">Rumus: ({cur.bobot_rapor}% × rata 5 sem) + ({cur.bobot_um}% × UM)</Badge>
            <Button variant="outline" onClick={handleRecalculate}><RefreshCw className="h-4 w-4 mr-2" />Hitung Ulang Nilai</Button>
            <Button variant="outline" onClick={handleExportRekap}><Download className="h-4 w-4 mr-2" />Export Rekap NA</Button>
            <Button variant="outline" onClick={handleExportPDUM}><FileSpreadsheet className="h-4 w-4 mr-2" />Export PDUM Kemenag</Button>
            <Button onClick={handleBulkLulus}>Tandai Semua LULUS</Button>
          </div>
          {(() => {
            const semKodes = SEMESTER_LIST.map(s => s.kode);
            let incomplete = 0;
            siswaList.forEach(s => {
              for (const m of mapelList) {
                const missingSem = semKodes.some(sk => {
                  const v = raporAll.find(r => r.siswa_id === s.id && r.kode_mapel === m.kode_mapel && r.semester === sk)?.nilai;
                  return v == null;
                });
                const umMissing = (umMap[`${s.id}|${m.kode_mapel}`] ?? null) == null;
                if (missingSem || umMissing) { incomplete++; break; }
              }
            });
            if (incomplete === 0 || siswaList.length === 0) return null;
            return (
              <div className="flex items-start gap-2 p-3 rounded-md border border-amber-500/40 bg-amber-500/10 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <b>{incomplete}</b> dari <b>{siswaList.length}</b> siswa belum lengkap (ada semester rapor atau nilai UM yang kosong). NA hanya muncul jika semua 5 semester + UM terisi. Hover baris untuk detail.
                </div>
              </div>
            );
          })()}
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              {siswaList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada siswa.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead className="min-w-[180px]">Nama / NISN</TableHead>
                      {mapelList.map(m => (
                        <TableHead key={m.kode_mapel} className="text-center min-w-[80px]" title={m.nama_mapel}>
                          {m.nama_mapel.length > 12 ? m.nama_mapel.substring(0, 10) + '…' : m.nama_mapel}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Rata NA</TableHead>
                      <TableHead className="text-center">Kelengkapan</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siswaList.map((s, i) => {
                      const naList: number[] = [];
                      const semKodes = SEMESTER_LIST.map(sm => sm.kode);
                      const missingSemSet = new Set<string>();
                      const missingUmSet = new Set<string>();
                      mapelList.forEach(m => {
                        semKodes.forEach(sk => {
                          const v = raporAll.find(r => r.siswa_id === s.id && r.kode_mapel === m.kode_mapel && r.semester === sk)?.nilai;
                          if (v == null) missingSemSet.add(`${m.nama_mapel} (${SEMESTER_LIST.find(x => x.kode === sk)?.label})`);
                        });
                        if ((umMap[`${s.id}|${m.kode_mapel}`] ?? null) == null) missingUmSet.add(m.nama_mapel);
                      });
                      const missingTotal = missingSemSet.size + missingUmSet.size;
                      const tooltip = missingTotal === 0 ? 'Lengkap' :
                        [
                          missingSemSet.size ? `Rapor kosong:\n- ${Array.from(missingSemSet).join('\n- ')}` : '',
                          missingUmSet.size ? `UM kosong:\n- ${Array.from(missingUmSet).join('\n- ')}` : '',
                        ].filter(Boolean).join('\n\n');
                      return (
                        <TableRow key={s.id} className={missingTotal > 0 ? 'bg-amber-500/5' : ''}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm flex items-center gap-1">
                              {missingTotal > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                              {s.nama}
                            </div>
                            <div className="text-xs text-muted-foreground">{s.nisn || s.nis}</div>
                          </TableCell>
                          {mapelList.map(m => {
                            const rata = rataRapor(raporAll, s.id, m.kode_mapel);
                            const umVal = umMap[`${s.id}|${m.kode_mapel}`] ?? null;
                            const na = nilaiAkhir(rata, umVal, cur.bobot_rapor, cur.bobot_um);
                            if (na != null) naList.push(na);
                            const cellMissing = rata == null || umVal == null;
                            const cellTitle = cellMissing
                              ? `${m.nama_mapel}: ${rata == null ? 'rapor belum lengkap' : 'OK'}${umVal == null ? ', UM kosong' : ''}`
                              : `${m.nama_mapel}: rata ${rata?.toFixed(2)} | UM ${umVal}`;
                            return (
                              <TableCell key={m.kode_mapel} className={`text-center text-sm ${cellMissing ? 'text-amber-700' : ''}`} title={cellTitle}>
                                {na != null ? na.toFixed(2) : '—'}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-semibold">
                            {naList.length ? (naList.reduce((a, b) => a + b, 0) / naList.length).toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-center" title={tooltip}>
                            {missingTotal === 0 ? (
                              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">Lengkap</Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500 text-amber-700">
                                {missingSemSet.size > 0 && `${missingSemSet.size} rapor`}
                                {missingSemSet.size > 0 && missingUmSet.size > 0 && ' · '}
                                {missingUmSet.size > 0 && `${missingUmSet.size} UM`}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={kelulusanMap[s.id] === 'lulus' ? 'default' : kelulusanMap[s.id] === 'tidak_lulus' ? 'destructive' : 'secondary'}>
                              {kelulusanMap[s.id] === 'lulus' ? 'LULUS' : kelulusanMap[s.id] === 'tidak_lulus' ? 'TIDAK' : 'BELUM'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SETTINGS ===== */}
        {/* ===== KELULUSAN & SKL ===== */}
        <TabsContent value="kelulusan" className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={handleBulkLulus}>Tandai Semua LULUS</Button>
          </div>
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              {siswaList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada siswa.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siswaList.map((s, i) => {
                      const k = kelulusanFullMap[s.id];
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{s.nama}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.nisn || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={k?.status === 'lulus' ? 'default' : k?.status === 'tidak_lulus' ? 'destructive' : 'secondary'}>
                              {k?.status === 'lulus' ? 'LULUS' : k?.status === 'tidak_lulus' ? 'TIDAK LULUS' : 'BELUM'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant={k?.status === 'lulus' ? 'default' : 'outline'} onClick={() => handleSetStatus(s.id, 'lulus')}>Lulus</Button>
                              <Button size="sm" variant={k?.status === 'tidak_lulus' ? 'destructive' : 'outline'} onClick={() => handleSetStatus(s.id, 'tidak_lulus')}>Tidak</Button>
                              <Button size="sm" variant="outline" onClick={() => setPrintSiswaId(s.id)} title="Cetak SKL"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PENGUMUMAN ===== */}
        <TabsContent value="pengumuman">
          <PengumumanPanel taId={taId} />
        </TabsContent>

        {/* ===== MAPEL ===== */}
        <TabsContent value="mapel">
          <MapelPanel mapelList={mapelList} onChanged={() => qc.invalidateQueries({ queryKey: ['pdum-mapel'] })} />
        </TabsContent>

        {/* ===== SETTINGS ===== */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan PDUM</CardTitle>
              <CardDescription>Bobot perhitungan & data madrasah untuk export Kemenag.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Bobot Rapor (%)</Label>
                  <Input type="number" min={0} max={100} value={cur.bobot_rapor}
                    onChange={(e) => setFormSettings(p => ({ ...p, bobot_rapor: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Bobot UM (%)</Label>
                  <Input type="number" min={0} max={100} value={cur.bobot_um}
                    onChange={(e) => setFormSettings(p => ({ ...p, bobot_um: Number(e.target.value) }))} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Rumus: NA = (rata-rata 5 sem × bobot rapor + UM × bobot UM) / (bobot rapor + bobot UM). Default 60/40.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>NSM (override)</Label>
                  <Input value={cur.nsm || ''} placeholder={madrasah?.nsm || '-'}
                    onChange={(e) => setFormSettings(p => ({ ...p, nsm: e.target.value || null }))} />
                  <p className="text-xs text-muted-foreground mt-1">Kosongkan untuk pakai NSM dari Pengaturan Madrasah.</p>
                </div>
                <div>
                  <Label>Prefix Nomor Peserta</Label>
                  <Input value={cur.nomor_peserta_prefix || ''} placeholder="26-09-02-2-0180"
                    onChange={(e) => setFormSettings(p => ({ ...p, nomor_peserta_prefix: e.target.value || null }))} />
                  <p className="text-xs text-muted-foreground mt-1">Akan ditambah -0001, -0002, dst saat generate.</p>
                </div>
              </div>
              <Button onClick={saveSettings}><Save className="h-4 w-4 mr-2" />Simpan Pengaturan</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {printSiswaId && (
        <CetakSKLDialog
          open={!!printSiswaId}
          onOpenChange={(o) => !o && setPrintSiswaId(null)}
          siswaId={printSiswaId}
          taId={taId}
        />
      )}
    </div>
  );
}

// ============ Pengumuman Panel ============
function PengumumanPanel({ taId }: { taId: string }) {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['kelulusan-settings', taId],
    enabled: !!taId,
    queryFn: async () => {
      const { data } = await supabase.from('kelulusan_settings').select('*').eq('ta_id', taId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  const merged = { ...(settings || {}), ...form };

  const save = async () => {
    const payload = {
      ta_id: taId,
      is_published: merged.is_published ?? false,
      published_at: merged.published_at || null,
      judul_pengumuman: merged.judul_pengumuman || 'Pengumuman Kelulusan',
      pesan_ucapan: merged.pesan_ucapan || '',
      nomor_sk_format: merged.nomor_sk_format || 'SK-LULUS/MTs43/{tahun}',
    };
    const { error } = await supabase.from('kelulusan_settings').upsert(payload, { onConflict: 'ta_id' });
    if (error) { toast.error(error.message); return; }
    toast.success('Pengaturan tersimpan');
    setForm({});
    qc.invalidateQueries({ queryKey: ['kelulusan-settings'] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Pengumuman Publik</CardTitle>
        <CardDescription>Atur kapan halaman publik <code>/kelulusan</code> menampilkan hasil.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label className="text-base">Buka Pengumuman</Label>
            <p className="text-xs text-muted-foreground">Saat aktif, siswa bisa cek status di halaman publik.</p>
          </div>
          <Switch checked={merged.is_published ?? false}
            onCheckedChange={(v) => setForm((f: any) => ({ ...f, is_published: v }))} />
        </div>
        <div>
          <Label>Tanggal & Jam Pengumuman Aktif</Label>
          <Input type="datetime-local"
            value={merged.published_at ? (() => { const d = new Date(merged.published_at); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; })() : ''}
            onChange={(e) => setForm((f: any) => ({ ...f, published_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
          <p className="text-xs text-muted-foreground mt-1">Sebelum waktu ini, halaman publik menampilkan "belum diumumkan".</p>
        </div>
        <div>
          <Label>Judul Pengumuman</Label>
          <Input value={merged.judul_pengumuman || ''} onChange={(e) => setForm((f: any) => ({ ...f, judul_pengumuman: e.target.value }))} />
        </div>
        <div>
          <Label>Pesan Ucapan untuk yang LULUS</Label>
          <Textarea rows={3} value={merged.pesan_ucapan || ''} onChange={(e) => setForm((f: any) => ({ ...f, pesan_ucapan: e.target.value }))} />
        </div>
        <div>
          <Label>Format Nomor SK Kelulusan</Label>
          <Input value={merged.nomor_sk_format || ''} onChange={(e) => setForm((f: any) => ({ ...f, nomor_sk_format: e.target.value }))} placeholder="SK-LULUS/MTs43/{tahun}" />
        </div>
        <div className="flex gap-2">
          <Button onClick={save}><Save className="h-4 w-4 mr-2" />Simpan</Button>
          <Button variant="outline" asChild>
            <a href="/kelulusan" target="_blank" rel="noopener"><FileText className="h-4 w-4 mr-2" />Buka Halaman Publik</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Mapel Panel ============
function MapelPanel({ mapelList: _mapelList, onChanged }: { mapelList: Mapel[]; onChanged: () => void }) {
  const [newName, setNewName] = useState('');
  const [newKode, setNewKode] = useState('');
  const [newKelompok, setNewKelompok] = useState('A');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const { data: allMapel = [], refetch } = useQuery({
    queryKey: ['pdum-mapel-all'],
    queryFn: async () => {
      const { data } = await supabase.from('pdum_mapel').select('*').order('urutan');
      return (data || []) as Mapel[];
    },
  });

  const refresh = () => { refetch(); onChanged(); };

  const addMapel = async () => {
    if (!newName.trim() || !newKode.trim()) { toast.error('Nama & kode wajib'); return; }
    const { error } = await supabase.from('pdum_mapel').insert({
      nama_mapel: newName.trim(), kode_mapel: newKode.trim().toLowerCase(),
      kelompok: newKelompok,
      urutan: (allMapel[allMapel.length - 1]?.urutan ?? 0) + 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Mapel ditambahkan');
    setNewName(''); setNewKode(''); refresh();
  };

  const toggle = async (m: Mapel) => {
    await supabase.from('pdum_mapel').update({ is_active: !m.is_active }).eq('id', m.id);
    refresh();
  };

  const remove = async (m: Mapel) => {
    if (!confirm(`Hapus mapel "${m.nama_mapel}"?`)) return;
    await supabase.from('pdum_mapel').delete().eq('id', m.id);
    refresh();
  };

  const persistOrder = async (ordered: Mapel[]) => {
    const results = await Promise.all(
      ordered.map((m, idx) => supabase.from('pdum_mapel').update({ urutan: idx + 1 }).eq('id', m.id))
    );
    const err = results.find(r => r.error);
    if (err?.error) { toast.error(err.error.message); return; }
    refresh();
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    const idx = allMapel.findIndex(m => m.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= allMapel.length) return;
    const next = [...allMapel];
    [next[idx], next[target]] = [next[target], next[idx]];
    persistOrder(next);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const from = allMapel.findIndex(m => m.id === dragId);
    const to = allMapel.findIndex(m => m.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...allMapel];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null); setOverId(null);
    persistOrder(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Mata Pelajaran PDUM/Ijazah</CardTitle>
        <CardDescription>Drag baris (ikon ⋮⋮) atau gunakan tombol panah untuk mengatur urutan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="Nama Mapel" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="Kode (mis. b_sunda)" value={newKode} onChange={(e) => setNewKode(e.target.value)} />
          <Select value={newKelompok} onValueChange={setNewKelompok}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Kelompok A (Umum/Agama)</SelectItem>
              <SelectItem value="B">Kelompok B</SelectItem>
              <SelectItem value="mulok">Muatan Lokal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addMapel}>+ Tambah Mapel</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Kelompok</TableHead>
              <TableHead>Urutkan</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMapel.map((m, i) => (
              <TableRow
                key={m.id}
                draggable
                onDragStart={() => setDragId(m.id)}
                onDragOver={(e) => { e.preventDefault(); setOverId(m.id); }}
                onDragLeave={() => setOverId(prev => prev === m.id ? null : prev)}
                onDrop={(e) => { e.preventDefault(); handleDrop(m.id); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={`${dragId === m.id ? 'opacity-50' : ''} ${overId === m.id && dragId !== m.id ? 'bg-accent/40' : ''} cursor-move`}
              >
                <TableCell className="text-muted-foreground"><GripVertical className="h-4 w-4" /></TableCell>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{m.nama_mapel}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.kode_mapel}</TableCell>
                <TableCell className="text-xs">
                  <Select
                    value={['A','B','mulok'].includes(m.kelompok) ? m.kelompok : (m.kelompok === 'muatan_lokal' ? 'mulok' : 'A')}
                    onValueChange={async (v) => {
                      await supabase.from('pdum_mapel').update({ kelompok: v }).eq('id', m.id);
                      refresh();
                    }}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Kelompok A</SelectItem>
                      <SelectItem value="B">Kelompok B</SelectItem>
                      <SelectItem value="mulok">Muatan Lokal</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => moveItem(m.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === allMapel.length - 1} onClick={() => moveItem(m.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
                <TableCell><Switch checked={m.is_active} onCheckedChange={() => toggle(m)} /></TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => remove(m)}>Hapus</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============ Reusable Nilai Table ============
function NilaiTable({ siswaList, mapelList, getValue, setValue }: {
  siswaList: Siswa[]; mapelList: Mapel[];
  getValue: (sid: string, kode: string) => number | null;
  setValue: (sid: string, kode: string, v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6 overflow-x-auto">
        {siswaList.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada siswa.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead className="min-w-[180px]">Nama / NISN</TableHead>
                {mapelList.map(m => (
                  <TableHead key={m.kode_mapel} className="text-center min-w-[80px]" title={m.nama_mapel}>
                    {m.nama_mapel.length > 12 ? m.nama_mapel.substring(0, 10) + '…' : m.nama_mapel}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {siswaList.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{s.nama}</div>
                    <div className="text-xs text-muted-foreground">{s.nisn || s.nis}</div>
                  </TableCell>
                  {mapelList.map(m => (
                    <TableCell key={m.kode_mapel}>
                      <Input type="number" min={0} max={100} step="0.01"
                        value={getValue(s.id, m.kode_mapel) ?? ''}
                        onChange={(e) => setValue(s.id, m.kode_mapel, e.target.value)}
                        className="h-8 w-16 text-center text-sm px-1" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
