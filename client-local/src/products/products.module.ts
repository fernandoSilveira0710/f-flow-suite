import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaClient],
  exports: [ProductsService],
})
export class ProductsModule {}