import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { NoteEntity } from './notes.entity';
import { SyncNotePayloadDto, SyncNoteRequestDto } from './dto/sync-note.dto';

/**
 * Compare timestamps for conflict resolution
 * Returns true if incoming timestamp is newer than current
 */
function isIncomingNewer(incomingUpdatedAt: string, currentUpdatedAt: string): boolean {
  const incoming = new Date(incomingUpdatedAt).getTime();
  const current = new Date(currentUpdatedAt).getTime();
  return Number.isFinite(incoming) && Number.isFinite(current) ? incoming > current : incomingUpdatedAt > currentUpdatedAt;
}

@Injectable()
export class NotesService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get all notes from database
   * Returns notes sorted by most recently updated first
   */
  async list(): Promise<NoteEntity[]> {
    const repo = this.dataSource.getRepository(NoteEntity);
    return repo.find({ order: { updatedAt: 'DESC' } });
  }

  /**
   * Sync a note operation from client
   * 
   * This method:
   * 1. Uses transaction with pessimistic lock for consistency
   * 2. Creates note if it doesn't exist (handles CREATE and late DELETE)
   * 3. Updates existing note only if incoming is newer (conflict resolution)
   * 4. Returns whether change was applied and the final note state
   * 
   * Idempotent - safe to retry the same operation
   */
  async sync(dto: SyncNoteRequestDto): Promise<{ applied: boolean; note: NoteEntity }> {
    const { action, payload } = dto;

    // Use transaction with row lock to prevent concurrent modification issues
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(NoteEntity);

      // Try to find existing note (with pessimistic write lock)
      const existing = await repo.findOne({
        where: { id: payload.id },
        lock: { mode: 'pessimistic_write' },
      });

      // Note doesn't exist - create it
      if (!existing) {
        // For DELETE operations, this creates a tombstone record
        // This prevents old CREATE operations from resurrecting deleted notes
        const created = repo.create(this.toEntity(action, payload));
        const saved = await repo.save(created);
        return { applied: true, note: saved };
      }

      // Note exists - check if incoming change is newer
      if (!isIncomingNewer(payload.updatedAt, existing.updatedAt)) {
        // Incoming is older or same - ignore it
        return { applied: false, note: existing };
      }

      // Incoming is newer - apply the changes
      const merged = this.applyIncoming(existing, action, payload);
      const saved = await repo.save(merged);
      return { applied: true, note: saved };
    });
  }

  /**
   * Convert sync payload to database entity
   * Handles DELETE action by setting isDeleted flag
   */
  private toEntity(action: SyncNoteRequestDto['action'], payload: SyncNotePayloadDto): NoteEntity {
    const isDeleted = payload.isDeleted || action === 'DELETE';

    return {
      id: payload.id,
      title: payload.title,
      content: payload.content,
      tags: payload.tags ?? [],
      updatedAt: payload.updatedAt,
      isDeleted,
    };
  }

  /**
   * Apply incoming changes to existing entity
   * Merges all fields from payload into existing entity
   */
  private applyIncoming(
    existing: NoteEntity,
    action: SyncNoteRequestDto['action'],
    payload: SyncNotePayloadDto,
  ): NoteEntity {
    existing.title = payload.title;
    existing.content = payload.content;
    existing.tags = payload.tags ?? [];
    existing.updatedAt = payload.updatedAt;
    existing.isDeleted = payload.isDeleted || action === 'DELETE';
    return existing;
  }
}
