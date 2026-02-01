-- =====================================================
-- MADRASAH SETTINGS TABLE
-- Stores school identity information
-- =====================================================
CREATE TABLE public.madrasah_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_madrasah TEXT NOT NULL DEFAULT 'MTs Al-Wathoniyah 43',
  npsn TEXT,
  alamat TEXT,
  kabupaten_kota TEXT,
  provinsi TEXT,
  kode_pos TEXT,
  no_telp TEXT,
  email TEXT,
  website TEXT,
  kepala_madrasah TEXT,
  nip_kepala TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.madrasah_settings ENABLE ROW LEVEL SECURITY;

-- Only one settings row should exist (singleton pattern)
-- All authenticated users can view
CREATE POLICY "Authenticated users can view madrasah_settings"
ON public.madrasah_settings
FOR SELECT
USING (has_any_role(auth.uid()));

-- Only admin can manage
CREATE POLICY "Admin can manage madrasah_settings"
ON public.madrasah_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_madrasah_settings_updated_at
BEFORE UPDATE ON public.madrasah_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- CP TEMPLATES TABLE
-- Stores Capaian Pembelajaran templates per mapel & fase
-- =====================================================
CREATE TABLE public.cp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mapel TEXT NOT NULL,
  fase fase_pembelajaran NOT NULL DEFAULT 'D',
  elemen TEXT[] DEFAULT '{}',
  capaian_pembelajaran TEXT NOT NULL,
  tujuan_pembelajaran TEXT[] DEFAULT '{}',
  sumber TEXT, -- e.g., "SK Dirjen 3302/2024"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mapel, fase)
);

-- Enable RLS
ALTER TABLE public.cp_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view templates
CREATE POLICY "Authenticated users can view cp_templates"
ON public.cp_templates
FOR SELECT
USING (has_any_role(auth.uid()));

-- Admin and operator can manage templates
CREATE POLICY "Admin and operator can manage cp_templates"
ON public.cp_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_cp_templates_updated_at
BEFORE UPDATE ON public.cp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INSERT INITIAL MADRASAH SETTINGS
-- =====================================================
INSERT INTO public.madrasah_settings (nama_madrasah, kepala_madrasah)
VALUES ('MTs Al-Wathoniyah 43', '');

-- =====================================================
-- INSERT SAMPLE CP TEMPLATES FOR MAPEL AGAMA (FASE D - MTs)
-- These are based on SK Dirjen Pendis 3211/2022 & 3302/2024
-- =====================================================

-- Al-Qur'an Hadis Fase D
INSERT INTO public.cp_templates (mapel, fase, elemen, capaian_pembelajaran, tujuan_pembelajaran, sumber)
VALUES (
  'Al-Qur''an Hadis',
  'D',
  ARRAY['Ilmu Tajwid', 'Ilmu Al-Qur''an', 'Ilmu Hadis', 'Al-Qur''an', 'Hadis'],
  'Pada akhir Fase D, peserta didik mampu membaca Al-Qur''an dengan menerapkan hukum tajwid secara baik dan benar, menghafal surah-surah pilihan, memahami makna ayat-ayat dan hadis secara tekstual dan kontekstual, serta mengamalkan kandungannya dalam kehidupan sehari-hari.',
  ARRAY[
    'Peserta didik mampu menerapkan hukum bacaan tajwid (Nun Sukun dan Tanwin, Mim Sukun, Qalqalah, Mad) dalam membaca Al-Qur''an',
    'Peserta didik mampu menghafal surah-surah pilihan (Al-Mulk, Al-Waqi''ah, Ar-Rahman) dan hadis-hadis pilihan',
    'Peserta didik mampu menerjemahkan dan memahami makna ayat-ayat Al-Qur''an tentang akhlak, ibadah, dan muamalah',
    'Peserta didik mampu menganalisis kandungan ayat dan hadis serta mengaitkannya dengan konteks kehidupan',
    'Peserta didik mampu mempresentasikan pemahaman ayat dan hadis secara lisan dan tertulis',
    'Peserta didik mampu membiasakan tilawah, tadabbur, dan mengamalkan ajaran Al-Qur''an dan Hadis'
  ],
  'SK Dirjen Pendis 3211/2022'
);

-- Akidah Akhlak Fase D
INSERT INTO public.cp_templates (mapel, fase, elemen, capaian_pembelajaran, tujuan_pembelajaran, sumber)
VALUES (
  'Akidah Akhlak',
  'D',
  ARRAY['Akidah', 'Akhlak', 'Kisah Teladan'],
  'Pada akhir Fase D, peserta didik mampu memahami dan meyakini rukun iman dengan dalil-dalilnya, menghayati asmaul husna, mengenal dan menghindari perilaku tercela, serta meneladani akhlak mulia Rasulullah SAW dan para sahabat.',
  ARRAY[
    'Peserta didik mampu memahami dan meyakini konsep iman kepada Allah dengan dalil naqli dan aqli',
    'Peserta didik mampu menghayati dan mengamalkan asmaul husna dalam kehidupan sehari-hari',
    'Peserta didik mampu memahami konsep iman kepada malaikat, kitab, rasul, hari akhir, dan qada qadar',
    'Peserta didik mampu membedakan akhlak terpuji dan tercela serta mengamalkan akhlak terpuji',
    'Peserta didik mampu meneladani kisah perjuangan Rasulullah SAW dan para sahabat',
    'Peserta didik mampu menerapkan adab dalam beribadah dan bermuamalah'
  ],
  'SK Dirjen Pendis 3211/2022'
);

