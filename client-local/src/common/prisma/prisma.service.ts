import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
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