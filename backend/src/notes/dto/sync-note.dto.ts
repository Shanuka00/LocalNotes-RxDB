import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/**
 * DTO for note data in sync request
 * Validates the structure of note payload
 */
export class SyncNotePayloadDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  updatedAt: string; // ISO string

  @IsBoolean()
  isDeleted: boolean;
}

/**
 * DTO for sync request from client
 * Validates entity type, action type, and payload structure
 */
export class SyncNoteRequestDto {
  @IsIn(['note'])
  entity: 'note';

  @IsIn(['CREATE', 'UPDATE', 'DELETE'])
  action: 'CREATE' | 'UPDATE' | 'DELETE';

  @ValidateNested()
  @Type(() => SyncNotePayloadDto)
  payload: SyncNotePayloadDto;
}
