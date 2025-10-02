import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { loadEnvConfig } from './common/env.js';

async function bootstrap() {
  loadEnvConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3010;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Client-local API listening on port ${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start client-local service', error);
  process.exit(1);
});
