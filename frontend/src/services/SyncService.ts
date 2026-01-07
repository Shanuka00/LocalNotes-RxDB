import axios from 'axios';

import { getDb } from '../db';
import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION } from '../db/schemas';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';

export type SyncResult = {
  processed: number; // How many operations were synced
  stoppedBecause: 'completed' | 'offline' | 'failed'; // Why sync stopped
};

// Flag to prevent multiple sync processes running at once
let syncInProgress = false;

// Get API base URL from environment or use default
function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
}

/**
 * Compare timestamps to determine which version is newer
 * Used for conflict resolution (last-write-wins)
 */
function isIncomingNewer(incomingUpdatedAt: string, currentUpdatedAt: string): boolean {
  const incoming = new Date(incomingUpdatedAt).getTime();
  const current = new Date(currentUpdatedAt).getTime();
  return Number.isFinite(incoming) && Number.isFinite(current) ? incoming > current : incomingUpdatedAt > currentUpdatedAt;
}

/**
 * Update sync status of a note in RxDB
 */
async function setNoteSyncStatus(noteId: string, status: NoteDocType['syncStatus']): Promise<void> {
  const db = await getDb();
  const doc = await db.collections[NOTE_COLLECTION].findOne({ selector: { id: noteId } }).exec();
  if (!doc) return;
  await doc.incrementalPatch({ syncStatus: status });
}

/**
 * Check if there are any pending operations for a specific note
 * Used to avoid overwriting local changes with server data
 */
async function hasAnyQueuedOpsForNote(noteId: string): Promise<boolean> {
  const db = await getDb();
  const remaining = await db.collections[SYNC_QUEUE_COLLECTION]
    .find({ selector: { entity: 'note' } })
    .exec();

  return remaining.some((q) => (q.toJSON() as SyncQueueItemDocType).payload.id === noteId);
}

/**
 * Service for syncing data between local RxDB and remote server
 */
export class SyncService {
  /**
   * Pull latest notes from server into RxDB
   * 
   * This:
   * 1. Fetches all notes from server
   * 2. Updates local RxDB with newer versions
   * 3. Skips notes that have pending local changes
   * 
   * Uses last-write-wins conflict resolution based on updatedAt timestamp
   */
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
      // Don't overwrite notes that have pending local changes
      const hasQueued = await hasAnyQueuedOpsForNote(serverNote.id);
      if (hasQueued) {
        skipped += 1;
        continue;
      }

      const existing = await db.collections[NOTE_COLLECTION]
        .findOne({ selector: { id: serverNote.id } })
        .exec();

      // Note doesn't exist locally - insert it
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
      // Only update if server version is newer
      if (!isIncomingNewer(serverNote.updatedAt, local.updatedAt)) {
        continue; // Local version is newer or same, keep it
      }

      // Server version is newer, update local copy
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

  /**
   * Process sync queue once (all pending operations)
   * 
   * This:
   * 1. Gets all queued operations in FIFO order
   * 2. Sends each to server one by one
   * 3. Removes from queue on success
   * 4. Stops on first failure (to maintain order)
   * 5. Updates note sync status
   */
  static async processQueueOnce(): Promise<SyncResult> {
    // Prevent multiple sync processes running at same time
    if (syncInProgress) {
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

      // Get all queue items sorted by creation time (FIFO)
      const queueDocs = await db.collections[SYNC_QUEUE_COLLECTION]
        .find({ selector: { entity: 'note' }, sort: [{ createdAt: 'asc' }] })
        .exec();

      console.log(`[SyncService] Found ${queueDocs.length} items in queue`);

      let processed = 0;

      // Process each queued operation
      for (const queueDoc of queueDocs) {
        // Stop if we went offline during sync
        if (!navigator.onLine) {
          console.log('[SyncService] Went offline during sync');
          return { processed, stoppedBecause: 'offline' };
        }

        const item = queueDoc.toJSON() as SyncQueueItemDocType;
        console.log(`[SyncService] Processing ${item.action} for note ${item.payload.id}`);

        try {
          // Send operation to server
          const response = await axios.post(`${apiBaseUrl()}/notes/sync`, {
            entity: item.entity,
            action: item.action,
            payload: item.payload,
          });

          console.log(`[SyncService] Successfully synced, response:`, response.data);

          // Remove from queue after successful sync
          await queueDoc.remove();
          processed += 1;

          // If no more operations for this note, mark as fully synced
          const stillQueued = await hasAnyQueuedOpsForNote(item.payload.id);
          if (!stillQueued) {
            await setNoteSyncStatus(item.payload.id, 'synced');
            console.log(`[SyncService] Marked note ${item.payload.id} as synced`);
          }
        } catch (err) {
          // Stop on first failure to maintain operation order
          // The failed operation stays in queue to retry later
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
