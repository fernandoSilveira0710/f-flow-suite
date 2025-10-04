import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, PrismaClient],
  exports: [ServicesService],
})
export class ServicesModule {}