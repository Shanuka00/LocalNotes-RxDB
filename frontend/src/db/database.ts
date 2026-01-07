import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import type { RxCollection } from 'rxdb';

import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION, noteSchema, syncQueueSchema } from './schemas';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';

// WHY: RxDB uses a plugin model; we register only what we need.
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

export type NotesCollection = RxCollection<NoteDocType>;
export type SyncQueueCollection = RxCollection<SyncQueueItemDocType>;

export type LocalNotesDatabaseCollections = {
  [NOTE_COLLECTION]: NotesCollection;
  [SYNC_QUEUE_COLLECTION]: SyncQueueCollection;
};

let dbPromise: Promise<RxDatabase<LocalNotesDatabaseCollections>> | null = null;

export async function getDb(): Promise<RxDatabase<LocalNotesDatabaseCollections>> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase<LocalNotesDatabaseCollections>({
        name: 'localnotes',
        storage: getRxStorageDexie(),
        // WHY: multiInstance allows multiple tabs; Dexie + RxDB handles coordination.
        multiInstance: true,
        // WHY: Fixes hot-reload and multi-tab duplicate instances without requiring dev-mode.
        closeDuplicates: true,
      });

      await db.addCollections({
        [NOTE_COLLECTION]: { schema: noteSchema },
        [SYNC_QUEUE_COLLECTION]: { schema: syncQueueSchema },
      });

      return db;
    })();
  }

  return dbPromise;
}
