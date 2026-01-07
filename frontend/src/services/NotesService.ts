import { v4 as uuidv4 } from 'uuid';

import { getDb } from '../db';
import { NOTE_COLLECTION, SYNC_QUEUE_COLLECTION } from '../db/schemas';
import type { NoteDocType, SyncAction } from '../types/notes';
import { nowIso } from '../utils/time';

type CreateNoteInput = {
  title: string;
  content: string;
  tags: string[];
};

type UpdateNoteInput = {
  title: string;
  content: string;
  tags: string[];
};

/**
 * Queue an operation to sync with the server
 * 
 * All note mutations (create/update/delete) are queued for syncing.
 * This allows the app to work offline - operations are stored locally
 * and synced when the user goes back online.
 */
async function enqueueNoteOp(action: SyncAction, payload: NoteDocType): Promise<void> {
  const db = await getDb();
  const createdAt = nowIso();

  // Add operation to sync queue
  // The queue is processed in FIFO order when online
  await db.collections[SYNC_QUEUE_COLLECTION].insert({
    id: uuidv4(),
    entity: 'note',
    action,
    payload,
    createdAt,
  });
}

/**
 * Service for managing notes
 * 
 * All operations work offline-first:
 * 1. Changes are immediately saved to RxDB (local database)
 * 2. UI updates instantly from RxDB
 * 3. Changes are queued to sync with server when online
 */
export class NotesService {
  /**
   * Create a new note
   * 
   * Steps:
   * 1. Generate UUID for the note (client-side)
   * 2. Save note to RxDB with 'pending' sync status
   * 3. Queue CREATE operation for server sync
   */
  static async createNote(input: CreateNoteInput): Promise<NoteDocType> {
    const db = await getDb();

    // Create note object with generated ID and current timestamp
    const note: NoteDocType = {
      id: uuidv4(), // Client generates ID for offline support
      title: input.title.trim(),
      content: input.content,
      tags: input.tags,
      updatedAt: nowIso(),
      isDeleted: false,
      syncStatus: 'pending', // Mark as pending until synced with server
    };

    console.log('[NotesService] Creating note:', note);
    // Save to local RxDB database
    await db.collections[NOTE_COLLECTION].insert(note);
    console.log('[NotesService] Note inserted into RxDB');
    // Queue for server sync
    await enqueueNoteOp('CREATE', note);
    console.log('[NotesService] Note queued for sync');

    return note;
  }

  /**
   * Update an existing note
   * 
   * Steps:
   * 1. Find note in RxDB by ID
   * 2. Update using incrementalPatch (safe for concurrent updates)
   * 3. Queue UPDATE operation for server sync
   */
  static async updateNote(id: string, input: UpdateNoteInput): Promise<void> {
    const db = await getDb();

    const doc = await db.collections[NOTE_COLLECTION].findOne({ selector: { id } }).exec();
    if (!doc) throw new Error('Note not found');

    const updatedAt = nowIso();

    // incrementalPatch is safe for multi-tab scenarios
    // It merges changes rather than overwriting the entire document
    const patched = await doc.incrementalPatch({
      title: input.title.trim(),
      content: input.content,
      tags: input.tags,
      updatedAt,
      isDeleted: false,
      syncStatus: 'pending',
    });

    await enqueueNoteOp('UPDATE', patched.toJSON() as NoteDocType);
  }

  /**
   * Delete a note (soft delete)
   * 
   * Steps:
   * 1. Find note in RxDB by ID
   * 2. Mark as deleted (soft delete) rather than removing
   * 3. Queue DELETE operation for server sync
   * 
   * Soft delete allows:
   * - Note to remain in database for sync purposes
   * - Conflict resolution if offline changes conflict
   */
  static async deleteNote(id: string): Promise<void> {
    const db = await getDb();

    const doc = await db.collections[NOTE_COLLECTION].findOne({ selector: { id } }).exec();
    if (!doc) return; // Already deleted or doesn't exist

    const updatedAt = nowIso();

    // Mark as deleted (soft delete)
    const patched = await doc.incrementalPatch({
      isDeleted: true,
      updatedAt,
      syncStatus: 'pending',
    });

    await enqueueNoteOp('DELETE', patched.toJSON() as NoteDocType);
  }
}
