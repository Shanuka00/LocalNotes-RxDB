import { useEffect } from 'react';

import { SyncService } from '../services/SyncService';
import { useOnlineStatus } from './useOnlineStatus';
import { useSyncSummary } from './useSyncSummary';

export function useSyncProcessor(): void {
  const online = useOnlineStatus();
  const { queueLength } = useSyncSummary();

  useEffect(() => {
    if (!online) return;

    let cancelled = false;

    const run = async () => {
      // WHY: When online, we first pull server notes into RxDB so the UI can render
      // them without depending on API responses. Then we push any queued local ops.
      // Both steps are best-effort; the UI always reads from RxDB.

      try {
        await SyncService.pullFromServer();
      } catch {
        // Ignore pull errors; push may still succeed.
      }

      while (!cancelled && navigator.onLine) {
        const result = await SyncService.processQueueOnce();
        if (result.stoppedBecause !== 'completed' || result.processed === 0) break;
      }

      try {
        await SyncService.pullFromServer();
      } catch {
        // Ignore pull errors.
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [online, queueLength]);
}
