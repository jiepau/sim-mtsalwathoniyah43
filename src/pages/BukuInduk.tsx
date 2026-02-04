import { useState, useEffect } from "react";
import { BookMarked, Search, Download, FileText, User, Calendar, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/supabase-helpers";

interface Siswa {
  id: string;
  nis: string;
  nisn: string | null;
  nama: string;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  nama_ayah_kandung: string | null;
  nama_ibu_kandung: string | null;
  wa_ortu: string | null;
  status: string | null;
  kelas: {
    id: string;
    nama_kelas: string;
    tingkat: number;
  } | null;
  tahun_ajaran: {
    id: string;
    nama_ta: string;
  } | null;
  created_at: string;
}

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
  is_active: boolean;
}

export default function BukuInduk() {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [taList, setTaList] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedTa, setSelectedTa] = useState<string>("all");
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [siswaRes, kelasRes, taRes] = await Promise.all([
        supabase
          .from("siswa")
          .select(`
            *,
            kelas:kelas_id (id, nama_kelas, tingkat),
            tahun_ajaran:ta_id (id, nama_ta)
          `)
          .eq("status", "aktif")
          .order("nama"),
        supabase.from("kelas").select("*").order("tingkat").order("nama_kelas"),
        supabase.from("tahun_ajaran").select("*").order("nama_ta", { ascending: false }),
      ]);

      if (siswaRes.error) throw siswaRes.error;
      if (kelasRes.error) throw kelasRes.error;
      if (taRes.error) throw taRes.error;

      setSiswa(siswaRes.data || []);
      setKelasList(kelasRes.data || []);
      setTaList(taRes.data || []);
      
      // Set default active TA
      const activeTa = taRes.data?.find(t => t.is_active);
      if (activeTa) setSelectedTa(activeTa.id);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSiswa = siswa.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm) ||
      (s.nisn && s.nisn.includes(searchTerm));
    const matchKelas = selectedKelas === "all" || s.kelas?.id === selectedKelas;
    const matchTa = selectedTa === "all" || s.tahun_ajaran?.id === selectedTa;
    return matchSearch && matchKelas && matchTa;
  });

  const getGenderLabel = (gender: string | null) => {
    if (gender === "L") return "Laki-laki";
    if (gender === "P") return "Perempuan";
    return "-";
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <PageHeader
          title="Buku Induk Siswa"
          description="Data lengkap siswa aktif"
          icon={<BookMarked className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Buku Induk Siswa"
        description="Rekap data lengkap siswa untuk keperluan administrasi"
        icon={<BookMarked className="h-6 w-6" />}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NIS, atau NISN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTa} onValueChange={setSelectedTa}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua TA</SelectItem>
                {taList.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama_ta} {t.is_active && "(Aktif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{filteredSiswa.length}</div>
            <p className="text-sm text-muted-foreground">Total Siswa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {filteredSiswa.filter(s => s.jenis_kelamin === "L").length}
            </div>
            <p className="text-sm text-muted-foreground">Laki-laki</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {filteredSiswa.filter(s => s.jenis_kelamin === "P").length}
            </div>
            <p className="text-sm text-muted-foreground">Perempuan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {new Set(filteredSiswa.map(s => s.kelas?.id).filter(Boolean)).size}
            </div>
            <p className="text-sm text-muted-foreground">Kelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Siswa ({filteredSiswa.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredSiswa.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data siswa ditemukan</p>
              </div>
            ) : (
              filteredSiswa.map((s, index) => (
                <Dialog key={s.id}>
                  <DialogTrigger asChild>
                    <div 
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedSiswa(s)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{s.nama}</p>
                          <p className="text-sm text-muted-foreground">
                            NIS: {s.nis} {s.nisn && `| NISN: ${s.nisn}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.jenis_kelamin === "L" ? "default" : "secondary"}>
                          {getGenderLabel(s.jenis_kelamin)}
                        </Badge>
                        {s.kelas && (
                          <Badge variant="outline">{s.kelas.nama_kelas}</Badge>
                        )}
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Detail Siswa
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh]">
                      <div className="space-y-6 p-2">
                        {/* Basic Info */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">{s.nama}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">NIS</p>
                              <p className="font-medium">{s.nis}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">NISN</p>
                              <p className="font-medium">{s.nisn || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Jenis Kelamin</p>
                              <p className="font-medium">{getGenderLabel(s.jenis_kelamin)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Kelas</p>
                              <p className="font-medium">{s.kelas?.nama_kelas || "-"}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Birth Info */}
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4" />
                            Data Kelahiran
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Tempat Lahir</p>
                              <p className="font-medium">{s.tempat_lahir || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Tanggal Lahir</p>
                              <p className="font-medium">
                                {s.tanggal_lahir ? formatDate(s.tanggal_lahir) : "-"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Address */}
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4" />
                            Alamat
                          </h4>
                          <p>{s.alamat || "-"}</p>
                        </div>

                        <Separator />

                        {/* Parents Info */}
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <User className="h-4 w-4" />
                            Data Orang Tua
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Nama Ayah</p>
                              <p className="font-medium">{s.nama_ayah_kandung || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Nama Ibu</p>
                              <p className="font-medium">{s.nama_ibu_kandung || "-"}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Contact */}
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-3">
                            <Phone className="h-4 w-4" />
                            Kontak
                          </h4>
                          <div>
                            <p className="text-sm text-muted-foreground">WhatsApp Orang Tua</p>
                            <p className="font-medium">{s.wa_ortu || "-"}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Meta */}
                        <div className="text-sm text-muted-foreground">
                          <p>Tahun Ajaran: {s.tahun_ajaran?.nama_ta || "-"}</p>
                          <p>Terdaftar: {formatDate(s.created_at)}</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
