export type SyncStatus = 'synced' | 'pending' | 'failed';

export type NoteDocType = {
  id: string; // UUID generated on client
  title: string;
  content: string;
  tags: string[];
  updatedAt: string; // ISO string
  isDeleted: boolean; // soft delete
  syncStatus: SyncStatus;
};

export type SyncEntity = 'note';

export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type SyncQueueItemDocType = {
  id: string; // UUID for queue item
  entity: SyncEntity;
  action: SyncAction;
  payload: NoteDocType;
  createdAt: string; // ISO string
};
