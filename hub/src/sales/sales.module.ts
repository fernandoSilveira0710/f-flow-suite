import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  controllers: [SalesController],
  providers: [
    SalesService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [SalesService],
})
export class SalesModule {}