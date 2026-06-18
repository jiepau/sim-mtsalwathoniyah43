import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { CircleCheck as CheckCircle2, Circle as XCircle, Clock, ClipboardList, Search, Phone, MapPin, ChevronRight, FileText, Users, GraduationCap, Star, MessageCircle, LogIn, BookOpen, CircleAlert as AlertCircle } from 'lucide-react';

const KONTAK_DEFAULT = {
  nama_madrasah: 'MTs Al Wathoniyah 43',
  nsm: '121231750043',
  alamat: 'Jl. Raya Madrasah, Bekasi',
  whatsapp: '6281234567890',
  jam_layanan: 'Senin – Sabtu, 07.30 – 14.00 WIB',
};

interface JadwalItem { fase: string; tanggal: string; status: string }

const JADWAL_DEFAULT: JadwalItem[] = [
  { fase: 'Pendaftaran Online', tanggal: '1 Juli – 20 Juli 2026', status: 'aktif' },
  { fase: 'Seleksi Berkas', tanggal: '21 – 25 Juli 2026', status: 'akan-datang' },
  { fase: 'Pengumuman', tanggal: '28 Juli 2026', status: 'akan-datang' },
  { fase: 'Daftar Ulang', tanggal: '29 Juli – 5 Agustus 2026', status: 'akan-datang' },
];

const PERSYARATAN_DEFAULT = [
  'Fotokopi Akta Kelahiran',
  'Fotokopi Kartu Keluarga',
  'Fotokopi Ijazah / Surat Keterangan Lulus SD/MI',
  'Pas foto 3x4 sebanyak 2 lembar (background merah)',
  'Fotokopi KTP orang tua/wali',
  'Surat Keterangan Sehat dari Dokter/Puskesmas',
  'Fotokopi NISN (jika ada)',
];

const KEUNGGULAN = [
  { icon: BookOpen, judul: 'Kurikulum Terpadu', deskripsi: 'Kombinasi kurikulum Kemendikbud & Kemenag untuk bekal ilmu agama dan umum yang seimbang.' },
  { icon: Users, judul: 'Tenaga Pendidik Berpengalaman', deskripsi: 'Guru-guru berpengalaman dan berdedikasi yang telah tersertifikasi oleh pemerintah.' },
  { icon: Star, judul: 'Prestasi Akademik', deskripsi: 'Terakreditasi A dengan rekam jejak prestasi siswa di berbagai kompetisi daerah dan nasional.' },
  { icon: GraduationCap, judul: 'Lingkungan Islami', deskripsi: 'Pembinaan akhlak dan kegiatan keagamaan yang terstruktur sebagai pondasi karakter siswa.' },
];

