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

async function enqueueNoteOp(action: SyncAction, payload: NoteDocType): Promise<void> {
  const db = await getDb();
  const createdAt = nowIso();

  // WHY: We queue *every* mutation so the app behaves identically online/offline.
  // Sync is an async side-effect, never the source of truth for the UI.
  await db.collections[SYNC_QUEUE_COLLECTION].insert({
    id: uuidv4(),
    entity: 'note',
    action,
    payload,
    createdAt,
  });
}

export class NotesService {
  static async createNote(input: CreateNoteInput): Promise<NoteDocType> {
    const db = await getDb();

    const note: NoteDocType = {
      id: uuidv4(),
      title: input.title.trim(),
      content: input.content,
      tags: input.tags,
      updatedAt: nowIso(),
      isDeleted: false,
      syncStatus: 'pending',
    };

    console.log('[NotesService] Creating note:', note);
    await db.collections[NOTE_COLLECTION].insert(note);
    console.log('[NotesService] Note inserted into RxDB');
    await enqueueNoteOp('CREATE', note);
    console.log('[NotesService] Note queued for sync');

    return note;
  }

  static async updateNote(id: string, input: UpdateNoteInput): Promise<void> {
    const db = await getDb();

    const doc = await db.collections[NOTE_COLLECTION].findOne({ selector: { id } }).exec();
    if (!doc) throw new Error('Note not found');

    const updatedAt = nowIso();

    // WHY: incrementalPatch is conflict-safe for concurrent writers (multi-tab).
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

  static async deleteNote(id: string): Promise<void> {
    const db = await getDb();

    const doc = await db.collections[NOTE_COLLECTION].findOne({ selector: { id } }).exec();
    if (!doc) return; // idempotent for local UX

    const updatedAt = nowIso();

    const patched = await doc.incrementalPatch({
      isDeleted: true,
      updatedAt,
      syncStatus: 'pending',
    });

    await enqueueNoteOp('DELETE', patched.toJSON() as NoteDocType);
  }
}
