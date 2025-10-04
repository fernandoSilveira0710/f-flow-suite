import { Module } from '@nestjs/common';
import { CheckInsController } from './checkins.controller';
import { CheckInsService } from './checkins.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CheckInsController],
  providers: [CheckInsService],
  exports: [CheckInsService],
})
export class CheckInsModule {}