import { Body, Controller, Get, Post } from '@nestjs/common';

import { SyncNoteRequestDto } from './dto/sync-note.dto';
import { NotesService } from './notes.service';

/**
 * REST API endpoints for notes
 */
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * GET /notes - Get all notes
   * Returns all notes from database (including soft-deleted ones)
   */
  @Get()
  async list() {
    return this.notesService.list();
  }

  /**
   * POST /notes/sync - Sync a note operation from client
   * 
   * Accepts CREATE, UPDATE, or DELETE operations
   * Uses last-write-wins conflict resolution
   * Idempotent - safe to retry
   */
  @Post('sync')
  async sync(@Body() dto: SyncNoteRequestDto) {
    return this.notesService.sync(dto);
  }
}
