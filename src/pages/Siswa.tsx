import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Search, Upload, Pencil, Trash2, Phone, X, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, IdCard, Camera, MoreHorizontal, Download, LayoutList, Table as TableIcon } from 'lucide-react';
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
import { EmisImportWizard } from '@/components/siswa/EmisImportWizard';
import { ExportButton } from '@/components/export/ExportButton';
import { SiswaDetailDialog } from '@/components/siswa/SiswaDetailDialog';
import { KartuPelajarPrint } from '@/components/siswa/KartuPelajarPrint';
import { WaOrtuInlineEdit } from '@/components/siswa/WaOrtuInlineEdit';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDatabaseError } from '@/lib/error-mapper';
import { useAuth } from '@/contexts/AuthContext';

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
  foto_path: string | null;
  kelas?: { nama_kelas: string };
  tahun_ajaran?: { nama_ta: string; semester?: string };
}

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat?: number;
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
  const { hasRole } = useAuth();
  const canMutate = hasRole('admin') || hasRole('operator');
  
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [emisImportOpen, setEmisImportOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const [printSiswaList, setPrintSiswaList] = useState<Siswa[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // View mode: 'group' (per kelas accordion) | 'table' (paginated table)
  const [viewMode, setViewMode] = useState<'group' | 'table'>(() => {
    return (localStorage.getItem('siswa_view_mode') as 'group' | 'table') || 'group';
  });
  useEffect(() => {
    localStorage.setItem('siswa_view_mode', viewMode);
  }, [viewMode]);

  // Accordion open state per kelas (persisted)
  const [openAccordions, setOpenAccordions] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('siswa_open_accordions');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });
  const [accordionInitialized, setAccordionInitialized] = useState(false);
  useEffect(() => {
    if (accordionInitialized) {
      localStorage.setItem('siswa_open_accordions', JSON.stringify(openAccordions));
    }
  }, [openAccordions, accordionInitialized]);
  
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

    // Try dd/MM/yyyy or M/D/YYYY format (auto-detect by checking if values are valid)
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const part1 = parseInt(slashMatch[1]);
      const part2 = parseInt(slashMatch[2]);
      const year = slashMatch[3];
      
      // If part2 > 12, assume M/D/YYYY (US/Excel format: month first)
      // If part1 > 12, assume DD/MM/YYYY (day first)
      // If both <= 12, default to DD/MM/YYYY
      let day: string, month: string;
      if (part2 > 12 && part1 <= 12) {
        // M/D/YYYY format (e.g., 3/23/2010 → month=3, day=23)
        month = part1.toString().padStart(2, '0');
        day = part2.toString().padStart(2, '0');
      } else {
        // DD/MM/YYYY format (e.g., 23/03/2010 → day=23, month=03)
        day = part1.toString().padStart(2, '0');
        month = part2.toString().padStart(2, '0');
      }
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

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 karena baris 1 = header, index mulai dari 0
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
          throw new Error('NIS dan Nama wajib diisi');
        }

        // Cek duplikat NIS di database
        const { data: existing } = await supabase
          .from('siswa')
          .select('id')
          .eq('nis', nis)
          .maybeSingle();
        
        if (existing) {
          throw new Error(`NIS "${nis}" sudah terdaftar di database`);
        }

        // Parse date from Indonesian format
        const tanggalLahir = parseIndonesianDate(tanggalLahirRaw);
        
        // Normalize gender (L -> Laki-laki, P -> Perempuan)
        const jenisKelamin = normalizeGender(jenisKelaminRaw);

        // Find kelas_id by name (case-insensitive, trim spaces)
        let kelasId: string | null = null;
        if (kelasNama) {
          const foundKelas = kelas.find(k => k.nama_kelas.trim().toLowerCase() === kelasNama.toLowerCase());
          if (foundKelas) {
            kelasId = foundKelas.id;
          } else {
            throw new Error(`Kelas "${kelasNama}" tidak ditemukan. Kelas yang tersedia: ${kelas.map(k => k.nama_kelas).join(', ')}`);
          }
        }

        // Find ta_id by name (support combined format like "2023/2024 Ganjil")
        let taId: string | null = null;
        if (taNama) {
          const taNamaLower = taNama.toLowerCase().trim();
          const foundTa = tahunAjaran.find(ta => {
            // Match exact nama_ta
            if (ta.nama_ta.toLowerCase() === taNamaLower) return true;
            // Match combined "nama_ta semester" format
            const combined = `${ta.nama_ta} ${ta.semester || ''}`.trim().toLowerCase();
            if (combined === taNamaLower) return true;
            return false;
          });
          if (foundTa) {
            taId = foundTa.id;
          } else {
            const taList = tahunAjaran.map(t => `${t.nama_ta} ${t.semester || ''}`.trim());
            throw new Error(`Tahun Ajaran "${taNama}" tidak ditemukan. TA yang tersedia: ${taList.join(', ')}`);
          }
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

        if (error) {
          if (error.code === '23505') throw new Error(`Data duplikat - NIS "${nis}" sudah ada`);
          if (error.code === '23503') throw new Error('Referensi kelas/tahun ajaran tidak valid');
          throw new Error(error.message);
        }
        success++;
      } catch (error: any) {
        failed++;
        const namaInfo = row['Nama']?.trim() ? ` (${row['Nama'].trim()})` : '';
        errors.push(`Baris ${rowNum}${namaInfo}: ${error.message}`);
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

  // Photo upload handler
  const handlePhotoUpload = async (siswaId: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WebP');
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${siswaId}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('siswa-photos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('siswa')
        .update({ foto_path: filePath } as any)
        .eq('id', siswaId);
      if (updateError) throw updateError;

      toast.success('Foto berhasil diupload');
      fetchData();
    } catch (error: any) {
      toast.error('Gagal upload foto: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Print kartu pelajar
  const handlePrintKartu = (siswaData: Siswa) => {
    setPrintSiswaList([siswaData]);
    setPrintMode(true);
  };

  const handlePrintBatch = () => {
    if (filteredSiswa.length === 0) {
      toast.info('Tidak ada siswa untuk dicetak');
      return;
    }
    setPrintSiswaList(filteredSiswa);
    setPrintMode(true);
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

  // Group siswa by kelas. Include ALL kelas (even empty ones) when no kelas filter is active,
  // so admin can see kelas kosong + ajakan tambah siswa.
  const groupedSiswa = (() => {
    const groups = new Map<string, { kelasId: string | null; namaKelas: string; tingkat: number; siswa: Siswa[] }>();

    // Seed dari master kelas (hanya jika tidak ada filter kelas)
    if (!kelasFilter) {
      for (const k of kelas) {
        groups.set(k.id, {
          kelasId: k.id,
          namaKelas: k.nama_kelas,
          tingkat: k.tingkat ?? 99,
          siswa: [],
        });
      }
    }

    // Isi siswa
    for (const s of filteredSiswa) {
      const key = s.kelas_id || '__no_kelas__';
      if (!groups.has(key)) {
        const k = kelas.find(k => k.id === s.kelas_id);
        groups.set(key, {
          kelasId: s.kelas_id,
          namaKelas: k?.nama_kelas || s.kelas?.nama_kelas || 'Belum Ada Kelas',
          tingkat: k?.tingkat ?? 99,
          siswa: [],
        });
      }
      groups.get(key)!.siswa.push(s);
    }

    // sort siswa within each group by nama
    for (const g of groups.values()) {
      g.siswa.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
      return a.namaKelas.localeCompare(b.namaKelas, 'id', { numeric: true });
    });
  })();

  // Inisialisasi accordion: jika belum ada state tersimpan, buka semua kelas yang ada siswanya
  useEffect(() => {
    if (!accordionInitialized && !loading && groupedSiswa.length > 0) {
      const stored = localStorage.getItem('siswa_open_accordions');
      if (!stored) {
        const initialOpen = groupedSiswa
          .filter(g => g.siswa.length > 0)
          .map(g => g.kelasId || '__no_kelas__');
        setOpenAccordions(initialOpen);
      }
      setAccordionInitialized(true);
    }
  }, [loading, groupedSiswa, accordionInitialized]);

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
      cell: (item: Siswa) => {
        const jk = item.jenis_kelamin;
        if (!jk) return '-';
        const isLaki = jk === 'L' || jk === 'Laki-laki';
        return (
          <Badge variant={isLaki ? 'default' : 'secondary'}>
            {isLaki ? 'L' : 'P'}
          </Badge>
        );
      },
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
      cell: (item: Siswa) => (
        <WaOrtuInlineEdit
          siswaId={item.id}
          value={item.wa_ortu}
          onSaved={(newVal) => {
            setSiswa((prev) => prev.map((s) => (s.id === item.id ? { ...s, wa_ortu: newVal } : s)));
          }}
        />
      )
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
          <Button size="sm" variant="ghost" onClick={() => handlePrintKartu(item)} title="Cetak Kartu Pelajar">
            <IdCard className="h-4 w-4" />
          </Button>
          {canMutate && (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(item)} title="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)} title="Hapus">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
      className: 'w-40'
    },
  ];
  if (printMode) {
    return <KartuPelajarPrint siswaList={printSiswaList} onClose={() => setPrintMode(false)} />;
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Data Siswa" 
        description={`Total ${siswa.length} siswa terdaftar`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex gap-2 items-center">
            {/* Hidden ExportButton — di-trigger dari dropdown */}
            <div className="hidden">
              <ExportButton 
                data={filteredSiswa} 
                columns={exportColumns} 
                filename="data_siswa"
              />
            </div>

            {/* Aksi utama */}
            <Button onClick={() => handleOpenDialog()} size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Siswa
            </Button>

            {/* Aksi sekunder dikelompokkan */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <MoreHorizontal className="h-4 w-4 mr-1.5" />
                  Aksi Lainnya
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Import Data</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setEmisImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import EMIS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Ekspor & Cetak</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    const btn = document.querySelector<HTMLButtonElement>(
                      '[data-export-trigger="data_siswa"]'
                    );
                    btn?.click();
                  }}
                  disabled={filteredSiswa.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintBatch} disabled={siswa.length === 0}>
                  <IdCard className="h-4 w-4 mr-2" />
                  Cetak Kartu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteAll}
                  disabled={siswa.length === 0}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Semua
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* Gender Statistics — hanya muncul di mode Tabel (di mode Per Kelas sudah ada badge L/P per accordion) */}
      {viewMode === 'table' && (
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
            <p className="text-lg font-bold text-foreground">{filteredSiswa.filter(s => s.jenis_kelamin === 'L' || s.jenis_kelamin === 'Laki-laki').length}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <span className="text-sm font-bold text-pink-600">P</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Perempuan</p>
            <p className="text-lg font-bold text-foreground">{filteredSiswa.filter(s => s.jenis_kelamin === 'P' || s.jenis_kelamin === 'Perempuan').length}</p>
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
      )}

      {/* View mode toggle + counter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {viewMode === 'table' && (
            <>
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
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {viewMode === 'table'
              ? `Menampilkan ${totalItems > 0 ? startIndex + 1 : 0} - ${endIndex} dari ${totalItems} data`
              : `Total ${totalItems} siswa di ${groupedSiswa.length} kelas`}
          </div>
          {/* Toggle view */}
          <div className="inline-flex rounded-md border bg-background p-0.5">
            <Button
              size="sm"
              variant={viewMode === 'group' ? 'default' : 'ghost'}
              className="h-8 px-2.5"
              onClick={() => setViewMode('group')}
              title="Tampilan per Kelas"
            >
              <LayoutList className="h-4 w-4 mr-1.5" />
              Per Kelas
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              className="h-8 px-2.5"
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
            >
              <TableIcon className="h-4 w-4 mr-1.5" />
              Tabel
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <>
          <DataTable 
            data={paginatedSiswa} 
            columns={columns} 
            loading={loading}
            emptyMessage="Belum ada data siswa"
          />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="Halaman Pertama">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} title="Sebelumnya">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className="w-9 h-9" onClick={() => setCurrentPage(pageNum)}>
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} title="Selanjutnya">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Halaman Terakhir">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        // Group by Kelas (accordion)
        loading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
        ) : groupedSiswa.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-md">Belum ada data siswa</div>
        ) : (
          <Accordion 
            type="multiple" 
            value={openAccordions}
            onValueChange={setOpenAccordions}
            className="space-y-2"
          >
            {groupedSiswa.map((group) => {
              const lakiCount = group.siswa.filter(s => s.jenis_kelamin === 'L' || s.jenis_kelamin === 'Laki-laki').length;
              const perempuanCount = group.siswa.filter(s => s.jenis_kelamin === 'P' || s.jenis_kelamin === 'Perempuan').length;
              const isEmpty = group.siswa.length === 0;
              return (
                <AccordionItem 
                  key={group.kelasId || '__no_kelas__'} 
                  value={group.kelasId || '__no_kelas__'}
                  className={cn(
                    "border rounded-md overflow-hidden bg-card",
                    isEmpty && "border-dashed opacity-90"
                  )}
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant={isEmpty ? "outline" : "default"} className="text-sm">{group.namaKelas}</Badge>
                      <span className={cn(
                        "text-sm font-semibold",
                        isEmpty ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {group.siswa.length} siswa
                      </span>
                      {!isEmpty && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Badge variant="outline" className="h-5 px-1.5 text-[10px]">L</Badge>{lakiCount}</span>
                          <span className="inline-flex items-center gap-1"><Badge variant="outline" className="h-5 px-1.5 text-[10px]">P</Badge>{perempuanCount}</span>
                        </div>
                      )}
                      {isEmpty && (
                        <Badge variant="secondary" className="text-[10px] font-normal">Kosong</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    {isEmpty ? (
                      <div className="px-6 py-8 text-center border-t bg-muted/20">
                        <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Belum ada siswa di {group.namaKelas}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Tambahkan siswa baru atau import dari EMIS untuk mengisi kelas ini.
                        </p>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, kelas_id: group.kelasId || '' }));
                              handleOpenDialog();
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Tambah Siswa ke {group.namaKelas}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEmisImportOpen(true)}
                          >
                            <Upload className="h-4 w-4 mr-1.5" />
                            Import EMIS
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <DataTable 
                        data={group.siswa}
                        columns={columns}
                        loading={false}
                        emptyMessage="Tidak ada siswa di kelas ini"
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )
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
            {/* Photo upload - only show when editing */}
            {editingSiswa && (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {editingSiswa.foto_path ? (
                    <img 
                      src={supabase.storage.from('siswa-photos').getPublicUrl(editingSiswa.foto_path).data.publicUrl} 
                      alt="Foto" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    {uploadingPhoto ? 'Mengupload...' : 'Upload Foto'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG/PNG/WebP, maks 2MB</p>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && editingSiswa) {
                        handlePhotoUpload(editingSiswa.id, file);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            )}
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
              <Label htmlFor="tanggal_lahir_input">Tanggal Lahir</Label>
              <Input
                id="tanggal_lahir_input"
                type="date"
                value={formData.tanggal_lahir ? format(formData.tanggal_lahir, 'yyyy-MM-dd') : ''}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined })}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
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

      {/* EMIS Import Wizard */}
      <EmisImportWizard
        open={emisImportOpen}
        onOpenChange={setEmisImportOpen}
        kelasList={kelas as any}
        taList={tahunAjaran as any}
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
