import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';

@Module({
  controllers: [LicensesController],
  providers: [LicensesService, PrismaClient],
  exports: [LicensesService],
})
export class LicensesModule {}
