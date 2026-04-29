import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/supabase-helpers';
import { mapDatabaseError } from '@/lib/error-mapper';

interface Siswa {
  id: string;
  nama: string;
  nis: string;
}

interface JenisTagihan {
  id: string;
  nama_tagihan: string;
  nominal: number;
}

interface TahunAjaran {
  id: string;
  nama_ta: string;
  semester: string | null;
  is_active: boolean | null;
}

interface InputTunggakanLamaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siswa: Siswa[];
  jenisTagihan: JenisTagihan[];
  onSaved: () => void;
}

const bulanOptions = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

export function InputTunggakanLamaDialog({
  open,
  onOpenChange,
  siswa,
  jenisTagihan,
  onSaved,
}: InputTunggakanLamaDialogProps) {
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    siswa_id: '',
    ta_id: '',
    jenis_tagihan_id: '',
    bulan: '',
    tahun: '',
    nominal: '',
    nominal_bayar: '0',
    keterangan: 'Tunggakan warisan TA sebelumnya',
  });

  useEffect(() => {
    if (open) {
      fetchTA();
      setForm({
        siswa_id: '',
        ta_id: '',
        jenis_tagihan_id: '',
        bulan: '',
        tahun: '',
        nominal: '',
        nominal_bayar: '0',
        keterangan: 'Tunggakan warisan TA sebelumnya',
      });
    }
  }, [open]);

  const fetchTA = async () => {
    const { data } = await supabase
      .from('tahun_ajaran')
      .select('id, nama_ta, semester, is_active')
      .order('nama_ta', { ascending: false });
    if (data) setTahunAjaran(data);
  };

  const handleTagihanChange = (id: string) => {
    const t = jenisTagihan.find(x => x.id === id);
    setForm({ ...form, jenis_tagihan_id: id, nominal: t ? String(t.nominal) : '' });
  };

  const handleTaChange = (id: string) => {
    // Auto-suggest tahun dari nama TA (mis. "2024/2025" -> 2024 untuk Ganjil, 2025 untuk Genap)
    const ta = tahunAjaran.find(t => t.id === id);
    let suggestedYear = form.tahun;
    if (ta && !form.tahun) {
      const match = ta.nama_ta.match(/(\d{4})\s*\/\s*(\d{4})/);
      if (match) {
        suggestedYear = ta.semester === 'genap' ? match[2] : match[1];
      }
    }
    setForm({ ...form, ta_id: id, tahun: suggestedYear });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.siswa_id || !form.ta_id || !form.jenis_tagihan_id) {
      toast.error('Siswa, Tahun Ajaran, dan Jenis Tagihan wajib dipilih');
      return;
    }

    const nominal = parseFloat(form.nominal) || 0;
    const nominalBayar = parseFloat(form.nominal_bayar) || 0;

    if (nominal <= 0) {
      toast.error('Nominal tagihan harus > 0');
      return;
    }
    if (nominalBayar > nominal) {
      toast.error('Nominal bayar tidak boleh melebihi nominal tagihan');
      return;
    }

    const sisa = nominal - nominalBayar;
    if (sisa <= 0) {
      toast.error('Sisa tunggakan harus > 0 (gunakan menu Pembayaran biasa untuk tagihan lunas)');
      return;
    }

    const status = nominalBayar > 0 ? 'cicil' : 'belum_lunas';

    setSubmitting(true);
    try {
      const { error } = await supabase.from('pembayaran').insert({
        siswa_id: form.siswa_id,
        ta_id: form.ta_id,
        jenis_tagihan_id: form.jenis_tagihan_id,
        bulan: form.bulan ? parseInt(form.bulan) : null,
        tahun: form.tahun ? parseInt(form.tahun) : null,
        nominal,
        nominal_bayar: nominalBayar,
        tanggal_bayar: nominalBayar > 0 ? new Date().toISOString() : null,
        status,
        keterangan: form.keterangan || null,
      });

      if (error) throw error;
      toast.success(`Tunggakan ${formatCurrency(sisa)} berhasil dicatat`);
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const sisa = (parseFloat(form.nominal) || 0) - (parseFloat(form.nominal_bayar) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-warning" />
            Input Tunggakan Lama (Warisan TA Sebelumnya)
          </DialogTitle>
          <DialogDescription>
            Catat sisa hutang siswa dari Tahun Ajaran sebelumnya. Pilih TA asal hutang agar laporan keuangan akurat.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-warning/30 bg-warning/10">
          <AlertDescription className="text-sm">
            💡 Gunakan form ini hanya untuk <b>tagihan lama yang belum lunas</b> dari TA sebelumnya. 
            Untuk tagihan periode aktif, gunakan tombol <b>Proses Pembayaran</b>.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Siswa *</Label>
            <Select value={form.siswa_id} onValueChange={(v) => setForm({ ...form, siswa_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
              <SelectContent>
                {siswa.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nis} - {s.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tahun Ajaran Asal Hutang *</Label>
            <Select value={form.ta_id} onValueChange={handleTaChange}>
              <SelectTrigger><SelectValue placeholder="Pilih TA asal tunggakan" /></SelectTrigger>
              <SelectContent>
                {tahunAjaran.map(ta => (
                  <SelectItem key={ta.id} value={ta.id}>
                    {ta.nama_ta} - {ta.semester === 'genap' ? 'Genap' : 'Ganjil'}
                    {ta.is_active && ' (Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jenis Tagihan *</Label>
            <Select value={form.jenis_tagihan_id} onValueChange={handleTagihanChange}>
              <SelectTrigger><SelectValue placeholder="Pilih jenis tagihan" /></SelectTrigger>
              <SelectContent>
                {jenisTagihan.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama_tagihan} ({formatCurrency(t.nominal)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bulan (opsional)</Label>
              <Select value={form.bulan} onValueChange={(v) => setForm({ ...form, bulan: v })}>
                <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>
                  {bulanOptions.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun (opsional)</Label>
              <Input
                type="number"
                placeholder="2025"
                value={form.tahun}
                onChange={(e) => setForm({ ...form, tahun: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nominal Tagihan *</Label>
              <Input
                type="number"
                min="1"
                value={form.nominal}
                onChange={(e) => setForm({ ...form, nominal: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Sudah Dibayar</Label>
              <Input
                type="number"
                min="0"
                value={form.nominal_bayar}
                onChange={(e) => setForm({ ...form, nominal_bayar: e.target.value })}
              />
            </div>
          </div>

          {sisa > 0 && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-muted-foreground">Sisa tunggakan yang akan dicatat:</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(sisa)}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Input
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Mis. Tunggakan SPP TA 2024/2025"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Catat Tunggakan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
