import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, PrismaClient],
  exports: [CustomersService],
})
export class CustomersModule {}