import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, School, Calendar, CalendarDays, UserCog, Wallet, Receipt,
  CreditCard, TrendingUp, TrendingDown, AlertTriangle, ArrowUpCircle, GraduationCap,
  Shield, BookOpen, Target, FileText, Settings, Sparkles, MailOpen, Send, BookMarked,
  User as UserIcon, ClipboardCheck, ClipboardList, BarChart3, MessageSquare, History,
  UserPlus, BookCheck, ChevronRight, Search, ListTree, Workflow, Map,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/lib/supabase-helpers';

type MenuEntry = {
  title: string;
  path: string;
  desc: string;
  icon: React.ElementType;
  roles?: AppRole[];
};

type MenuGroup = {
  kategori: string;
  icon: React.ElementType;
  items: MenuEntry[];
};

const groups: MenuGroup[] = [
  {
    kategori: 'Beranda', icon: LayoutDashboard, items: [
      { title: 'Dashboard', path: '/dashboard', desc: 'Ringkasan statistik & aktivitas madrasah', icon: LayoutDashboard, roles: ['admin','operator','bendahara','guru','panitia'] },
      { title: 'Dashboard Siswa', path: '/e-learning/dashboard', desc: 'Beranda khusus akun siswa (materi, tugas, nilai)', icon: GraduationCap, roles: ['siswa'] },
      { title: 'Profil Saya', path: '/profil-guru', desc: 'Data pribadi GTK yang terhubung dengan akun Anda', icon: UserIcon, roles: ['guru','bendahara','admin'] },
    ],
  },
  {
    kategori: 'Master Data', icon: Users, items: [
      { title: 'Siswa', path: '/siswa', desc: 'Kelola data siswa (import EMIS, foto, naik kelas)', icon: Users, roles: ['admin','operator','bendahara'] },
      { title: 'Kelas', path: '/kelas', desc: 'Atur rombongan belajar & wali kelas', icon: School, roles: ['admin','operator'] },
      { title: 'GTK/PTK', path: '/gtk-ptk', desc: 'Kelola guru & tenaga kependidikan', icon: UserCog, roles: ['admin','operator'] },
      { title: 'Tahun Ajaran', path: '/tahun-ajaran', desc: 'Aktifkan TA & semester, atur kalender akademik', icon: Calendar, roles: ['admin','operator'] },
    ],
  },
  {
    kategori: 'Absensi & Kehadiran', icon: ClipboardCheck, items: [
      { title: 'Absensi Siswa', path: '/absensi-siswa', desc: 'Input kehadiran siswa harian per kelas', icon: ClipboardCheck, roles: ['admin','operator','guru'] },
      { title: 'Absensi GTK', path: '/absensi-gtk', desc: 'Input presensi guru & pegawai', icon: ClipboardList, roles: ['admin','operator','guru'] },
      { title: 'Rekap Bulanan', path: '/rekap-absensi', desc: 'Rekap kehadiran per bulan & tren ketidakhadiran', icon: BarChart3, roles: ['admin','operator','guru'] },
      { title: 'Rapor Kehadiran', path: '/rapor-kehadiran', desc: 'Cetak rapor kehadiran siswa per semester', icon: ClipboardList, roles: ['admin','operator','guru'] },
      { title: 'Kalender Akademik', path: '/kalender-akademik', desc: 'Atur hari libur & event akademik', icon: CalendarDays },
    ],
  },
  {
    kategori: 'Kurikulum', icon: BookOpen, items: [
      { title: 'Panduan Kurikulum', path: '/panduan-kurikulum', desc: 'Alur kerja CP → ATP → KKTP → Prota → Promes → RPP', icon: BookOpen, roles: ['admin','operator','guru'] },
      { title: 'Template CP', path: '/cp-templates', desc: 'Capaian Pembelajaran (93 template mapel)', icon: FileText, roles: ['admin','operator','guru'] },
      { title: 'ATP', path: '/atp', desc: 'Alur Tujuan Pembelajaran per mapel', icon: BookOpen, roles: ['admin','operator','guru'] },
      { title: 'KKTP', path: '/kktp', desc: 'Kriteria Ketercapaian Tujuan Pembelajaran', icon: Target, roles: ['admin','operator','guru'] },
      { title: 'Prota', path: '/prota', desc: 'Program Tahunan', icon: Calendar, roles: ['admin','operator','guru'] },
      { title: 'Promes', path: '/promes', desc: 'Program Semester (matriks minggu × TP)', icon: CalendarDays, roles: ['admin','operator','guru'] },
      { title: 'Generator RPP', path: '/generator-rpp', desc: 'Bantuan AI menyusun RPP berbasis Deep Learning', icon: Sparkles, roles: ['admin','operator','guru'] },
    ],
  },
  {
    kategori: 'E-Learning', icon: GraduationCap, items: [
      { title: 'Kelola Materi', path: '/e-learning/materi-guru', desc: 'Unggah materi pembelajaran untuk siswa', icon: BookOpen, roles: ['admin','operator','guru'] },
      { title: 'Kelola Tugas', path: '/e-learning/tugas-guru', desc: 'Buat & nilai tugas siswa', icon: ClipboardList, roles: ['admin','operator','guru'] },
      { title: 'Materi (Siswa)', path: '/e-learning/materi-siswa', desc: 'Akses materi pembelajaran', icon: BookOpen, roles: ['siswa'] },
      { title: 'Tugas (Siswa)', path: '/e-learning/tugas-siswa', desc: 'Kerjakan & submit tugas', icon: ClipboardList, roles: ['siswa'] },
      { title: 'Nilai Saya', path: '/e-learning/nilai', desc: 'Lihat nilai tugas', icon: Target, roles: ['siswa'] },
      { title: 'Forum Diskusi', path: '/e-learning/forum', desc: 'Diskusi guru ↔ siswa per mapel', icon: MessageSquare, roles: ['admin','operator','guru','siswa'] },
    ],
  },
  {
    kategori: 'Keuangan', icon: Wallet, items: [
      { title: 'Jenis Tagihan', path: '/jenis-tagihan', desc: 'Setup jenis tagihan (SPP, daftar ulang, dll)', icon: Receipt, roles: ['admin','bendahara'] },
      { title: 'Pembayaran', path: '/pembayaran', desc: 'Catat pembayaran siswa, cetak kwitansi', icon: CreditCard, roles: ['admin','bendahara'] },
      { title: 'Pemasukan', path: '/pemasukan', desc: 'Pemasukan non-tagihan (donasi, hibah, dll)', icon: TrendingUp, roles: ['admin','bendahara'] },
      { title: 'Pengeluaran', path: '/pengeluaran', desc: 'Catat pengeluaran operasional', icon: TrendingDown, roles: ['admin','bendahara'] },
      { title: 'Tunggakan', path: '/tunggakan', desc: 'Pantau tunggakan & kirim reminder WA', icon: AlertTriangle, roles: ['admin','bendahara'] },
      { title: 'Laporan Keuangan', path: '/laporan-keuangan', desc: 'Laporan kas masuk/keluar per periode', icon: FileText, roles: ['admin','bendahara'] },
      { title: 'Tutup Buku', path: '/tutup-buku', desc: 'Tutup buku per TA', icon: BookCheck, roles: ['admin','bendahara'] },
      { title: 'Buku Induk', path: '/buku-induk', desc: 'Riwayat lengkap pembayaran per siswa', icon: BookMarked, roles: ['admin','bendahara'] },
    ],
  },
  {
    kategori: 'Akhir Tahun', icon: ArrowUpCircle, items: [
      { title: 'Naik Kelas', path: '/naik-kelas', desc: 'Promosi siswa ke kelas berikutnya (bulk)', icon: ArrowUpCircle, roles: ['admin','operator'] },
      { title: 'Nilai Ijazah & Kelulusan (PDUM)', path: '/pdum', desc: 'Olah nilai rapor 5 sem + UM, cetak SKL', icon: BookCheck, roles: ['admin','operator'] },
      { title: 'Alumni', path: '/alumni', desc: 'Data lulusan & riwayat pembayarannya', icon: GraduationCap, roles: ['admin','operator'] },
    ],
  },
  {
    kategori: 'SPMB (Penerimaan Murid Baru)', icon: UserPlus, items: [
      { title: 'SPMB', path: '/spmb', desc: 'Kelola pendaftar baru & konversi ke siswa', icon: UserPlus, roles: ['admin','panitia'] },
    ],
  },
  {
    kategori: 'Surat Menyurat', icon: MailOpen, items: [
      { title: 'Surat Masuk', path: '/surat-masuk', desc: 'Agenda surat masuk', icon: MailOpen, roles: ['admin','operator'] },
      { title: 'Surat Keluar', path: '/surat-keluar', desc: 'Buat surat keluar (nomor otomatis, ekspor Word)', icon: Send, roles: ['admin','operator'] },
    ],
  },
  {
    kategori: 'Pengaturan & Administrasi', icon: Settings, items: [
      { title: 'Pengaturan Madrasah', path: '/pengaturan-madrasah', desc: 'Identitas madrasah, kop surat, logo', icon: Settings, roles: ['admin'] },
      { title: 'Notifikasi WhatsApp', path: '/notifikasi-wa', desc: 'Konfigurasi notif Fonnte (absen, tunggakan)', icon: MessageSquare, roles: ['admin'] },
      { title: 'Manajemen User', path: '/user-management', desc: 'Approve akun, set role, reset password', icon: Shield, roles: ['admin'] },
      { title: 'Riwayat Pembaruan', path: '/changelog', desc: 'Catatan rilis & fitur baru', icon: History },
    ],
  },
];

