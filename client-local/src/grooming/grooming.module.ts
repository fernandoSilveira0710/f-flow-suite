import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ServicesService } from './services.service';
import { ProfessionalsService } from './professionals.service';
import { TicketsController } from './tickets.controller';
import { ServicesController } from './services.controller';
import { ProfessionalsController } from './professionals.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [PrismaModule, ValidationModule],
  controllers: [TicketsController, ServicesController, ProfessionalsController],
  providers: [TicketsService, ServicesService, ProfessionalsService],
  exports: [TicketsService, ServicesService, ProfessionalsService],
})
export class GroomingModule {}
