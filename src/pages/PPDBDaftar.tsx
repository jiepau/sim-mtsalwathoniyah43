import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
const logoImg = '/logo-alwathoniyah.png';

const pendidikanOptions = ['Tidak Sekolah', 'SD/MI', 'SMP/MTs', 'SMA/MA', 'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3'];
const pekerjaanOptions = ['Tidak Bekerja', 'Nelayan', 'Petani', 'Peternak', 'PNS/TNI/Polri', 'Karyawan Swasta', 'Pedagang Kecil', 'Pedagang Besar', 'Wiraswasta', 'Wirausaha', 'Buruh', 'Pensiunan', 'Lainnya'];
const penghasilanOptions = ['< Rp 500.000', 'Rp 500.000 - Rp 1.000.000', 'Rp 1.000.000 - Rp 2.000.000', 'Rp 2.000.000 - Rp 5.000.000', '> Rp 5.000.000'];
const transportasiOptions = ['Jalan kaki', 'Sepeda', 'Sepeda Motor', 'Angkutan Umum', 'Mobil Pribadi', 'Ojek', 'Lainnya'];
const statusTinggalOptions = ['Milik Sendiri', 'Kontrak/Sewa', 'Menumpang', 'Lainnya'];
const membiayaiOptions = ['Orang Tua', 'Wali', 'Beasiswa', 'Lainnya'];
const agamaOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Konghucu'];
const jarakOptions = ['< 1 km', '1 - 5 km', '5 - 10 km', '> 10 km'];
const waktuTempuhOptions = ['< 15 menit', '15 - 30 menit', '30 - 60 menit', '> 60 menit'];

type FormData = Record<string, string>;

const initialForm: FormData = {
  nama: '', nik: '', nisn: '', kip: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '',
  agama: 'Islam', alamat: '', jumlah_saudara: '', anak_ke: '', hobi: '', cita_cita: '',
  no_hp: '', email_siswa: '', asal_sekolah: '', yang_membiayai: '', kebutuhan_disabilitas: '',
  kebutuhan_khusus: '', status_tempat_tinggal: '', jarak_ke_madrasah: '', waktu_tempuh: '', transportasi: '',
  nama_ayah: '', ayah_nik: '', ayah_tempat_lahir: '', ayah_tanggal_lahir: '', ayah_status: '',
  ayah_pendidikan: '', ayah_pekerjaan: '', ayah_domisili: '', ayah_no_hp: '', ayah_penghasilan: '',
  ayah_alamat: '', ayah_status_tempat_tinggal: '',
  nama_ibu: '', ibu_nik: '', ibu_nama: '', ibu_tempat_lahir: '', ibu_tanggal_lahir: '', ibu_status: '',
  ibu_pendidikan: '', ibu_pekerjaan: '', ibu_domisili: '', ibu_no_hp: '', ibu_penghasilan: '',
  ibu_alamat: '', ibu_status_tempat_tinggal: '',
  wali_nik: '', wali_nama: '', wali_tempat_lahir: '', wali_tanggal_lahir: '', wali_status: '',
  wali_pendidikan: '', wali_pekerjaan: '', wali_domisili: '', wali_no_hp: '', wali_penghasilan: '',
  wali_alamat: '', wali_status_tempat_tinggal: '', wa_ortu: '',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 pb-2">
      <h3 className="text-sm font-semibold text-primary">{children}</h3>
      <Separator className="mt-1" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}{required && ' *'}</Label>
      {children}
    </div>
  );
}

