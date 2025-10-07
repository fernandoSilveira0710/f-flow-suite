import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}