import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncHttpClient } from './http.client';

@Module({
  providers: [SyncService, SyncHttpClient],
  exports: [SyncService],
})
export class SyncAgentModule {}
