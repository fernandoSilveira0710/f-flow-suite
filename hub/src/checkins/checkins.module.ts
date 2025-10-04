import { Module } from '@nestjs/common';
import { CheckInsService } from './checkins.service';
import { CheckInsController } from './checkins.controller';

@Module({
  controllers: [CheckInsController],
  providers: [CheckInsService],
  exports: [CheckInsService],
})
export class CheckInsModule {}