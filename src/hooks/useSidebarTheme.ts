import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

const writeLocal = (theme: ThemeColor, intensity: GradientIntensity) => {
  localStorage.setItem(THEME_KEY, theme);
  localStorage.setItem(GRADIENT_KEY, intensity);
  window.dispatchEvent(new Event(EVENT_NAME));
};

export function useSidebarTheme() {
  const { user } = useAuth();
  const [themeColor, setThemeColorState] = useState<ThemeColor>(readTheme);
  const [intensity, setIntensityState] = useState<GradientIntensity>(readIntensity);
  const lastUserId = useRef<string | null>(null);

  // Sync from storage / custom event (cross-tab + same-tab)
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

  // On login: fetch preferences from profiles → apply to local
  useEffect(() => {
    if (!user || lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('sidebar_theme, sidebar_intensity')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) return;

      const t = (data.sidebar_theme as ThemeColor) || 'hijau';
      const i = (data.sidebar_intensity as GradientIntensity) || 'kuat';
      setThemeColorState(t);
      setIntensityState(i);
      writeLocal(t, i);
    })();
  }, [user]);

  // Reset tracker on logout
  useEffect(() => {
    if (!user) lastUserId.current = null;
  }, [user]);

  const persistRemote = useCallback(
    async (patch: { sidebar_theme?: ThemeColor; sidebar_intensity?: GradientIntensity }) => {
      if (!user) return;
      await supabase.from('profiles').update(patch).eq('user_id', user.id);
    },
    [user]
  );

  const setTheme = useCallback(
    (v: ThemeColor) => {
      localStorage.setItem(THEME_KEY, v);
      setThemeColorState(v);
      window.dispatchEvent(new Event(EVENT_NAME));
      persistRemote({ sidebar_theme: v });
    },
    [persistRemote]
  );

  const setIntensity = useCallback(
    (v: GradientIntensity) => {
      localStorage.setItem(GRADIENT_KEY, v);
      setIntensityState(v);
      window.dispatchEvent(new Event(EVENT_NAME));
      persistRemote({ sidebar_intensity: v });
    },
    [persistRemote]
  );

  return { themeColor, intensity, setTheme, setIntensity };
}
