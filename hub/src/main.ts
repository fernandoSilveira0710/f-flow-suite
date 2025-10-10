import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { loadEnvConfig } from './common/env';

async function bootstrap() {
  loadEnvConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Configurar CORS para permitir requisições do frontend
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Hub API is running on port ${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start Hub API', error);
  process.exit(1);
});
