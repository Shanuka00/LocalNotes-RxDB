import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { NoteEntity } from '../notes/notes.entity';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';

  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST') ?? 'localhost',
    port: Number(config.get<string>('DB_PORT') ?? '3306'),
    username: config.get<string>('DB_USER') ?? 'localnotes',
    password: config.get<string>('DB_PASSWORD') ?? 'localnotes',
    database: config.get<string>('DB_NAME') ?? 'localnotes',
    entities: [NoteEntity],

    // WHY: Auto-sync schema is convenient for local dev; production should use migrations.
    synchronize: nodeEnv !== 'production',

    logging: nodeEnv !== 'production',
  };
}
