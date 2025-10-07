import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [PrismaModule, ValidationModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}