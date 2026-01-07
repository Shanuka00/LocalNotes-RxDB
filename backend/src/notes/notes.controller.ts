import { Body, Controller, Get, Post } from '@nestjs/common';

import { SyncNoteRequestDto } from './dto/sync-note.dto';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async list() {
    return this.notesService.list();
  }

  @Post('sync')
  async sync(@Body() dto: SyncNoteRequestDto) {
    // IMPORTANT: UI must not depend on this response.
    // We return it for observability/debugging and to support other clients.
    return this.notesService.sync(dto);
  }
}
