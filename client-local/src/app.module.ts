import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PosModule } from './pos/pos.module';
import { InventoryModule } from './inventory/inventory.module';
import { GroomingModule } from './grooming/grooming.module';
import { LicensingModule } from './licensing/licensing.module';
import { SyncAgentModule } from './sync-agent/sync.module';
import { ProductsModule } from './products/products.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LicensingModule,
    PosModule,
    ProductsModule,
    InventoryModule,
    GroomingModule,
    SyncAgentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
