import { useEffect, useState, useCallback } from 'react';

export type ThemeColor = 'hijau' | 'tosca';
export type GradientIntensity = 'kuat' | 'sedang' | 'netral' | 'kontras';

const THEME_KEY = 'sidebar-theme';
const GRADIENT_KEY = 'sidebar-gradient';
const EVENT_NAME = 'sidebar-theme-change';

const readTheme = (): ThemeColor => {
  if (typeof window === 'undefined') return 'hijau';
  return (localStorage.getItem(THEME_KEY) as ThemeColor) || 'hijau';
};

const readIntensity = (): GradientIntensity => {
  if (typeof window === 'undefined') return 'kuat';
  return (localStorage.getItem(GRADIENT_KEY) as GradientIntensity) || 'kuat';
};

export function useSidebarTheme() {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(readTheme);
  const [intensity, setIntensityState] = useState<GradientIntensity>(readIntensity);

  // Sync from storage (other tabs) and from custom event (same tab)
  useEffect(() => {
    const sync = () => {
      setThemeColorState(readTheme());
      setIntensityState(readIntensity());
    };
    window.addEventListener('storage', sync);
    window.addEventListener(EVENT_NAME, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(EVENT_NAME, sync);
    };
  }, []);

  const setTheme = useCallback((v: ThemeColor) => {
    localStorage.setItem(THEME_KEY, v);
    setThemeColorState(v);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const setIntensity = useCallback((v: GradientIntensity) => {
    localStorage.setItem(GRADIENT_KEY, v);
    setIntensityState(v);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { themeColor, intensity, setTheme, setIntensity };
}
