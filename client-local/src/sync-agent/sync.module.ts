import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncHttpClient } from './http.client';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SyncController],
  providers: [SyncService, SyncHttpClient],
  exports: [SyncService],
})
export class SyncAgentModule {}
