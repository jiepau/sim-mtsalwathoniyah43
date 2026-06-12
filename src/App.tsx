import { lazy, Suspense, useState, useCallback } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { UpdateChecker } from "@/components/UpdateChecker";
import { WhatsNewDialog } from "@/components/WhatsNewDialog";

// Auth pages
import Login from "@/pages/auth/Login";

// Lazy load all protected pages to reduce initial bundle
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Siswa = lazy(() => import("@/pages/Siswa"));
const Kelas = lazy(() => import("@/pages/Kelas"));
const TahunAjaran = lazy(() => import("@/pages/TahunAjaran"));
const GtkPtk = lazy(() => import("@/pages/GtkPtk"));
const JenisTagihan = lazy(() => import("@/pages/JenisTagihan"));
const Pembayaran = lazy(() => import("@/pages/Pembayaran"));
const Pemasukan = lazy(() => import("@/pages/Pemasukan"));
const Pengeluaran = lazy(() => import("@/pages/Pengeluaran"));
const Tunggakan = lazy(() => import("@/pages/Tunggakan"));
const LaporanKeuangan = lazy(() => import("@/pages/LaporanKeuangan"));
const TutupBuku = lazy(() => import("@/pages/TutupBuku"));
const NaikKelas = lazy(() => import("@/pages/NaikKelas"));
const Alumni = lazy(() => import("@/pages/Alumni"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const ATP = lazy(() => import("@/pages/ATP"));
const KKTP = lazy(() => import("@/pages/KKTP"));
const CPTemplates = lazy(() => import("@/pages/CPTemplates"));
const GeneratorRPP = lazy(() => import("@/pages/GeneratorRPP"));
const Prota = lazy(() => import("@/pages/Prota"));
const Promes = lazy(() => import("@/pages/Promes"));
const PanduanKurikulum = lazy(() => import("@/pages/PanduanKurikulum"));
const Jadwal = lazy(() => import("@/pages/Jadwal"));
const PengaturanMadrasah = lazy(() => import("@/pages/PengaturanMadrasah"));
const SuratMasuk = lazy(() => import("@/pages/SuratMasuk"));
const SuratKeluar = lazy(() => import("@/pages/SuratKeluar"));
const BukuInduk = lazy(() => import("@/pages/BukuInduk"));
const ProfilGuru = lazy(() => import("@/pages/ProfilGuru"));
const AbsensiSiswa = lazy(() => import("@/pages/AbsensiSiswa"));
const AbsensiGtk = lazy(() => import("@/pages/AbsensiGtk"));
const KalenderAkademik = lazy(() => import("@/pages/KalenderAkademik"));
const RekapAbsensi = lazy(() => import("@/pages/RekapAbsensi"));
const RaporKehadiran = lazy(() => import("@/pages/RaporKehadiran"));
const NotifikasiWA = lazy(() => import("@/pages/NotifikasiWA"));
const Changelog = lazy(() => import("@/pages/Changelog"));
const MateriGuru = lazy(() => import("@/pages/elearning/MateriGuru"));
const TugasGuru = lazy(() => import("@/pages/elearning/TugasGuru"));
const ForumDiskusi = lazy(() => import("@/pages/elearning/ForumDiskusi"));
const DashboardSiswa = lazy(() => import("@/pages/elearning/DashboardSiswa"));
const MateriSiswa = lazy(() => import("@/pages/elearning/MateriSiswa"));
const TugasSiswa = lazy(() => import("@/pages/elearning/TugasSiswa"));
const NilaiSiswa = lazy(() => import("@/pages/elearning/NilaiSiswa"));
const ValidasiGtk = lazy(() => import("@/pages/ValidasiGtk"));
const SPMBPage = lazy(() => import("@/pages/PPDB"));
const SPMBDaftar = lazy(() => import("@/pages/PPDBDaftar"));
const SPMBCekStatus = lazy(() => import("@/pages/PPDBCekStatus"));
const PDUM = lazy(() => import("@/pages/PDUM"));
const GajiGuru = lazy(() => import("@/pages/GajiGuru"));
const KelulusanPublik = lazy(() => import("@/pages/KelulusanPublik"));
const KartuUjian = lazy(() => import("@/pages/KartuUjian"));
const PetaSitus = lazy(() => import("@/pages/PetaSitus"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Preserve URL hash during root redirect (needed for OAuth callback tokens)
const RootRedirect = () => {
  const hash = window.location.hash;
  return <Navigate to={`/login${hash}`} replace />;
};

// Loading fallback for lazy components
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
          <UpdateChecker />
          <WhatsNewDialog />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/gtk/:id" element={<ValidasiGtk />} />
                <Route path="/spmb/daftar" element={<SPMBDaftar />} />
                <Route path="/spmb/cek-status" element={<SPMBCekStatus />} />
                <Route path="/kelulusan" element={<KelulusanPublik />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Dashboard - all roles */}
                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin','operator','bendahara','guru','panitia']}><Dashboard /></ProtectedRoute>} />

                  {/* Akademik - admin/operator (siswa read via Bendahara too) */}
                  <Route path="/siswa" element={<ProtectedRoute allowedRoles={['admin','operator','bendahara']}><Siswa /></ProtectedRoute>} />
                  <Route path="/kelas" element={<ProtectedRoute allowedRoles={['admin','operator']}><Kelas /></ProtectedRoute>} />
                  <Route path="/tahun-ajaran" element={<ProtectedRoute allowedRoles={['admin','operator']}><TahunAjaran /></ProtectedRoute>} />
                  <Route path="/gtk-ptk" element={<ProtectedRoute allowedRoles={['admin','operator']}><GtkPtk /></ProtectedRoute>} />
                  <Route path="/naik-kelas" element={<ProtectedRoute allowedRoles={['admin','operator']}><NaikKelas /></ProtectedRoute>} />
                  <Route path="/alumni" element={<ProtectedRoute allowedRoles={['admin','operator']}><Alumni /></ProtectedRoute>} />
                  <Route path="/e-ijazah" element={<Navigate to="/pdum" replace />} />
                  <Route path="/pdum" element={<ProtectedRoute allowedRoles={['admin','operator']}><PDUM /></ProtectedRoute>} />
                  <Route path="/kartu-ujian" element={<ProtectedRoute allowedRoles={['admin','operator']}><KartuUjian /></ProtectedRoute>} />
                  <Route path="/buku-induk" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><BukuInduk /></ProtectedRoute>} />

                  {/* Keuangan - admin/bendahara */}
                  <Route path="/jenis-tagihan" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><JenisTagihan /></ProtectedRoute>} />
                  <Route path="/pembayaran" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><Pembayaran /></ProtectedRoute>} />
                  <Route path="/pemasukan" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><Pemasukan /></ProtectedRoute>} />
                  <Route path="/pengeluaran" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><Pengeluaran /></ProtectedRoute>} />
                  <Route path="/tunggakan" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><Tunggakan /></ProtectedRoute>} />
                  <Route path="/laporan-keuangan" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><LaporanKeuangan /></ProtectedRoute>} />
                  <Route path="/tutup-buku" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><TutupBuku /></ProtectedRoute>} />
                  <Route path="/gaji-guru" element={<ProtectedRoute allowedRoles={['admin','bendahara']}><GajiGuru /></ProtectedRoute>} />

                  {/* Kurikulum - admin/operator/guru */}
                  <Route path="/atp" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><ATP /></ProtectedRoute>} />
                  <Route path="/kktp" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><KKTP /></ProtectedRoute>} />
                  <Route path="/cp-templates" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><CPTemplates /></ProtectedRoute>} />
                  <Route path="/generator-rpp" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><GeneratorRPP /></ProtectedRoute>} />
                  <Route path="/prota" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><Prota /></ProtectedRoute>} />
                  <Route path="/promes" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><Promes /></ProtectedRoute>} />
                  <Route path="/panduan-kurikulum" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><PanduanKurikulum /></ProtectedRoute>} />

                  {/* Admin only */}
                  <Route path="/pengaturan-madrasah" element={<ProtectedRoute allowedRoles={['admin']}><PengaturanMadrasah /></ProtectedRoute>} />
                  <Route path="/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                  <Route path="/notifikasi-wa" element={<ProtectedRoute allowedRoles={['admin']}><NotifikasiWA /></ProtectedRoute>} />

                  {/* Surat - admin/operator */}
                  <Route path="/surat-masuk" element={<ProtectedRoute allowedRoles={['admin','operator']}><SuratMasuk /></ProtectedRoute>} />
                  <Route path="/surat-keluar" element={<ProtectedRoute allowedRoles={['admin','operator']}><SuratKeluar /></ProtectedRoute>} />

                  {/* Profil Guru - guru/bendahara (GTK linked) */}
                  <Route path="/profil-guru" element={<ProtectedRoute allowedRoles={['guru','bendahara','admin']}><ProfilGuru /></ProtectedRoute>} />

                  {/* Absensi - admin/operator/guru */}
                  <Route path="/absensi-siswa" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><AbsensiSiswa /></ProtectedRoute>} />
                  <Route path="/absensi-gtk" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><AbsensiGtk /></ProtectedRoute>} />
                  <Route path="/rekap-absensi" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><RekapAbsensi /></ProtectedRoute>} />
                  <Route path="/rapor-kehadiran" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><RaporKehadiran /></ProtectedRoute>} />

                  {/* Kalender - all roles incl. siswa */}
                  <Route path="/kalender-akademik" element={<KalenderAkademik />} />

                  {/* Changelog & Peta Situs - all roles */}
                  <Route path="/changelog" element={<Changelog />} />
                  <Route path="/peta-situs" element={<PetaSitus />} />

                  {/* SPMB - admin only */}
                  <Route path="/spmb" element={<ProtectedRoute allowedRoles={['admin', 'panitia']}><SPMBPage /></ProtectedRoute>} />

                  {/* E-Learning - guru side */}
                  <Route path="/e-learning/materi-guru" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><MateriGuru /></ProtectedRoute>} />
                  <Route path="/e-learning/tugas-guru" element={<ProtectedRoute allowedRoles={['admin','operator','guru']}><TugasGuru /></ProtectedRoute>} />
                  <Route path="/e-learning/forum" element={<ProtectedRoute allowedRoles={['admin','operator','guru','siswa']}><ForumDiskusi /></ProtectedRoute>} />

                  {/* E-Learning - siswa side */}
                  <Route path="/e-learning/dashboard" element={<ProtectedRoute allowedRoles={['siswa']}><DashboardSiswa /></ProtectedRoute>} />
                  <Route path="/e-learning/materi-siswa" element={<ProtectedRoute allowedRoles={['siswa']}><MateriSiswa /></ProtectedRoute>} />
                  <Route path="/e-learning/tugas-siswa" element={<ProtectedRoute allowedRoles={['siswa']}><TugasSiswa /></ProtectedRoute>} />
                  <Route path="/e-learning/nilai" element={<ProtectedRoute allowedRoles={['siswa']}><NilaiSiswa /></ProtectedRoute>} />
                </Route>
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
