import { useEffect, useState } from 'react';

/**
 * Hook to track browser online/offline status
 * 
 * Listens to the browser's online and offline events
 * Returns true when browser has network connectivity, false otherwise
 */
export function useOnlineStatus(): boolean {
  // Initialize with current online status
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // Event handlers for online/offline changes
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    // Listen for browser online/offline events
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Cleanup: Remove listeners when component unmounts
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}
