import axios from 'axios';

import { getDb } from '../db';
import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION } from '../db/schemas';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';

export type SyncResult = {
  processed: number;
  stoppedBecause: 'completed' | 'offline' | 'failed';
};

let syncInProgress = false;

function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
}

function isIncomingNewer(incomingUpdatedAt: string, currentUpdatedAt: string): boolean {
  const incoming = new Date(incomingUpdatedAt).getTime();
  const current = new Date(currentUpdatedAt).getTime();
  return Number.isFinite(incoming) && Number.isFinite(current) ? incoming > current : incomingUpdatedAt > currentUpdatedAt;
}

async function setNoteSyncStatus(noteId: string, status: NoteDocType['syncStatus']): Promise<void> {
  const db = await getDb();
  const doc = await db.collections[NOTE_COLLECTION].findOne({ selector: { id: noteId } }).exec();
  if (!doc) return;
  await doc.incrementalPatch({ syncStatus: status });
}

async function hasAnyQueuedOpsForNote(noteId: string): Promise<boolean> {
  const db = await getDb();
  const remaining = await db.collections[SYNC_QUEUE_COLLECTION]
    .find({ selector: { entity: 'note' } })
    .exec();

  return remaining.some((q) => (q.toJSON() as SyncQueueItemDocType).payload.id === noteId);
}

export class SyncService {
  static async pullFromServer(): Promise<{ pulled: number } | { pulled: number; skipped: number }> {
    if (!navigator.onLine) return { pulled: 0 };

    const response = await axios.get(`${apiBaseUrl()}/notes`);
    const serverNotes = (response.data ?? []) as Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
      updatedAt: string;
      isDeleted: boolean;
    }>;

    const db = await getDb();
    let pulled = 0;
    let skipped = 0;

    for (const serverNote of serverNotes) {
      const hasQueued = await hasAnyQueuedOpsForNote(serverNote.id);
      if (hasQueued) {
        skipped += 1;
        continue;
      }

      const existing = await db.collections[NOTE_COLLECTION]
        .findOne({ selector: { id: serverNote.id } })
        .exec();

      if (!existing) {
        await db.collections[NOTE_COLLECTION].insert({
          id: serverNote.id,
          title: serverNote.title,
          content: serverNote.content,
          tags: Array.isArray(serverNote.tags) ? serverNote.tags : [],
          updatedAt: serverNote.updatedAt,
          isDeleted: !!serverNote.isDeleted,
          syncStatus: 'synced',
        });
        pulled += 1;
        continue;
      }

      const local = existing.toJSON() as NoteDocType;
      if (!isIncomingNewer(serverNote.updatedAt, local.updatedAt)) {
        continue;
      }

      await existing.incrementalPatch({
        title: serverNote.title,
        content: serverNote.content,
        tags: Array.isArray(serverNote.tags) ? serverNote.tags : [],
        updatedAt: serverNote.updatedAt,
        isDeleted: !!serverNote.isDeleted,
        syncStatus: 'synced',
      });
      pulled += 1;
    }

    return { pulled, skipped };
  }

  static async processQueueOnce(): Promise<SyncResult> {
    if (syncInProgress) {
      // WHY: Prevent concurrent processors from duplicating work.
      console.log('[SyncService] Sync already in progress');
      return { processed: 0, stoppedBecause: 'completed' };
    }

    if (!navigator.onLine) {
      console.log('[SyncService] Offline');
      return { processed: 0, stoppedBecause: 'offline' };
    }

    syncInProgress = true;
    console.log('[SyncService] Starting sync...');

    try {
      const db = await getDb();

      // FIFO: process in createdAt order.
      const queueDocs = await db.collections[SYNC_QUEUE_COLLECTION]
        .find({ selector: { entity: 'note' }, sort: [{ createdAt: 'asc' }] })
        .exec();

      console.log(`[SyncService] Found ${queueDocs.length} items in queue`);

      let processed = 0;

      for (const queueDoc of queueDocs) {
        if (!navigator.onLine) {
          console.log('[SyncService] Went offline during sync');
          return { processed, stoppedBecause: 'offline' };
        }

        const item = queueDoc.toJSON() as SyncQueueItemDocType;
        console.log(`[SyncService] Processing ${item.action} for note ${item.payload.id}`);

        try {
          const response = await axios.post(`${apiBaseUrl()}/notes/sync`, {
            entity: item.entity,
            action: item.action,
            payload: item.payload,
          });

          console.log(`[SyncService] Successfully synced, response:`, response.data);

          await queueDoc.remove();
          processed += 1;

          // If there are no more queued operations for this note, it is fully synced.
          const stillQueued = await hasAnyQueuedOpsForNote(item.payload.id);
          if (!stillQueued) {
            await setNoteSyncStatus(item.payload.id, 'synced');
            console.log(`[SyncService] Marked note ${item.payload.id} as synced`);
          }
        } catch (err) {
          // REQUIRED: stop syncing on first failure.
          console.error(`[SyncService] Sync failed for note ${item.payload.id}:`, err);
          await setNoteSyncStatus(item.payload.id, 'failed');
          return { processed, stoppedBecause: 'failed' };
        }
      }

      return { processed, stoppedBecause: 'completed' };
    } finally {
      syncInProgress = false;
    }
  }
}
