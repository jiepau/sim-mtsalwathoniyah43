import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, Loader2, Copy, Download, RefreshCw, FileText, Database, 
  BookOpen, Target, Brain, Users, Heart, Save, History, ChevronDown,
  FileStack, BookMarked, Eye, Code2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAtpData } from '@/hooks/useAtpData';
import { useKktpData } from '@/hooks/useKktpData';
import { useModulAjar } from '@/hooks/useModulAjar';
import { exportToDocx } from '@/lib/docx-export';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  MODEL_PEMBELAJARAN,
  PROFIL_PELAJAR_PANCASILA,
  NILAI_KARAKTER_KBC,
  TEKNIK_ASESMEN,
  JENIS_ASESMEN,
  JENJANG_OPTIONS,
  MAPEL_OPTIONS,
  KELAS_OPTIONS,
  ALOKASI_WAKTU_OPTIONS,
  DIFERENSIASI_PRESETS,
  generateMateriInsersi
} from '@/lib/rpp-constants';

interface FormData {
  jenjang: string;
  kelas: string;
  semester: string;
  mapel: string;
  topik: string;
  alokasi_waktu: string;
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string;
  format_output: 'per_topik' | 'per_bab';
  jumlah_pertemuan: string;
  // Deep Learning
  model_pembelajaran: string;
  // Profil Pelajar Pancasila
  profil_pelajar: string[];
  // KBC
  tema_kbc: string[];
  materi_insersi: string;
  // KKTP
  kriteria_ketercapaian: string;
  // Asesmen HOTS
  teknik_asesmen: string[];
  jenis_asesmen: string[];
  // Diferensiasi
  diferensiasi_konten: string;
  diferensiasi_proses: string;
  diferensiasi_produk: string;
}

const initialFormData: FormData = {
  jenjang: '',
  kelas: '',
  semester: '',
  mapel: '',
  topik: '',
  alokasi_waktu: '',
  capaian_pembelajaran: '',
  tujuan_pembelajaran: '',
  format_output: 'per_topik',
  jumlah_pertemuan: '2',
  model_pembelajaran: 'discovery_learning',
  profil_pelajar: [],
  tema_kbc: [],
  materi_insersi: '',
  kriteria_ketercapaian: '',
  teknik_asesmen: [],
  jenis_asesmen: [],
  diferensiasi_konten: '',
  diferensiasi_proses: '',
  diferensiasi_produk: '',
};