const flows = [
  {
    title: 'Setup Awal Tahun Ajaran',
    icon: Calendar,
    desc: 'Langkah saat memulai tahun ajaran baru.',
    roles: ['admin','operator'] as AppRole[],
    steps: [
      { label: 'Aktifkan TA baru', path: '/tahun-ajaran' },
      { label: 'Buat/atur Kelas & Wali Kelas', path: '/kelas' },
      { label: 'Naik Kelas siswa lama', path: '/naik-kelas' },
      { label: 'Buka SPMB & input pendaftar', path: '/spmb' },
      { label: 'Setup jenis tagihan SPP/dll', path: '/jenis-tagihan' },
    ],
  },
  {
    title: 'Alur Pembayaran SPP',
    icon: CreditCard,
    desc: 'Catat pembayaran sampai cetak kwitansi.',
    roles: ['admin','bendahara'] as AppRole[],
    steps: [
      { label: 'Buka menu Pembayaran', path: '/pembayaran' },
      { label: 'Pilih siswa & bulan tagihan', path: '/pembayaran' },
      { label: 'Cetak kwitansi (A4/A5)', path: '/pembayaran' },
      { label: 'Pantau tunggakan & kirim reminder WA', path: '/tunggakan' },
      { label: 'Tutup buku saat akhir TA', path: '/tutup-buku' },
    ],
  },
  {
    title: 'Alur Kurikulum (CP → RPP)',
    icon: BookOpen,
    desc: 'Dari Capaian Pembelajaran sampai RPP siap pakai.',
    roles: ['admin','operator','guru'] as AppRole[],
    steps: [
      { label: 'Baca Panduan Kurikulum', path: '/panduan-kurikulum' },
      { label: 'Pilih Template CP per mapel', path: '/cp-templates' },
      { label: 'Susun ATP & KKTP', path: '/atp' },
      { label: 'Buat Prota (program tahunan)', path: '/prota' },
      { label: 'Buat Promes (alokasi mingguan)', path: '/promes' },
      { label: 'Generate RPP dengan AI', path: '/generator-rpp' },
    ],
  },
  {
    title: 'Absensi Harian',
    icon: ClipboardCheck,
    desc: 'Rutin harian guru & wali kelas.',
    roles: ['admin','operator','guru'] as AppRole[],
    steps: [
      { label: 'Input absensi siswa per kelas', path: '/absensi-siswa' },
      { label: 'Input presensi GTK', path: '/absensi-gtk' },
      { label: 'Lihat rekap bulanan', path: '/rekap-absensi' },
      { label: 'Cetak rapor kehadiran (akhir semester)', path: '/rapor-kehadiran' },
    ],
  },
  {
    title: 'Akhir Kelulusan Kelas 9',
    icon: GraduationCap,
    desc: 'Olah nilai sampai cetak SKL.',
    roles: ['admin','operator'] as AppRole[],
    steps: [
      { label: 'Input nilai rapor 5 sem + UM (PDUM)', path: '/pdum' },
      { label: 'Set pengumuman & tanggal kelulusan', path: '/pdum' },
      { label: 'Cetak SKL gaya Kemenag', path: '/pdum' },
      { label: 'Konversi ke Alumni', path: '/alumni' },
    ],
  },
];

