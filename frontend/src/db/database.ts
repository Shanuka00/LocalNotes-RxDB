import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import type { RxCollection } from 'rxdb';

import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION, noteSchema, syncQueueSchema } from './schemas';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';

// RxDB uses plugins to add functionality. We only register the ones we need:
// - UpdatePlugin: Allows incremental updates to documents
// - MigrationSchemaPlugin: Supports schema version changes
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

// Type definitions for our RxDB collections
export type NotesCollection = RxCollection<NoteDocType>;
export type SyncQueueCollection = RxCollection<SyncQueueItemDocType>;

// Define all collections in our database
export type LocalNotesDatabaseCollections = {
  [NOTE_COLLECTION]: NotesCollection;
  [SYNC_QUEUE_COLLECTION]: SyncQueueCollection;
};

// Store database promise to ensure we only create one database instance
let dbPromise: Promise<RxDatabase<LocalNotesDatabaseCollections>> | null = null;

/**
 * Get the RxDB database instance (creates it on first call)
 * RxDB is an offline-first database that stores data in IndexedDB
 */
export async function getDb(): Promise<RxDatabase<LocalNotesDatabaseCollections>> {
  // Create database only once and reuse it
  if (!dbPromise) {
    dbPromise = (async () => {
      // Create RxDB database with Dexie storage (uses IndexedDB under the hood)
      const db = await createRxDatabase<LocalNotesDatabaseCollections>({
        name: 'localnotes',
        storage: getRxStorageDexie(), // Use Dexie for IndexedDB storage
        multiInstance: true, // Allow multiple browser tabs to use the same database
        closeDuplicates: true, // Prevent duplicate instances in development/hot-reload
      });

      // Create our two collections:
      // 1. notes: Stores actual note documents
      // 2. syncQueue: Stores pending operations to sync with server
      await db.addCollections({
        [NOTE_COLLECTION]: { schema: noteSchema },
        [SYNC_QUEUE_COLLECTION]: { schema: syncQueueSchema },
      });

      return db;
    })();
  }

  return dbPromise;
}
