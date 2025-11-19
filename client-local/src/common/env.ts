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
      // Do not override existing environment variables injected by Electron
      loadDotenv({ path: cwdPath, override: false });
      logger.log(`Loaded environment variables from ${candidate} (cwd)`);
      envLoaded = true;
      return;
    }

    // 2) Try next to compiled dist (service mode safety)
    const distSiblingPath = join(__dirname, '..', candidate);
    if (existsSync(distSiblingPath)) {
      // Do not override existing environment variables injected by Electron
      loadDotenv({ path: distSiblingPath, override: false });
      logger.log(`Loaded environment variables from ${candidate} (dist sibling)`);
      envLoaded = true;
      return;
    }
  }

  logger.warn('No .env file found; relying on system environment');
  envLoaded = true;
}
