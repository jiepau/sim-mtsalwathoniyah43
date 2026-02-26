import { useState, useEffect } from 'react';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2000);
    const finish = setTimeout(onFinish, 2600);
    return () => { clearTimeout(timer); clearTimeout(finish); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-hero transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="animate-fade-in flex flex-col items-center gap-4">
        <img
          src="/logo-alwathoniyah.png"
          alt="Logo"
          className="h-24 w-24 rounded-2xl object-contain animate-scale-in"
        />
        <h1 className="text-2xl font-bold text-primary-foreground drop-shadow-md">
          SIM MTs Al Wathoniyah 43
        </h1>
        <p className="text-sm text-primary-foreground/80">
          Sistem Informasi Manajemen Madrasah
        </p>
        <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full animate-loading-bar rounded-full bg-primary-foreground/80" />
        </div>
      </div>
    </div>
  );
}
