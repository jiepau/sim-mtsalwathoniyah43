import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Main pages
import Dashboard from "@/pages/Dashboard";
import Siswa from "@/pages/Siswa";
import Kelas from "@/pages/Kelas";
import TahunAjaran from "@/pages/TahunAjaran";
import GtkPtk from "@/pages/GtkPtk";
import JenisTagihan from "@/pages/JenisTagihan";
import Pembayaran from "@/pages/Pembayaran";
import Pemasukan from "@/pages/Pemasukan";
import Pengeluaran from "@/pages/Pengeluaran";
import Tunggakan from "@/pages/Tunggakan";
import NaikKelas from "@/pages/NaikKelas";
import Alumni from "@/pages/Alumni";
import UserManagement from "@/pages/UserManagement";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
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
              <Route path="/user-management" element={<UserManagement />} />
            </Route>
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