function SelectField({ value, onValueChange, options, placeholder = 'Pilih' }: { value: string; onValueChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className="text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function PPDBDaftar() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...initialForm });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['ppdb-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ppdb_settings').select('*').limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

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
        no_hp: form.no_hp.trim() || null,
        email_siswa: form.email_siswa.trim() || null,
        asal_sekolah: form.asal_sekolah.trim() || null,
        yang_membiayai: form.yang_membiayai || null,
        kebutuhan_disabilitas: form.kebutuhan_disabilitas.trim() || null,
        kebutuhan_khusus: form.kebutuhan_khusus.trim() || null,
        status_tempat_tinggal: form.status_tempat_tinggal || null,
        jarak_ke_madrasah: form.jarak_ke_madrasah || null,
        waktu_tempuh: form.waktu_tempuh || null,
        transportasi: form.transportasi || null,
        // Ayah
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
        // Ibu
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
        // Wali
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

      const { error } = await supabase.from('ppdb_pendaftar').insert(payload);
      if (error) throw error;
      return nomor as string;
    },
    onSuccess: (nomor) => { setSubmitted(nomor); toast.success('Pendaftaran berhasil!'); },
    onError: (err: Error) => toast.error(err.message),
  });

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOpen = settings?.is_open ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <img src={logoImg} alt="Logo" className="h-16 mx-auto" />
          <CardTitle className="text-lg">Seleksi Penerimaan Murid Baru</CardTitle>
          <p className="text-sm text-muted-foreground">
            MTs Al-Wathoniyah 43 — TA {settings?.tahun_ajaran ?? '-'}
          </p>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-lg font-bold">Pendaftaran Berhasil!</h2>
              <p className="text-sm text-muted-foreground">Nomor pendaftaran Anda:</p>
              <p className="text-2xl font-mono font-bold text-primary">{submitted}</p>
              <p className="text-xs text-muted-foreground">Simpan nomor ini untuk pengecekan hasil seleksi.</p>
              <Link to="/spmb/cek-status" className="inline-block mt-2 text-sm text-primary hover:underline font-medium">
                Cek Status Pendaftaran →
              </Link>
              {settings?.pesan_selamat && <p className="text-sm mt-4">{settings.pesan_selamat}</p>}
            </div>
          ) : !isOpen ? (
            <div className="text-center space-y-4 py-8">
              <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
              <h2 className="text-lg font-semibold">Pendaftaran Ditutup</h2>
              <p className="text-sm text-muted-foreground">
                Saat ini pendaftaran belum dibuka. Silakan hubungi pihak madrasah untuk informasi lebih lanjut.
              </p>
            </div>
          ) : (
            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
              {/* === DATA SISWA === */}
              <SectionTitle>Data Pribadi Siswa</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Field label="Nama Lengkap" required><Input value={form.nama} onChange={(e) => set('nama', e.target.value)} required /></Field>
                </div>
                <Field label="NIK"><Input value={form.nik} onChange={(e) => set('nik', e.target.value)} maxLength={16} /></Field>
                <Field label="NISN"><Input value={form.nisn} onChange={(e) => set('nisn', e.target.value)} /></Field>
                <Field label="KIP"><Input value={form.kip} onChange={(e) => set('kip', e.target.value)} /></Field>
                <Field label="Jenis Kelamin" required>
                  <SelectField value={form.jenis_kelamin} onValueChange={(v) => set('jenis_kelamin', v)} options={['L', 'P']} placeholder="L / P" />
                </Field>
                <Field label="Tempat Lahir"><Input value={form.tempat_lahir} onChange={(e) => set('tempat_lahir', e.target.value)} /></Field>
                <Field label="Tanggal Lahir"><Input type="date" value={form.tanggal_lahir} onChange={(e) => set('tanggal_lahir', e.target.value)} /></Field>
                <Field label="Agama">
                  <SelectField value={form.agama} onValueChange={(v) => set('agama', v)} options={agamaOptions} />
                </Field>
                <Field label="Jumlah Saudara"><Input type="number" min={0} value={form.jumlah_saudara} onChange={(e) => set('jumlah_saudara', e.target.value)} /></Field>
                <Field label="Anak Ke"><Input type="number" min={1} value={form.anak_ke} onChange={(e) => set('anak_ke', e.target.value)} /></Field>
                <Field label="Hobi"><Input value={form.hobi} onChange={(e) => set('hobi', e.target.value)} /></Field>
                <Field label="Cita-cita"><Input value={form.cita_cita} onChange={(e) => set('cita_cita', e.target.value)} /></Field>
                <Field label="No. Handphone"><Input value={form.no_hp} onChange={(e) => set('no_hp', e.target.value)} placeholder="08xxx" /></Field>
                <Field label="Alamat Email Siswa"><Input type="email" value={form.email_siswa} onChange={(e) => set('email_siswa', e.target.value)} /></Field>
                <Field label="Asal Sekolah"><Input value={form.asal_sekolah} onChange={(e) => set('asal_sekolah', e.target.value)} /></Field>
                <Field label="Yang Membiayai Sekolah">
                  <SelectField value={form.yang_membiayai} onValueChange={(v) => set('yang_membiayai', v)} options={membiayaiOptions} />
                </Field>
                <Field label="Kebutuhan Disabilitas"><Input value={form.kebutuhan_disabilitas} onChange={(e) => set('kebutuhan_disabilitas', e.target.value)} placeholder="Tidak ada" /></Field>
                <Field label="Kebutuhan Khusus"><Input value={form.kebutuhan_khusus} onChange={(e) => set('kebutuhan_khusus', e.target.value)} placeholder="Tidak ada" /></Field>
                <div className="sm:col-span-2">
                  <Field label="Alamat"><Textarea value={form.alamat} onChange={(e) => set('alamat', e.target.value)} rows={2} /></Field>
                </div>
                <Field label="Status Tempat Tinggal">
                  <SelectField value={form.status_tempat_tinggal} onValueChange={(v) => set('status_tempat_tinggal', v)} options={statusTinggalOptions} />
                </Field>
                <Field label="Jarak Tempat Tinggal - Madrasah">
                  <SelectField value={form.jarak_ke_madrasah} onValueChange={(v) => set('jarak_ke_madrasah', v)} options={jarakOptions} />
                </Field>
                <Field label="Waktu Tempuh">
                  <SelectField value={form.waktu_tempuh} onValueChange={(v) => set('waktu_tempuh', v)} options={waktuTempuhOptions} />
                </Field>
                <Field label="Transportasi ke Sekolah">
                  <SelectField value={form.transportasi} onValueChange={(v) => set('transportasi', v)} options={transportasiOptions} />
                </Field>
              </div>

              {/* === AYAH KANDUNG === */}
              <SectionTitle>Data Ayah Kandung</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nama Lengkap"><Input value={form.nama_ayah} onChange={(e) => set('nama_ayah', e.target.value)} /></Field>
                <Field label="NIK"><Input value={form.ayah_nik} onChange={(e) => set('ayah_nik', e.target.value)} maxLength={16} /></Field>
                <Field label="Tempat Lahir"><Input value={form.ayah_tempat_lahir} onChange={(e) => set('ayah_tempat_lahir', e.target.value)} /></Field>
                <Field label="Tanggal Lahir"><Input type="date" value={form.ayah_tanggal_lahir} onChange={(e) => set('ayah_tanggal_lahir', e.target.value)} /></Field>
                <Field label="Status"><Input value={form.ayah_status} onChange={(e) => set('ayah_status', e.target.value)} placeholder="Masih Hidup / Meninggal" /></Field>
                <Field label="Pendidikan Terakhir">
                  <SelectField value={form.ayah_pendidikan} onValueChange={(v) => set('ayah_pendidikan', v)} options={pendidikanOptions} />
                </Field>
                <Field label="Pekerjaan Utama">
                  <SelectField value={form.ayah_pekerjaan} onValueChange={(v) => set('ayah_pekerjaan', v)} options={pekerjaanOptions} />
                </Field>
                <Field label="Domisili"><Input value={form.ayah_domisili} onChange={(e) => set('ayah_domisili', e.target.value)} /></Field>
                <Field label="No. Handphone"><Input value={form.ayah_no_hp} onChange={(e) => set('ayah_no_hp', e.target.value)} placeholder="08xxx" /></Field>
                <Field label="Penghasilan Rata-rata Per Bulan">
                  <SelectField value={form.ayah_penghasilan} onValueChange={(v) => set('ayah_penghasilan', v)} options={penghasilanOptions} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Alamat"><Textarea value={form.ayah_alamat} onChange={(e) => set('ayah_alamat', e.target.value)} rows={2} /></Field>
                </div>
                <Field label="Status Tempat Tinggal">
                  <SelectField value={form.ayah_status_tempat_tinggal} onValueChange={(v) => set('ayah_status_tempat_tinggal', v)} options={statusTinggalOptions} />
                </Field>
              </div>

              {/* === IBU KANDUNG === */}
              <SectionTitle>Data Ibu Kandung</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nama Lengkap"><Input value={form.ibu_nama} onChange={(e) => set('ibu_nama', e.target.value)} /></Field>
                <Field label="NIK"><Input value={form.ibu_nik} onChange={(e) => set('ibu_nik', e.target.value)} maxLength={16} /></Field>
                <Field label="Tempat Lahir"><Input value={form.ibu_tempat_lahir} onChange={(e) => set('ibu_tempat_lahir', e.target.value)} /></Field>
                <Field label="Tanggal Lahir"><Input type="date" value={form.ibu_tanggal_lahir} onChange={(e) => set('ibu_tanggal_lahir', e.target.value)} /></Field>
                <Field label="Status"><Input value={form.ibu_status} onChange={(e) => set('ibu_status', e.target.value)} placeholder="Masih Hidup / Meninggal" /></Field>
                <Field label="Pendidikan Terakhir">
                  <SelectField value={form.ibu_pendidikan} onValueChange={(v) => set('ibu_pendidikan', v)} options={pendidikanOptions} />
                </Field>
                <Field label="Pekerjaan Utama">
                  <SelectField value={form.ibu_pekerjaan} onValueChange={(v) => set('ibu_pekerjaan', v)} options={pekerjaanOptions} />
                </Field>
                <Field label="Domisili"><Input value={form.ibu_domisili} onChange={(e) => set('ibu_domisili', e.target.value)} /></Field>
                <Field label="No. Handphone"><Input value={form.ibu_no_hp} onChange={(e) => set('ibu_no_hp', e.target.value)} placeholder="08xxx" /></Field>
                <Field label="Penghasilan Rata-rata Per Bulan">
                  <SelectField value={form.ibu_penghasilan} onValueChange={(v) => set('ibu_penghasilan', v)} options={penghasilanOptions} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Alamat"><Textarea value={form.ibu_alamat} onChange={(e) => set('ibu_alamat', e.target.value)} rows={2} /></Field>
                </div>
                <Field label="Status Tempat Tinggal">
                  <SelectField value={form.ibu_status_tempat_tinggal} onValueChange={(v) => set('ibu_status_tempat_tinggal', v)} options={statusTinggalOptions} />
                </Field>
              </div>

              {/* === WALI === */}
              <SectionTitle>Data Wali (Opsional)</SectionTitle>
              <p className="text-xs text-muted-foreground">Isi jika wali berbeda dari orang tua kandung</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nama Lengkap"><Input value={form.wali_nama} onChange={(e) => set('wali_nama', e.target.value)} /></Field>
                <Field label="NIK"><Input value={form.wali_nik} onChange={(e) => set('wali_nik', e.target.value)} maxLength={16} /></Field>
                <Field label="Tempat Lahir"><Input value={form.wali_tempat_lahir} onChange={(e) => set('wali_tempat_lahir', e.target.value)} /></Field>
                <Field label="Tanggal Lahir"><Input type="date" value={form.wali_tanggal_lahir} onChange={(e) => set('wali_tanggal_lahir', e.target.value)} /></Field>
                <Field label="Status"><Input value={form.wali_status} onChange={(e) => set('wali_status', e.target.value)} /></Field>
                <Field label="Pendidikan Terakhir">
                  <SelectField value={form.wali_pendidikan} onValueChange={(v) => set('wali_pendidikan', v)} options={pendidikanOptions} />
                </Field>
                <Field label="Pekerjaan Utama">
                  <SelectField value={form.wali_pekerjaan} onValueChange={(v) => set('wali_pekerjaan', v)} options={pekerjaanOptions} />
                </Field>
                <Field label="Domisili"><Input value={form.wali_domisili} onChange={(e) => set('wali_domisili', e.target.value)} /></Field>
                <Field label="No. Handphone"><Input value={form.wali_no_hp} onChange={(e) => set('wali_no_hp', e.target.value)} placeholder="08xxx" /></Field>
                <Field label="Penghasilan Rata-rata Per Bulan">
                  <SelectField value={form.wali_penghasilan} onValueChange={(v) => set('wali_penghasilan', v)} options={penghasilanOptions} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Alamat"><Textarea value={form.wali_alamat} onChange={(e) => set('wali_alamat', e.target.value)} rows={2} /></Field>
                </div>
                <Field label="Status Tempat Tinggal">
                  <SelectField value={form.wali_status_tempat_tinggal} onValueChange={(v) => set('wali_status_tempat_tinggal', v)} options={statusTinggalOptions} />
                </Field>
              </div>

              {/* === KONTAK UTAMA === */}
              <SectionTitle>Kontak Utama (WA Orang Tua/Wali)</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="No. WA Orang Tua / Wali"><Input value={form.wa_ortu} onChange={(e) => set('wa_ortu', e.target.value)} placeholder="08xxxxxxxxxx" /></Field>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Daftar Sekarang
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
