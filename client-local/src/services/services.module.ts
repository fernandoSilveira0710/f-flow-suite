import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [PrismaModule, ValidationModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}