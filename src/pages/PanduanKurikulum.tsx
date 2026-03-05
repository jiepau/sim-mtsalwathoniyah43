import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, BookOpen, Target, Calendar, CalendarDays, Sparkles, 
  ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Info,
  Download, Save, Copy
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  path: string;
  color: string;
  required: boolean;
  description: string;
  actions: string[];
  dataProduced: string[];
  tips: string[];
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Template CP',
    subtitle: 'Capaian Pembelajaran',
    icon: FileText,
    path: '/cp-templates',
    color: 'bg-blue-500',
    required: true,
    description: 'Pilih template Capaian Pembelajaran (CP) berdasarkan mata pelajaran dan fase yang sesuai. Template ini menjadi acuan utama dalam penyusunan kurikulum.',
    actions: [
      'Pilih mata pelajaran',
      'Pilih fase pembelajaran (A-F)',
      'Salin CP dan elemen ke ATP',
    ],
    dataProduced: ['Capaian Pembelajaran (CP)', 'Elemen Pembelajaran', 'Tujuan Pembelajaran (TP)'],
    tips: ['Template sudah tersedia untuk mapel agama Fase D (MTs)', 'CP bisa diisi manual jika template belum tersedia'],
  },
  {
    id: 2,
    title: 'ATP',
    subtitle: 'Alur Tujuan Pembelajaran',
    icon: BookOpen,
    path: '/atp',
    color: 'bg-emerald-500',
    required: true,
    description: 'Susun Alur Tujuan Pembelajaran berdasarkan CP yang sudah dipilih. Di sini Anda menentukan tujuan pembelajaran, alokasi waktu, serta nilai karakter KBC.',
    actions: [
      'Pilih guru, tahun ajaran, dan fase',
      'Masukkan CP dari template',
      'Tentukan Tujuan Pembelajaran (TP)',
      'Pilih nilai karakter (KBC)',
      'Tentukan alokasi waktu',
    ],
    dataProduced: ['Tujuan Pembelajaran (TP)', 'Nilai Karakter KBC', 'Alokasi Waktu', 'Elemen & CP'],
    tips: ['Gunakan tombol "Load Template" untuk mengisi CP otomatis', 'Bisa menambah beberapa TP dalam satu ATP'],
  },
  {
    id: 3,
    title: 'KKTP',
    subtitle: 'Kriteria Ketercapaian TP',
    icon: Target,
    path: '/kktp',
    color: 'bg-violet-500',
    required: true,
    description: 'Tentukan kriteria ketercapaian untuk setiap Tujuan Pembelajaran. Di sini Anda membuat indikator penilaian, teknik asesmen, dan instrumen yang digunakan.',
    actions: [
      'Pilih ATP yang sudah dibuat',
      'Tentukan kriteria ketercapaian per TP',
      'Pilih teknik penilaian (tes, observasi, dll)',
      'Pilih bentuk instrumen',
    ],
    dataProduced: ['Kriteria Ketercapaian', 'Teknik Penilaian', 'Bentuk Instrumen'],
    tips: ['KKTP diakses dari tombol "KKTP" di tabel ATP', 'Kriteria bisa lebih dari satu per TP'],
  },
  {
    id: 4,
    title: 'Prota & Promes',
    subtitle: 'Program Tahunan & Semester',
    icon: CalendarDays,
    path: '/prota',
    color: 'bg-amber-500',
    required: false,
    description: 'Distribusikan materi pembelajaran ke dalam jadwal tahunan (Prota) dan semester (Promes). Langkah ini bersifat opsional namun sangat membantu perencanaan.',
    actions: [
      'Buat Prota: distribusi materi per bulan',
      'Buat Promes: distribusi materi per minggu',
      'Export ke dokumen Word',
    ],
    dataProduced: ['Jadwal Tahunan', 'Jadwal Semester', 'Dokumen Prota/Promes'],
    tips: ['Bisa di-generate otomatis oleh AI', 'Export ke Word untuk dicetak'],
  },
  {
    id: 5,
    title: 'Generator RPP',
    subtitle: 'AI Modul Ajar',
    icon: Sparkles,
    path: '/generator-rpp',
    color: 'bg-rose-500',
    required: true,
    description: 'Langkah terakhir! Pilih ATP, dan sistem akan mengisi data secara otomatis. Pilih model pembelajaran dan AI akan menghasilkan RPP/Modul Ajar yang lengkap dan siap pakai.',
    actions: [
      'Pilih ATP → data CP, TP, KBC terisi otomatis',
      'Data KKTP (kriteria asesmen) terisi otomatis',
      'Pilih model pembelajaran (Discovery, PBL, PjBL, dll)',
      'Pilih dimensi Profil Pelajar Pancasila',
      'Klik "Generate dengan AI"',
    ],
    dataProduced: ['RPP/Modul Ajar lengkap', 'LKPD', 'Rubrik Penilaian'],
    tips: [
      'Semakin lengkap data ATP & KKTP, semakin baik hasilnya',
      'Bisa simpan ke database untuk diakses kembali',
      'Export ke Word (.docx) atau Markdown',
    ],
  },
];

