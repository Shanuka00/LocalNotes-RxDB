import { getDb } from '../db';
import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION } from '../db/schemas';
import { isoMinusDays } from '../utils/time';

/**
 * Service for cleaning up old data from RxDB/IndexedDB
 * 
 * Why cleanup is needed:
 * - Soft-deleted notes (isDeleted: true) are kept for sync conflict resolution
 *   but accumulate indefinitely without cleanup
 * - Sync queue items are removed after success, but old failed/stuck items
 *   may remain if they're never successfully sent
 * - IndexedDB has storage quotas (typically 50-100MB+); excessive data hits limits
 * 
 * This service safely removes old data that's no longer needed:
 * - Soft-deleted notes older than N days (default 7)
 * - Sync queue items older than N days (default 7)
 */
export class CleanupService {
  /**
   * Permanently remove soft-deleted notes older than specified days
   * 
   * Safe because:
   * - Only targets notes with isDeleted: true
   * - Only removes if updatedAt is older than cutoff date
   * - Allows sufficient time for sync to process deletions
   * 
   * @param days - How many days back to keep (older notes are removed)
   * @returns Number of notes permanently deleted
   */
  static async purgeSoftDeletedNotes(days: number = 7): Promise<number> {
    try {
      const db = await getDb();
      const cutoff = isoMinusDays(days); // ISO string for date N days ago

      // Find all soft-deleted notes older than cutoff date
      const docs = await db.collections[NOTE_COLLECTION]
        .find({
          selector: {
            isDeleted: true, // Only deleted notes
            updatedAt: { $lt: cutoff }, // Only older than cutoff
          },
        })
        .exec();

      let removed = 0;

      // Permanently delete each old note from RxDB/IndexedDB
      for (const doc of docs) {
        await doc.remove();
        removed++;
      }

      if (removed > 0) {
        console.log(`[CleanupService] Purged ${removed} soft-deleted notes older than ${days} days`);
      }

      return removed;
    } catch (err) {
      console.error('[CleanupService] Error purging soft-deleted notes:', err);
      return 0;
    }
  }

  /**
   * Remove old sync queue items
   * 
   * Sync queue items are normally removed after successful sync.
   * This cleanup removes items that are very old, which may indicate:
   * - Failed operations that got stuck
   * - Items from retries that are no longer relevant
   * 
   * Safe because:
   * - Only removes items older than cutoff
   * - By that time, sync either succeeded or failed permanently
   * - User still has note in database (this is just the queue item)
   * 
   * @param days - How many days back to keep (older items are removed)
   * @returns Number of queue items deleted
   */
  static async cleanupOldQueueItems(days: number = 7): Promise<number> {
    try {
      const db = await getDb();
      const cutoff = isoMinusDays(days);

      // Find all queue items older than cutoff
      const docs = await db.collections[SYNC_QUEUE_COLLECTION]
        .find({
          selector: {
            createdAt: { $lt: cutoff },
          },
        })
        .exec();

      let removed = 0;

      // Remove each old queue item
      for (const doc of docs) {
        await doc.remove();
        removed++;
      }

      if (removed > 0) {
        console.log(`[CleanupService] Cleaned up ${removed} queue items older than ${days} days`);
      }

      return removed;
    } catch (err) {
      console.error('[CleanupService] Error cleaning up queue items:', err);
      return 0;
    }
  }

  /**
   * Estimate current storage usage
   * 
   * Returns info about IndexedDB storage usage if available
   * Can be used to warn users when storage is getting full
   * 
   * @returns Object with usage in bytes and quota in bytes, or null if not supported
   */
  static async estimateStorage(): Promise<{ usage?: number; quota?: number } | null> {
    try {
      if (navigator.storage?.estimate) {
        return await navigator.storage.estimate();
      }
    } catch (err) {
      console.warn('[CleanupService] Could not estimate storage:', err);
    }
    return null;
  }

  /**
   * Run all cleanup operations
   * This is the main entry point - call this after sync completes
   * 
   * @param softDeleteDays - Days to keep for soft-deleted notes (default 7)
   * @param queueDays - Days to keep for queue items (default 7)
   */
  static async runCleanup(softDeleteDays: number = 7, queueDays: number = 7): Promise<void> {
    // Run both cleanups in parallel (no dependencies between them)
    const [deletedCount, queueCount] = await Promise.all([
      this.purgeSoftDeletedNotes(softDeleteDays),
      this.cleanupOldQueueItems(queueDays),
    ]);

    // Log summary if anything was cleaned
    if (deletedCount > 0 || queueCount > 0) {
      console.log(
        `[CleanupService] Cleanup complete: removed ${deletedCount} notes + ${queueCount} queue items`,
      );
    }
  }
}
