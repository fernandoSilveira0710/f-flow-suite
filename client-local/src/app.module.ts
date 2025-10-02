import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PosModule } from './pos/pos.module';
import { InventoryModule } from './inventory/inventory.module';
import { GroomingModule } from './grooming/grooming.module';
import { LicensingModule } from './licensing/licensing.module';
import { SyncAgentModule } from './sync-agent/sync.module';

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
