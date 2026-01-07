import { useEffect } from 'react';

import { SyncService } from '../services/SyncService';
import { useOnlineStatus } from './useOnlineStatus';
import { useSyncSummary } from './useSyncSummary';

/**
 * Hook that automatically syncs with the server when online
 * 
 * This hook:
 * 1. Watches for online status changes
 * 2. When online, pulls latest data from server into RxDB
 * 3. Pushes any queued local operations to the server
 * 4. Re-runs when queue length changes (new operations added)
 */
export function useSyncProcessor(): void {
  const online = useOnlineStatus();
  const { queueLength } = useSyncSummary();

  useEffect(() => {
    // Only sync when online
    if (!online) return;

    let cancelled = false;

    const run = async () => {
      // Step 1: Pull latest notes from server into RxDB
      // This ensures UI shows up-to-date data even if sync fails
      try {
        await SyncService.pullFromServer();
      } catch {
        // Continue even if pull fails - pushing may still work
      }

      // Step 2: Push all queued operations to server (FIFO order)
      // Keep processing until queue is empty or we go offline
      while (!cancelled && navigator.onLine) {
        const result = await SyncService.processQueueOnce();
        // Stop if no items were processed or sync failed
        if (result.stoppedBecause !== 'completed' || result.processed === 0) break;
      }

      // Step 3: Final pull to ensure we have latest server state
      try {
        await SyncService.pullFromServer();
      } catch {
        // Ignore errors
      }
    };

    run();

    // Cleanup: Cancel sync if component unmounts or dependencies change
    return () => {
      cancelled = true;
    };
  }, [online, queueLength]);
}
