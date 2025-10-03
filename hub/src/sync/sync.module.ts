import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [ProductsModule, InventoryModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
