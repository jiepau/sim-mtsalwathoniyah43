import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, Sparkles, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmisGtkRow {
  nama: string;
  nuptk: string;
  nip: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string | null;
  jenis_kelamin: string;
  jabatan: string;
  status_kepegawaian: string;
  sertifikasi: boolean;
  nomor_sertifikasi: string;
  pendidikan: string;
  lulusan: string;
  mapel: string;
  no_hp: string;
  email: string;
  alamat: string;
  status_aktif: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const cleanText = (v: any): string => {
  if (v === null || v === undefined) return '';
  return String(v).replace(/^['"]+/, '').trim();
};

const parseTanggal = (v: any): string | null => {
  if (!v) return null;
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = cleanText(v);
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return null;
};

const normalizeJK = (v: string): string => {
  const s = cleanText(v).toLowerCase();
  if (s.startsWith('l') || s.startsWith('m')) return 'Laki-laki';
  if (s.startsWith('p') || s.startsWith('f')) return 'Perempuan';
  return '';
};

const normalizeHp = (v: any): string => {
  let s = cleanText(v).replace(/[^\d+]/g, '');
  if (!s || s === '0') return '';
  return s;
};

// Normalisasi status kepegawaian dari berbagai variasi EMIS
const normalizeStatusKepegawaian = (v: string): string => {
  const s = cleanText(v).toLowerCase();
  if (!s) return '';
  if (s.includes('pns')) return 'PNS';
  if (s.includes('pppk') || s.includes('p3k')) return 'PPPK';
  if (s.includes('gty') || s.includes('tetap yayasan')) return 'GTY';
  if (s.includes('gtt') || s.includes('tidak tetap')) return 'GTT';
  if (s.includes('honor')) return 'Honorer';
  return cleanText(v);
};

const normalizeSertifikasi = (v: any): { sertifikasi: boolean; nomor: string } => {
  const s = cleanText(v).toLowerCase();
  if (!s || s === '-' || s === '0' || s === 'tidak' || s === 'belum') {
    return { sertifikasi: false, nomor: '' };
  }
  if (s === 'ya' || s === 'sudah' || s === 'sertifikasi' || s === 'bersertifikat') {
    return { sertifikasi: true, nomor: '' };
  }
  // Jika ada angka/nomor sertifikat, anggap sertifikasi=true
  if (/\d{4,}/.test(s)) {
    return { sertifikasi: true, nomor: cleanText(v) };
  }
  return { sertifikasi: false, nomor: '' };
};

const findHeaderRow = (rows: any[][]): number => {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i] || [];
    const joined = row.map(c => String(c || '').toLowerCase()).join('|');
    // GTK EMIS biasanya punya kolom NUPTK + Nama
    if ((joined.includes('nuptk') || joined.includes('peg')) && joined.includes('nama')) return i;
    if (joined.includes('nama') && (joined.includes('jabatan') || joined.includes('kepegawaian'))) return i;
  }
  return 0;
};

const colIndex = (headers: string[], ...keywords: string[]): number => {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase();
    if (keywords.every(k => h.includes(k))) return i;
  }
  return -1;
};