const GeneratorRPP = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState('');
  const [previewTab, setPreviewTab] = useState<'preview' | 'markdown'>('preview');
  const [activePertemuan, setActivePertemuan] = useState<number>(0); // 0 = semua
  const resultRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  
  // ATP & KKTP integration
  const { atpList, mapelOptions: atpMapelOptions, getAtpByMapelAndFase, isLoading: isLoadingAtp } = useAtpData();
  const { getKktpByAtpId, formatKriteriaForPrompt, isLoading: isLoadingKktp } = useKktpData();
  const { saveModulAjar, isSaving } = useModulAjar();
  
  const [selectedAtpId, setSelectedAtpId] = useState<string>('');
  const [filteredAtp, setFilteredAtp] = useState<typeof atpList>([]);
  
  // Collapsible states
  const [openSections, setOpenSections] = useState({
    identitas: true,
    kurikulum: false,
    deepLearning: false,
    kbc: false,
    asesmen: false,
    diferensiasi: false,
  });

  // Kelas options based on jenjang
  const kelasOptions = formData.jenjang ? (KELAS_OPTIONS[formData.jenjang] || []) : [];

  // Topik options from ATP tujuan_pembelajaran
  const topikOptions = selectedAtpId 
    ? (atpList.find(a => a.id === selectedAtpId)?.tujuan_pembelajaran || [])
    : [];

  // Update filtered ATP when jenjang, mapel, kelas, or semester changes
  useEffect(() => {
    if (formData.mapel && formData.jenjang) {
      const jenjangOption = JENJANG_OPTIONS.find(j => j.value === formData.jenjang);
      const fase = jenjangOption?.fase;
      const kelas = formData.kelas ? parseInt(formData.kelas) : undefined;
      const semester = formData.semester || undefined;
      const filtered = getAtpByMapelAndFase(formData.mapel, fase, kelas, semester);
      setFilteredAtp(filtered);
      if (filtered.length > 0) {
        setOpenSections(prev => ({ ...prev, kurikulum: true }));
      }
    } else {
      setFilteredAtp([]);
    }
    setSelectedAtpId('');
  }, [formData.mapel, formData.jenjang, formData.kelas, formData.semester]);

  // Auto-fill from selected ATP including KKTP
  const handleAtpSelect = (atpId: string) => {
    setSelectedAtpId(atpId);
    const atp = atpList.find(a => a.id === atpId);
    if (atp) {
      const nilaiKarakterFromAtp = atp.nilai_karakter || [];
      const autoMateriInsersi = generateMateriInsersi(nilaiKarakterFromAtp);
      
      // Get KKTP data for this ATP
      const kktpItems = getKktpByAtpId(atpId);
      const kriteriaFormatted = formatKriteriaForPrompt(kktpItems);
      
      setFormData(prev => ({
        ...prev,
        // Don't overwrite semester and kelas - user already selected them
        capaian_pembelajaran: atp.capaian_pembelajaran || '',
        tujuan_pembelajaran: atp.tujuan_pembelajaran?.join('\n') || '',
        alokasi_waktu: atp.alokasi_waktu || prev.alokasi_waktu,
        tema_kbc: nilaiKarakterFromAtp,
        materi_insersi: autoMateriInsersi,
        kriteria_ketercapaian: kriteriaFormatted,
      }));
      
      toast({
        title: "Data ATP & KKTP dimuat",
        description: `CP, TP, Nilai Karakter, dan ${kktpItems.length} Kriteria Ketercapaian telah diisi otomatis.`,
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset kelas when jenjang changes
      if (field === 'jenjang') {
        updated.kelas = '';
      }
      return updated;
    });
  };

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    const currentValues = formData[field] as string[];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    handleInputChange(field, newValues);
    
    // Auto-generate materi insersi when KBC changes
    if (field === 'tema_kbc') {
      const newMateriInsersi = generateMateriInsersi(newValues);
      setFormData(prev => ({ ...prev, materi_insersi: newMateriInsersi }));
    }
  };

  const handleGenerate = async () => {
    if (!formData.jenjang || !formData.kelas || !formData.semester || !formData.mapel || !formData.topik || !formData.alokasi_waktu) {
      toast({
        title: "Form tidak lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi (Jenjang, Kelas, Semester, Mapel, Topik, Alokasi Waktu).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const modelData = MODEL_PEMBELAJARAN[formData.model_pembelajaran as keyof typeof MODEL_PEMBELAJARAN];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Anda harus login untuk menggunakan fitur ini');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-rpp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            jenjang: formData.jenjang,
            kelas: formData.kelas,
            semester: formData.semester,
            mapel: formData.mapel,
            topik: formData.topik,
            alokasi_waktu: formData.alokasi_waktu,
            capaian_pembelajaran: formData.capaian_pembelajaran,
            tujuan_pembelajaran: formData.tujuan_pembelajaran,
            format_output: formData.format_output,
            jumlah_pertemuan: formData.format_output === 'per_bab' ? formData.jumlah_pertemuan : undefined,
            // Deep Learning
            model_pembelajaran: formData.model_pembelajaran,
            // Profil Pelajar Pancasila
            profil_pelajar: formData.profil_pelajar
              .map(v => PROFIL_PELAJAR_PANCASILA[v as keyof typeof PROFIL_PELAJAR_PANCASILA]?.label || v)
              .join('; '),
            // KBC
            tema_kbc: formData.tema_kbc
              .map(v => NILAI_KARAKTER_KBC[v]?.label || v)
              .join('; '),
            materi_insersi: formData.materi_insersi,
            // KKTP
            kriteria_ketercapaian: formData.kriteria_ketercapaian,
            // Asesmen HOTS
            teknik_asesmen: formData.teknik_asesmen
              .map(v => TEKNIK_ASESMEN[v as keyof typeof TEKNIK_ASESMEN]?.label || v)
              .join('; '),
            jenis_asesmen: formData.jenis_asesmen
              .map(v => JENIS_ASESMEN[v as keyof typeof JENIS_ASESMEN] || v)
              .join('; '),
            // Diferensiasi
            diferensiasi_konten: formData.diferensiasi_konten,
            diferensiasi_proses: formData.diferensiasi_proses,
            diferensiasi_produk: formData.diferensiasi_produk,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghasilkan RPP');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setResult(assistantContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      toast({
        title: "Modul Ajar Berhasil Dibuat!",
        description: "RPP/Modul Ajar telah selesai digenerate dengan pendekatan Deep Learning & KBC.",
      });
    } catch (error) {
      console.error('Error generating RPP:', error);
      toast({
        title: "Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menghasilkan RPP.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!result) {
      toast({ title: "Tidak ada hasil", description: "Generate RPP terlebih dahulu.", variant: "destructive" });
      return;
    }

    await saveModulAjar({
      jenjang: formData.jenjang,
      kelas: parseInt(formData.kelas) || 7,
      semester: formData.semester,
      mapel: formData.mapel,
      topik: formData.topik,
      alokasi_waktu: formData.alokasi_waktu,
      capaian_pembelajaran: formData.capaian_pembelajaran,
      tujuan_pembelajaran: formData.tujuan_pembelajaran.split('\n').filter(Boolean),
      model_pembelajaran: formData.model_pembelajaran,
      profil_pelajar: formData.profil_pelajar,
      nilai_karakter: formData.tema_kbc,
      materi_insersi: formData.materi_insersi,
      teknik_asesmen: formData.teknik_asesmen,
      jenis_asesmen: formData.jenis_asesmen,
      diferensiasi_konten: formData.diferensiasi_konten,
      diferensiasi_proses: formData.diferensiasi_proses,
      diferensiasi_produk: formData.diferensiasi_produk,
      hasil_rpp: result,
      atp_id: selectedAtpId || undefined,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({ title: "Berhasil disalin!", description: "RPP telah disalin ke clipboard." });
    } catch {
      toast({ title: "Gagal menyalin", description: "Tidak dapat menyalin ke clipboard.", variant: "destructive" });
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ModulAjar_${formData.mapel}_${formData.topik.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download dimulai", description: "File Modul Ajar (Markdown) sedang diunduh." });
  };

  const handleDownloadWord = async () => {
    setIsExporting(true);
    try {
      await exportToDocx({
        jenjang: formData.jenjang,
        kelas: formData.kelas,
        semester: formData.semester,
        mapel: formData.mapel,
        topik: formData.topik,
        alokasi_waktu: formData.alokasi_waktu,
        content: result,
      });
      toast({ title: "Download dimulai", description: "File Modul Ajar (Word) sedang diunduh." });
    } catch (error) {
      console.error('Error exporting to Word:', error);
      toast({ title: "Gagal export", description: "Terjadi kesalahan saat membuat file Word.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResult('');
    setSelectedAtpId('');
    setFilteredAtp([]);
  };

  const allMapelOptions = [...new Set([...MAPEL_OPTIONS, ...atpMapelOptions])].sort();
  const selectedModel = MODEL_PEMBELAJARAN[formData.model_pembelajaran as keyof typeof MODEL_PEMBELAJARAN];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generator Modul Ajar"
        description="Buat RPP dan Modul Ajar dengan pendekatan Deep Learning, HOTS, dan Kurikulum Berbasis Cinta"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Input Modul Ajar
              </CardTitle>
              <CardDescription>
                Lengkapi data untuk menghasilkan Modul Ajar berbasis AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Section: Identitas */}
              <Collapsible open={openSections.identitas} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, identitas: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <BookOpen className="h-4 w-4" />
                      Identitas Pembelajaran
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.identitas ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Jenjang *</Label>
                      <Select value={formData.jenjang} onValueChange={(v) => handleInputChange('jenjang', v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                        <SelectContent>
                          {JENJANG_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Kelas *</Label>
                      <Select value={formData.kelas} onValueChange={(v) => handleInputChange('kelas', v)} disabled={!formData.jenjang}>
                        <SelectTrigger className="h-9"><SelectValue placeholder={formData.jenjang ? "Pilih Kelas" : "Pilih Jenjang dulu"} /></SelectTrigger>
                        <SelectContent>
                          {kelasOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Semester *</Label>
                      <Select value={formData.semester} onValueChange={(v) => handleInputChange('semester', v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Pilih Semester" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ganjil">Ganjil</SelectItem>
                          <SelectItem value="Genap">Genap</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Alokasi Waktu *</Label>
                      <Select value={formData.alokasi_waktu} onValueChange={(v) => handleInputChange('alokasi_waktu', v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Pilih Alokasi Waktu" /></SelectTrigger>
                        <SelectContent>
                          {ALOKASI_WAKTU_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Mode Cepat — Format Output
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('format_output', 'per_topik')}
                        className={`flex flex-col items-start gap-1 rounded-md border-2 p-3 text-left transition-all ${
                          formData.format_output === 'per_topik'
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <FileText className="h-3.5 w-3.5" />
                          Per Topik
                        </div>
                        <span className="text-[10px] text-muted-foreground leading-tight">1 pertemuan, fokus 1 TP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('format_output', 'per_bab')}
                        className={`flex flex-col items-start gap-1 rounded-md border-2 p-3 text-left transition-all ${
                          formData.format_output === 'per_bab'
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <BookMarked className="h-3.5 w-3.5" />
                          Per BAB
                        </div>
                        <span className="text-[10px] text-muted-foreground leading-tight">Multi pertemuan, 1 bab utuh</span>
                      </button>
                    </div>
                    {formData.format_output === 'per_bab' && (
                      <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Label className="text-xs flex items-center gap-1">
                          <FileStack className="h-3 w-3" />
                          Jumlah Pertemuan
                        </Label>
                        <Select value={formData.jumlah_pertemuan} onValueChange={(v) => handleInputChange('jumlah_pertemuan', v)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Pertemuan</SelectItem>
                            <SelectItem value="3">3 Pertemuan</SelectItem>
                            <SelectItem value="4">4 Pertemuan</SelectItem>
                            <SelectItem value="5">5 Pertemuan</SelectItem>
                            <SelectItem value="6">6 Pertemuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mata Pelajaran *</Label>
                    <Select value={formData.mapel} onValueChange={(v) => handleInputChange('mapel', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                      <SelectContent>
                        {allMapelOptions.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Topik/Materi Utama *</Label>
                    {topikOptions.length > 0 ? (
                      <Select value={formData.topik} onValueChange={(v) => handleInputChange('topik', v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Pilih Topik dari TP" /></SelectTrigger>
                        <SelectContent>
                          {topikOptions.map((tp, i) => (
                            <SelectItem key={i} value={tp}>{tp.length > 80 ? tp.substring(0, 80) + '...' : tp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input className="h-9" placeholder="Contoh: Shalat Berjamaah" value={formData.topik} onChange={(e) => handleInputChange('topik', e.target.value)} />
                    )}
                    {topikOptions.length > 0 && (
                      <p className="text-xs text-muted-foreground">Topik otomatis dari Tujuan Pembelajaran ATP</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Section: Data Kurikulum (ATP Integration) */}
              <Collapsible open={openSections.kurikulum} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, kurikulum: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Database className="h-4 w-4" />
                      Data Kurikulum (ATP & KKTP)
                      {selectedAtpId && <Badge variant="secondary" className="ml-2">ATP Terhubung</Badge>}
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.kurikulum ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  {filteredAtp.length > 0 ? (
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Ambil Data dari ATP (Otomatis isi CP, TP, KKTP)
                      </Label>
                      <Select value={selectedAtpId} onValueChange={handleAtpSelect}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Pilih ATP..." /></SelectTrigger>
                        <SelectContent>
                          {filteredAtp.map((atp) => (
                            <SelectItem key={atp.id} value={atp.id}>
                              {atp.mapel} - {atp.elemen || 'Umum'} (Kelas {atp.kelas})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {isLoadingAtp || isLoadingKktp ? 'Memuat data...' : `${filteredAtp.length} ATP tersedia`}
                      </p>
                    </div>
                  ) : formData.mapel && formData.jenjang && formData.kelas && formData.semester ? (
                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-1">
                      <p className="text-sm font-medium text-destructive">Tidak ada ATP yang cocok</p>
                      <p className="text-xs text-muted-foreground">
                        Belum ada ATP untuk <strong>{formData.mapel}</strong> Kelas <strong>{formData.kelas}</strong> Semester <strong>{formData.semester}</strong>. 
                        Silakan buat ATP terlebih dahulu di menu <strong>ATP</strong>, atau isi data CP & TP secara manual di bawah.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-muted bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        Pilih Jenjang, Kelas, Semester, dan Mapel terlebih dahulu untuk menampilkan ATP yang tersedia.
                      </p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Capaian Pembelajaran</Label>
                    <Textarea rows={2} placeholder="Diisi dari ATP atau manual..." value={formData.capaian_pembelajaran} onChange={(e) => handleInputChange('capaian_pembelajaran', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tujuan Pembelajaran</Label>
                    <Textarea rows={3} placeholder="Satu TP per baris..." value={formData.tujuan_pembelajaran} onChange={(e) => handleInputChange('tujuan_pembelajaran', e.target.value)} />
                  </div>
                  {formData.kriteria_ketercapaian && (
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Kriteria Ketercapaian (KKTP)
                      </Label>
                      <Textarea rows={4} className="text-xs font-mono" value={formData.kriteria_ketercapaian} onChange={(e) => handleInputChange('kriteria_ketercapaian', e.target.value)} />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Section: Model Pembelajaran Deep Learning */}
              <Collapsible open={openSections.deepLearning} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, deepLearning: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Brain className="h-4 w-4" />
                      Model Pembelajaran (Deep Learning)
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.deepLearning ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pilih Model Pembelajaran</Label>
                    <Select value={formData.model_pembelajaran} onValueChange={(v) => handleInputChange('model_pembelajaran', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(MODEL_PEMBELAJARAN).map(([key, model]) => (
                          <SelectItem key={key} value={key}>{model.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedModel && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <p className="text-xs text-muted-foreground">{selectedModel.deskripsi}</p>
                      <div className="text-xs">
                        <p className="font-medium mb-1">Sintaks:</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                          {selectedModel.sintaks.map((s, i) => (<li key={i}>{s}</li>))}
                        </ol>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">Profil Pelajar Pancasila</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(PROFIL_PELAJAR_PANCASILA).map(([key, data]) => (
                        <label key={key} className="flex items-start gap-2 text-xs cursor-pointer">
                          <Checkbox 
                            checked={formData.profil_pelajar.includes(key)} 
                            onCheckedChange={(checked) => handleCheckboxChange('profil_pelajar', key, !!checked)} 
                          />
                          <span>{data.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Section: Kurikulum Berbasis Cinta */}
              <Collapsible open={openSections.kbc} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, kbc: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Heart className="h-4 w-4" />
                      Kurikulum Berbasis Cinta (KBC)
                      {formData.tema_kbc.length > 0 && <Badge variant="secondary">{formData.tema_kbc.length} nilai</Badge>}
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.kbc ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Tema Nilai Karakter</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(NILAI_KARAKTER_KBC).map(([key, data]) => (
                        <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox 
                            checked={formData.tema_kbc.includes(key)} 
                            onCheckedChange={(checked) => handleCheckboxChange('tema_kbc', key, !!checked)} 
                          />
                          <span>{data.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Materi Insersi</Label>
                    <Textarea rows={4} placeholder="Poin-poin integrasi nilai karakter..." value={formData.materi_insersi} onChange={(e) => handleInputChange('materi_insersi', e.target.value)} />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Section: Asesmen HOTS */}
              <Collapsible open={openSections.asesmen} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, asesmen: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Target className="h-4 w-4" />
                      Asesmen HOTS
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.asesmen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Teknik Asesmen</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(TEKNIK_ASESMEN).map(([key, data]) => (
                        <label key={key} className="flex items-start gap-2 text-xs cursor-pointer">
                          <Checkbox 
                            checked={formData.teknik_asesmen.includes(key)} 
                            onCheckedChange={(checked) => handleCheckboxChange('teknik_asesmen', key, !!checked)} 
                          />
                          <div>
                            <span className="font-medium">{data.label}</span>
                            <p className="text-muted-foreground">{data.deskripsi}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Jenis Asesmen</Label>
                    <div className="space-y-2">
                      {Object.entries(JENIS_ASESMEN).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox 
                            checked={formData.jenis_asesmen.includes(key)} 
                            onCheckedChange={(checked) => handleCheckboxChange('jenis_asesmen', key, !!checked)} 
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Section: Diferensiasi */}
              <Collapsible open={openSections.diferensiasi} onOpenChange={(open) => setOpenSections(prev => ({ ...prev, diferensiasi: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Users className="h-4 w-4" />
                      Diferensiasi Pembelajaran
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.diferensiasi ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Diferensiasi Konten</Label>
                    <div className="space-y-1.5">
                      {DIFERENSIASI_PRESETS.konten.map((item, i) => (
                        <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox
                            checked={formData.diferensiasi_konten.includes(item)}
                            onCheckedChange={(checked) => {
                              const current = formData.diferensiasi_konten ? formData.diferensiasi_konten.split('\n').filter(Boolean) : [];
                              const updated = checked ? [...current, item] : current.filter(v => v !== item);
                              handleInputChange('diferensiasi_konten', updated.join('\n'));
                            }}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Diferensiasi Proses</Label>
                    <div className="space-y-1.5">
                      {DIFERENSIASI_PRESETS.proses.map((item, i) => (
                        <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox
                            checked={formData.diferensiasi_proses.includes(item)}
                            onCheckedChange={(checked) => {
                              const current = formData.diferensiasi_proses ? formData.diferensiasi_proses.split('\n').filter(Boolean) : [];
                              const updated = checked ? [...current, item] : current.filter(v => v !== item);
                              handleInputChange('diferensiasi_proses', updated.join('\n'));
                            }}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Diferensiasi Produk</Label>
                    <div className="space-y-1.5">
                      {DIFERENSIASI_PRESETS.produk.map((item, i) => (
                        <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox
                            checked={formData.diferensiasi_produk.includes(item)}
                            onCheckedChange={(checked) => {
                              const current = formData.diferensiasi_produk ? formData.diferensiasi_produk.split('\n').filter(Boolean) : [];
                              const updated = checked ? [...current, item] : current.filter(v => v !== item);
                              handleInputChange('diferensiasi_produk', updated.join('\n'));
                            }}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleGenerate} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Generate Modul Ajar</>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Result Output */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Hasil Modul Ajar</CardTitle>
                <CardDescription>RPP/Modul Ajar yang dihasilkan AI</CardDescription>
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveToDatabase} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDownloadWord}>
                        <FileText className="h-4 w-4 mr-2" />Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadMarkdown}>
                        <Download className="h-4 w-4 mr-2" />Markdown (.md)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div ref={resultRef} className="min-h-[600px] max-h-[700px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
              {isLoading && !result && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Sedang menghasilkan Modul Ajar...</p>
                  <p className="text-sm">Dengan model {selectedModel?.nama}</p>
                </div>
              )}
              {!result && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                  <p>Hasil Modul Ajar akan muncul di sini</p>
                  <p className="text-sm">Isi form di sebelah kiri dan klik "Generate Modul Ajar"</p>
                </div>
              )}
              {result && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeneratorRPP;
