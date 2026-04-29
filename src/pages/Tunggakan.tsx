import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Search, Phone, History as HistoryIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/supabase-helpers';

interface TunggakanItem {
  jenis_tagihan: string;
  bulan: number | null;
  tahun: number | null;
  nominal: number;
  nominal_bayar: number;
  sisa: number;
  status: string;
  ta_id: string | null;
  ta_label: string;
  is_warisan: boolean;
}

interface SiswaTunggakan {
  id: string;
  siswa_id: string;
  nama: string;
  nis: string;
  kelas: string;
  kelas_id: string | null;
  wa_ortu: string | null;
  total_tunggakan: number;
  total_warisan: number;
  items: TunggakanItem[];
  ta_set: Set<string>;
}

interface TaOption { id: string; nama_ta: string; semester: string | null; is_active: boolean | null; }
interface KelasOption { id: string; nama_kelas: string; }

const bulanOptions = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function TunggakanPage() {
  const [tunggakanData, setTunggakanData] = useState<SiswaTunggakan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [taList, setTaList] = useState<TaOption[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [activeTaId, setActiveTaId] = useState<string | null>(null);
  const [filterTa, setFilterTa] = useState<string>('all');
  const [filterKelas, setFilterKelas] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pembayaranRes, taRes, kelasRes] = await Promise.all([
        supabase
          .from('pembayaran')
          .select(`*, siswa(id, nama, nis, wa_ortu, kelas_id, kelas(nama_kelas)), jenis_tagihan(nama_tagihan)`)
          .or('status.eq.belum_lunas,status.eq.cicil')
          .order('created_at', { ascending: false }),
        supabase.from('tahun_ajaran').select('id, nama_ta, semester, is_active').order('nama_ta', { ascending: false }),
        supabase.from('kelas').select('id, nama_kelas').order('nama_kelas'),
      ]);

      if (taRes.data) setTaList(taRes.data);
      if (kelasRes.data) setKelasList(kelasRes.data);
      const active = taRes.data?.find(t => t.is_active);
      if (active) setActiveTaId(active.id);

      const taMap = new Map<string, TaOption>();
      taRes.data?.forEach(t => taMap.set(t.id, t));

      const grouped: Record<string, SiswaTunggakan> = {};

      (pembayaranRes.data || []).forEach(p => {
        const siswaId = p.siswa?.id || p.siswa_id;
        const sisa = Number(p.nominal) - Number(p.nominal_bayar);
        const ta = p.ta_id ? taMap.get(p.ta_id) : null;
        const taLabel = ta ? `${ta.nama_ta} ${ta.semester === 'genap' ? 'Genap' : 'Ganjil'}` : 'TA tidak diset';
        const isWarisan = p.ta_id !== null && active && p.ta_id !== active.id;

        if (!grouped[siswaId]) {
          grouped[siswaId] = {
            id: siswaId,
            siswa_id: siswaId,
            nama: p.siswa?.nama || '-',
            nis: p.siswa?.nis || '-',
            kelas: p.siswa?.kelas?.nama_kelas || '-',
            kelas_id: p.siswa?.kelas_id || null,
            wa_ortu: p.siswa?.wa_ortu || null,
            total_tunggakan: 0,
            total_warisan: 0,
            items: [],
            ta_set: new Set(),
          };
        }

        grouped[siswaId].total_tunggakan += sisa;
        if (isWarisan) grouped[siswaId].total_warisan += sisa;
        if (p.ta_id) grouped[siswaId].ta_set.add(p.ta_id);

        grouped[siswaId].items.push({
          jenis_tagihan: p.jenis_tagihan?.nama_tagihan || '-',
          bulan: p.bulan,
          tahun: p.tahun,
          nominal: Number(p.nominal),
          nominal_bayar: Number(p.nominal_bayar),
          sisa,
          status: p.status || 'belum_lunas',
          ta_id: p.ta_id,
          ta_label: taLabel,
          is_warisan: !!isWarisan,
        });
      });

      const arr = Object.values(grouped).sort((a, b) => b.total_tunggakan - a.total_tunggakan);
      setTunggakanData(arr);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return tunggakanData
      .map(s => {
        // Filter items by TA
        const items = filterTa === 'all'
          ? s.items
          : s.items.filter(i => i.ta_id === filterTa);
        const total = items.reduce((acc, i) => acc + i.sisa, 0);
        return { ...s, items, total_tunggakan: total };
      })
      .filter(s => s.items.length > 0)
      .filter(s => filterKelas === 'all' || s.kelas_id === filterKelas)
      .filter(s =>
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.nis.toLowerCase().includes(search.toLowerCase())
      );
  }, [tunggakanData, filterTa, filterKelas, search]);

  const totalTunggakan = filteredData.reduce((acc, s) => acc + s.total_tunggakan, 0);
  const totalWarisan = filteredData.reduce((acc, s) => acc + s.total_warisan, 0);

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
    return cleaned;
  };

  const getWhatsAppUrl = (siswa: SiswaTunggakan): string => {
    if (!siswa.wa_ortu) return '#';
    const phone = formatPhoneNumber(siswa.wa_ortu);
    const itemsText = siswa.items.map(item => {
      const periode = item.bulan && item.tahun
        ? ` (${bulanOptions[item.bulan - 1]} ${item.tahun})`
        : '';
      const taTxt = item.is_warisan ? ` [Warisan ${item.ta_label}]` : '';
      return `• ${item.jenis_tagihan}${periode}${taTxt}: ${formatCurrency(item.sisa)}`;
    }).join('\n');

    const message = encodeURIComponent(
      `Assalamu'alaikum Bapak/Ibu Wali dari ${siswa.nama},\n\n` +
      `Kami ingin menginformasikan bahwa terdapat tunggakan pembayaran sebagai berikut:\n\n` +
      `${itemsText}\n\n` +
      `Total Tunggakan: ${formatCurrency(siswa.total_tunggakan)}\n\n` +
      `Mohon segera melakukan pembayaran. Terima kasih.\n\nWassalamu'alaikum`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  // Group items per TA for accordion display
  const groupItemsPerTa = (items: TunggakanItem[]) => {
    const map = new Map<string, { ta_label: string; is_warisan: boolean; items: TunggakanItem[]; total: number }>();
    items.forEach(it => {
      const key = it.ta_id || 'no-ta';
      if (!map.has(key)) {
        map.set(key, { ta_label: it.ta_label, is_warisan: it.is_warisan, items: [], total: 0 });
      }
      const g = map.get(key)!;
      g.items.push(it);
      g.total += it.sisa;
    });
    return Array.from(map.values()).sort((a, b) => (a.is_warisan === b.is_warisan ? 0 : a.is_warisan ? -1 : 1));
  };

  const columns = [
    {
      header: 'Siswa',
      cell: (item: SiswaTunggakan) => (
        <div>
          <p className="font-medium">{item.nama}</p>
          <p className="text-xs text-muted-foreground">{item.nis}</p>
          {item.total_warisan > 0 && (
            <Badge variant="outline" className="mt-1 bg-warning/15 text-warning border-warning/40 text-[10px]">
              <HistoryIcon className="h-3 w-3 mr-1" />
              Warisan: {formatCurrency(item.total_warisan)}
            </Badge>
          )}
        </div>
      )
    },
    {
      header: 'Kelas',
      cell: (item: SiswaTunggakan) => (
        <Badge variant="outline">{item.kelas}</Badge>
      )
    },
    {
      header: 'Rincian Tunggakan per TA',
      cell: (item: SiswaTunggakan) => {
        const groups = groupItemsPerTa(item.items);
        return (
          <div className="space-y-2">
            {groups.map((g, idx) => (
              <div key={idx} className={`p-2 rounded border ${g.is_warisan ? 'border-warning/30 bg-warning/5' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold flex items-center gap-1">
                    {g.is_warisan && <HistoryIcon className="h-3 w-3 text-warning" />}
                    {g.ta_label}
                    {g.is_warisan && <Badge variant="outline" className="bg-warning/15 text-warning border-warning/40 text-[9px] px-1 py-0">Warisan</Badge>}
                  </span>
                  <span className="text-xs font-bold text-destructive">{formatCurrency(g.total)}</span>
                </div>
                {g.items.slice(0, 3).map((t, i) => (
                  <div key={i} className="text-xs text-muted-foreground pl-2">
                    • {t.jenis_tagihan}
                    {t.bulan && t.tahun && ` (${bulanOptions[t.bulan - 1]} ${t.tahun})`}
                    <span className="text-destructive ml-1">{formatCurrency(t.sisa)}</span>
                  </div>
                ))}
                {g.items.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-2 italic">+{g.items.length - 3} lainnya</p>
                )}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Total',
      cell: (item: SiswaTunggakan) => (
        <div className="text-right">
          <span className="font-bold text-lg text-destructive">
            {formatCurrency(item.total_tunggakan)}
          </span>
          <p className="text-xs text-muted-foreground">{item.items.length} tagihan</p>
        </div>
      )
    },
    {
      header: 'WA',
      cell: (item: SiswaTunggakan) => item.wa_ortu && (
        <a
          href={getWhatsAppUrl(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
        >
          <Phone className="h-4 w-4" />
          Kirim
        </a>
      ),
      className: 'w-28'
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Tunggakan"
        description="Daftar siswa dengan tunggakan pembayaran (dikelompokkan per Tahun Ajaran)"
        icon={<AlertTriangle className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-card border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Total Tunggakan (terfilter)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalTunggakan)}</p>
            <p className="text-sm text-muted-foreground mt-1">{filteredData.length} siswa</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-warning flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Tunggakan Warisan (TA Sebelumnya)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totalWarisan)}</p>
            <p className="text-sm text-muted-foreground mt-1">Hutang dari TA non-aktif</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama / NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterTa} onValueChange={setFilterTa}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
            {taList.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.nama_ta} {t.semester === 'genap' ? 'Genap' : 'Ganjil'}
                {t.is_active && ' (Aktif)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterKelas} onValueChange={setFilterKelas}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {kelasList.map(k => (
              <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        loading={loading}
        emptyMessage="Tidak ada tunggakan sesuai filter"
      />
    </div>
  );
}
