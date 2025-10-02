import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service.js';
import { LicensesController } from './licenses.controller.js';

@Module({
  providers: [LicensesService],
  controllers: [LicensesController],
  exports: [LicensesService],
})
export class LicensesModule {}
