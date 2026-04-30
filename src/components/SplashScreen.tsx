import { useState, useEffect, useRef } from 'react';
import { APP_VERSION, APP_BUILD_DATE } from '@/config/version';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Deteksi prefers-reduced-motion (reactive)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  // Timing: lebih cepat & subtle untuk reduced motion
  useEffect(() => {
    const showMs = reducedMotion ? 1400 : 2400;
    const exitMs = reducedMotion ? 250 : 850;
    const startExit = setTimeout(() => setExiting(true), showMs);
    const finish = setTimeout(onFinish, showMs + exitMs);
    return () => { clearTimeout(startExit); clearTimeout(finish); };
  }, [onFinish, reducedMotion]);

  // Focus trap ringan: kunci fokus ke splash + restore setelah selesai
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    rootRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      // Cegah Tab keluar dari splash & cegah aksi keyboard mengganggu loading
      if (e.key === 'Tab') e.preventDefault();
    };
    document.addEventListener('keydown', handleKey, true);

    // Cegah scroll latar saat splash aktif
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.body.style.overflow = prevOverflow;
      // Restore fokus ke elemen sebelumnya jika masih ada di DOM
      const prev = previousFocusRef.current as HTMLElement | null;
      if (prev && document.body.contains(prev)) {
        prev.focus?.();
      }
    };
  }, []);

  const buildYear = (APP_BUILD_DATE || '').slice(0, 4) || new Date().getFullYear().toString();

  // Transisi: lebih natural — durasi panjang, easing halus, blur/zoom subtle
  // Untuk reduced motion: hanya fade tanpa blur/zoom
  const transitionStyle: React.CSSProperties = reducedMotion
    ? {
        opacity: exiting ? 0 : 1,
        transition: 'opacity 250ms ease-out',
      }
    : {
        opacity: exiting ? 0 : 1,
        filter: exiting ? 'blur(6px)' : 'blur(0px)',
        transform: exiting ? 'scale(1.012)' : 'scale(1)',
        transition:
          'opacity 850ms cubic-bezier(0.22, 0.61, 0.36, 1), filter 850ms cubic-bezier(0.22, 0.61, 0.36, 1), transform 850ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        willChange: 'opacity, filter, transform',
      };

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      aria-label={`Memuat SIM MTs Al Wathoniyah 43, versi ${APP_VERSION}`}
      tabIndex={-1}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-hero outline-none ${
        exiting ? 'pointer-events-none' : ''
      }`}
      style={transitionStyle}
    >
      {/* Soft glow background — disembunyikan saat reduced motion agar lebih tenang */}
      {!reducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full bg-primary-foreground/5 blur-3xl" />
        </div>
      )}

      <div className={`relative flex flex-col items-center gap-3 ${reducedMotion ? '' : 'animate-fade-in'}`}>
        {/* Label kecil di atas — kontras dinaikkan dari /70 ke /85 */}
        <span className="text-[11px] font-semibold tracking-[0.4em] text-primary-foreground/85 uppercase">
          SIM
        </span>

        {/* Logo */}
        <img
          src="/logo-alwathoniyah.png"
          alt=""
          aria-hidden="true"
          className={`h-24 w-24 rounded-2xl object-contain drop-shadow-lg ${reducedMotion ? '' : 'animate-scale-in'}`}
        />

        {/* Judul utama — sudah kontras tinggi */}
        <h1 className="mt-2 text-3xl font-bold text-primary-foreground drop-shadow-md tracking-tight">
          MTs Al Wathoniyah 43
        </h1>
        <p className="text-sm text-primary-foreground/90">
          Sistem Informasi Manajemen Madrasah
        </p>

        {/* Loading bar — saat reduced motion: bar statis dengan teks status */}
        <div
          className="mt-8 relative h-1.5 w-56 overflow-hidden rounded-full bg-primary-foreground/20 ring-1 ring-primary-foreground/25"
          role="progressbar"
          aria-label="Memuat aplikasi"
          aria-valuemin={0}
          aria-valuemax={100}
          {...(reducedMotion ? { 'aria-valuenow': 50 } : {})}
        >
          {reducedMotion ? (
            <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary-foreground/90" />
          ) : (
            <>
              <div className="absolute inset-y-0 left-0 animate-splash-progress rounded-full bg-gradient-to-r from-primary-foreground/80 via-primary-foreground to-primary-foreground/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
              <div className="absolute inset-y-0 left-0 w-1/3 animate-shimmer-slide bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </>
          )}
        </div>

        <span className="mt-3 text-[10px] font-medium tracking-[0.3em] text-primary-foreground/75 uppercase">
          Memuat...
        </span>
      </div>

      {/* Footer: versi & brand kecil — kontras dinaikkan */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 text-primary-foreground/85">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider">
          <span className="px-2 py-0.5 rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/30">
            v{APP_VERSION}
          </span>
          <span className="text-primary-foreground/60" aria-hidden="true">•</span>
          <span className="uppercase tracking-[0.25em] text-[10px]">Build {APP_BUILD_DATE}</span>
        </div>
        <p className="text-[10px] text-primary-foreground/70 tracking-wide">
          © {buildYear} MTs Al Wathoniyah 43
        </p>
      </div>
    </div>
  );
}
