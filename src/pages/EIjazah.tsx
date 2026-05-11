import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Save, Download, Upload, Settings as SettingsIcon, Printer, Loader2, FileText } from 'lucide-react';
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

interface Mapel { id: string; kode_mapel: string; nama_mapel: string; urutan: number; is_active: boolean; }
interface Siswa { id: string; nama: string; nis: string; nisn: string | null; kelas_id: string | null; }
interface Kelas { id: string; nama_kelas: string; tingkat: number; }
interface TA { id: string; nama_ta: string; is_active: boolean; }
interface Nilai { siswa_id: string; kode_mapel: string; nilai: number | null; }
interface Kelulusan { siswa_id: string; status: string; nomor_sk: string | null; tanggal_lulus: string | null; }

export default function EIjazah() {
  const qc = useQueryClient();
  const [taId, setTaId] = useState<string>('');
  const [kelasId, setKelasId] = useState<string>('all');
  const [editedNilai, setEditedNilai] = useState<Record<string, number | null>>({}); // key: siswaId|kode
  const [printSiswaId, setPrintSiswaId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: taList } = useQuery({
    queryKey: ['eijazah-ta'],
    queryFn: async () => {
      const { data } = await supabase.from('tahun_ajaran').select('id, nama_ta, is_active').order('nama_ta', { ascending: false });
      const list = (data || []) as TA[];
      if (!taId && list.length) {
        const active = list.find(t => t.is_active) || list[0];
        setTaId(active.id);
      }
      return list;
    },
  });

  const { data: kelasList } = useQuery({
    queryKey: ['eijazah-kelas'],
    queryFn: async () => {
      const { data } = await supabase.from('kelas').select('id, nama_kelas, tingkat').eq('tingkat', 9).order('nama_kelas');
      return (data || []) as Kelas[];
    },
  });

  const { data: mapelList = [] } = useQuery({
    queryKey: ['eijazah-mapel'],
    queryFn: async () => {
      const { data } = await supabase.from('ijazah_mapel_settings').select('*').eq('is_active', true).order('urutan');
      return (data || []) as Mapel[];
    },
  });

  const { data: siswaList = [] } = useQuery({
    queryKey: ['eijazah-siswa', taId, kelasId],
    enabled: !!taId,
    queryFn: async () => {
      let q = supabase.from('siswa').select('id, nama, nis, nisn, kelas_id')
        .eq('ta_id', taId)
        .in('kelas_id', (kelasList || []).map(k => k.id));
      if (kelasId !== 'all') q = q.eq('kelas_id', kelasId);
      const { data } = await q.order('nama');
      return (data || []) as Siswa[];
    },
  });

  const { data: nilaiData = [] } = useQuery({
    queryKey: ['eijazah-nilai', taId, siswaList.map(s => s.id).join(',')],
    enabled: !!taId && siswaList.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('ijazah_nilai').select('siswa_id, kode_mapel, nilai')
        .eq('ta_id', taId).in('siswa_id', siswaList.map(s => s.id));
      return (data || []) as Nilai[];
    },
  });

  const { data: kelulusanData = [] } = useQuery({
    queryKey: ['eijazah-kelulusan', taId, siswaList.map(s => s.id).join(',')],
    enabled: !!taId && siswaList.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('kelulusan').select('siswa_id, status, nomor_sk, tanggal_lulus')
        .eq('ta_id', taId).in('siswa_id', siswaList.map(s => s.id));
      return (data || []) as Kelulusan[];
    },
  });

  const nilaiMap = useMemo(() => {
    const m: Record<string, number | null> = {};
    nilaiData.forEach(n => { m[`${n.siswa_id}|${n.kode_mapel}`] = n.nilai; });
    return m;
  }, [nilaiData]);

  const kelulusanMap = useMemo(() => {
    const m: Record<string, Kelulusan> = {};
    kelulusanData.forEach(k => { m[k.siswa_id] = k; });
    return m;
  }, [kelulusanData]);

  const getNilai = (sid: string, kode: string) => {
    const k = `${sid}|${kode}`;
    if (k in editedNilai) return editedNilai[k];
    return nilaiMap[k] ?? null;
  };

  const setNilai = (sid: string, kode: string, val: string) => {
    const num = val === '' ? null : Number(val);
    setEditedNilai(prev => ({ ...prev, [`${sid}|${kode}`]: num }));
  };

  const handleSaveNilai = async () => {
    const rows = Object.entries(editedNilai).map(([k, nilai]) => {
      const [siswa_id, kode_mapel] = k.split('|');
      return { siswa_id, ta_id: taId, kode_mapel, nilai };
    });
    if (!rows.length) { toast.info('Tidak ada perubahan'); return; }
    const { error } = await supabase.from('ijazah_nilai').upsert(rows, { onConflict: 'siswa_id,ta_id,kode_mapel' });
    if (error) { toast.error('Gagal simpan: ' + error.message); return; }
    toast.success(`Tersimpan ${rows.length} nilai`);
    setEditedNilai({});
    qc.invalidateQueries({ queryKey: ['eijazah-nilai'] });
  };

  const handleSetStatus = async (siswa_id: string, status: 'lulus' | 'tidak_lulus' | 'pending') => {
    const existing = kelulusanMap[siswa_id];
    const payload: any = {
      siswa_id, ta_id: taId, status,
      tanggal_lulus: status === 'lulus' ? (existing?.tanggal_lulus || new Date().toISOString().slice(0, 10)) : null,
    };
    const { error } = await supabase.from('kelulusan').upsert(payload, { onConflict: 'siswa_id,ta_id' });
    if (error) { toast.error('Gagal: ' + error.message); return; }
    qc.invalidateQueries({ queryKey: ['eijazah-kelulusan'] });
  };

  const handleBulkLulus = async () => {
    if (!siswaList.length) return;
    if (!confirm(`Tandai ${siswaList.length} siswa sebagai LULUS?`)) return;
    const today = new Date().toISOString().slice(0, 10);
    const rows = siswaList.map(s => ({ siswa_id: s.id, ta_id: taId, status: 'lulus', tanggal_lulus: today }));
    const { error } = await supabase.from('kelulusan').upsert(rows, { onConflict: 'siswa_id,ta_id' });
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} siswa ditandai LULUS`);
    qc.invalidateQueries({ queryKey: ['eijazah-kelulusan'] });
  };

  // CSV export template (semua siswa di kelas)
  const downloadTemplate = () => {
    const headers = ['NISN', 'NIS', 'NAMA', ...mapelList.map(m => m.nama_mapel)];
    const rows = siswaList.map(s => [s.nisn || '', s.nis, s.nama, ...mapelList.map(m => {
      const n = nilaiMap[`${s.id}|${m.kode_mapel}`];
      return n != null ? String(n) : '';
    })]);
    const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const csv = '\uFEFFsep=,\n' + [headers, ...rows].map(r => r.map(c => esc(String(c))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `template-nilai-ijazah-${kelasId === 'all' ? 'semua-kelas-9' : kelasList?.find(k => k.id === kelasId)?.nama_kelas}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    const startIdx = lines[0].toLowerCase().startsWith('sep=') ? 1 : 0;
    const headers = lines[startIdx].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const nisnIdx = headers.findIndex(h => h.toUpperCase() === 'NISN');
    const nisIdx = headers.findIndex(h => h.toUpperCase() === 'NIS');
    if (nisnIdx < 0 && nisIdx < 0) { toast.error('Kolom NISN atau NIS wajib ada'); return; }

    const mapelByName: Record<string, string> = {};
    mapelList.forEach(m => { mapelByName[m.nama_mapel.toLowerCase()] = m.kode_mapel; });

    const rows: any[] = [];
    let skipped = 0;
    for (let i = startIdx + 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const nisnVal = nisnIdx >= 0 ? cols[nisnIdx] : '';
      const nisVal = nisIdx >= 0 ? cols[nisIdx] : '';
      const siswa = siswaList.find(s => (nisnVal && s.nisn === nisnVal) || (nisVal && s.nis === nisVal));
      if (!siswa) { skipped++; continue; }
      headers.forEach((h, idx) => {
        const kode = mapelByName[h.toLowerCase()];
        if (!kode) return;
        const v = cols[idx];
        if (v === '' || v == null) return;
        const num = Number(v);
        if (isNaN(num)) return;
        rows.push({ siswa_id: siswa.id, ta_id: taId, kode_mapel: kode, nilai: num });
      });
    }

    if (!rows.length) { toast.error('Tidak ada nilai yang dikenali'); return; }
    const { error } = await supabase.from('ijazah_nilai').upsert(rows, { onConflict: 'siswa_id,ta_id,kode_mapel' });
    if (error) { toast.error(error.message); return; }
    toast.success(`Import berhasil: ${rows.length} nilai${skipped ? `, ${skipped} baris siswa tidak ditemukan` : ''}`);
    qc.invalidateQueries({ queryKey: ['eijazah-nilai'] });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="E-Ijazah & Kelulusan" description="Kelola nilai akhir & status kelulusan siswa kelas 9" icon={<GraduationCap className="h-6 w-6" />} />

      <Card>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
          <div>
            <Label>Tahun Ajaran</Label>
            <Select value={taId} onValueChange={setTaId}>
              <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
              <SelectContent>
                {(taList || []).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nama_ta} {t.is_active && '(Aktif)'}</SelectItem>
                ))}
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

      <Tabs defaultValue="nilai">
        <TabsList>
          <TabsTrigger value="nilai">Nilai</TabsTrigger>
          <TabsTrigger value="kelulusan">Status Kelulusan</TabsTrigger>
          <TabsTrigger value="pengumuman">Pengumuman</TabsTrigger>
          <TabsTrigger value="mapel">Mata Pelajaran</TabsTrigger>
        </TabsList>

        {/* NILAI TAB */}
        <TabsContent value="nilai" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveNilai} disabled={!Object.keys(editedNilai).length}>
              <Save className="h-4 w-4 mr-2" />Simpan Perubahan ({Object.keys(editedNilai).length})
            </Button>
            <Button variant="outline" onClick={downloadTemplate}><Download className="h-4 w-4 mr-2" />Unduh Template (CSV)</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </div>

          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              {siswaList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada siswa. Pilih tahun ajaran & pastikan ada siswa kelas 9.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">No</TableHead>
                      <TableHead className="sticky left-10 bg-background min-w-[200px]">Nama / NISN</TableHead>
                      {mapelList.map(m => (
                        <TableHead key={m.kode_mapel} className="text-center min-w-[80px]" title={m.nama_mapel}>
                          {m.nama_mapel.length > 12 ? m.nama_mapel.substring(0, 10) + '…' : m.nama_mapel}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Rata²</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siswaList.map((s, i) => {
                      const nilais = mapelList.map(m => getNilai(s.id, m.kode_mapel)).filter(n => n != null) as number[];
                      const avg = nilais.length ? (nilais.reduce((a, b) => a + b, 0) / nilais.length).toFixed(1) : '-';
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{s.nama}</div>
                            <div className="text-xs text-muted-foreground">{s.nisn || s.nis}</div>
                          </TableCell>
                          {mapelList.map(m => (
                            <TableCell key={m.kode_mapel}>
                              <Input
                                type="number" min={0} max={100} step="0.01"
                                value={getNilai(s.id, m.kode_mapel) ?? ''}
                                onChange={(e) => setNilai(s.id, m.kode_mapel, e.target.value)}
                                className="h-8 w-16 text-center text-sm px-1"
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold">{avg}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KELULUSAN TAB */}
        <TabsContent value="kelulusan" className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={handleBulkLulus}>Tandai Semua LULUS</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
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
                    const k = kelulusanMap[s.id];
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* PENGUMUMAN TAB */}
        <TabsContent value="pengumuman">
          <PengumumanPanel taId={taId} />
        </TabsContent>

        {/* MAPEL TAB */}
        <TabsContent value="mapel">
          <MapelPanel mapelList={mapelList} onChanged={() => qc.invalidateQueries({ queryKey: ['eijazah-mapel'] })} />
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

// =============== Pengumuman Panel ===============
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
          <Switch
            checked={merged.is_published ?? false}
            onCheckedChange={(v) => setForm((f: any) => ({ ...f, is_published: v }))}
          />
        </div>
        <div>
          <Label>Tanggal & Jam Pengumuman Aktif</Label>
          <Input type="datetime-local"
            value={merged.published_at ? new Date(merged.published_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => setForm((f: any) => ({ ...f, published_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
          />
          <p className="text-xs text-muted-foreground mt-1">Sebelum waktu ini, halaman publik akan menampilkan "belum diumumkan".</p>
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

// =============== Mapel Panel ===============
function MapelPanel({ mapelList, onChanged }: { mapelList: Mapel[]; onChanged: () => void }) {
  const [newName, setNewName] = useState('');
  const [newKode, setNewKode] = useState('');

  const addMapel = async () => {
    if (!newName.trim() || !newKode.trim()) { toast.error('Nama & kode wajib'); return; }
    const { error } = await supabase.from('ijazah_mapel_settings').insert({
      nama_mapel: newName.trim(), kode_mapel: newKode.trim().toLowerCase(),
      urutan: (mapelList[mapelList.length - 1]?.urutan ?? 0) + 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Mapel ditambahkan');
    setNewName(''); setNewKode(''); onChanged();
  };

  const toggle = async (m: Mapel) => {
    await supabase.from('ijazah_mapel_settings').update({ is_active: !m.is_active }).eq('id', m.id);
    onChanged();
  };

  const remove = async (m: Mapel) => {
    if (!confirm(`Hapus mapel "${m.nama_mapel}"?`)) return;
    await supabase.from('ijazah_mapel_settings').delete().eq('id', m.id);
    onChanged();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Mata Pelajaran</CardTitle>
        <CardDescription>Mapel yang muncul di kolom nilai dan template impor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Nama Mapel (mis. Bahasa Sunda)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="Kode (mis. b_sunda)" value={newKode} onChange={(e) => setNewKode(e.target.value)} />
          <Button onClick={addMapel}>+ Tambah Mapel</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead>#</TableHead><TableHead>Nama</TableHead><TableHead>Kode</TableHead><TableHead>Aktif</TableHead><TableHead>Aksi</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {mapelList.map((m, i) => (
              <TableRow key={m.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{m.nama_mapel}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.kode_mapel}</TableCell>
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
