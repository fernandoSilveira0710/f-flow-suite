import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PosModule } from './pos/pos.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { GroomingModule } from './grooming/grooming.module.js';
import { LicensingModule } from './licensing/licensing.module.js';
import { SyncAgentModule } from './sync-agent/sync.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LicensingModule,
    PosModule,
    InventoryModule,
    GroomingModule,
    SyncAgentModule,
  ],
})
export class AppModule {}
