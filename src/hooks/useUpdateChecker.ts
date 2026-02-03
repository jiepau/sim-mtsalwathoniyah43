import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION, GITHUB_API_URL } from '@/config/version';

const STORAGE_KEY = 'app_update_info';

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string | null;
  releaseUrl: string | null;
  checkedAt: string | null;
  error: string | null;
}

const defaultUpdateInfo: UpdateInfo = {
  hasUpdate: false,
  latestVersion: null,
  releaseUrl: null,
  checkedAt: null,
  error: null,
};

// Compare two semantic versions
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

export function useUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored update info:', e);
    }
    return defaultUpdateInfo;
  });
  
  const [checking, setChecking] = useState(false);

  // Save to localStorage whenever updateInfo changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updateInfo));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('update-info-changed', { detail: updateInfo }));
    } catch (e) {
      console.error('Failed to save update info:', e);
    }
  }, [updateInfo]);

  // Listen for changes from other components
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent<UpdateInfo>) => {
      setUpdateInfo(e.detail);
    };

    window.addEventListener('update-info-changed' as any, handleStorageChange);
    return () => {
      window.removeEventListener('update-info-changed' as any, handleStorageChange);
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!GITHUB_API_URL) {
      setUpdateInfo({
        ...defaultUpdateInfo,
        error: 'Repository belum dikonfigurasi',
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setChecking(true);

    try {
      const response = await fetch(GITHUB_API_URL);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil informasi update');
      }

      const data = await response.json();
      const latestVersion = data.tag_name?.replace('v', '') || data.name;
      const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0;

      setUpdateInfo({
        hasUpdate,
        latestVersion,
        releaseUrl: data.html_url,
        checkedAt: new Date().toISOString(),
        error: null,
      });
    } catch (error) {
      setUpdateInfo({
        ...defaultUpdateInfo,
        error: 'Tidak dapat memeriksa update. Repo mungkin private.',
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setChecking(false);
    }
  }, []);

  // Clear the update notification (after user has seen/updated)
  const dismissUpdate = useCallback(() => {
    setUpdateInfo(prev => ({
      ...prev,
      hasUpdate: false,
    }));
  }, []);

  return {
    updateInfo,
    checking,
    checkForUpdates,
    dismissUpdate,
    hasUpdate: updateInfo.hasUpdate,
  };
}
