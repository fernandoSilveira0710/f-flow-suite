import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected');
    } catch (err) {
      // Não bloquear o bootstrap do Hub se o banco não estiver acessível
      this.logger.error('Falha ao conectar ao banco (Prisma). Continuando sem DB.', err as any);
    }
  }
}