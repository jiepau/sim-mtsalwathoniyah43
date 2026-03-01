import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHariLibur } from '@/hooks/useHariLibur';
import { RekapSiswaTab } from '@/components/rekap/RekapSiswaTab';
import { RekapGtkTab } from '@/components/rekap/RekapGtkTab';
import { BarChart3, Users, UserCog } from 'lucide-react';
import { getDaysInMonth } from 'date-fns';

interface Kelas { id: string; nama_kelas: string; tingkat: number; }
interface TahunAjaran { id: string; nama_ta: string; is_active: boolean; }

const BULAN_LIST = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const TAHUN_LIST = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

const RekapAbsensi = () => {
  const { isHoliday } = useHariLibur();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedBulan, setSelectedBulan] = useState(String(new Date().getMonth() + 1));
  const [selectedTahun, setSelectedTahun] = useState(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('siswa');

  useEffect(() => {
    const fetchInitial = async () => {
      const [kelasRes, taRes] = await Promise.all([
        supabase.from('kelas').select('*').order('tingkat').order('nama_kelas'),
        supabase.from('tahun_ajaran').select('*').order('nama_ta', { ascending: false }),
      ]);
      if (kelasRes.data) setKelasList(kelasRes.data);
      if (taRes.data) {
        setTahunAjaranList(taRes.data);
        const active = taRes.data.find(t => t.is_active);
        if (active) setSelectedTA(active.id);
      }
      setLoading(false);
    };
    fetchInitial();
  }, []);

  const hariEfektif = useMemo(() => {
    const bulan = parseInt(selectedBulan);
    const tahun = parseInt(selectedTahun);
    const daysInMonth = getDaysInMonth(new Date(tahun, bulan - 1));
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const { isLibur } = isHoliday(dateStr);
      if (!isLibur) count++;
    }
    return count;
  }, [selectedBulan, selectedTahun, isHoliday]);

  const bulanLabel = BULAN_LIST.find(b => b.value === selectedBulan)?.label || '';
  const kelasName = kelasList.find(k => k.id === selectedKelas)?.nama_kelas || '';

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rekap Absensi Bulanan" description="Ringkasan kehadiran per bulan" icon={<BarChart3 className="h-6 w-6" />} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Absensi Bulanan"
        description="Ringkasan total kehadiran siswa dan GTK selama satu bulan penuh"
        icon={<BarChart3 className="h-6 w-6" />}
      />

      {/* Shared Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tahun Ajaran</label>
          <Select value={selectedTA} onValueChange={setSelectedTA}>
            <SelectTrigger><SelectValue placeholder="Pilih Tahun Ajaran" /></SelectTrigger>
            <SelectContent>
              {tahunAjaranList.map(ta => (
                <SelectItem key={ta.id} value={ta.id}>{ta.nama_ta} {ta.is_active && '(Aktif)'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {activeTab === 'siswa' && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Kelas</label>
            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
              <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
              <SelectContent>
                {kelasList.map(k => (
                  <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Bulan</label>
          <Select value={selectedBulan} onValueChange={setSelectedBulan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BULAN_LIST.map(b => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tahun</label>
          <Select value={selectedTahun} onValueChange={setSelectedTahun}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TAHUN_LIST.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="siswa" className="gap-1.5">
            <Users className="h-4 w-4" />
            Rekap Siswa
          </TabsTrigger>
          <TabsTrigger value="gtk" className="gap-1.5">
            <UserCog className="h-4 w-4" />
            Rekap GTK
          </TabsTrigger>
        </TabsList>
        <TabsContent value="siswa" className="mt-4">
          <RekapSiswaTab
            selectedKelas={selectedKelas}
            selectedTA={selectedTA}
            selectedBulan={selectedBulan}
            selectedTahun={selectedTahun}
            hariEfektif={hariEfektif}
            bulanLabel={bulanLabel}
            kelasName={kelasName}
          />
        </TabsContent>
        <TabsContent value="gtk" className="mt-4">
          <RekapGtkTab
            selectedBulan={selectedBulan}
            selectedTahun={selectedTahun}
            hariEfektif={hariEfektif}
            bulanLabel={bulanLabel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RekapAbsensi;
