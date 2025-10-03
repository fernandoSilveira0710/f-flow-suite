import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaClient],
  exports: [InventoryService],
})
export class InventoryModule {}
