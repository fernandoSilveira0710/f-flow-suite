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
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    process.env.CLIENT_LOCAL_API_URL || 'http://localhost:3001',
    process.env.SITE_URL || 'http://localhost:5173',
    // Incluir variações com 127.0.0.1 para compatibilidade
    (process.env.FRONTEND_URL || 'http://localhost:8080').replace('localhost', '127.0.0.1'),
    (process.env.CLIENT_LOCAL_API_URL || 'http://localhost:3001').replace('localhost', '127.0.0.1'),
    (process.env.SITE_URL || 'http://localhost:5173').replace('localhost', '127.0.0.1'),
  ];

  app.enableCors({
    origin: allowedOrigins,
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
