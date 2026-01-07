import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Note entity - stored in MySQL database
 * 
 * Key design decisions:
 * - Client generates UUIDs (allows offline creation)
 * - Uses updatedAt timestamp for conflict resolution
 * - Soft delete with isDeleted flag (allows sync tombstones)
 */
@Entity({ name: 'notes' })
export class NoteEntity {
  // Client-generated UUID (not auto-increment)
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  // Store array as JSON (simple for small lists)
  @Column({ type: 'simple-json' })
  tags: string[];

  // ISO string timestamp for last-write-wins conflict resolution
  @Column({ type: 'varchar', length: 30 })
  updatedAt: string;

  // Soft delete flag (allows sync tombstones)
  @Column({ type: 'tinyint', width: 1, default: 0 })
  isDeleted: boolean;
}
