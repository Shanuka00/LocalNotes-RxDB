import type { RxJsonSchema } from 'rxdb';
import type { NoteDocType, SyncQueueItemDocType } from '../types/notes';

// Collection names as constants
export const NOTE_COLLECTION = 'notes' as const;
export const SYNC_QUEUE_COLLECTION = 'syncQueue' as const;

/**
 * RxDB schema for notes collection
 * This defines the structure and validation rules for note documents
 * RxDB uses JSON Schema for validation and indexing
 */
export const noteSchema: RxJsonSchema<NoteDocType> = {
  title: 'note schema',
  version: 1,
  description: 'Offline-first note stored locally in IndexedDB.',
  primaryKey: 'id', // Client-generated UUID
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 }, // UUID generated on client
    title: { type: 'string' },
    content: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
    updatedAt: { type: 'string' }, // ISO timestamp for conflict resolution
    isDeleted: { type: 'boolean' }, // Soft delete flag
    syncStatus: { type: 'string', enum: ['synced', 'pending', 'failed'] },
  },
  required: ['id', 'title', 'content', 'tags', 'updatedAt', 'isDeleted', 'syncStatus'],
  // Indexes speed up queries - we query by updatedAt (sort), isDeleted (filter), syncStatus, title (search)
  indexes: ['updatedAt', 'isDeleted', 'syncStatus', 'title'],
};

/**
 * RxDB schema for sync queue collection
 * This stores operations that need to be sent to the server
 * Acts as a FIFO queue - we process items in order of creation
 */
export const syncQueueSchema: RxJsonSchema<SyncQueueItemDocType> = {
  title: 'sync queue schema',
  version: 1,
  description: 'FIFO queue of operations to be sent to the backend when online.',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 }, // UUID for this queue item
    entity: { type: 'string', enum: ['note'] }, // What type of entity this operation is for
    action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] }, // What operation to perform
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
    createdAt: { type: 'string' }, // When this operation was queued (for FIFO ordering)
  },
  required: ['id', 'entity', 'action', 'payload', 'createdAt'],
  // Index by createdAt for FIFO processing, entity and action for filtering
  indexes: ['createdAt', 'entity', 'action'],
};