-- Fiqih Fase D
INSERT INTO public.cp_templates (mapel, fase, elemen, capaian_pembelajaran, tujuan_pembelajaran, sumber)
VALUES (
  'Fiqih',
  'D',
  ARRAY['Fiqih Ibadah', 'Fiqih Muamalah', 'Ushul Fiqih'],
  'Pada akhir Fase D, peserta didik mampu memahami ketentuan thaharah, shalat, puasa, zakat, haji dan umrah, serta ketentuan muamalah dalam Islam, dan mampu mengamalkannya dalam kehidupan sehari-hari.',
  ARRAY[
    'Peserta didik mampu memahami dan mempraktikkan ketentuan thaharah (wudhu, tayamum, mandi wajib)',
    'Peserta didik mampu memahami dan mempraktikkan shalat fardhu, sunnah, dan jenazah dengan benar',
    'Peserta didik mampu memahami ketentuan puasa Ramadhan dan puasa sunnah',
    'Peserta didik mampu memahami ketentuan zakat fitrah dan zakat mal',
    'Peserta didik mampu memahami tata cara haji dan umrah',
    'Peserta didik mampu memahami ketentuan jual beli, qirad, riba yang dilarang dalam Islam',
    'Peserta didik mampu memahami dasar-dasar ushul fiqih dan sumber hukum Islam'
  ],
  'SK Dirjen Pendis 3211/2022'
);

-- SKI (Sejarah Kebudayaan Islam) Fase D
INSERT INTO public.cp_templates (mapel, fase, elemen, capaian_pembelajaran, tujuan_pembelajaran, sumber)
VALUES (
  'Sejarah Kebudayaan Islam',
  'D',
  ARRAY['Sejarah Nabi dan Sahabat', 'Sejarah Peradaban Islam', 'Hikmah Sejarah'],
  'Pada akhir Fase D, peserta didik mampu memahami sejarah dakwah Rasulullah SAW, perkembangan Islam pada masa Khulafaur Rasyidin, dan dinasti-dinasti Islam, serta mengambil hikmah untuk diterapkan dalam kehidupan.',
  ARRAY[
    'Peserta didik mampu memahami sejarah dakwah Nabi Muhammad SAW periode Makkah dan Madinah',
    'Peserta didik mampu memahami perjuangan dan kepemimpinan Khulafaur Rasyidin',
    'Peserta didik mampu mengenal perkembangan Islam pada masa Bani Umayyah dan Bani Abbasiyah',
    'Peserta didik mampu memahami perkembangan Islam di Indonesia',
    'Peserta didik mampu menganalisis hikmah dari peristiwa sejarah Islam',
    'Peserta didik mampu meneladani nilai-nilai perjuangan tokoh-tokoh Islam'
  ],
  'SK Dirjen Pendis 3211/2022'
);

-- Bahasa Arab Fase D
INSERT INTO public.cp_templates (mapel, fase, elemen, capaian_pembelajaran, tujuan_pembelajaran, sumber)
VALUES (
  'Bahasa Arab',
  'D',
  ARRAY['Istima'' (Menyimak)', 'Kalam (Berbicara)', 'Qira''ah (Membaca)', 'Kitabah (Menulis)'],
  'Pada akhir Fase D, peserta didik mampu menyimak, berbicara, membaca, dan menulis dalam bahasa Arab sederhana terkait tema-tema kehidupan sehari-hari dengan penerapan kaidah nahwu dan sharaf dasar.',
  ARRAY[
    'Peserta didik mampu menyimak dan memahami percakapan bahasa Arab sederhana tentang kehidupan sehari-hari',
    'Peserta didik mampu berbicara dan berdialog dalam bahasa Arab tentang tema perkenalan, keluarga, sekolah, dan aktivitas',
    'Peserta didik mampu membaca teks bahasa Arab sederhana dengan makhraj dan tajwid yang benar',
    'Peserta didik mampu memahami kosakata dan struktur kalimat bahasa Arab',
    'Peserta didik mampu menulis kalimat dan paragraf sederhana dalam bahasa Arab',
    'Peserta didik mampu menerapkan kaidah nahwu dasar (isim, fi''il, huruf, mubtada khabar)'
  ],
  'SK Dirjen Pendis 3302/2024'
);