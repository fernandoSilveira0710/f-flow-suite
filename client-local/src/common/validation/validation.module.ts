import { Module } from '@nestjs/common';
import { EventValidatorService } from './event-validator.service';

@Module({
  providers: [EventValidatorService],
  exports: [EventValidatorService],
})
export class ValidationModule {}