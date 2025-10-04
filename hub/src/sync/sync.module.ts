import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';
import { PetsModule } from '../pets/pets.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [ProductsModule, SalesModule, CustomersModule, PetsModule, InventoryModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
