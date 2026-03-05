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
const PengaturanMadrasah = lazy(() => import("@/pages/PengaturanMadrasah"));
const SuratMasuk = lazy(() => import("@/pages/SuratMasuk"));
const SuratKeluar = lazy(() => import("@/pages/SuratKeluar"));
const BukuInduk = lazy(() => import("@/pages/BukuInduk"));
const ProfilGuru = lazy(() => import("@/pages/ProfilGuru"));
const AbsensiSiswa = lazy(() => import("@/pages/AbsensiSiswa"));
const AbsensiGtk = lazy(() => import("@/pages/AbsensiGtk"));
const KalenderAkademik = lazy(() => import("@/pages/KalenderAkademik"));
const RekapAbsensi = lazy(() => import("@/pages/RekapAbsensi"));
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
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/siswa" element={<Siswa />} />
                  <Route path="/kelas" element={<Kelas />} />
                  <Route path="/tahun-ajaran" element={<TahunAjaran />} />
                  <Route path="/gtk-ptk" element={<GtkPtk />} />
                  <Route path="/jenis-tagihan" element={<JenisTagihan />} />
                  <Route path="/pembayaran" element={<Pembayaran />} />
                  <Route path="/pemasukan" element={<Pemasukan />} />
                  <Route path="/pengeluaran" element={<Pengeluaran />} />
                  <Route path="/tunggakan" element={<Tunggakan />} />
                  <Route path="/naik-kelas" element={<NaikKelas />} />
                  <Route path="/alumni" element={<Alumni />} />
                  <Route path="/atp" element={<ATP />} />
                  <Route path="/kktp" element={<KKTP />} />
                  <Route path="/cp-templates" element={<CPTemplates />} />
                  <Route path="/generator-rpp" element={<GeneratorRPP />} />
                  <Route path="/prota" element={<Prota />} />
                  <Route path="/promes" element={<Promes />} />
                  <Route path="/panduan-kurikulum" element={<PanduanKurikulum />} />
                  <Route path="/pengaturan-madrasah" element={<PengaturanMadrasah />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/surat-masuk" element={<SuratMasuk />} />
                  <Route path="/surat-keluar" element={<SuratKeluar />} />
                  <Route path="/buku-induk" element={<BukuInduk />} />
                  <Route path="/profil-guru" element={<ProfilGuru />} />
                  <Route path="/absensi-siswa" element={<AbsensiSiswa />} />
                  <Route path="/absensi-gtk" element={<AbsensiGtk />} />
                  <Route path="/kalender-akademik" element={<KalenderAkademik />} />
                  <Route path="/rekap-absensi" element={<RekapAbsensi />} />
                  <Route path="/notifikasi-wa" element={<NotifikasiWA />} />
                  <Route path="/changelog" element={<Changelog />} />
                  <Route path="/e-learning/materi-guru" element={<MateriGuru />} />
                  <Route path="/e-learning/tugas-guru" element={<TugasGuru />} />
                  <Route path="/e-learning/forum" element={<ForumDiskusi />} />
                  <Route path="/e-learning/dashboard" element={<DashboardSiswa />} />
                  <Route path="/e-learning/materi-siswa" element={<MateriSiswa />} />
                  <Route path="/e-learning/tugas-siswa" element={<TugasSiswa />} />
                  <Route path="/e-learning/nilai" element={<NilaiSiswa />} />
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
