import { useState, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Copy, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const JENJANG_OPTIONS = [
  { value: 'MI', label: 'MI (Madrasah Ibtidaiyah)' },
  { value: 'MTs', label: 'MTs (Madrasah Tsanawiyah)' },
  { value: 'MA', label: 'MA (Madrasah Aliyah)' },
  { value: 'SD', label: 'SD (Sekolah Dasar)' },
  { value: 'SMP', label: 'SMP (Sekolah Menengah Pertama)' },
  { value: 'SMA', label: 'SMA (Sekolah Menengah Atas)' },
];

const MAPEL_OPTIONS = [
  'Al-Qur\'an Hadis',
  'Akidah Akhlak',
  'Fiqih',
  'Sejarah Kebudayaan Islam',
  'Bahasa Arab',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Matematika',
  'IPA',
  'IPS',
  'PKN',
  'Seni Budaya',
  'PJOK',
  'Prakarya',
  'Informatika',
];

const GeneratorRPP = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    jenjang: '',
    kelas: '',
    semester: '',
    mapel: '',
    topik: '',
    alokasi_waktu: '',
    tujuan_pembelajaran: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.jenjang || !formData.kelas || !formData.semester || !formData.mapel || !formData.topik || !formData.alokasi_waktu) {
      toast({
        title: "Form tidak lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-rpp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghasilkan RPP');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

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
        title: "RPP Berhasil Dibuat!",
        description: "RPP/Modul Ajar telah selesai digenerate.",
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Berhasil disalin!",
        description: "RPP telah disalin ke clipboard.",
      });
    } catch {
      toast({
        title: "Gagal menyalin",
        description: "Tidak dapat menyalin ke clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RPP_${formData.mapel}_${formData.topik.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download dimulai",
      description: "File RPP sedang diunduh.",
    });
  };

  const handleReset = () => {
    setFormData({
      jenjang: '',
      kelas: '',
      semester: '',
      mapel: '',
      topik: '',
      alokasi_waktu: '',
      tujuan_pembelajaran: '',
    });
    setResult('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generator RPP/Modul Ajar"
        description="Buat RPP dan Modul Ajar secara otomatis dengan bantuan AI sesuai Kurikulum Merdeka"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Input Data RPP
            </CardTitle>
            <CardDescription>
              Isi informasi pembelajaran untuk menghasilkan RPP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jenjang">Jenjang *</Label>
                <Select
                  value={formData.jenjang}
                  onValueChange={(value) => handleInputChange('jenjang', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENJANG_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas *</Label>
                <Input
                  id="kelas"
                  placeholder="Contoh: VII, VIII, IX"
                  value={formData.kelas}
                  onChange={(e) => handleInputChange('kelas', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => handleInputChange('semester', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ganjil">Ganjil</SelectItem>
                    <SelectItem value="Genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alokasi_waktu">Alokasi Waktu *</Label>
                <Input
                  id="alokasi_waktu"
                  placeholder="Contoh: 2 x 40 menit"
                  value={formData.alokasi_waktu}
                  onChange={(e) => handleInputChange('alokasi_waktu', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapel">Mata Pelajaran *</Label>
              <Select
                value={formData.mapel}
                onValueChange={(value) => handleInputChange('mapel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {MAPEL_OPTIONS.map((mapel) => (
                    <SelectItem key={mapel} value={mapel}>
                      {mapel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topik">Topik/Materi Utama *</Label>
              <Input
                id="topik"
                placeholder="Contoh: Mengenal Tumbuhan"
                value={formData.topik}
                onChange={(e) => handleInputChange('topik', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tujuan_pembelajaran">
                Tujuan Pembelajaran Spesifik (Opsional)
              </Label>
              <Textarea
                id="tujuan_pembelajaran"
                placeholder="Tuliskan tujuan pembelajaran spesifik yang ingin dicapai..."
                value={formData.tujuan_pembelajaran}
                onChange={(e) => handleInputChange('tujuan_pembelajaran', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang Generate...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate RPP
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Output */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hasil RPP</CardTitle>
                <CardDescription>
                  RPP/Modul Ajar yang dihasilkan AI
                </CardDescription>
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-1" />
                    Salin
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Unduh
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={resultRef}
              className="min-h-[500px] max-h-[600px] overflow-y-auto rounded-lg border bg-muted/30 p-4"
            >
              {isLoading && !result && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Sedang menghasilkan RPP...</p>
                  <p className="text-sm">Mohon tunggu beberapa saat</p>
                </div>
              )}
              {!result && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                  <p>Hasil RPP akan muncul di sini</p>
                  <p className="text-sm">Isi form di sebelah kiri dan klik "Generate RPP"</p>
                </div>
              )}
              {result && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result}
                  </ReactMarkdown>
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
