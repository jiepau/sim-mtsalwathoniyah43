import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Loader2, Eye, EyeOff, Megaphone, GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { mapAuthError } from "@/lib/error-mapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import loginBg from "@/assets/login-background.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Show announcement popup once per session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("login-announce-dismissed");
    if (!dismissed) {
      const t = setTimeout(() => setAnnounceOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const handleCloseAnnounce = () => {
    sessionStorage.setItem("login-announce-dismissed", "1");
    setAnnounceOpen(false);
  };

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(mapAuthError(error));
        setLoading(false);
      } else {
        toast.success("Berhasil masuk!");
        // Don't navigate here - let useEffect handle it to avoid race condition
        // Navigation will happen via useEffect when user state updates
      }
    } catch (error) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <Helmet>
        <title>Masuk — SIM MTs Al Wathoniyah 43</title>
        <meta
          name="description"
          content="Halaman masuk Sistem Informasi Manajemen MTs Al Wathoniyah 43 untuk admin, guru, bendahara, operator, dan siswa."
        />
        <link rel="canonical" href="https://sim.mtsalwathoniyah43.com/login" />
        <meta property="og:title" content="Masuk — SIM MTs Al Wathoniyah 43" />
        <meta property="og:description" content="Halaman masuk Sistem Informasi Manajemen MTs Al Wathoniyah 43." />
        <meta property="og:url" content="https://sim.mtsalwathoniyah43.com/login" />
      </Helmet>
      <Card className="w-full max-w-md shadow-2xl border-0 bg-background/85 backdrop-blur-md">
        <CardHeader className="text-center pb-2">
          <img
            src="/logo-alwathoniyah.png"
            alt="Logo MTs Al Wathoniyah 43"
            className="mx-auto h-20 w-20 rounded-2xl object-contain mb-4"
          />
          <CardDescription>Sistem Informasi Manajemen Madrasah </CardDescription>
          <CardDescription>MTSS AL WATHONIYAH 43</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@madrasah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>

            <p className="text-sm text-muted-foreground text-center">Hubungi administrator untuk mendapatkan akun.</p>
            <div className="flex justify-center gap-3 text-xs">
              <a href="/spmb/daftar" className="text-primary hover:underline">
                Daftar SPMB
              </a>
              <span className="text-muted-foreground">·</span>
              <a href="/kelulusan" className="text-primary hover:underline">
                Pengumuman Kelulusan
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={announceOpen} onOpenChange={(o) => (o ? setAnnounceOpen(true) : handleCloseAnnounce())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-lg">Pengumuman Madrasah</DialogTitle>
            <DialogDescription className="text-center">
              Informasi penting dari MTs Al Wathoniyah 43
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">SPMB Sedang Dibuka!</p>
                <p className="text-muted-foreground">
                  Pendaftaran Peserta Didik Baru tahun pelajaran ini sudah dibuka. Silakan daftar online.
                </p>
                <a
                  href="/spmb/daftar"
                  className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                >
                  → Daftar Sekarang
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Pengumuman Kelulusan</p>
                <p className="text-muted-foreground">
                  Pengumuman kelulusan kelas 9 akan segera dibuka. Pantau terus halaman pengumuman.
                </p>
                <a
                  href="/kelulusan"
                  className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                >
                  → Cek Halaman Kelulusan
                </a>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" className="w-full" onClick={handleCloseAnnounce}>
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
