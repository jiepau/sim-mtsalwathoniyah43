import { useEffect, useState } from "react";
import { Settings, Save, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapDatabaseError } from "@/lib/error-mapper";
import { VersionChecker } from "@/components/settings/VersionChecker";

interface MadrasahSettings {
  id: string;
  nama_madrasah: string;
  npsn: string | null;
  nsm: string | null;
  alamat: string | null;
  kabupaten_kota: string | null;
  provinsi: string | null;
  kode_pos: string | null;
  no_telp: string | null;
  email: string | null;
  website: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
  akreditasi: string | null;
  no_sk_pendirian: string | null;
  tanggal_sk_pendirian: string | null;
  ttd_kepala_url: string | null;
  stempel_url: string | null;
}

export default function PengaturanMadrasahPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MadrasahSettings | null>(null);
  const [formData, setFormData] = useState({
    nama_madrasah: "",
    npsn: "",
    nsm: "",
    alamat: "",
    kabupaten_kota: "",
    provinsi: "",
    kode_pos: "",
    no_telp: "",
    email: "",
    website: "",
    kepala_madrasah: "",
    nip_kepala: "",
    akreditasi: "",
    no_sk_pendirian: "",
    tanggal_sk_pendirian: "",
    ttd_kepala_url: "",
    stempel_url: "",
  });
  const [uploadingTtd, setUploadingTtd] = useState(false);
  const [uploadingStempel, setUploadingStempel] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("madrasah_settings").select("*").limit(1).single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(data);
        setFormData({
          nama_madrasah: data.nama_madrasah || "",
          npsn: data.npsn || "",
          nsm: data.nsm || "",
          alamat: data.alamat || "",
          kabupaten_kota: data.kabupaten_kota || "",
          provinsi: data.provinsi || "",
          kode_pos: data.kode_pos || "",
          no_telp: data.no_telp || "",
          email: data.email || "",
          website: data.website || "",
          kepala_madrasah: data.kepala_madrasah || "",
          nip_kepala: data.nip_kepala || "",
          akreditasi: data.akreditasi || "",
          no_sk_pendirian: data.no_sk_pendirian || "",
          tanggal_sk_pendirian: data.tanggal_sk_pendirian || "",
          ttd_kepala_url: (data as any).ttd_kepala_url || "",
          stempel_url: (data as any).stempel_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        nama_madrasah: formData.nama_madrasah,
        npsn: formData.npsn || null,
        nsm: formData.nsm || null,
        alamat: formData.alamat || null,
        kabupaten_kota: formData.kabupaten_kota || null,
        provinsi: formData.provinsi || null,
        kode_pos: formData.kode_pos || null,
        no_telp: formData.no_telp || null,
        email: formData.email || null,
        website: formData.website || null,
        kepala_madrasah: formData.kepala_madrasah || null,
        nip_kepala: formData.nip_kepala || null,
        akreditasi: formData.akreditasi || null,
        no_sk_pendirian: formData.no_sk_pendirian || null,
        tanggal_sk_pendirian: formData.tanggal_sk_pendirian || null,
        ttd_kepala_url: formData.ttd_kepala_url || null,
        stempel_url: formData.stempel_url || null,
      };

      if (settings) {
        const { error } = await supabase.from("madrasah_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("madrasah_settings").insert(payload);
        if (error) throw error;
      }

      toast.success("Pengaturan berhasil disimpan");
      fetchSettings();
    } catch (error: any) {
      toast.error(mapDatabaseError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, kind: 'ttd' | 'stempel') => {
    if (!file.type.startsWith('image/')) { toast.error('File harus berupa gambar'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran maks 2MB'); return; }
    const setBusy = kind === 'ttd' ? setUploadingTtd : setUploadingStempel;
    setBusy(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('madrasah-assets').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('madrasah-assets').getPublicUrl(path);
      const field = kind === 'ttd' ? 'ttd_kepala_url' : 'stempel_url';
      setFormData((p) => ({ ...p, [field]: publicUrl }));
      toast.success('Berhasil diunggah. Klik Simpan Pengaturan untuk menyimpan.');
    } catch (e: any) {
      toast.error(mapDatabaseError(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <PageHeader
          title="Pengaturan Madrasah"
          description="Kelola identitas dan informasi madrasah"
          icon={<Settings className="h-6 w-6" />}
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
        title="Pengaturan Madrasah"
        description="Kelola identitas dan informasi madrasah untuk dokumen administrasi"
        icon={<Settings className="h-6 w-6" />}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Identitas Madrasah
            </CardTitle>
            <CardDescription>
              Informasi ini akan digunakan pada dokumen ATP, Prota, Promes, dan laporan lainnya
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama_madrasah">Nama Madrasah *</Label>
                <Input
                  id="nama_madrasah"
                  value={formData.nama_madrasah}
                  onChange={(e) => setFormData({ ...formData, nama_madrasah: e.target.value })}
                  placeholder="MTs Al-Wathoniyah 43"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npsn">NPSN</Label>
                <Input
                  id="npsn"
                  value={formData.npsn}
                  onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                  placeholder="20xxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nsm">NSM</Label>
                <Input
                  id="nsm"
                  value={formData.nsm}
                  onChange={(e) => setFormData({ ...formData, nsm: e.target.value })}
                  placeholder="1212xxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="akreditasi">Akreditasi</Label>
                <Input
                  id="akreditasi"
                  value={formData.akreditasi}
                  onChange={(e) => setFormData({ ...formData, akreditasi: e.target.value })}
                  placeholder="A / B / C"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="no_sk_pendirian">Nomor SK Pendirian</Label>
                <Input
                  id="no_sk_pendirian"
                  value={formData.no_sk_pendirian}
                  onChange={(e) => setFormData({ ...formData, no_sk_pendirian: e.target.value })}
                  placeholder="SK/xxx/xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_sk_pendirian">Tanggal SK Pendirian</Label>
                <Input
                  id="tanggal_sk_pendirian"
                  type="date"
                  value={formData.tanggal_sk_pendirian}
                  onChange={(e) => setFormData({ ...formData, tanggal_sk_pendirian: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Jl. ..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kabupaten_kota">Kabupaten/Kota</Label>
                <Input
                  id="kabupaten_kota"
                  value={formData.kabupaten_kota}
                  onChange={(e) => setFormData({ ...formData, kabupaten_kota: e.target.value })}
                  placeholder="Jakarta Timur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provinsi">Provinsi</Label>
                <Input
                  id="provinsi"
                  value={formData.provinsi}
                  onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                  placeholder="DKI Jakarta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kode_pos">Kode Pos</Label>
                <Input
                  id="kode_pos"
                  value={formData.kode_pos}
                  onChange={(e) => setFormData({ ...formData, kode_pos: e.target.value })}
                  placeholder="13xxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="no_telp">No. Telepon</Label>
                <Input
                  id="no_telp"
                  value={formData.no_telp}
                  onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
                  placeholder="021-xxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@mts.sch.id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://mts.sch.id"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kepala Madrasah</CardTitle>
            <CardDescription>Data ini akan ditampilkan pada bagian pengesahan dokumen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kepala_madrasah">Nama Kepala Madrasah</Label>
                <Input
                  id="kepala_madrasah"
                  value={formData.kepala_madrasah}
                  onChange={(e) => setFormData({ ...formData, kepala_madrasah: e.target.value })}
                  placeholder="H. Ahmad Fauzi, S.Pd.I., M.Pd."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip_kepala">NIP</Label>
                <Input
                  id="nip_kepala"
                  value={formData.nip_kepala}
                  onChange={(e) => setFormData({ ...formData, nip_kepala: e.target.value })}
                  placeholder="19xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Tanda Tangan Kepala Madrasah</Label>
                <div className="border rounded-md p-3 flex flex-col items-center gap-2 bg-muted/30">
                  {formData.ttd_kepala_url ? (
                    <img src={formData.ttd_kepala_url} alt="TTD" className="h-24 object-contain bg-white p-1 rounded" />
                  ) : (
                    <div className="h-24 w-full flex items-center justify-center text-xs text-muted-foreground">Belum ada TTD</div>
                  )}
                  <div className="flex gap-2 w-full">
                    <Input type="file" accept="image/*" disabled={uploadingTtd}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'ttd'); e.target.value = ''; }} />
                    {formData.ttd_kepala_url && (
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => setFormData({ ...formData, ttd_kepala_url: '' })}>Hapus</Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">PNG transparan disarankan. Maks 2MB.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stempel Sekolah</Label>
                <div className="border rounded-md p-3 flex flex-col items-center gap-2 bg-muted/30">
                  {formData.stempel_url ? (
                    <img src={formData.stempel_url} alt="Stempel" className="h-24 object-contain bg-white p-1 rounded" />
                  ) : (
                    <div className="h-24 w-full flex items-center justify-center text-xs text-muted-foreground">Belum ada Stempel</div>
                  )}
                  <div className="flex gap-2 w-full">
                    <Input type="file" accept="image/*" disabled={uploadingStempel}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'stempel'); e.target.value = ''; }} />
                    {formData.stempel_url && (
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => setFormData({ ...formData, stempel_url: '' })}>Hapus</Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">PNG transparan disarankan. Maks 2MB.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </form>

      {/* Version Checker */}
      <div className="mt-6">
        <VersionChecker />
      </div>
    </div>
  );
}
