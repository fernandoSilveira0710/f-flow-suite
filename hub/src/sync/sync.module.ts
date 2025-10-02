import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller.js';
import { SyncService } from './sync.service.js';

@Module({
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
