import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncHttpClient } from './http.client';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [PrismaModule, ValidationModule],
  controllers: [SyncController],
  providers: [SyncService, SyncHttpClient],
  exports: [SyncService],
})
export class SyncAgentModule {}
