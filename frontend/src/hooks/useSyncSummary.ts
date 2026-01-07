import { useMemo } from 'react';
import { from } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

import { getDb } from '../db';
import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION } from '../db/schemas';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';
import { useRxObservable } from './useRxObservable';

export type SyncSummary = {
  queueLength: number; // Number of operations waiting to sync
  pendingNotes: number; // Number of notes marked as pending
  failedNotes: number; // Number of notes that failed to sync
  allSynced: boolean; // True if everything is synced
};

/**
 * Hook to get sync status summary
 * 
 * Provides reactive information about:
 * - How many operations are queued
 * - How many notes have pending/failed sync status
 * - Whether everything is fully synced
 */
export function useSyncSummary(): SyncSummary {
  // Create reactive query for sync queue (updates when queue changes)
  const queue$ = useMemo(() => {
    return from(getDb()).pipe(
      switchMap((db) => db.collections[SYNC_QUEUE_COLLECTION].find({ sort: [{ createdAt: 'asc' }] }).$),
      map((docs) => docs.map((d) => d.toJSON() as SyncQueueItemDocType)),
      startWith([] as SyncQueueItemDocType[]),
    );
  }, []);

  // Create reactive query for notes (updates when notes change)
  const notes$ = useMemo(() => {
    return from(getDb()).pipe(
      switchMap((db) => db.collections[NOTE_COLLECTION].find({ selector: { isDeleted: false } }).$),
      map((docs) => docs.map((d) => d.toJSON() as NoteDocType)),
      startWith([] as NoteDocType[]),
    );
  }, []);

  // Subscribe to both observables
  const queue = useRxObservable<SyncQueueItemDocType[]>(queue$, []);
  const notes = useRxObservable<NoteDocType[]>(notes$, []);

  // Calculate sync status from current data
  const pendingNotes = notes.filter((n) => n.syncStatus === 'pending').length;
  const failedNotes = notes.filter((n) => n.syncStatus === 'failed').length;

  return {
    queueLength: queue.length,
    pendingNotes,
    failedNotes,
    allSynced: queue.length === 0 && pendingNotes === 0 && failedNotes === 0,
  };
}
