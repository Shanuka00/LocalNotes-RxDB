import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

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

export class SyncNoteRequestDto {
  @IsIn(['note'])
  entity: 'note';

  @IsIn(['CREATE', 'UPDATE', 'DELETE'])
  action: 'CREATE' | 'UPDATE' | 'DELETE';

  @ValidateNested()
  @Type(() => SyncNotePayloadDto)
  payload: SyncNotePayloadDto;
}
