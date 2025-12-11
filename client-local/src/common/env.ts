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
  const candidates = [
    process.env.NODE_ENV && `.env.${process.env.NODE_ENV}`,
    '.env.production',
    '.env',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    // 1) Try current working directory
    const cwdPath = join(process.cwd(), candidate);
    if (existsSync(cwdPath)) {
      // In desenvolvimento, permita que .env sobrescreva variáveis de ambiente
      // Em produção/serviço, mantenha o comportamento original (não sobrescrever)
      loadDotenv({ path: cwdPath, override: process.env.NODE_ENV === 'development' });
      logger.log(`Loaded environment variables from ${candidate} (cwd)`);
      envLoaded = true;
      return;
    }

    // 2) Try next to compiled dist (service mode safety)
    const distSiblingPath = join(__dirname, '..', candidate);
    if (existsSync(distSiblingPath)) {
      // Em desenvolvimento, sobrescreva; em produção/serviço, não sobrescreva
      loadDotenv({ path: distSiblingPath, override: process.env.NODE_ENV === 'development' });
      logger.log(`Loaded environment variables from ${candidate} (dist sibling)`);
      envLoaded = true;
      return;
    }
  }

  logger.warn('No .env file found; relying on system environment');
  envLoaded = true;
}
