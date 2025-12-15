import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as path from 'path';
import { existsSync } from 'fs';

function getPrismaClientClass(): new (...args: unknown[]) => unknown {
  const isPackaged = Boolean((process as unknown as { pkg?: unknown }).pkg);
  const exeDir = isPackaged ? path.dirname(process.execPath) : process.cwd();
  const appDir = process.env.LOCAL_DATA_DIR || exeDir;

  // Ensure engine path is set when running from installed folder
  const engineCandidates = [
    path.join(appDir, 'node_modules', '.prisma', 'client', 'query_engine-windows.dll.node'),
    path.join(appDir, 'prisma-client', 'query_engine-windows.dll.node'),
  ];
  if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
    for (const candidate of engineCandidates) {
      if (existsSync(candidate)) {
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = candidate;
        break;
      }
    }
  }
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
  }

  // Prefer loading generated client from external folder when packaged
  if (isPackaged) {
    const externalClient = path.join(exeDir, 'prisma-client', 'index.js');
    if (existsSync(externalClient)) {
      const { PrismaClient } = require(externalClient);
      return PrismaClient;
    }
  }

  // Fallback: load Prisma client from snapshot/node_modules
  const { PrismaClient } = require('@prisma/client');
  return PrismaClient;
}

const PrismaClientRef = getPrismaClientClass();

@Injectable()
export class PrismaService extends PrismaClientRef implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Use unknown typing for cross-version event payloads
    (this as unknown as { $on: (evt: string, cb: (e: unknown) => void) => void }).$on('query', (e: unknown) => {
      const qe = e as { query?: string; params?: string };
      this.logger.debug(`Prisma query: ${qe.query ?? ''} | params: ${qe.params ?? ''}`);
    });

    (this as unknown as { $on: (evt: string, cb: (e: unknown) => void) => void }).$on('error', (e: unknown) => {
      const er = e as { message?: string; stack?: string };
      this.logger.error(`Prisma error: ${er.message ?? ''}`, er.stack ?? '');
    });

    (this as unknown as { $on: (evt: string, cb: (e: unknown) => void) => void }).$on('warn', (e: unknown) => {
      const wr = e as { message?: string };
      this.logger.warn(`Prisma warn: ${wr.message ?? ''}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }
}
