import { useEffect } from 'react';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function UpdateChecker() {
  const { checkForUpdates, updateInfo } = useUpdateChecker();

  useEffect(() => {
    // Check if we should auto-check (first load or 24h since last check)
    const lastChecked = updateInfo.checkedAt;
    const shouldCheck = !lastChecked || 
      (Date.now() - new Date(lastChecked).getTime() > CHECK_INTERVAL_MS);

    if (shouldCheck) {
      checkForUpdates();
    }
  }, []); // Only run once on mount

  return null; // This component doesn't render anything
}
