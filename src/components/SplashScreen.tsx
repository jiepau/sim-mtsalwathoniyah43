import { useState, useEffect } from 'react';
import { APP_VERSION, APP_BUILD_DATE } from '@/config/version';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const startExit = setTimeout(() => setExiting(true), 2400);
    const finish = setTimeout(onFinish, 3300);
    return () => { clearTimeout(startExit); clearTimeout(finish); };
  }, [onFinish]);

  const buildYear = (APP_BUILD_DATE || '').slice(0, 4) || new Date().getFullYear().toString();

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-hero transition-all duration-700 ease-out ${
        exiting ? 'opacity-0 backdrop-blur-xl scale-[1.02] pointer-events-none' : 'opacity-100 backdrop-blur-0 scale-100'
      }`}
      style={{ filter: exiting ? 'blur(12px)' : 'blur(0px)', transition: 'opacity 700ms ease-out, filter 700ms ease-out, transform 700ms ease-out' }}
    >
      {/* Soft glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      <div className="relative animate-fade-in flex flex-col items-center gap-3">
        {/* Label kecil di atas */}
        <span className="text-[11px] font-semibold tracking-[0.4em] text-primary-foreground/70 uppercase">
          SIM
        </span>

        {/* Logo */}
        <img
          src="/logo-alwathoniyah.png"
          alt="Logo MTs Al Wathoniyah 43"
          className="h-24 w-24 rounded-2xl object-contain animate-scale-in drop-shadow-lg"
        />

        {/* Judul utama */}
        <h1 className="mt-2 text-3xl font-bold text-primary-foreground drop-shadow-md tracking-tight">
          MTs Al Wathoniyah 43
        </h1>
        <p className="text-sm text-primary-foreground/80">
          Sistem Informasi Manajemen Madrasah
        </p>

        {/* Loading bar elegant: progress + shimmer overlay */}
        <div className="mt-8 relative h-1.5 w-56 overflow-hidden rounded-full bg-primary-foreground/15 backdrop-blur-sm ring-1 ring-primary-foreground/10">
          <div className="absolute inset-y-0 left-0 animate-splash-progress rounded-full bg-gradient-to-r from-primary-foreground/70 via-primary-foreground to-primary-foreground/70 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          <div className="absolute inset-y-0 left-0 w-1/3 animate-shimmer-slide bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        <span className="mt-3 text-[10px] font-medium tracking-[0.3em] text-primary-foreground/60 uppercase">
          Memuat...
        </span>
      </div>

      {/* Footer: versi & brand kecil */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 text-primary-foreground/70">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider">
          <span className="px-2 py-0.5 rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/20 backdrop-blur-sm">
            v{APP_VERSION}
          </span>
          <span className="text-primary-foreground/50">•</span>
          <span className="uppercase tracking-[0.25em] text-[10px]">Build {APP_BUILD_DATE}</span>
        </div>
        <p className="text-[10px] text-primary-foreground/50 tracking-wide">
          © {buildYear} MTs Al Wathoniyah 43
        </p>
      </div>
    </div>
  );
}
