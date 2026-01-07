import { useMemo } from 'react';
import { from } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

import { getDb } from '../db';
import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION } from '../db/schemas';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';
import { useRxObservable } from './useRxObservable';

export type SyncSummary = {
  queueLength: number;
  pendingNotes: number;
  failedNotes: number;
  allSynced: boolean;
};

export function useSyncSummary(): SyncSummary {
  const queue$ = useMemo(() => {
    return from(getDb()).pipe(
      switchMap((db) => db.collections[SYNC_QUEUE_COLLECTION].find({ sort: [{ createdAt: 'asc' }] }).$),
      map((docs) => docs.map((d) => d.toJSON() as SyncQueueItemDocType)),
      startWith([] as SyncQueueItemDocType[]),
    );
  }, []);

  const notes$ = useMemo(() => {
    return from(getDb()).pipe(
      switchMap((db) => db.collections[NOTE_COLLECTION].find({ selector: { isDeleted: false } }).$),
      map((docs) => docs.map((d) => d.toJSON() as NoteDocType)),
      startWith([] as NoteDocType[]),
    );
  }, []);

  const queue = useRxObservable<SyncQueueItemDocType[]>(queue$, []);
  const notes = useRxObservable<NoteDocType[]>(notes$, []);

  const pendingNotes = notes.filter((n) => n.syncStatus === 'pending').length;
  const failedNotes = notes.filter((n) => n.syncStatus === 'failed').length;

  return {
    queueLength: queue.length,
    pendingNotes,
    failedNotes,
    allSynced: queue.length === 0 && pendingNotes === 0 && failedNotes === 0,
  };
}
