import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [ProductsModule, SalesModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
