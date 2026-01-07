import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend requests (frontend runs on different port in dev)
  app.enableCors({
    origin: true,
  });

  // Enable automatic validation of request DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that aren't in the DTO
      forbidNonWhitelisted: false, // Allow extra fields (for client flexibility)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