function StatusBadge({ isOpen, isFinalized, isError }: { isOpen: boolean; isFinalized: boolean; isError: boolean }) {
  if (isError) {
    return (
      <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-4 py-1.5 text-sm font-semibold">
        <AlertCircle className="h-4 w-4" />
        Status sedang dimuat ulang…
      </span>
    );
  }
  if (isFinalized) {
    return (
      <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-4 py-1.5 text-sm font-semibold">
        <AlertCircle className="h-4 w-4" />
        Finalisasi Seleksi
      </span>
    );
  }
  if (isOpen) {
    return (
      <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 border border-green-300 rounded-full px-4 py-1.5 text-sm font-semibold">
        <CheckCircle2 className="h-4 w-4" />
        Pendaftaran DIBUKA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 bg-red-100 text-red-600 border border-red-300 rounded-full px-4 py-1.5 text-sm font-semibold">
      <XCircle className="h-4 w-4" />
      Pendaftaran DITUTUP
    </span>
  );
}

export default function SPMBLanding() {
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['ppdb-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ppdb_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: 2,
  });

  const isOpen = settings?.is_open === true;
  const isFinalized = (settings as { is_finalized?: boolean } | null)?.is_finalized === true;
  const tahunAjaran = settings?.tahun_ajaran ?? '2026/2027';

  return (
    <>
      <Helmet>
        <title>SPMB {tahunAjaran} – {KONTAK.nama_madrasah}</title>
        <meta name="description" content={`Sistem Penerimaan Murid Baru ${tahunAjaran} ${KONTAK.nama_madrasah}. Daftar dan cek status pendaftaran Anda di sini.`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-alwathoniyah.png" alt="Logo" className="h-8 w-8 object-contain" />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-teal-700 leading-tight">{KONTAK.nama_madrasah}</p>
                <p className="text-[10px] text-gray-500 leading-tight">SPMB {tahunAjaran}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/spmb/cek-status"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <Search className="h-4 w-4" />
                Cek Status
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login SIM</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="flex flex-col items-center text-center gap-6">
              {/* Logos */}
              <div className="flex items-center gap-4">
                <img src="/logo-kemenag.png" alt="Kemenag" className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md" />
                <div className="w-px h-14 bg-white/30" />
                <img src="/logo-alwathoniyah.png" alt="Al Wathoniyah" className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md" />
              </div>

              {/* Status badge */}
              {!isLoading && (
                <div className="animate-in fade-in duration-500">
                  <StatusBadge isOpen={isOpen} isFinalized={isFinalized} isError={isError} />
                </div>
              )}
              {isLoading && (
                <div className="h-8 w-48 bg-white/20 rounded-full animate-pulse" />
              )}

              <div>
                <p className="text-teal-100 text-sm sm:text-base font-medium uppercase tracking-widest mb-2">
                  Sistem Penerimaan Murid Baru
                </p>
                <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
                  SPMB {tahunAjaran}
                </h1>
                <p className="mt-3 text-teal-100 text-lg font-medium">
                  {KONTAK.nama_madrasah}
                </p>
              </div>

              <p className="max-w-xl text-teal-100/90 text-sm sm:text-base leading-relaxed">
                Selamat datang calon siswa baru! Daftarkan dirimu sekarang dan bergabunglah bersama kami dalam meraih ilmu yang bermanfaat.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  to="/spmb/daftar"
                  className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg ${
                    isOpen && !isFinalized
                      ? 'bg-white text-teal-700 hover:bg-teal-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                      : 'bg-white/30 text-white/70 cursor-not-allowed'
                  }`}
                  onClick={e => { if (!isOpen || isFinalized) e.preventDefault(); }}
                >
                  <ClipboardList className="h-5 w-5" />
                  Daftar Sekarang
                </Link>
                <Link
                  to="/spmb/cek-status"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base border-2 border-white/40 text-white hover:bg-white/10 hover:border-white/70 transition-all duration-200"
                >
                  <Search className="h-5 w-5" />
                  Cek Status
                </Link>
              </div>

              {!isOpen && !isFinalized && !isLoading && (
                <p className="text-amber-200 text-sm flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Pendaftaran belum dibuka. Pantau terus halaman ini.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Alur Pendaftaran */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Alur Pendaftaran</h2>
            <p className="text-gray-500 mt-2">Ikuti langkah-langkah berikut untuk mendaftar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { step: '01', icon: ClipboardList, judul: 'Isi Formulir', deskripsi: 'Klik tombol "Daftar Sekarang" dan lengkapi seluruh data diri dengan benar.' },
              { step: '02', icon: Search, judul: 'Cek Status', deskripsi: 'Simpan nomor pendaftaran Anda, lalu pantau status seleksi secara berkala.' },
              { step: '03', icon: GraduationCap, judul: 'Daftar Ulang', deskripsi: 'Jika diterima, lakukan daftar ulang sesuai jadwal yang telah ditentukan.' },
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {i < 2 && (
                  <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Langkah {item.step}</span>
                    <h3 className="font-bold text-gray-800 mt-0.5">{item.judul}</h3>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">{item.deskripsi}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Jadwal & Persyaratan side-by-side */}
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
              {/* Jadwal */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-teal-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Jadwal SPMB</h2>
                </div>
                <div className="space-y-3">
                  {JADWAL.map((j, i) => (
                    <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      j.status === 'aktif'
                        ? 'bg-teal-50 border-teal-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}>
                      <div className={`flex-shrink-0 mt-0.5 w-2.5 h-2.5 rounded-full mt-1.5 ${
                        j.status === 'aktif' ? 'bg-teal-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${j.status === 'aktif' ? 'text-teal-700' : 'text-gray-700'}`}>
                          {j.fase}
                          {j.status === 'aktif' && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-teal-500 text-white px-2 py-0.5 rounded-full">Aktif</span>
                          )}
                        </p>
                        <p className="text-gray-500 text-sm mt-0.5">{j.tanggal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persyaratan */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-teal-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Persyaratan Dokumen</h2>
                </div>
                <ul className="space-y-3">
                  {PERSYARATAN.map((p, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <CheckCircle2 className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Keunggulan */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Mengapa Memilih Kami?</h2>
            <p className="text-gray-500 mt-2">Keunggulan yang kami tawarkan untuk masa depan putra-putri Anda</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {KEUNGGULAN.map((k, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 shadow-sm">
                  <k.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{k.judul}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{k.deskripsi}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        {isOpen && !isFinalized && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
            <div className="relative bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 sm:p-10 overflow-hidden shadow-lg">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-8 w-32 h-32 rounded-full border-4 border-white" />
                <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full border-4 border-white" />
              </div>
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Pendaftaran Sedang Dibuka!</h3>
                  <p className="text-teal-100 mt-1 text-sm sm:text-base">Jangan tunda! Segera daftarkan dirimu sebelum pendaftaran ditutup.</p>
                </div>
                <Link
                  to="/spmb/daftar"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-3.5 rounded-xl hover:bg-teal-50 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  <ClipboardList className="h-5 w-5" />
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Kontak */}
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800">Hubungi Kami</h2>
              <p className="text-gray-500 mt-2">Ada pertanyaan? Panitia SPMB siap membantu Anda</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Alamat</p>
                  <p className="text-sm font-semibold text-gray-700">{KONTAK.alamat}</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-gray-100" />
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jam Layanan</p>
                  <p className="text-sm font-semibold text-gray-700">{KONTAK.jam_layanan}</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-gray-100" />
              <a
                href={`https://wa.me/${KONTAK.whatsapp}?text=Assalamualaikum, saya ingin bertanya tentang SPMB ${tahunAjaran} ${KONTAK.nama_madrasah}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm hover:shadow-md"
              >
                <MessageCircle className="h-5 w-5" />
                Chat WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-teal-800 text-teal-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo-alwathoniyah.png" alt="Logo" className="h-8 w-8 object-contain opacity-80" />
                <div>
                  <p className="font-bold text-white text-sm">{KONTAK.nama_madrasah}</p>
                  <p className="text-xs text-teal-300">NSM: {KONTAK.nsm}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link to="/spmb/daftar" className="text-teal-300 hover:text-white transition-colors">
                  Formulir Pendaftaran
                </Link>
                <span className="text-teal-600">·</span>
                <Link to="/spmb/cek-status" className="text-teal-300 hover:text-white transition-colors">
                  Cek Status
                </Link>
                <span className="text-teal-600">·</span>
                <Link to="/login" className="text-teal-300 hover:text-white transition-colors flex items-center gap-1">
                  <LogIn className="h-3.5 w-3.5" />
                  Login SIM
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-teal-700 text-center text-xs text-teal-400">
              © {new Date().getFullYear()} {KONTAK.nama_madrasah}. Hak cipta dilindungi.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
