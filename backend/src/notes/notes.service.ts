import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { NoteEntity } from './notes.entity';
import { SyncNotePayloadDto, SyncNoteRequestDto } from './dto/sync-note.dto';

function isIncomingNewer(incomingUpdatedAt: string, currentUpdatedAt: string): boolean {
  // WHY: Conflict resolution is last-write-wins based on the updatedAt timestamp.
  // We parse as dates to avoid edge cases (string comparison, time zones).
  const incoming = new Date(incomingUpdatedAt).getTime();
  const current = new Date(currentUpdatedAt).getTime();
  return Number.isFinite(incoming) && Number.isFinite(current) ? incoming > current : incomingUpdatedAt > currentUpdatedAt;
}

@Injectable()
export class NotesService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async list(): Promise<NoteEntity[]> {
    const repo = this.dataSource.getRepository(NoteEntity);
    return repo.find({ order: { updatedAt: 'DESC' } });
  }

  async sync(dto: SyncNoteRequestDto): Promise<{ applied: boolean; note: NoteEntity }> {
    const { action, payload } = dto;

    // We use a transaction + row lock to make the endpoint safe under concurrent retries.
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(NoteEntity);

      const existing = await repo.findOne({
        where: { id: payload.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!existing) {
        // Idempotency: if the note doesn't exist yet, we create it.
        // For DELETE actions, this creates a tombstone so older creates won't resurrect it.
        const created = repo.create(this.toEntity(action, payload));
        const saved = await repo.save(created);
        return { applied: true, note: saved };
      }

      if (!isIncomingNewer(payload.updatedAt, existing.updatedAt)) {
        // Duplicate request or older write => ignore.
        return { applied: false, note: existing };
      }

      const merged = this.applyIncoming(existing, action, payload);
      const saved = await repo.save(merged);
      return { applied: true, note: saved };
    });
  }

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