export function EmisImportWizardGtk({ open, onOpenChange, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<EmisGtkRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importMode, setImportMode] = useState<'upsert' | 'insert_only' | 'update_only'>('upsert');
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; failed: number; errors: string[] } | null>(null);

  const stats = useMemo(() => {
    const pns = rows.filter(r => r.status_kepegawaian === 'PNS' || r.status_kepegawaian === 'PPPK').length;
    const honor = rows.filter(r => r.status_kepegawaian === 'Honorer' || r.status_kepegawaian === 'GTT' || r.status_kepegawaian === 'GTY').length;
    const sertifikasi = rows.filter(r => r.sertifikasi).length;
    return { pns, honor, sertifikasi };
  }, [rows]);

  const reset = () => {
    setStep(1);
    setFile(null);
    setRows([]);
    setParseError(null);
    setResult(null);
    setProgress(0);
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onOpenChange(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParseError(null);
    setParsing(true);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const arr: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
      if (!arr.length) throw new Error('File kosong');

      const headerIdx = findHeaderRow(arr);
      const headers = (arr[headerIdx] || []).map((h: any) => String(h || ''));

      const idx = {
        nama: colIndex(headers, 'nama'),
        nuptk: colIndex(headers, 'nuptk'),
        peg: colIndex(headers, 'peg'),
        nip: colIndex(headers, 'nip'),
        nik: colIndex(headers, 'nik'),
        tempat: colIndex(headers, 'tempat', 'lahir'),
        tanggal: colIndex(headers, 'tanggal', 'lahir'),
        jk: colIndex(headers, 'kelamin'),
        jabatan: colIndex(headers, 'jabatan'),
        kepeg: colIndex(headers, 'kepegawaian'),
        sert: colIndex(headers, 'sertifikasi'),
        sertNo: colIndex(headers, 'nomor', 'sertifikasi'),
        pend: colIndex(headers, 'pendidikan'),
        lulusan: colIndex(headers, 'lulusan'),
        mapel: colIndex(headers, 'mapel'),
        hp: colIndex(headers, 'hp'),
        telp: colIndex(headers, 'telepon'),
        email: colIndex(headers, 'email'),
        alamat: colIndex(headers, 'alamat'),
        status: colIndex(headers, 'status', 'aktif'),
      };

      if (idx.nama < 0) {
        throw new Error('Kolom "Nama" tidak ditemukan. Pastikan file ini hasil unduhan EMIS GTK/PTK.');
      }

      // NUPTK fallback ke PegID
      const nuptkCol = idx.nuptk >= 0 ? idx.nuptk : idx.peg;
      const hpCol = idx.hp >= 0 ? idx.hp : idx.telp;

      const parsed: EmisGtkRow[] = [];
      for (let i = headerIdx + 1; i < arr.length; i++) {
        const r = arr[i];
        if (!r || r.every((c: any) => !cleanText(c))) continue;
        const nama = cleanText(r[idx.nama]);
        if (!nama) continue;

        const sertData = idx.sert >= 0 ? normalizeSertifikasi(r[idx.sert]) : { sertifikasi: false, nomor: '' };
        const nomorSert = idx.sertNo >= 0 ? cleanText(r[idx.sertNo]) : sertData.nomor;

        parsed.push({
          nama,
          nuptk: nuptkCol >= 0 ? cleanText(r[nuptkCol]) : '',
          nip: idx.nip >= 0 ? cleanText(r[idx.nip]) : '',
          nik: idx.nik >= 0 ? cleanText(r[idx.nik]) : '',
          tempat_lahir: idx.tempat >= 0 ? cleanText(r[idx.tempat]) : '',
          tanggal_lahir: idx.tanggal >= 0 ? parseTanggal(r[idx.tanggal]) : null,
          jenis_kelamin: idx.jk >= 0 ? normalizeJK(cleanText(r[idx.jk])) : '',
          jabatan: idx.jabatan >= 0 ? cleanText(r[idx.jabatan]) : '',
          status_kepegawaian: idx.kepeg >= 0 ? normalizeStatusKepegawaian(cleanText(r[idx.kepeg])) : '',
          sertifikasi: sertData.sertifikasi || !!nomorSert,
          nomor_sertifikasi: nomorSert,
          pendidikan: idx.pend >= 0 ? cleanText(r[idx.pend]) : '',
          lulusan: idx.lulusan >= 0 ? cleanText(r[idx.lulusan]) : '',
          mapel: idx.mapel >= 0 ? cleanText(r[idx.mapel]) : '',
          no_hp: hpCol >= 0 ? normalizeHp(r[hpCol]) : '',
          email: idx.email >= 0 ? cleanText(r[idx.email]) : '',
          alamat: idx.alamat >= 0 ? cleanText(r[idx.alamat]) : '',
          status_aktif: idx.status >= 0 ? cleanText(r[idx.status]) : 'aktif',
        });
      }

      if (!parsed.length) throw new Error('Tidak ada baris GTK yang valid ditemukan.');
      setRows(parsed);
    } catch (err: any) {
      setParseError(err.message || 'Gagal membaca file');
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const goNext = () => {
    if (step === 1 && rows.length > 0) setStep(2);
    else if (step === 2) setStep(3);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as any);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(5);
    setResult(null);
    const errors: string[] = [];
    let created = 0, updated = 0, skipped = 0, failed = 0;

    try {
      // Pre-fetch existing GTK by NUPTK / NIP / NIK
      const nuptkList = rows.map(r => r.nuptk).filter(Boolean);
      const nipList = rows.map(r => r.nip).filter(Boolean);
      const nikList = rows.map(r => r.nik).filter(Boolean);

      const [byNuptk, byNip, byNik] = await Promise.all([
        nuptkList.length ? supabase.from('gtk_ptk').select('id, nuptk, nip, nik, nama').in('nuptk', nuptkList) : Promise.resolve({ data: [] as any[] }),
        nipList.length ? supabase.from('gtk_ptk').select('id, nuptk, nip, nik, nama').in('nip', nipList) : Promise.resolve({ data: [] as any[] }),
        nikList.length ? supabase.from('gtk_ptk').select('id, nuptk, nip, nik, nama').in('nik', nikList) : Promise.resolve({ data: [] as any[] }),
      ]);

      const existingMap = new Map<string, any>();
      [...(byNuptk.data || []), ...(byNip.data || []), ...(byNik.data || [])].forEach((g: any) => {
        if (g.nuptk) existingMap.set(`nuptk:${g.nuptk}`, g);
        if (g.nip) existingMap.set(`nip:${g.nip}`, g);
        if (g.nik) existingMap.set(`nik:${g.nik}`, g);
      });

      setProgress(15);

      const total = rows.length;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        const payload: any = {
          nama: r.nama,
          nuptk: r.nuptk || null,
          nip: r.nip || null,
          nik: r.nik || null,
          tempat_lahir: r.tempat_lahir || null,
          tanggal_lahir: r.tanggal_lahir,
          jenis_kelamin: r.jenis_kelamin || null,
          jabatan: r.jabatan || null,
          status_kepegawaian: r.status_kepegawaian || null,
          sertifikasi: r.sertifikasi,
          nomor_sertifikasi: r.nomor_sertifikasi || null,
          pendidikan: r.pendidikan || null,
          lulusan: r.lulusan || null,
          mapel: r.mapel || null,
          no_hp: r.no_hp || null,
          email: r.email || null,
          alamat: r.alamat || null,
          status_aktif: r.status_aktif?.toLowerCase().includes('tidak') ? 'tidak_aktif' : 'aktif',
        };

        try {
          let existing = null;
          if (r.nuptk) existing = existingMap.get(`nuptk:${r.nuptk}`);
          if (!existing && r.nip) existing = existingMap.get(`nip:${r.nip}`);
          if (!existing && r.nik) existing = existingMap.get(`nik:${r.nik}`);

          if (existing) {
            if (importMode === 'insert_only') {
              skipped++;
            } else {
              const { error } = await supabase.from('gtk_ptk').update(payload).eq('id', existing.id);
              if (error) throw error;
              updated++;
            }
          } else {
            if (importMode === 'update_only') {
              skipped++;
            } else {
              const { error } = await supabase.from('gtk_ptk').insert(payload);
              if (error) throw error;
              created++;
            }
          }
        } catch (err: any) {
          failed++;
          errors.push(`${r.nama}: ${err.message}`);
        }

        setProgress(15 + Math.round(((i + 1) / total) * 80));
      }

      setProgress(100);
      setResult({ created, updated, skipped, failed, errors });
      if (created + updated > 0) {
        toast.success(`Import selesai: ${created} baru, ${updated} diperbarui${skipped ? `, ${skipped} dilewati` : ''}`);
        onSuccess();
      } else if (skipped > 0) {
        toast.info(`${skipped} baris dilewati sesuai mode import`);
      }
    } catch (err: any) {
      toast.error('Import gagal: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Import GTK/PTK dari EMIS Kemenag
          </DialogTitle>
          <DialogDescription>
            Upload file Excel hasil unduhan langsung dari emis.kemenag.go.id (Modul GTK).
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-4 px-2">
          {[
            { n: 1, label: 'Upload File' },
            { n: 2, label: 'Preview Data' },
            { n: 3, label: 'Import' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step >= s.n ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Login ke <strong>emis.kemenag.go.id</strong> → menu <strong>GTK / Personal</strong> → klik <strong>"Unduh Excel"</strong>. Lalu upload file aslinya di sini.
                <br />
                <span className="text-xs text-muted-foreground">
                  Kolom yang dideteksi otomatis: NUPTK/PegID, NIP, NIK, Nama, Tempat/Tanggal Lahir, Jenis Kelamin, Jabatan, Status Kepegawaian (PNS/PPPK/GTY/Honorer), Sertifikasi, Pendidikan, Mapel, No HP, Email, Alamat.
                </span>
              </AlertDescription>
            </Alert>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-32 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
            >
              <div className="flex flex-col items-center gap-2">
                {parsing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Membaca file...</span>
                  </>
                ) : file ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{rows.length} GTK terdeteksi</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Klik untuk pilih file Excel EMIS GTK (.xlsx)</span>
                  </>
                )}
              </div>
            </Button>

            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {rows.length > 0 && (
              <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Berhasil membaca <strong>{rows.length} GTK</strong> — terdeteksi <b>{stats.pns} PNS/PPPK</b>, <b>{stats.honor} Honor</b>, <b>{stats.sertifikasi} bersertifikasi</b>.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{rows.length}</div>
                <div className="text-xs text-muted-foreground">Total GTK</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.pns}</div>
                <div className="text-xs text-muted-foreground">PNS/PPPK</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.honor}</div>
                <div className="text-xs text-muted-foreground">Honor/GTY</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.sertifikasi}</div>
                <div className="text-xs text-muted-foreground">Sertifikasi</div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>NUPTK</TableHead>
                    <TableHead>JK</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sert.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{r.nama}</TableCell>
                      <TableCell className="text-xs font-mono">{r.nuptk || '-'}</TableCell>
                      <TableCell className="text-xs">{r.jenis_kelamin || '-'}</TableCell>
                      <TableCell className="text-xs">{r.jabatan || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {r.status_kepegawaian ? <Badge variant="outline">{r.status_kepegawaian}</Badge> : '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.sertifikasi ? <Badge className="bg-primary/15 text-primary border-primary/40">✓</Badge> : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 100 && (
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  ...dan {rows.length - 100} baris lainnya
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Mode Import</p>
              <div className="grid gap-2">
                {[
                  { v: 'upsert', t: 'Tambah baru & perbarui yang sudah ada', d: 'Default. GTK baru ditambahkan, yang cocok NUPTK/NIP/NIK akan diperbarui.' },
                  { v: 'insert_only', t: 'Hanya tambah data baru', d: 'GTK yang NUPTK/NIP/NIK-nya sudah ada akan dilewati (tidak duplikat, tidak ditimpa).' },
                  { v: 'update_only', t: 'Hanya perbarui yang sudah ada', d: 'Tidak menambah GTK baru. Hanya update data yang cocok NUPTK/NIP/NIK.' },
                ].map((opt) => (
                  <label
                    key={opt.v}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${importMode === opt.v ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value={opt.v}
                      checked={importMode === opt.v}
                      onChange={() => setImportMode(opt.v as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{opt.t}</div>
                      <div className="text-xs text-muted-foreground">{opt.d}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Pencocokan data existing menggunakan <b>NUPTK/PegID</b>, <b>NIP</b>, atau <b>NIK</b> (prioritas berurutan).
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* STEP 3: Import */}
        {step === 3 && (
          <div className="space-y-3">
            {!result && !importing && (
              <Alert>
                <UserCog className="h-4 w-4" />
                <AlertDescription>
                  Siap mengimport <b>{rows.length} GTK</b> dengan mode{' '}
                  <b>
                    {importMode === 'upsert' && 'Tambah baru & perbarui'}
                    {importMode === 'insert_only' && 'Hanya tambah baru'}
                    {importMode === 'update_only' && 'Hanya perbarui'}
                  </b>
                  . Klik <b>Import Sekarang</b> untuk memulai.
                </AlertDescription>
              </Alert>
            )}

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">Mengimport data... {progress}%</p>
              </div>
            )}

            {result && (
              <div className="space-y-2">
                <Alert className="border-green-600 bg-green-50 dark:bg-green-950/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>{result.created}</strong> GTK baru ditambahkan, <strong>{result.updated}</strong> diperbarui
                    {result.skipped > 0 && <>, <strong>{result.skipped}</strong> dilewati</>}.
                  </AlertDescription>
                </Alert>
                {result.failed > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">{result.failed} baris gagal:</p>
                      <ul className="list-disc list-inside mt-2 text-xs max-h-40 overflow-auto">
                        {result.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={step === 1 ? handleClose : goBack} disabled={importing}>
            {step === 1 ? 'Batal' : <><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</>}
          </Button>
          {step < 3 ? (
            <Button onClick={goNext} disabled={step === 1 ? rows.length === 0 : false}>
              Lanjut <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : result ? (
            <Button onClick={handleClose}>Selesai</Button>
          ) : (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Mengimport...</> : <>Import Sekarang ({rows.length})</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
