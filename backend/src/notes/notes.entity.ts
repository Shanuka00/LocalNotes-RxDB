import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'notes' })
export class NoteEntity {
  // WHY: Client generates UUIDs offline, so the server must accept them as PKs.
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  // WHY: Tags are a small list; simple-json keeps schema simple while preserving arrays.
  @Column({ type: 'simple-json' })
  tags: string[];

  // Stored as ISO string for consistent last-write-wins comparison with client.
  @Column({ type: 'varchar', length: 30 })
  updatedAt: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  isDeleted: boolean;
}
