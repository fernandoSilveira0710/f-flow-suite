import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncHttpClient } from './http.client';
import { SyncController } from './sync.controller';

@Module({
  controllers: [SyncController],
  providers: [SyncService, SyncHttpClient],
  exports: [SyncService],
})
export class SyncAgentModule {}
