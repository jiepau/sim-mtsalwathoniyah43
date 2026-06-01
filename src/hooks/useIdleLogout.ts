import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const IDLE_MS = 30 * 60 * 1000; // 30 menit
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;
const STORAGE_KEY = 'lastActivityAt';

/**
 * Auto-logout setelah idle 30 menit (tanpa peringatan).
 * Aktivitas disinkronkan antar-tab via localStorage.
 */
export function useIdleLogout() {
  const { user, signOut } = useAuth();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const triggerLogout = async () => {
      toast.info('Sesi berakhir karena tidak ada aktivitas selama 30 menit. Silakan login ulang.');
      try {
        await signOut();
      } finally {
        // Reload supaya semua cache React Query bersih
        setTimeout(() => window.location.replace('/auth/login'), 300);
      }
    };

    const schedule = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(triggerLogout, IDLE_MS);
    };

    const markActivity = () => {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      schedule();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) schedule();
    };

    // Kalau halaman dibuka lagi setelah lama idle, langsung logout
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (last && Date.now() - last > IDLE_MS) {
      triggerLogout();
      return;
    }

    markActivity();
    EVENTS.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }));
    window.addEventListener('storage', onStorage);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      EVENTS.forEach((ev) => window.removeEventListener(ev, markActivity));
      window.removeEventListener('storage', onStorage);
    };
  }, [user, signOut]);
}
