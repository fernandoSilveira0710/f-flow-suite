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
  const candidates = [process.env.NODE_ENV && `.env.${process.env.NODE_ENV}`, '.env'];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const path = join(process.cwd(), candidate);
    if (!existsSync(path)) continue;
    loadDotenv({ path });
    logger.log(`Loaded environment variables from ${candidate}`);
    envLoaded = true;
    return;
  }

  logger.warn('No .env file found; relying on system environment');
  envLoaded = true;
}
