import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as path from 'path';

function getPrismaClientClass(): any {
  const exeDir = (process as any).pkg ? path.dirname(process.execPath) : process.cwd();
  const appDir = process.env.LOCAL_DATA_DIR || exeDir;

  // Ensure engine path is set when running from installed folder
  const engineCandidates = [
    path.join(appDir, 'node_modules', '.prisma', 'client', 'query_engine-windows.dll.node'),
    path.join(appDir, 'prisma-client', 'query_engine-windows.dll.node'),
  ];
  if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
    for (const candidate of engineCandidates) {
      try {
        require('fs').accessSync(candidate);
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = candidate;
        break;
      } catch {}
    }
  }
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
  }

  // Prefer loading generated client from external folder when packaged
  if ((process as any).pkg) {
    const fs = require('fs');
    const externalClient = path.join(exeDir, 'prisma-client', 'index.js');
    if (fs.existsSync(externalClient)) {
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

    // Cast to any to support event listeners across Prisma versions
    (this as any).$on('query', (e: any) => {
      this.logger.debug(`Prisma query: ${e.query} | params: ${e.params}`);
    });

    (this as any).$on('error', (e: any) => {
      this.logger.error(`Prisma error: ${e.message}`, e.stack);
    });

    (this as any).$on('warn', (e: any) => {
      this.logger.warn(`Prisma warn: ${e.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }
}