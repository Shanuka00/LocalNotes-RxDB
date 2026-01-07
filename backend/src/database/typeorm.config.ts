import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { NoteEntity } from '../notes/notes.entity';

/**
 * Build TypeORM configuration from environment variables
 * 
 * Configuration:
 * - MySQL database connection
 * - Auto-sync schema in development (use migrations in production)
 * - Logging enabled in development
 */
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

    // Auto-sync schema in development (NEVER use in production)
    synchronize: nodeEnv !== 'production',

    // Enable SQL query logging in development
    logging: nodeEnv !== 'production',
  };
}
