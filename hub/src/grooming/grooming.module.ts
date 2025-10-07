import { Module } from '@nestjs/common';
import { GroomingController } from './grooming.controller';
import { GroomingService } from './grooming.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [GroomingController],
  providers: [GroomingService],
  exports: [GroomingService],
})
export class GroomingModule {}