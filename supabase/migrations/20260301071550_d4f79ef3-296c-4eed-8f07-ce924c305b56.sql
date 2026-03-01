-- Tabel pengaturan notifikasi WhatsApp
CREATE TABLE public.notifikasi_wa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis text NOT NULL UNIQUE, -- 'absensi_pagi', 'absensi_siang', 'tunggakan'
  is_active boolean NOT NULL DEFAULT true,
  jam text NOT NULL DEFAULT '06:00', -- Format HH:MM WIB
  hari_aktif integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}', -- 1=Senin..6=Sabtu
  template_pesan text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifikasi_wa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage notifikasi_wa_settings"
  ON public.notifikasi_wa_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view notifikasi_wa_settings"
  ON public.notifikasi_wa_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.notifikasi_wa_settings (jenis, jam, template_pesan) VALUES
  ('absensi_pagi', '06:00', 'Assalamu''alaikum {nama},

Pengingat: Mohon segera mengisi absensi kehadiran hari ini.

Terima kasih.

- Admin MTs Al-Wathoniyah 43'),
  ('absensi_siang', '13:40', 'Assalamu''alaikum {nama},

Pengingat: Anda belum mengisi absensi kehadiran hari ini. Mohon segera diisi sebelum jam pulang.

Terima kasih.

- Admin MTs Al-Wathoniyah 43');

-- Trigger for updated_at
CREATE TRIGGER update_notifikasi_wa_settings_updated_at
  BEFORE UPDATE ON public.notifikasi_wa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();