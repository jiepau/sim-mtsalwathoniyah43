import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, GraduationCap, Sparkles } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface EmisRow {
  nama: string;
  nisn: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string | null;
  tingkat: number | null;
  rombel: string;
  kelas_label: string;
  jenis_kelamin: string;
  alamat: string;
  no_telepon: string;
  nama_ayah: string;
  nama_ibu: string;
  status: string;
}

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
  semester?: string;
  is_active?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelasList: Kelas[];
  taList: TahunAjaran[];
  onSuccess: () => void;
}

type ClassMapping = Record<string, string>; // emis label -> kelas_id (or "__create__")

const cleanText = (v: any): string => {
  if (v === null || v === undefined) return '';
  return String(v).replace(/^['"]+/, '').trim();
};

const parseTanggal = (v: any): string | null => {
  if (!v) return null;
  // Excel serial date
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = cleanText(v);
  // ISO YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return null;
};

const parseTingkatRombel = (v: string): { tingkat: number | null; rombel: string } => {
  const s = cleanText(v);
  // "Kelas 7 - 7" or "7 - A"
  const m = s.match(/(\d+)\s*-\s*(.+)$/);
  if (m) return { tingkat: parseInt(m[1], 10), rombel: m[2].trim() };
  const numOnly = s.match(/(\d+)/);
  return { tingkat: numOnly ? parseInt(numOnly[1], 10) : null, rombel: s };
};

const normalizeJK = (v: string): string => {
  const s = cleanText(v).toLowerCase();
  if (s.startsWith('l') || s.startsWith('m')) return 'L';
  if (s.startsWith('p') || s.startsWith('f')) return 'P';
  return '';
};

const normalizeWa = (v: any): string => {
  let s = cleanText(v).replace(/[^\d]/g, '');
  if (!s || s === '0') return '';
  if (s.startsWith('0')) s = '62' + s.substring(1);
  if (!s.startsWith('62')) s = '62' + s;
  return s;
};

// Find header row (EMIS may have empty rows at top)
const findHeaderRow = (rows: any[][]): number => {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i] || [];
    const joined = row.map(c => String(c || '').toLowerCase()).join('|');
    if (joined.includes('nama lengkap') && joined.includes('nisn')) return i;
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

export function EmisImportWizard({ open, onOpenChange, kelasList, taList, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<EmisRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [classMapping, setClassMapping] = useState<ClassMapping>({});
  const [selectedTaId, setSelectedTaId] = useState<string>(
    taList.find(t => t.is_active)?.id || taList[0]?.id || ''
  );

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ created: number; updated: number; failed: number; errors: string[]; classesCreated: number } | null>(null);

  const uniqueClasses = useMemo(() => {
    const map = new Map<string, { tingkat: number | null; rombel: string; count: number }>();
    rows.forEach(r => {
      if (!r.kelas_label) return;
      const ex = map.get(r.kelas_label);
      if (ex) ex.count++;
      else map.set(r.kelas_label, { tingkat: r.tingkat, rombel: r.rombel, count: 1 });
    });
    return Array.from(map.entries()).map(([label, data]) => ({ label, ...data }));
  }, [rows]);

  const reset = () => {
    setStep(1);
    setFile(null);
    setRows([]);
    setParseError(null);
    setClassMapping({});
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
        nama: colIndex(headers, 'nama', 'lengkap'),
        nisn: colIndex(headers, 'nisn'),
        nik: colIndex(headers, 'nik'),
        tempat: colIndex(headers, 'tempat', 'lahir'),
        tanggal: colIndex(headers, 'tanggal', 'lahir'),
        kelas: colIndex(headers, 'tingkat'),
        status: colIndex(headers, 'status'),
        jk: colIndex(headers, 'kelamin'),
        alamat: colIndex(headers, 'alamat'),
        telp: colIndex(headers, 'telepon'),
        ayah: colIndex(headers, 'ayah'),
        ibu: colIndex(headers, 'ibu'),
      };

      if (idx.nama < 0 || idx.nisn < 0) {
        throw new Error('Kolom "Nama Lengkap" atau "NISN" tidak ditemukan. Pastikan file ini hasil unduhan EMIS.');
      }
      // Fallback for class column
      if (idx.kelas < 0) {
        const k2 = colIndex(headers, 'rombel');
        if (k2 >= 0) idx.kelas = k2;
      }

      const parsed: EmisRow[] = [];
      for (let i = headerIdx + 1; i < arr.length; i++) {
        const r = arr[i];
        if (!r || r.every((c: any) => !cleanText(c))) continue;
        const nama = cleanText(r[idx.nama]);
        const nisn = cleanText(r[idx.nisn]);
        if (!nama || !nisn) continue;
        const { tingkat, rombel } = idx.kelas >= 0 ? parseTingkatRombel(cleanText(r[idx.kelas])) : { tingkat: null, rombel: '' };
        parsed.push({
          nama,
          nisn,
          nik: idx.nik >= 0 ? cleanText(r[idx.nik]) : '',
          tempat_lahir: idx.tempat >= 0 ? cleanText(r[idx.tempat]) : '',
          tanggal_lahir: idx.tanggal >= 0 ? parseTanggal(r[idx.tanggal]) : null,
          tingkat,
          rombel,
          kelas_label: idx.kelas >= 0 ? cleanText(r[idx.kelas]) : '',
          jenis_kelamin: idx.jk >= 0 ? normalizeJK(cleanText(r[idx.jk])) : '',
          alamat: idx.alamat >= 0 ? cleanText(r[idx.alamat]) : '',
          no_telepon: idx.telp >= 0 ? normalizeWa(r[idx.telp]) : '',
          nama_ayah: idx.ayah >= 0 ? cleanText(r[idx.ayah]) : '',
          nama_ibu: idx.ibu >= 0 ? cleanText(r[idx.ibu]) : '',
          status: idx.status >= 0 ? cleanText(r[idx.status]) : 'Aktif',
        });
      }

      if (!parsed.length) throw new Error('Tidak ada baris siswa yang valid ditemukan.');
      setRows(parsed);

      // Auto-suggest class mapping
      const labels = Array.from(new Set(parsed.map(p => p.kelas_label).filter(Boolean)));
      const initial: ClassMapping = {};
      labels.forEach(label => {
        const { tingkat, rombel } = parseTingkatRombel(label);
        // Try exact match: tingkat + rombel substring
        const found = kelasList.find(k =>
          k.tingkat === tingkat && k.nama_kelas.toLowerCase().includes(rombel.toLowerCase())
        );
        initial[label] = found ? found.id : '__create__';
      });
      setClassMapping(initial);
    } catch (err: any) {
      setParseError(err.message || 'Gagal membaca file');
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const goNext = () => {
    if (step === 1 && rows.length > 0) setStep(2);
    else if (step === 2) {
      // Validate all classes mapped
      const unmapped = uniqueClasses.find(c => !classMapping[c.label]);
      if (unmapped) {
        toast.error(`Kelas "${unmapped.label}" belum dipetakan`);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedTaId) {
        toast.error('Pilih Tahun Ajaran terlebih dahulu');
        return;
      }
      setStep(4);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as any);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(5);
    setResult(null);
    const errors: string[] = [];
    let created = 0, updated = 0, failed = 0, classesCreated = 0;

    try {
      // 1) Resolve / create kelas for "__create__"
      const resolvedMapping: Record<string, string> = {};
      for (const c of uniqueClasses) {
        const target = classMapping[c.label];
        if (target && target !== '__create__') {
          resolvedMapping[c.label] = target;
        } else {
          // Auto-create
          const { data: newK, error } = await supabase
            .from('kelas')
            .insert({ nama_kelas: c.label, tingkat: c.tingkat || 7 })
            .select('id')
            .single();
          if (error || !newK) {
            errors.push(`Gagal buat kelas "${c.label}": ${error?.message}`);
            continue;
          }
          resolvedMapping[c.label] = newK.id;
          classesCreated++;
        }
      }
      setProgress(20);

      // 2) Pre-fetch existing siswa by NISN
      const nisnList = rows.map(r => r.nisn).filter(Boolean);
      const { data: existing } = await supabase
        .from('siswa')
        .select('id, nis, nisn')
        .in('nisn', nisnList);
      const existingMap = new Map((existing || []).map(s => [s.nisn, s]));

      // 3) Import per row
      const total = rows.length;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const kelas_id = resolvedMapping[r.kelas_label];
        if (!kelas_id) {
          failed++;
          errors.push(`${r.nama}: kelas "${r.kelas_label}" tidak terpetakan`);
          continue;
        }

        const payload: any = {
          nis: r.nisn, // EMIS tidak punya NIS lokal, pakai NISN
          nisn: r.nisn,
          nama: r.nama,
          tempat_lahir: r.tempat_lahir || null,
          tanggal_lahir: r.tanggal_lahir,
          jenis_kelamin: r.jenis_kelamin || null,
          alamat: r.alamat || null,
          wa_ortu: r.no_telepon || null,
          nama_ayah_kandung: r.nama_ayah || null,
          nama_ibu_kandung: r.nama_ibu || null,
          kelas_id,
          ta_id: selectedTaId,
          status: r.status?.toLowerCase().includes('aktif') ? 'aktif' : 'aktif',
        };

        try {
          const ex = existingMap.get(r.nisn);
          let siswaId: string;
          if (ex) {
            const { error } = await supabase.from('siswa').update(payload).eq('id', ex.id);
            if (error) throw error;
            siswaId = ex.id;
            updated++;
          } else {
            const { data: ins, error } = await supabase.from('siswa').insert(payload).select('id').single();
            if (error) throw error;
            siswaId = ins.id;
            created++;
          }

          // Upsert siswa_riwayat for this TA
          const { data: existingRiwayat } = await supabase
            .from('siswa_riwayat')
            .select('id')
            .eq('siswa_id', siswaId)
            .eq('ta_id', selectedTaId)
            .maybeSingle();
          if (existingRiwayat) {
            await supabase.from('siswa_riwayat').update({ kelas_id, status: 'aktif' }).eq('id', existingRiwayat.id);
          } else {
            await supabase.from('siswa_riwayat').insert({ siswa_id: siswaId, kelas_id, ta_id: selectedTaId, status: 'aktif' });
          }
        } catch (err: any) {
          failed++;
          errors.push(`${r.nama} (${r.nisn}): ${err.message}`);
        }

        setProgress(20 + Math.round(((i + 1) / total) * 75));
      }

      setProgress(100);
      setResult({ created, updated, failed, errors, classesCreated });
      if (created + updated > 0) {
        toast.success(`Import selesai: ${created} baru, ${updated} diperbarui`);
        onSuccess();
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
            Import Siswa dari EMIS Kemenag
          </DialogTitle>
          <DialogDescription>
            Upload file Excel hasil unduhan langsung dari emis.kemenag.go.id — tanpa edit manual.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-4 px-2">
          {[
            { n: 1, label: 'Upload File' },
            { n: 2, label: 'Petakan Kelas' },
            { n: 3, label: 'Pilih TA' },
            { n: 4, label: 'Preview & Import' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step >= s.n ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Login ke <strong>emis.kemenag.go.id</strong> → menu <strong>Kesiswaan → Daftar Siswa Aktif</strong> → klik <strong>"Unduh Excel"</strong>. Lalu upload file aslinya di sini.
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
                    <span className="text-xs text-muted-foreground">{rows.length} siswa terdeteksi</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Klik untuk pilih file Excel EMIS (.xlsx)</span>
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
                  Berhasil membaca <strong>{rows.length} siswa</strong> dalam <strong>{uniqueClasses.length} kelas</strong> berbeda.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* STEP 2: Map Classes */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Petakan setiap kelas dari EMIS ke kelas yang ada di SIM, atau biarkan dibuat otomatis.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas EMIS</TableHead>
                    <TableHead className="w-24">Jumlah</TableHead>
                    <TableHead>Petakan ke Kelas SIM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueClasses.map(c => (
                    <TableRow key={c.label}>
                      <TableCell className="font-medium">{c.label}</TableCell>
                      <TableCell><Badge variant="secondary">{c.count} siswa</Badge></TableCell>
                      <TableCell>
                        <Select
                          value={classMapping[c.label] || '__create__'}
                          onValueChange={(v) => setClassMapping({ ...classMapping, [c.label]: v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__create__">
                              <span className="flex items-center gap-2 text-primary">
                                <GraduationCap className="h-4 w-4" />
                                Buat kelas baru: "{c.label}"
                              </span>
                            </SelectItem>
                            {kelasList
                              .filter(k => !c.tingkat || k.tingkat === c.tingkat)
                              .map(k => (
                                <SelectItem key={k.id} value={k.id}>
                                  {k.nama_kelas} (Tingkat {k.tingkat})
                                </SelectItem>
                              ))}
                            {kelasList.filter(k => c.tingkat && k.tingkat !== c.tingkat).length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1">Tingkat lain:</div>
                                {kelasList
                                  .filter(k => c.tingkat && k.tingkat !== c.tingkat)
                                  .map(k => (
                                    <SelectItem key={k.id} value={k.id}>
                                      {k.nama_kelas} (Tingkat {k.tingkat})
                                    </SelectItem>
                                  ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* STEP 3: Select TA */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pilih Tahun Ajaran tempat data siswa ini akan dicatat (riwayat kelas).
            </p>
            <Select value={selectedTaId} onValueChange={setSelectedTaId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                {taList.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama_ta} {t.semester ? `- ${t.semester}` : ''} {t.is_active ? '(Aktif)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Setiap siswa otomatis mendapat entri di <strong>riwayat kelas</strong> untuk TA ini. Jika siswa sudah ada (NISN sama), datanya akan diperbarui.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* STEP 4: Preview & Import */}
        {step === 4 && (
          <div className="space-y-3">
            {!result && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{rows.length}</div>
                    <div className="text-xs text-muted-foreground">Total Siswa</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{uniqueClasses.length}</div>
                    <div className="text-xs text-muted-foreground">Kelas</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {Object.values(classMapping).filter(v => v === '__create__').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Kelas Baru</div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NISN</TableHead>
                        <TableHead>JK</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Tgl Lahir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 100).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{r.nama}</TableCell>
                          <TableCell className="text-xs">{r.nisn}</TableCell>
                          <TableCell className="text-xs">{r.jenis_kelamin}</TableCell>
                          <TableCell className="text-xs">{r.kelas_label}</TableCell>
                          <TableCell className="text-xs">{r.tanggal_lahir || '-'}</TableCell>
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
              </>
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
                    <strong>{result.created}</strong> siswa baru ditambahkan, <strong>{result.updated}</strong> diperbarui
                    {result.classesCreated > 0 && `, ${result.classesCreated} kelas baru dibuat`}.
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
          {step < 4 ? (
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