export default function PetaSitus() {
  const { hasRole, roles, loading } = useAuth();
  const [q, setQ] = useState('');

  const can = (allowed?: AppRole[]) => {
    if (!allowed || allowed.length === 0) return true;
    if (loading) return true;
    return allowed.some(r => hasRole(r));
  };

  const filteredGroups = useMemo(() => {
    const term = q.trim().toLowerCase();
    return groups
      .map(g => ({
        ...g,
        items: g.items.filter(it =>
          can(it.roles) &&
          (term === '' ||
            it.title.toLowerCase().includes(term) ||
            it.desc.toLowerCase().includes(term) ||
            g.kategori.toLowerCase().includes(term))
        ),
      }))
      .filter(g => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, roles, loading]);

  const filteredFlows = useMemo(() => flows.filter(f => can(f.roles)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles, loading]);

  const totalMenu = filteredGroups.reduce((s, g) => s + g.items.length, 0);

  return (
    <>
      <Helmet>
        <title>Peta Situs — SIM MTs Al Wathoniyah 43</title>
        <meta name="description" content="Daftar lengkap menu & panduan alur kerja SIM MTs Al Wathoniyah 43." />
      </Helmet>

      <PageHeader
        title="Peta Situs"
        description="Daftar semua menu dan panduan alur kerja yang tersedia untuk Anda."
        icon={<Map className="h-5 w-5" />}
      />

      <Tabs defaultValue="menu" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabsList>
            <TabsTrigger value="menu" className="gap-2">
              <ListTree className="h-4 w-4" /> Daftar Menu
            </TabsTrigger>
            <TabsTrigger value="flow" className="gap-2">
              <Workflow className="h-4 w-4" /> Panduan Flow
            </TabsTrigger>
          </TabsList>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari menu (mis. tunggakan, RPP, kwitansi)…"
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="menu" className="space-y-6 mt-2">
          {q && (
            <p className="text-xs text-muted-foreground">
              Menampilkan <span className="font-semibold text-foreground">{totalMenu}</span> menu untuk pencarian
              "<span className="font-semibold text-foreground">{q}</span>".
            </p>
          )}

          {filteredGroups.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada menu yang cocok dengan pencarian Anda.
            </Card>
          )}

          {filteredGroups.map((g) => (
            <section key={g.kategori}>
              <div className="flex items-center gap-2 mb-3">
                <g.icon className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">{g.kategori}</h2>
                <Badge variant="secondary" className="rounded-full">{g.items.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map(it => (
                  <Link key={it.path + it.title} to={it.path}>
                    <Card className="p-4 hover:border-primary/50 hover:shadow-md transition-all group h-full">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <it.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm text-foreground truncate">{it.title}</p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{it.desc}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        <TabsContent value="flow" className="space-y-4 mt-2">
          {filteredFlows.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Belum ada panduan alur untuk role Anda.
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFlows.map((f) => (
              <Card key={f.title} className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
                <ol className="space-y-2">
                  {f.steps.map((s, i) => (
                    <li key={i}>
                      <Link
                        to={s.path}
                        className="flex items-center gap-3 p-2 rounded-md border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                      >
                        <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground flex-1">{s.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
