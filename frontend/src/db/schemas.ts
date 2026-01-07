import type { RxJsonSchema } from 'rxdb';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';

export const NOTE_COLLECTION = 'notes' as const;
export const SYNC_QUEUE_COLLECTION = 'syncQueue' as const;

export const noteSchema: RxJsonSchema<NoteDocType> = {
  title: 'note schema',
  version: 1,
  description: 'Offline-first note stored locally in IndexedDB.',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    title: { type: 'string' },
    content: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
    updatedAt: { type: 'string' },
    isDeleted: { type: 'boolean' },
    syncStatus: { type: 'string', enum: ['synced', 'pending', 'failed'] },
  },
  required: ['id', 'title', 'content', 'tags', 'updatedAt', 'isDeleted', 'syncStatus'],
  indexes: ['updatedAt', 'isDeleted', 'syncStatus', 'title'],
};

export const syncQueueSchema: RxJsonSchema<SyncQueueItemDocType> = {
  title: 'sync queue schema',
  version: 1,
  description: 'FIFO queue of operations to be sent to the backend when online.',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    entity: { type: 'string', enum: ['note'] },
    action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] },
    payload: {
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 64 },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        updatedAt: { type: 'string' },
        isDeleted: { type: 'boolean' },
        syncStatus: { type: 'string' },
      },
      required: ['id', 'title', 'content', 'tags', 'updatedAt', 'isDeleted', 'syncStatus'],
    },
    createdAt: { type: 'string' },
  },
  required: ['id', 'entity', 'action', 'payload', 'createdAt'],
  indexes: ['createdAt', 'entity', 'action'],
};
