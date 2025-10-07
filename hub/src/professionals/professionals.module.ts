import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';

@Module({
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, PrismaClient],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}