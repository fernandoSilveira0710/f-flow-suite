import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LicensesService } from './licenses.service.js';
import { LicensesController } from './licenses.controller.js';

@Module({
  controllers: [LicensesController],
  providers: [LicensesService, PrismaClient],
  exports: [LicensesService],
})
export class LicensesModule {}
