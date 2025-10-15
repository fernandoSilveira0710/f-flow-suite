import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';

@Module({
  imports: [JwtModule],
  controllers: [LicensesController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}
