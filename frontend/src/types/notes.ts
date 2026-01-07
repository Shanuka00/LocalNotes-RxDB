// Sync status of a note
export type SyncStatus = 'synced' | 'pending' | 'failed';

// Note document structure (stored in RxDB)
export type NoteDocType = {
  id: string; // UUID generated on client
  title: string;
  content: string;
  tags: string[];
  updatedAt: string; // ISO timestamp for conflict resolution
  isDeleted: boolean; // Soft delete flag
  syncStatus: SyncStatus; // Tracks if note is synced with server
};

// Entity type (currently only notes)
export type SyncEntity = 'note';

// Sync operation types
export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

// Queue item structure (operations waiting to sync)
export type SyncQueueItemDocType = {
  id: string; // UUID for queue item
  entity: SyncEntity; // What entity this operation is for
  action: SyncAction; // What operation to perform
  payload: NoteDocType; // The note data to sync
  createdAt: string; // When operation was queued (for FIFO ordering)
};
