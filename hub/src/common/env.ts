import { config as loadDotenv } from 'dotenv';
import { Logger } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

let envLoaded = false;

export function loadEnvConfig(): void {
  if (envLoaded) {
    return;
  }

  const logger = new Logger('Env');
  const envFile = process.env.NODE_ENV === 'production' ? '.env' : `.env.${process.env.NODE_ENV ?? 'local'}`;
  const envPaths = [
    join(process.cwd(), envFile),
    join(process.cwd(), '.env'),
  ];

  for (const path of envPaths) {
    if (!existsSync(path)) {
      continue;
    }
    loadDotenv({ path, override: true });
    logger.log(`Environment variables loaded from ${path}`);
    envLoaded = true;
    return;
  }

  logger.warn('No .env file found; relying on process environment');
  envLoaded = true;
}
