import { Module } from '@nestjs/common';
import { SyncService } from './sync.service.js';
import { SyncHttpClient } from './http.client.js';

@Module({
  providers: [SyncService, SyncHttpClient],
  exports: [SyncService],
})
export class SyncAgentModule {}
