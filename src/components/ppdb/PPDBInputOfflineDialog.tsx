import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { UserPlus, CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyForm = (): Record<string, string> => ({
  nama: '', nik: '', nisn: '', kip: '',
  tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', agama: 'Islam',
  alamat: '', no_hp: '', email_siswa: '',
  asal_sekolah: '', npsn_asal_sekolah: '', nsm_asal_sekolah: '',
  jumlah_saudara: '', anak_ke: '',
  hobi: '', cita_cita: '', prestasi: '',
  yang_membiayai: '', kebutuhan_disabilitas: '', kebutuhan_khusus: '',
  status_tempat_tinggal: '', jarak_ke_madrasah: '', waktu_tempuh: '', transportasi: '',
  // Ayah
  nama_ayah: '', ayah_nik: '', ayah_tempat_lahir: '', ayah_tanggal_lahir: '',
  ayah_status: '', ayah_pendidikan: '', ayah_pekerjaan: '',
  ayah_domisili: '', ayah_no_hp: '', ayah_penghasilan: '',
  ayah_alamat: '', ayah_status_tempat_tinggal: '',
  // Ibu
  nama_ibu: '', ibu_nik: '', ibu_nama: '', ibu_tempat_lahir: '', ibu_tanggal_lahir: '',
  ibu_status: '', ibu_pendidikan: '', ibu_pekerjaan: '',
  ibu_domisili: '', ibu_no_hp: '', ibu_penghasilan: '',
  ibu_alamat: '', ibu_status_tempat_tinggal: '',
  // Wali
  wali_nik: '', wali_nama: '', wali_tempat_lahir: '', wali_tanggal_lahir: '',
  wali_status: '', wali_pendidikan: '', wali_pekerjaan: '',
  wali_domisili: '', wali_no_hp: '', wali_penghasilan: '',
  wali_alamat: '', wali_status_tempat_tinggal: '',
  // WA
  wa_ortu: '',
});

export function PPDBInputOfflineDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>(emptyForm());
  const [result, setResult] = useState<string | null>(null);

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.nama.trim()) throw new Error('Nama wajib diisi');
      if (!form.jenis_kelamin) throw new Error('Jenis kelamin wajib dipilih');

      const { data: nomor, error: rpcErr } = await supabase.rpc('generate_nomor_ppdb');
      if (rpcErr) throw rpcErr;

      const payload: Record<string, unknown> = {
        nomor_pendaftaran: nomor,
        nama: form.nama.trim(),
        nik: form.nik.trim() || null,
        nisn: form.nisn.trim() || null,
        kip: form.kip.trim() || null,
        tempat_lahir: form.tempat_lahir.trim() || null,
        tanggal_lahir: form.tanggal_lahir || null,
        jenis_kelamin: form.jenis_kelamin || null,
        agama: form.agama || null,
        alamat: form.alamat.trim() || null,
        jumlah_saudara: form.jumlah_saudara ? parseInt(form.jumlah_saudara) : null,
        anak_ke: form.anak_ke ? parseInt(form.anak_ke) : null,
        hobi: form.hobi.trim() || null,
        cita_cita: form.cita_cita.trim() || null,
        prestasi: form.prestasi.trim() || null,
        no_hp: form.no_hp.trim() || null,
        email_siswa: form.email_siswa.trim() || null,
        asal_sekolah: form.asal_sekolah.trim() || null,
        npsn_asal_sekolah: form.npsn_asal_sekolah.trim() || null,
        nsm_asal_sekolah: form.nsm_asal_sekolah.trim() || null,
        yang_membiayai: form.yang_membiayai || null,
        kebutuhan_disabilitas: form.kebutuhan_disabilitas.trim() || null,
        kebutuhan_khusus: form.kebutuhan_khusus.trim() || null,
        status_tempat_tinggal: form.status_tempat_tinggal || null,
        jarak_ke_madrasah: form.jarak_ke_madrasah || null,
        waktu_tempuh: form.waktu_tempuh || null,
        transportasi: form.transportasi || null,
        nama_ayah: form.nama_ayah.trim() || null,
        ayah_nik: form.ayah_nik.trim() || null,
        ayah_tempat_lahir: form.ayah_tempat_lahir.trim() || null,
        ayah_tanggal_lahir: form.ayah_tanggal_lahir || null,
        ayah_status: form.ayah_status.trim() || null,
        ayah_pendidikan: form.ayah_pendidikan || null,
        ayah_pekerjaan: form.ayah_pekerjaan || null,
        ayah_domisili: form.ayah_domisili.trim() || null,
        ayah_no_hp: form.ayah_no_hp.trim() || null,
        ayah_penghasilan: form.ayah_penghasilan || null,
        ayah_alamat: form.ayah_alamat.trim() || null,
        ayah_status_tempat_tinggal: form.ayah_status_tempat_tinggal || null,
        nama_ibu: form.ibu_nama.trim() || form.nama_ibu.trim() || null,
        ibu_nik: form.ibu_nik.trim() || null,
        ibu_nama: form.ibu_nama.trim() || form.nama_ibu.trim() || null,
        ibu_tempat_lahir: form.ibu_tempat_lahir.trim() || null,
        ibu_tanggal_lahir: form.ibu_tanggal_lahir || null,
        ibu_status: form.ibu_status.trim() || null,
        ibu_pendidikan: form.ibu_pendidikan || null,
        ibu_pekerjaan: form.ibu_pekerjaan || null,
        ibu_domisili: form.ibu_domisili.trim() || null,
        ibu_no_hp: form.ibu_no_hp.trim() || null,
        ibu_penghasilan: form.ibu_penghasilan || null,
        ibu_alamat: form.ibu_alamat.trim() || null,
        ibu_status_tempat_tinggal: form.ibu_status_tempat_tinggal || null,
        wali_nik: form.wali_nik.trim() || null,
        wali_nama: form.wali_nama.trim() || null,
        wali_tempat_lahir: form.wali_tempat_lahir.trim() || null,
        wali_tanggal_lahir: form.wali_tanggal_lahir || null,
        wali_status: form.wali_status.trim() || null,
        wali_pendidikan: form.wali_pendidikan || null,
        wali_pekerjaan: form.wali_pekerjaan || null,
        wali_domisili: form.wali_domisili.trim() || null,
        wali_no_hp: form.wali_no_hp.trim() || null,
        wali_penghasilan: form.wali_penghasilan || null,
        wali_alamat: form.wali_alamat.trim() || null,
        wali_status_tempat_tinggal: form.wali_status_tempat_tinggal || null,
        wa_ortu: form.wa_ortu.trim() || form.ayah_no_hp.trim() || form.ibu_no_hp.trim() || null,
      };

      const { error } = await supabase.from('ppdb_pendaftar').insert(payload as any);
      if (error) throw error;
      return nomor as string;
    },
    onSuccess: (nomor) => {
      setResult(nomor);
      qc.invalidateQueries({ queryKey: ['ppdb-pendaftar'] });
      toast.success('Pendaftar offline berhasil ditambahkan');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleClose = () => {
    setForm(emptyForm());
    setResult(null);
    onOpenChange(false);
  };

  const Field = ({ label, field, type = 'text', required = false, placeholder = '' }: { label: string; field: string; type?: string; required?: boolean; placeholder?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input type={type} value={form[field] || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder} className="h-9 text-sm" />
    </div>
  );

  const SelectField = ({ label, field, options, required = false }: { label: string; field: string; options: { value: string; label: string }[]; required?: boolean }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Select value={form[field] || 'none'} onValueChange={v => set(field, v === 'none' ? '' : v)}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">-- Pilih --</SelectItem>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const pendidikanOptions = [
    { value: 'Tidak Sekolah', label: 'Tidak Sekolah' },
    { value: 'SD/MI', label: 'SD/MI' },
    { value: 'SMP/MTs', label: 'SMP/MTs' },
    { value: 'SMA/MA', label: 'SMA/MA' },
    { value: 'D1', label: 'D1' }, { value: 'D2', label: 'D2' }, { value: 'D3', label: 'D3' },
    { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }, { value: 'S3', label: 'S3' },
  ];

  const penghasilanOptions = [
    { value: '< 1.000.000', label: '< 1.000.000' },
    { value: '1.000.000 - 3.000.000', label: '1.000.000 - 3.000.000' },
    { value: '3.000.000 - 5.000.000', label: '3.000.000 - 5.000.000' },
    { value: '> 5.000.000', label: '> 5.000.000' },
  ];

  if (result) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Pendaftaran Berhasil!</h3>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Nomor Pendaftaran:</p>
              <p className="text-2xl font-mono font-bold text-primary">{result}</p>
            </div>
            <Button onClick={handleClose} className="w-full mt-2">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Input Pendaftar Offline
          </DialogTitle>
          <DialogDescription>
            Input data calon siswa yang mendaftar langsung ke sekolah
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          <Accordion type="multiple" defaultValue={['data-siswa']} className="w-full">
            {/* Data Siswa */}
            <AccordionItem value="data-siswa">
              <AccordionTrigger className="text-sm font-semibold py-2">📋 Data Calon Siswa</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nama Lengkap" field="nama" required placeholder="Nama lengkap calon siswa" />
                  <SelectField label="Jenis Kelamin" field="jenis_kelamin" required options={[{ value: 'Laki-laki', label: 'Laki-laki' }, { value: 'Perempuan', label: 'Perempuan' }]} />
                  <Field label="NIK" field="nik" placeholder="16 digit" />
                  <Field label="NISN" field="nisn" placeholder="10 digit" />
                  <Field label="KIP" field="kip" placeholder="Nomor KIP (jika ada)" />
                  <Field label="Tempat Lahir" field="tempat_lahir" placeholder="Kota/Kab lahir" />
                  <Field label="Tanggal Lahir" field="tanggal_lahir" type="date" />
                  <SelectField label="Agama" field="agama" options={[{ value: 'Islam', label: 'Islam' }, { value: 'Kristen', label: 'Kristen' }, { value: 'Katolik', label: 'Katolik' }, { value: 'Hindu', label: 'Hindu' }, { value: 'Buddha', label: 'Buddha' }, { value: 'Konghucu', label: 'Konghucu' }]} />
                </div>
                <Field label="Alamat" field="alamat" placeholder="Alamat lengkap" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="No HP" field="no_hp" placeholder="No HP calon siswa" />
                  <Field label="Email" field="email_siswa" type="email" placeholder="Email (opsional)" />
                  <Field label="Asal Sekolah" field="asal_sekolah" placeholder="Nama SD/MI asal" />
                  <Field label="NPSN Asal" field="npsn_asal_sekolah" placeholder="NPSN sekolah asal" />
                  <Field label="Jumlah Saudara" field="jumlah_saudara" type="number" />
                  <Field label="Anak Ke" field="anak_ke" type="number" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="No WA Orang Tua" field="wa_ortu" required placeholder="08xxxxxxxxxx" />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Data Ayah */}
            <AccordionItem value="data-ayah">
              <AccordionTrigger className="text-sm font-semibold py-2">👨 Data Ayah</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nama Ayah" field="nama_ayah" placeholder="Nama lengkap" />
                  <Field label="NIK Ayah" field="ayah_nik" placeholder="16 digit" />
                  <Field label="Tempat Lahir" field="ayah_tempat_lahir" />
                  <Field label="Tanggal Lahir" field="ayah_tanggal_lahir" type="date" />
                  <SelectField label="Pendidikan" field="ayah_pendidikan" options={pendidikanOptions} />
                  <Field label="Pekerjaan" field="ayah_pekerjaan" placeholder="Pekerjaan ayah" />
                  <Field label="No HP" field="ayah_no_hp" placeholder="08xxxxxxxxxx" />
                  <SelectField label="Penghasilan" field="ayah_penghasilan" options={penghasilanOptions} />
                </div>
                <Field label="Alamat" field="ayah_alamat" placeholder="Alamat ayah" />
              </AccordionContent>
            </AccordionItem>

            {/* Data Ibu */}
            <AccordionItem value="data-ibu">
              <AccordionTrigger className="text-sm font-semibold py-2">👩 Data Ibu</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nama Ibu" field="ibu_nama" placeholder="Nama lengkap" />
                  <Field label="NIK Ibu" field="ibu_nik" placeholder="16 digit" />
                  <Field label="Tempat Lahir" field="ibu_tempat_lahir" />
                  <Field label="Tanggal Lahir" field="ibu_tanggal_lahir" type="date" />
                  <SelectField label="Pendidikan" field="ibu_pendidikan" options={pendidikanOptions} />
                  <Field label="Pekerjaan" field="ibu_pekerjaan" placeholder="Pekerjaan ibu" />
                  <Field label="No HP" field="ibu_no_hp" placeholder="08xxxxxxxxxx" />
                  <SelectField label="Penghasilan" field="ibu_penghasilan" options={penghasilanOptions} />
                </div>
                <Field label="Alamat" field="ibu_alamat" placeholder="Alamat ibu" />
              </AccordionContent>
            </AccordionItem>

            {/* Data Wali */}
            <AccordionItem value="data-wali">
              <AccordionTrigger className="text-sm font-semibold py-2">🧑‍🦳 Data Wali (Opsional)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nama Wali" field="wali_nama" placeholder="Nama lengkap" />
                  <Field label="NIK Wali" field="wali_nik" placeholder="16 digit" />
                  <Field label="Tempat Lahir" field="wali_tempat_lahir" />
                  <Field label="Tanggal Lahir" field="wali_tanggal_lahir" type="date" />
                  <SelectField label="Pendidikan" field="wali_pendidikan" options={pendidikanOptions} />
                  <Field label="Pekerjaan" field="wali_pekerjaan" placeholder="Pekerjaan wali" />
                  <Field label="No HP" field="wali_no_hp" placeholder="08xxxxxxxxxx" />
                  <SelectField label="Penghasilan" field="wali_penghasilan" options={penghasilanOptions} />
                </div>
                <Field label="Alamat" field="wali_alamat" placeholder="Alamat wali" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="border-t pt-4 shrink-0">
          <Button type="button" variant="outline" onClick={handleClose}>Batal</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Pendaftar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
