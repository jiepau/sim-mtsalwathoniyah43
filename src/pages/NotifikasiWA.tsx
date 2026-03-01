import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare, Send, Clock, Calendar, Save, TestTube } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface WaSettings {
  id: string;
  jenis: string;
  is_active: boolean;
  jam: string;
  hari_aktif: number[];
  template_pesan: string;
}

const HARI_LABELS: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

const JENIS_LABELS: Record<string, string> = {
  absensi_pagi: 'Pengingat Absensi Pagi',
  absensi_siang: 'Pengingat Absensi Siang',
  tunggakan: 'Pengingat Tunggakan',
};

export default function NotifikasiWA() {
  const [settings, setSettings] = useState<WaSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notifikasi_wa_settings')
        .select('*')
        .order('jenis');

      if (error) throw error;

      // Cast the data properly since the table is new and not yet in types
      setSettings((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error('Gagal memuat pengaturan notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (id: string, field: keyof WaSettings, value: any) => {
    setSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const toggleHari = (id: string, hari: number) => {
    setSettings(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const newHari = s.hari_aktif.includes(hari)
          ? s.hari_aktif.filter(h => h !== hari)
          : [...s.hari_aktif, hari].sort();
        return { ...s, hari_aktif: newHari };
      })
    );
  };

  const saveSetting = async (setting: WaSettings) => {
    setSaving(setting.id);
    try {
      const { error } = await supabase
        .from('notifikasi_wa_settings')
        .update({
          is_active: setting.is_active,
          jam: setting.jam,
          hari_aktif: setting.hari_aktif,
          template_pesan: setting.template_pesan,
        } as any)
        .eq('id', setting.id);

      if (error) throw error;
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(null);
    }
  };

  const testSendReminder = async () => {
    setTesting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/send-absensi-reminder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type: 'test' }),
        }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Gagal mengirim');

      toast.success(
        `Test berhasil! ${result.sent}/${result.total_pending} pesan terkirim`
      );
    } catch (err) {
      console.error('Test error:', err);
      toast.error('Gagal mengirim test: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Notifikasi WhatsApp"
          description="Pengaturan pengingat otomatis via WhatsApp"
          icon={<MessageSquare className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi WhatsApp"
        description="Atur jadwal dan template pesan pengingat otomatis via WhatsApp (Fonnte)"
        icon={<MessageSquare className="h-6 w-6" />}
      />

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TestTube className="h-5 w-5" />
            Test Pengingat
          </CardTitle>
          <CardDescription>
            Kirim pengingat test ke semua guru yang belum mengisi absensi hari ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testSendReminder} disabled={testing}>
            <Send className="h-4 w-4 mr-2" />
            {testing ? 'Mengirim...' : 'Kirim Test Sekarang'}
          </Button>
        </CardContent>
      </Card>

      {/* Settings Cards */}
      {settings.map(setting => (
        <Card key={setting.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {JENIS_LABELS[setting.jenis] || setting.jenis}
                </CardTitle>
                <CardDescription>
                  {setting.jenis === 'absensi_pagi'
                    ? 'Pengingat pagi sebelum guru mulai mengajar'
                    : 'Pengingat siang untuk guru yang belum absen'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                  {setting.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Switch
                  checked={setting.is_active}
                  onCheckedChange={val => updateSetting(setting.id, 'is_active', val)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Jam */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jam Pengiriman (WIB)
              </Label>
              <Input
                type="time"
                value={setting.jam}
                onChange={e => updateSetting(setting.id, 'jam', e.target.value)}
                className="w-40"
              />
            </div>

            {/* Hari Aktif */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Hari Aktif
              </Label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(HARI_LABELS).map(([num, label]) => (
                  <div key={num} className="flex items-center gap-2">
                    <Checkbox
                      id={`${setting.id}-hari-${num}`}
                      checked={setting.hari_aktif.includes(Number(num))}
                      onCheckedChange={() => toggleHari(setting.id, Number(num))}
                    />
                    <Label htmlFor={`${setting.id}-hari-${num}`} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Pesan */}
            <div className="space-y-2">
              <Label>Template Pesan</Label>
              <Textarea
                value={setting.template_pesan}
                onChange={e => updateSetting(setting.id, 'template_pesan', e.target.value)}
                rows={5}
                placeholder="Gunakan {nama} untuk nama guru"
              />
              <p className="text-xs text-muted-foreground">
                Variabel tersedia: <code className="text-primary">{'{nama}'}</code> = nama guru
              </p>
            </div>

            <Button
              onClick={() => saveSetting(setting)}
              disabled={saving === setting.id}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving === setting.id ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