export default function PanduanKurikulum() {
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (id: number) => {
    setExpandedStep(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panduan Kurikulum"
        description="Langkah-langkah menyusun RPP/Modul Ajar dari awal hingga akhir"
      />

      {/* Flow Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Alur Pengerjaan</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ikuti langkah berikut secara berurutan. Data dari setiap langkah akan digunakan di langkah berikutnya.
              </p>
            </div>
          </div>

          {/* Horizontal Flow */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => toggleStep(step.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    "border hover:shadow-md",
                    step.required 
                      ? "bg-card border-primary/30 text-foreground" 
                      : "bg-card border-warning/30 text-foreground"
                  )}
                >
                  <step.icon className="h-3.5 w-3.5" />
                  {step.title}
                  {!step.required && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-warning/50 text-warning">
                      Opsional
                    </Badge>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Cards */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isExpanded = expandedStep === step.id;
          
          return (
            <Card 
              key={step.id}
              className={cn(
                "transition-all overflow-hidden",
                isExpanded && "ring-2 ring-primary/30 shadow-lg"
              )}
            >
              {/* Step Header */}
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full text-left"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Step Number */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg",
                      step.color
                    )}>
                      {step.id}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base">{step.title}</h3>
                        <span className="text-xs text-muted-foreground">— {step.subtitle}</span>
                        {!step.required && (
                          <Badge variant="outline" className="text-[10px] border-warning/50 text-warning">
                            Opsional
                          </Badge>
                        )}
                        {step.required && (
                          <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                            Wajib
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {step.description}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t">
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    {/* Actions */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Langkah-langkah
                      </h4>
                      <ul className="space-y-1.5">
                        {step.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {i + 1}
                            </span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Data Produced */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        <Save className="h-4 w-4 text-emerald-500" />
                        Data yang Dihasilkan
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {step.dataProduced.map((data, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {data}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-amber-500" />
                        Tips
                      </h4>
                      <ul className="space-y-1.5">
                        {step.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-amber-500 mt-0.5">💡</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Navigate Button */}
                  <div className="mt-4 flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={() => navigate(step.path)}
                      className="gap-1.5"
                    >
                      Buka {step.title}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Output Info */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Hasil Akhir
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Setelah mengikuti seluruh langkah, Anda akan mendapatkan RPP/Modul Ajar lengkap yang bisa:
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs">
              <Save className="h-3.5 w-3.5 text-primary" />
              Simpan ke Database
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs">
              <Download className="h-3.5 w-3.5 text-blue-500" />
              Export Word (.docx)
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs">
              <Download className="h-3.5 w-3.5 text-violet-500" />
              Export Markdown
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs">
              <Copy className="h-3.5 w-3.5 text-amber-500" />
              Salin ke Clipboard
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
