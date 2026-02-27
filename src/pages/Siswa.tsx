import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Search, Upload, Pencil, Trash2, Phone, X, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportDialog, ImportResult } from '@/components/import/ImportDialog';
import { ExportButton } from '@/components/export/ExportButton';
import { SiswaDetailDialog } from '@/components/siswa/SiswaDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDatabaseError } from '@/lib/error-mapper';

interface Siswa {
  id: string;
  nis: string;
  nisn: string | null;
  nama: string;
  kelas_id: string | null;
  ta_id: string | null;
  wa_ortu: string | null;
  alamat: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: string | null;
  nama_ibu_kandung: string | null;
  nama_ayah_kandung: string | null;
  kelas?: { nama_kelas: string };
  tahun_ajaran?: { nama_ta: string; semester?: string };
}

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
  semester?: string;
}

export default function SiswaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kelasFilter = searchParams.get('kelas');
  const taFilter = searchParams.get('ta');
  
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    nama: '',
    kelas_id: '',
    ta_id: '',
    wa_ortu: '',
    alamat: '',
    tempat_lahir: '',
    tanggal_lahir: undefined as Date | undefined,
    jenis_kelamin: '',
    nama_ibu_kandung: '',
    nama_ayah_kandung: '',
  });

  // Import configuration
  const importHeaders = ['NIS', 'NISN', 'Nama', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Kelas', 'Tahun Ajaran', 'WA Ortu', 'Alamat', 'Nama Ayah', 'Nama Ibu'];
  const importSampleData = [
    ['001', '0012345678', 'Ahmad Fauzi', 'Laki-laki', 'Jakarta', '2010-05-15', '7A', '2024/2025', '081234567890', 'Jl. Merdeka No. 1', 'Budi', 'Siti'],
    ['002', '0012345679', 'Siti Aminah', 'Perempuan', 'Bandung', '2010-08-20', '7B', '2024/2025', '081234567891', 'Jl. Sudirman No. 2', 'Ahmad', 'Fatimah'],
  ];

  // Export columns configuration
  const exportColumns = [
    { header: 'NIS', accessor: (s: Siswa) => s.nis },
    { header: 'NISN', accessor: (s: Siswa) => s.nisn },
    { header: 'Nama', accessor: (s: Siswa) => s.nama },
    { header: 'Jenis Kelamin', accessor: (s: Siswa) => s.jenis_kelamin },
    { header: 'Tempat Lahir', accessor: (s: Siswa) => s.tempat_lahir },
    { header: 'Tanggal Lahir', accessor: (s: Siswa) => s.tanggal_lahir },
    { header: 'Kelas', accessor: (s: Siswa) => s.kelas?.nama_kelas },
    { header: 'Tahun Ajaran', accessor: (s: Siswa) => s.tahun_ajaran?.nama_ta },
    { header: 'WA Ortu', accessor: (s: Siswa) => s.wa_ortu },
    { header: 'Alamat', accessor: (s: Siswa) => s.alamat },
    { header: 'Nama Ayah', accessor: (s: Siswa) => s.nama_ayah_kandung },
    { header: 'Nama Ibu', accessor: (s: Siswa) => s.nama_ibu_kandung },
  ];

  // Helper to parse Indonesian date format
  const parseIndonesianDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // Map Indonesian month names to numbers
    const monthMap: Record<string, string> = {
      'jan': '01', 'januari': '01',
      'feb': '02', 'februari': '02',
      'mar': '03', 'maret': '03',
      'apr': '04', 'april': '04',
      'mei': '05', 'may': '05',
      'jun': '06', 'juni': '06',
      'jul': '07', 'juli': '07',
      'agu': '08', 'agustus': '08',
      'sep': '09', 'september': '09',
      'okt': '10', 'oktober': '10',
      'nov': '11', 'november': '11',
      'des': '12', 'desember': '12',
    };

    // Try ISO format first (yyyy-MM-dd)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try dd-MMM-yyyy or d-MMM-yyyy format (with hyphen)
    const hyphenMatch = dateStr.match(/^(\d{1,2})-([a-zA-Z]+)-(\d{2,4})$/i);
    if (hyphenMatch) {
      const day = hyphenMatch[1].padStart(2, '0');
      const monthName = hyphenMatch[2].toLowerCase();
      let year = hyphenMatch[3];
      
      if (year.length === 2) {
        year = parseInt(year) > 50 ? '19' + year : '20' + year;
      }
      
      const month = monthMap[monthName];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    // Try "dd MMMM yyyy" or "d MMMM yyyy" format (with space - common Excel format)
    const spaceMatch = dateStr.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i);
    if (spaceMatch) {
      const day = spaceMatch[1].padStart(2, '0');
      const monthName = spaceMatch[2].toLowerCase();
      const year = spaceMatch[3];
      
      const month = monthMap[monthName];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    // Try dd/MM/yyyy format
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, '0');
      const month = slashMatch[2].padStart(2, '0');
      const year = slashMatch[3];
      return `${year}-${month}-${day}`;
    }

    return null; // Return null if format not recognized
  };

  // Helper to normalize gender
  const normalizeGender = (gender: string): string | null => {
    if (!gender) return null;
    const g = gender.trim().toLowerCase();
    if (g === 'l' || g === 'laki-laki' || g === 'laki' || g === 'pria') return 'Laki-laki';
    if (g === 'p' || g === 'perempuan' || g === 'wanita') return 'Perempuan';
    return null;
  };

  const handleImport = async (data: Record<string, string>[]): Promise<ImportResult> => {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        const nis = row['NIS']?.trim();
        const nisn = row['NISN']?.trim();
        const nama = row['Nama']?.trim();
        const kelasNama = row['Kelas']?.trim();
        const taNama = row['Tahun Ajaran']?.trim();
        const waOrtu = row['WA Ortu']?.trim();
        const alamat = row['Alamat']?.trim();
        const tempatLahir = row['Tempat Lahir']?.trim();
        const tanggalLahirRaw = row['Tanggal Lahir']?.trim();
        const jenisKelaminRaw = row['Jenis Kelamin']?.trim();
        const namaAyah = row['Nama Ayah']?.trim();
        const namaIbu = row['Nama Ibu']?.trim();

        if (!nis || !nama) {
          throw new Error('NIS dan Nama harus diisi');
        }

        // Parse date from Indonesian format
        const tanggalLahir = parseIndonesianDate(tanggalLahirRaw);
        
        // Normalize gender (L -> Laki-laki, P -> Perempuan)
        const jenisKelamin = normalizeGender(jenisKelaminRaw);

        // Find kelas_id by name (case-insensitive, trim spaces)
        let kelasId: string | null = null;
        if (kelasNama) {
          const foundKelas = kelas.find(k => k.nama_kelas.trim().toLowerCase() === kelasNama.toLowerCase());
          if (foundKelas) kelasId = foundKelas.id;
        }

        // Find ta_id by name
        let taId: string | null = null;
        if (taNama) {
          const foundTa = tahunAjaran.find(ta => ta.nama_ta.toLowerCase() === taNama.toLowerCase());
          if (foundTa) taId = foundTa.id;
        }

        const { error } = await supabase.from('siswa').insert({
          nis,
          nisn: nisn || null,
          nama,
          kelas_id: kelasId,
          ta_id: taId,
          wa_ortu: waOrtu || null,
          alamat: alamat || null,
          tempat_lahir: tempatLahir || null,
          tanggal_lahir: tanggalLahir,
          jenis_kelamin: jenisKelamin,
          nama_ayah_kandung: namaAyah || null,
          nama_ibu_kandung: namaIbu || null,
        });

        if (error) throw error;
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Baris ${row['NIS'] || '?'}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [siswaRes, kelasRes, taRes] = await Promise.all([
        supabase
          .from('siswa')
          .select(`*, kelas(nama_kelas), tahun_ajaran(nama_ta, semester)`)
          .order('nama'),
        supabase.from('kelas').select('*').order('nama_kelas'),
        supabase.from('tahun_ajaran').select('*').order('nama_ta'),
      ]);

      if (siswaRes.data) setSiswa(siswaRes.data);
      if (kelasRes.data) setKelas(kelasRes.data);
      if (taRes.data) setTahunAjaran(taRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (siswaData?: Siswa) => {
    if (siswaData) {
      setEditingSiswa(siswaData);
      setFormData({
        nis: siswaData.nis,
        nisn: siswaData.nisn || '',
        nama: siswaData.nama,
        kelas_id: siswaData.kelas_id || '',
        ta_id: siswaData.ta_id || '',
        wa_ortu: siswaData.wa_ortu || '',
        alamat: siswaData.alamat || '',
        tempat_lahir: siswaData.tempat_lahir || '',
        tanggal_lahir: siswaData.tanggal_lahir ? new Date(siswaData.tanggal_lahir) : undefined,
        jenis_kelamin: siswaData.jenis_kelamin || '',
        nama_ibu_kandung: siswaData.nama_ibu_kandung || '',
        nama_ayah_kandung: siswaData.nama_ayah_kandung || '',
      });
    } else {
      setEditingSiswa(null);
      setFormData({ 
        nis: '', nisn: '', nama: '', kelas_id: '', ta_id: '', wa_ortu: '', alamat: '',
        tempat_lahir: '', tanggal_lahir: undefined, jenis_kelamin: '',
        nama_ibu_kandung: '', nama_ayah_kandung: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        nis: formData.nis,
        nisn: formData.nisn || null,
        nama: formData.nama,
        kelas_id: formData.kelas_id || null,
        ta_id: formData.ta_id || null,
        wa_ortu: formData.wa_ortu || null,
        alamat: formData.alamat || null,
        tempat_lahir: formData.tempat_lahir || null,
        tanggal_lahir: formData.tanggal_lahir ? format(formData.tanggal_lahir, 'yyyy-MM-dd') : null,
        jenis_kelamin: formData.jenis_kelamin || null,
        nama_ibu_kandung: formData.nama_ibu_kandung || null,
        nama_ayah_kandung: formData.nama_ayah_kandung || null,
      };

      if (editingSiswa) {
        const { error } = await supabase
          .from('siswa')
          .update(payload)
          .eq('id', editingSiswa.id);
        if (error) throw error;
        toast.success('Siswa berhasil diupdate');
      } else {
        const { error } = await supabase.from('siswa').insert(payload);
        if (error) throw error;
        toast.success('Siswa berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;
    
    try {
      const { error } = await supabase.from('siswa').delete().eq('id', id);
      if (error) throw error;
      toast.success('Siswa berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  const handleDeleteAll = async () => {
    const count = siswa.length;
    if (count === 0) {
      toast.info('Tidak ada data siswa untuk dihapus');
      return;
    }
    
    const confirmText = `HAPUS SEMUA`;
    const userInput = prompt(`Anda akan menghapus ${count} data siswa.\n\nKetik "${confirmText}" untuk konfirmasi:`);
    
    if (userInput !== confirmText) {
      toast.info('Penghapusan dibatalkan');
      return;
    }
    
    try {
      // Delete all siswa records
      const { error } = await supabase.from('siswa').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast.success(`${count} data siswa berhasil dihapus`);
      fetchData();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    }
  };

  // Filter by search, kelas, and TA from URL
  const filteredSiswa = siswa.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.toLowerCase().includes(search.toLowerCase());
    const matchesKelas = !kelasFilter || s.kelas_id === kelasFilter;
    const matchesTA = !taFilter || s.ta_id === taFilter;
    return matchesSearch && matchesKelas && matchesTA;
  });

  // Pagination calculations
  const totalItems = filteredSiswa.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSiswa = filteredSiswa.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, kelasFilter, taFilter, pageSize]);

  const filterKelasName = kelasFilter ? kelas.find(k => k.id === kelasFilter)?.nama_kelas : null;
  const filterTAName = taFilter ? tahunAjaran.find(ta => ta.id === taFilter) : null;
  const filterTADisplay = filterTAName 
    ? `${filterTAName.nama_ta} ${filterTAName.semester === 'genap' ? 'Genap' : 'Ganjil'}`
    : null;

  const clearKelasFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('kelas');
    setSearchParams(newParams);
  };

  const clearTAFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('ta');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const columns = [
    { 
      header: 'NIS / NISN', 
      cell: (item: Siswa) => (
        <div className="flex flex-col">
          <span className="font-mono font-medium">{item.nis}</span>
          {item.nisn && <span className="font-mono text-xs text-muted-foreground">{item.nisn}</span>}
        </div>
      ),
      className: 'w-32'
    },
    { header: 'Nama Siswa', accessorKey: 'nama' as keyof Siswa },
    { 
      header: 'L/P', 
      cell: (item: Siswa) => item.jenis_kelamin ? (
        <Badge variant={item.jenis_kelamin === 'Laki-laki' ? 'default' : 'secondary'}>
          {item.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}
        </Badge>
      ) : '-',
      className: 'w-16'
    },
    { 
      header: 'Kelas', 
      cell: (item: Siswa) => item.kelas ? (
        <Badge variant="outline">{item.kelas.nama_kelas}</Badge>
      ) : '-'
    },
    { 
      header: 'Tahun Ajaran', 
      cell: (item: Siswa) => {
        if (!item.tahun_ajaran) return '-';
        const semester = item.tahun_ajaran.semester;
        const semesterLabel = semester === 'genap' ? 'Genap' : semester === 'ganjil' ? 'Ganjil' : '';
        const displayText = semesterLabel ? `${item.tahun_ajaran.nama_ta} ${semesterLabel}` : item.tahun_ajaran.nama_ta;
        return <Badge variant="outline">{displayText}</Badge>;
      }
    },
    { 
      header: 'WA Ortu', 
      cell: (item: Siswa) => {
        if (!item.wa_ortu) return '-';
        let phone = item.wa_ortu.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1);
        } else if (!phone.startsWith('62')) {
          phone = '62' + phone;
        }
        return (
          <a 
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
          >
            <Phone className="h-3 w-3" />
            {item.wa_ortu}
          </a>
        );
      }
    },
    { 
      header: 'Aksi', 
      cell: (item: Siswa) => (
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              setSelectedSiswa(item);
              setDetailDialogOpen(true);
            }}
            title="Detail Siswa"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(item)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)} title="Hapus">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-32'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Data Siswa" 
        description={`Total ${siswa.length} siswa terdaftar`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDeleteAll}
              disabled={siswa.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
            <ExportButton 
              data={filteredSiswa} 
              columns={exportColumns} 
              filename="data_siswa"
            />
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        }
      />

      {/* Search & Filter */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari NIS atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter Kelas */}
        <Select 
          value={kelasFilter || 'all'} 
          onValueChange={(v) => {
            const newParams = new URLSearchParams(searchParams);
            if (v === 'all') {
              newParams.delete('kelas');
            } else {
              newParams.set('kelas', v);
            }
            setSearchParams(newParams);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {kelas.map(k => (
              <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Tahun Ajaran */}
        <Select 
          value={taFilter || 'all'} 
          onValueChange={(v) => {
            const newParams = new URLSearchParams(searchParams);
            if (v === 'all') {
              newParams.delete('ta');
            } else {
              newParams.set('ta', v);
            }
            setSearchParams(newParams);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Semua Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
            {tahunAjaran.map(ta => {
              const semesterLabel = ta.semester === 'genap' ? 'Genap' : 'Ganjil';
              return (
                <SelectItem key={ta.id} value={ta.id}>
                  {ta.nama_ta} - {semesterLabel}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {(kelasFilter || taFilter) && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Reset Filter
          </Button>
        )}
      </div>

      {/* Gender Statistics */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-lg border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Siswa</p>
            <p className="text-lg font-bold text-foreground">{filteredSiswa.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">L</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Laki-laki</p>
            <p className="text-lg font-bold text-foreground">{filteredSiswa.filter(s => s.jenis_kelamin === 'Laki-laki').length}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <span className="text-sm font-bold text-pink-600">P</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Perempuan</p>
            <p className="text-lg font-bold text-foreground">{filteredSiswa.filter(s => s.jenis_kelamin === 'Perempuan').length}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">?</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Belum Diisi</p>
            <p className="text-lg font-bold text-foreground">{filteredSiswa.filter(s => !s.jenis_kelamin).length}</p>
          </div>
        </div>
      </div>

      {/* Pagination Controls - Top */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tampilkan</span>
          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">data</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Menampilkan {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} dari {totalItems} data
        </div>
      </div>

      {/* Table */}
      <DataTable 
        data={paginatedSiswa} 
        columns={columns} 
        loading={loading}
        emptyMessage="Belum ada data siswa"
      />

      {/* Pagination Controls - Bottom */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1}
            title="Halaman Pertama"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            title="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className="w-9 h-9"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
            title="Selanjutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(totalPages)} 
            disabled={currentPage === totalPages}
            title="Halaman Terakhir"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  required
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nisn">NISN</Label>
                <Input
                  id="nisn"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  maxLength={10}
                  placeholder="10 digit"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select value={formData.jenis_kelamin} onValueChange={(v) => setFormData({ ...formData, jenis_kelamin: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                <Input
                  id="tempat_lahir"
                  value={formData.tempat_lahir}
                  onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                  placeholder="Contoh: Jakarta"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.tanggal_lahir && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.tanggal_lahir ? format(formData.tanggal_lahir, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.tanggal_lahir}
                    onSelect={(date) => setFormData({ ...formData, tanggal_lahir: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    defaultMonth={formData.tanggal_lahir || new Date(2010, 0)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas</Label>
                <Select value={formData.kelas_id} onValueChange={(v) => setFormData({ ...formData, kelas_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelas.map(k => (
                      <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ta">Tahun Ajaran</Label>
                <Select value={formData.ta_id} onValueChange={(v) => setFormData({ ...formData, ta_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih TA" />
                  </SelectTrigger>
                  <SelectContent>
                    {tahunAjaran.map(ta => {
                      const semesterLabel = ta.semester === 'genap' ? 'Genap' : ta.semester === 'ganjil' ? 'Ganjil' : '';
                      const displayText = semesterLabel ? `${ta.nama_ta} ${semesterLabel}` : ta.nama_ta;
                      return (
                        <SelectItem key={ta.id} value={ta.id}>{displayText}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa_ortu">No. WA Orang Tua</Label>
              <Input
                id="wa_ortu"
                value={formData.wa_ortu}
                onChange={(e) => setFormData({ ...formData, wa_ortu: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama_ayah_kandung">Nama Ayah Kandung</Label>
                <Input
                  id="nama_ayah_kandung"
                  value={formData.nama_ayah_kandung}
                  onChange={(e) => setFormData({ ...formData, nama_ayah_kandung: e.target.value })}
                  placeholder="Nama ayah"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_ibu_kandung">Nama Ibu Kandung</Label>
                <Input
                  id="nama_ibu_kandung"
                  value={formData.nama_ibu_kandung}
                  onChange={(e) => setFormData({ ...formData, nama_ibu_kandung: e.target.value })}
                  placeholder="Nama ibu"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingSiswa ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Import Data Siswa"
        templateHeaders={importHeaders}
        templateFileName="template_siswa.csv"
        templateSampleData={importSampleData}
        onImport={handleImport}
        onSuccess={fetchData}
      />

      {/* Detail Dialog */}
      <SiswaDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        siswa={selectedSiswa}
      />
    </div>
  );
}
